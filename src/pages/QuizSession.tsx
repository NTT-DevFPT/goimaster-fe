import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Word, QuizModeType, WordStats } from '../types';
import { Timer, CheckCircle, XCircle, LogOut, Play, Trophy, Flame, Snowflake } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to shuffle array
const shuffle = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

// Levenshtein Distance - calculates similarity between two strings
const levenshteinDistance = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }
    return matrix[len1][len2];
};

// Calculate similarity score (0-1, higher is more similar)
const calculateSimilarity = (str1: string, str2: string): number => {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    const distance = levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
};

// Detect if word is a する verb
const isSuruVerb = (word: Word): boolean => {
    return word.furigana.endsWith('する') || word.furigana.endsWith('スル');
};

// Detect if word is an い-adjective
const isIAdjective = (word: Word): boolean => {
    const furigana = word.furigana;
    return furigana.endsWith('い') &&
        !furigana.endsWith('ない') &&
        !furigana.endsWith('たい');
};

// Detect if word is a な-adjective
const isNaAdjective = (word: Word): boolean => {
    // Often marked in dictionary form
    return word.meaning.includes('(na-adj)') || word.meaning.includes('な形容詞');
};

// Get word grammatical pattern
const getWordPattern = (word: Word): string => {
    if (isSuruVerb(word)) return 'suru-verb';
    if (isIAdjective(word)) return 'i-adjective';
    if (isNaAdjective(word)) return 'na-adjective';
    return 'other';
};

// Get smart distractors based on similarity AND grammatical pattern
const getSmartDistractors = (target: Word, allWords: Word[], mode: QuizModeType, count: number = 3): Word[] => {
    const others = allWords.filter(w => w.id !== target.id);

    if (others.length <= count) {
        return others;
    }

    // STEP 1: Filter by grammatical pattern first (CRITICAL for quality)
    const targetPattern = getWordPattern(target);
    const samePattern = others.filter(w => getWordPattern(w) === targetPattern);

    // Use same-pattern words if we have enough, otherwise fall back to all
    const candidatePool = samePattern.length >= count ? samePattern : others;

    // STEP 2: Calculate similarity scores for candidate pool
    const scored = candidatePool.map(word => {
        let similarityScore = 0;

        switch (mode) {
            case QuizModeType.KANJI_TO_FURIGANA:
                // For furigana mode, find similar sounding words
                similarityScore = calculateSimilarity(target.furigana, word.furigana);
                break;
            case QuizModeType.FURIGANA_TO_MEANING:
            case QuizModeType.KANJI_TO_MEANING:
                // For meaning mode, find similar meanings (by length and character overlap)
                const targetMeaning = target.meaning.toLowerCase();
                const wordMeaning = word.meaning.toLowerCase();
                similarityScore = calculateSimilarity(targetMeaning, wordMeaning);

                // Bonus for same length
                if (Math.abs(target.meaning.length - word.meaning.length) <= 2) {
                    similarityScore += 0.1;
                }
                break;
            default:
                similarityScore = Math.random();
        }

        return { word, score: similarityScore };
    });

    // Sort by similarity (descending) and take top matches
    scored.sort((a, b) => b.score - a.score);

    // Take a mix: some very similar, some moderately similar for balance
    const verySimil = scored.slice(0, Math.min(2, count));
    const moderateSimilar = scored.slice(Math.min(2, count), Math.min(6, candidatePool.length));

    // Mix them for variety
    const mixedPool = [...verySimil];
    while (mixedPool.length < count && moderateSimilar.length > 0) {
        const randomIndex = Math.floor(Math.random() * moderateSimilar.length);
        mixedPool.push(moderateSimilar.splice(randomIndex, 1)[0]);
    }

    return mixedPool.map(item => item.word);
};

export const QuizSession: React.FC = () => {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const { getWords, updateStats, saveHistory } = useApp();
    const [words, setWords] = useState<Word[]>([]);

    // Setup State
    const [isPlaying, setIsPlaying] = useState(false);
    const [durationMinutes, setDurationMinutes] = useState(2); // Duration in minutes (default 2 minutes)
    const [mode, setMode] = useState<QuizModeType>(QuizModeType.KANJI_TO_MEANING);

    // Game State
    const [timeLeft, setTimeLeft] = useState(0);
    const [currentWord, setCurrentWord] = useState<Word | null>(null);
    const [options, setOptions] = useState<Word[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [lastAnswerStatus, setLastAnswerStatus] = useState<'correct' | 'wrong' | null>(null);
    const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
    const [streak, setStreak] = useState(0);
    const [streakBadge, setStreakBadge] = useState<{ type: 'hot' | 'cold'; text: string } | null>(null);
    const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(1.5);
    const [nextCountdown, setNextCountdown] = useState<number | null>(null);

    // Refs for logic that doesn't need re-renders
    const timerRef = useRef<number | null>(null);
    const statsQueueRef = useRef<WordStats[]>([]);
    const detailsRef = useRef<{ wordId: string; isCorrect: boolean; kanji?: string; meaning?: string }[]>([]);
    const autoAdvanceTimeoutRef = useRef<number | null>(null);
    const autoAdvanceIntervalRef = useRef<number | null>(null);

    const clearAutoAdvanceTimers = () => {
        if (autoAdvanceTimeoutRef.current) {
            clearTimeout(autoAdvanceTimeoutRef.current);
            autoAdvanceTimeoutRef.current = null;
        }
        if (autoAdvanceIntervalRef.current) {
            clearInterval(autoAdvanceIntervalRef.current);
            autoAdvanceIntervalRef.current = null;
        }
        setNextCountdown(null);
    };

    useEffect(() => {
        const loadWords = async () => {
            if (lessonId) {
                const wordsData = await getWords(lessonId);
                setWords(wordsData);
            }
        };
        loadWords();
    }, [lessonId, getWords]);

    // Timer Logic
    useEffect(() => {
        if (isPlaying && timeLeft > 0) {
            timerRef.current = window.setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        endGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, timeLeft]);

    useEffect(() => {
        return () => {
            clearAutoAdvanceTimers();
        };
    }, []);

    const startGame = () => {
        if (words.length < 4) {
            alert("Need at least 4 words to start a quiz!");
            return;
        }
        // Convert minutes to seconds for timer
        const durationSeconds = durationMinutes * 60;
        setTimeLeft(durationSeconds);
        setIsPlaying(true);
        setSessionStats({ correct: 0, total: 0 });
        statsQueueRef.current = [];
        detailsRef.current = [];
        setStreak(0);
        setStreakBadge(null);
        clearAutoAdvanceTimers();
        nextQuestion();
    };

    const endGame = async () => {
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
        clearAutoAdvanceTimers();

        // Calculate duration in seconds
        const durationSeconds = durationMinutes * 60;
        const actualDuration = durationSeconds - timeLeft;

        // Save stats and history
        if (lessonId && statsQueueRef.current.length > 0) {
            try {
                await updateStats(lessonId, statsQueueRef.current);
                await saveHistory(lessonId, {
                    id: crypto.randomUUID(),
                    lessonId,
                    date: new Date().toISOString(),
                    durationSeconds: actualDuration,
                    totalQuestions: sessionStats.total,
                    correctAnswers: sessionStats.correct,
                    mode
                }, detailsRef.current);
            } catch (error) {
                console.error('Failed to save quiz results:', error);
            }
        }
    };

    const nextQuestion = () => {
        clearAutoAdvanceTimers();
        setSelectedOption(null);
        setLastAnswerStatus(null);
        setStreakBadge(null);

        const randomIndex = Math.floor(Math.random() * words.length);
        const target = words[randomIndex];
        setCurrentWord(target);

        // Use smart distractor selection
        const distractors = getSmartDistractors(target, words, mode, 3);
        const pool = shuffle([target, ...distractors]);
        setOptions(pool);
    };

    const goToNextQuestion = () => {
        clearAutoAdvanceTimers();
        if (timeLeft <= 0) {
            endGame();
            return;
        }
        nextQuestion();
    };

    const scheduleNextQuestion = () => {
        if (autoAdvanceSeconds <= 0) return;
        clearAutoAdvanceTimers();
        setNextCountdown(parseFloat(autoAdvanceSeconds.toFixed(1)));
        autoAdvanceTimeoutRef.current = window.setTimeout(() => {
            goToNextQuestion();
        }, autoAdvanceSeconds * 1000);
        autoAdvanceIntervalRef.current = window.setInterval(() => {
            setNextCountdown(prev => {
                if (prev === null) return null;
                const next = Number(Math.max(0, prev - 0.1).toFixed(1));
                return next;
            });
        }, 100);
    };

    const handleAnswer = (wordId: string) => {
        if (selectedOption || !currentWord) return;

        setSelectedOption(wordId);
        const correct = wordId === currentWord.id;
        setLastAnswerStatus(correct ? 'correct' : 'wrong');

        setStreak(prev => {
            const next = correct ? (prev >= 0 ? prev + 1 : 1) : (prev <= 0 ? prev - 1 : -1);
            if (correct && next >= 3) {
                setStreakBadge({ type: 'hot', text: `${next} correct answers in a row!` });
            } else if (!correct && next <= -2) {
                setStreakBadge({ type: 'cold', text: `${Math.abs(next)} mistakes in a row. Take a breath!` });
            } else {
                setStreakBadge(null);
            }
            return next;
        });

        // Update Session Stats
        setSessionStats(prev => ({
            total: prev.total + 1,
            correct: correct ? prev.correct + 1 : prev.correct
        }));

        // Queue persistent stats
        statsQueueRef.current.push({
            wordId: currentWord.id,
            seen: 1,
            correct: correct ? 1 : 0,
            incorrect: correct ? 0 : 1
        });

        // Queue detailed results
        detailsRef.current.push({
            wordId: currentWord.id,
            isCorrect: correct,
            kanji: currentWord.kanji,
            meaning: currentWord.meaning
        });

        if (timeLeft > 0 && isPlaying) {
            scheduleNextQuestion();
        } else if (timeLeft <= 0) {
            endGame();
        }
    };

    const renderQuestionText = () => {
        if (!currentWord) return '';
        switch (mode) {
            case QuizModeType.KANJI_TO_MEANING: return currentWord.kanji;
            case QuizModeType.KANJI_TO_FURIGANA: return currentWord.kanji;
            case QuizModeType.FURIGANA_TO_MEANING: return currentWord.furigana;
            default: return currentWord.kanji;
        }
    };

    const renderQuestionLabel = () => {
        switch (mode) {
            case QuizModeType.KANJI_TO_MEANING: return "What does this Kanji mean?";
            case QuizModeType.KANJI_TO_FURIGANA: return "How do you read this?";
            case QuizModeType.FURIGANA_TO_MEANING: return "What does this word mean?";
            default: return "";
        }
    }

    const renderOptionText = (w: Word) => {
        switch (mode) {
            case QuizModeType.KANJI_TO_MEANING: return w.meaning;
            case QuizModeType.KANJI_TO_FURIGANA: return w.furigana;
            case QuizModeType.FURIGANA_TO_MEANING: return w.meaning;
            default: return w.meaning;
        }
    };

    const wrongCount = Math.max(sessionStats.total - sessionStats.correct, 0);
    const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 100;
    const totalSecondsConfigured = durationMinutes * 60;
    const timeProgress = totalSecondsConfigured ? (timeLeft / totalSecondsConfigured) * 100 : 0;

    // 1. Setup Screen
    if (!isPlaying && sessionStats.total === 0) {
        return (
            <div className="max-w-xl mx-auto py-12 px-4 animate-fade-in">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2 text-center">Quiz Configuration</h1>
                    <p className="text-slate-500 mb-8 text-center">Customize your challenge</p>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Quiz Mode</label>
                            <div className="space-y-2">
                                {[
                                    { id: QuizModeType.KANJI_TO_MEANING, label: "Kanji ➔ Meaning", desc: "Read Kanji, find meaning" },
                                    { id: QuizModeType.FURIGANA_TO_MEANING, label: "Furigana ➔ Meaning", desc: "Read Hiragana, find meaning" },
                                    { id: QuizModeType.KANJI_TO_FURIGANA, label: "Kanji ➔ Furigana", desc: "Read Kanji, find pronounciation" },
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id)}
                                        className={clsx(
                                            "w-full px-4 py-3 rounded-xl text-left border-2 transition-all flex justify-between items-center group",
                                            mode === m.id
                                                ? "bg-brand-50 border-brand-500"
                                                : "border-slate-100 hover:bg-slate-50"
                                        )}
                                    >
                                        <div>
                                            <div className={clsx("font-bold", mode === m.id ? "text-brand-700" : "text-slate-700")}>{m.label}</div>
                                            <div className="text-xs text-slate-400">{m.desc}</div>
                                        </div>
                                        {mode === m.id && <CheckCircle size={20} className="text-brand-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Duration</label>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <input
                                    type="range"
                                    min="1"
                                    max="60"
                                    step="1"
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600 mb-2"
                                />
                                <div className="flex justify-between font-mono font-bold text-slate-500 text-sm">
                                    <span>1 min</span>
                                    <span className="text-brand-600 text-lg">{durationMinutes} {durationMinutes === 1 ? 'minute' : 'minutes'}</span>
                                    <span>60 min</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Auto advance delay</label>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="0.5"
                                    value={autoAdvanceSeconds}
                                    onChange={(e) => setAutoAdvanceSeconds(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600 mb-2"
                                />
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>1s</span>
                                    <span className="font-semibold text-brand-600">{autoAdvanceSeconds.toFixed(1)}s</span>
                                    <span>10s</span>
                                </div>        </div>
                            <p className="text-xs text-slate-400 mt-2">Question auto advances after this delay. You can always press "Next question" to skip immediately.</p>
                        </div>
                    </div>

                    <button
                        onClick={startGame}
                        disabled={words.length < 4}
                        className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                    >
                        <Play fill="currentColor" size={20} />
                        Start Quiz
                    </button>
                    {words.length < 4 && <p className="text-center text-red-500 text-sm">Need at least 4 words in lesson.</p>}
                </div>
            </div>

        );
    }

    // 2. Result Screen
    if (!isPlaying && sessionStats.total > 0) {
        return (
            <div className="max-w-md mx-auto py-12 px-4 text-center animate-fade-in">
                <div className="bg-white rounded-3xl shadow-xl p-10 border border-slate-100">
                    <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-500 shadow-inner">
                        <Trophy size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
                    <p className="text-slate-500 mb-8 font-medium">Here is your performance summary.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                            <div className="text-4xl font-black text-green-600 mb-1">{sessionStats.correct}</div>
                            <div className="text-xs text-green-700 uppercase font-bold tracking-wider">Correct</div>
                        </div>
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                            <div className="text-4xl font-black text-red-500 mb-1">{sessionStats.total - sessionStats.correct}</div>
                            <div className="text-xs text-red-700 uppercase font-bold tracking-wider">Wrong</div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => navigate(-1)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">
                            Exit
                        </button>
                        <button onClick={() => { setSessionStats({ total: 0, correct: 0 }); setIsPlaying(false); }} className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all">
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Game Screen
    return (
        <div className="max-w-2xl mx-auto py-6 px-4 flex flex-col min-h-[85vh] relative animate-fade-in">

            {/* Header */}
            <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center">{sessionStats.correct}</span>
                            <div>
                                <p className="text-xs uppercase text-green-500 font-semibold">Correct</p>
                                <p className="text-sm text-green-700 font-semibold">{accuracy}% accuracy</p>
                            </div>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center">{wrongCount}</span>
                            <div>
                                <p className="text-xs uppercase text-red-500 font-semibold">Wrong</p>
                                <p className="text-sm text-red-600 font-semibold">{sessionStats.total} answered</p>
                            </div>
                        </div>
                    </div>

                    <div className={clsx("font-mono font-black text-2xl flex items-center gap-2 px-4 py-2 rounded-xl", timeLeft < 10 ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-50 text-slate-700")}>
                        <Timer size={24} />
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                    </div>

                    <button onClick={endGame} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={clsx("h-full rounded-full transition-all", timeLeft < 10 ? "bg-red-400" : "bg-brand-500")}
                        style={{ width: `${Math.max(0, Math.min(100, timeProgress))}%` }}
                    />
                </div>
            </div>

            {/* Streak badge */}
            <AnimatePresence>
                {streakBadge && (
                    <motion.div
                        key={streakBadge.text}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={clsx(
                            "mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm font-semibold",
                            streakBadge.type === 'hot' ? "bg-orange-50 text-orange-700 border border-orange-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                        )}
                    >
                        {streakBadge.type === 'hot' ? <Flame className="text-orange-500" /> : <Snowflake className="text-blue-500" />}
                        {streakBadge.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Question Card */}
            <div className="flex-1 bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden flex flex-col">
                <div className="bg-slate-50 p-12 text-center border-b border-slate-100 flex-1 flex flex-col justify-center items-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">{renderQuestionLabel()}</p>
                    <motion.h2
                        key={currentWord?.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-6xl md:text-7xl font-black font-jp text-slate-800"
                    >
                        {renderQuestionText()}
                    </motion.h2>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-white">
                    {options.map((option, idx) => {
                        const isSelected = selectedOption === option.id;
                        const isCorrectOption = option.id === currentWord?.id;

                        let btnClass = "p-6 rounded-2xl border-2 text-lg font-medium transition-all text-left relative overflow-hidden group ";

                        if (selectedOption) {
                            if (isSelected) {
                                btnClass += isCorrectOption
                                    ? "bg-green-50 border-green-500 text-green-700"
                                    : "bg-red-50 border-red-500 text-red-700";
                            } else if (isCorrectOption) {
                                btnClass += "bg-green-50 border-green-500 text-green-700 opacity-60";
                            } else {
                                btnClass += "bg-slate-50 border-slate-100 text-slate-300";
                            }
                        } else {
                            btnClass += "bg-white border-slate-100 text-slate-700 hover:border-brand-300 hover:shadow-md hover:-translate-y-1";
                        }

                        return (
                            <button
                                key={option.id}
                                disabled={!!selectedOption}
                                onClick={() => handleAnswer(option.id)}
                                className={btnClass}
                            >
                                <span className={clsx(
                                    "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold mr-3 transition-colors",
                                    selectedOption
                                        ? (isSelected && isCorrectOption ? "bg-green-200 text-green-700" : isSelected ? "bg-red-200 text-red-700" : "bg-slate-200 text-slate-500")
                                        : "bg-slate-100 text-slate-500 group-hover:bg-brand-600 group-hover:text-white"
                                )}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className={clsx("font-jp", selectedOption ? "" : "group-hover:text-brand-700")}>
                                    {renderOptionText(option)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {selectedOption && currentWord && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="border-t border-slate-100 bg-slate-900 text-white p-6 flex flex-col md:flex-row gap-6"
                        >
                            <div className="flex-1 space-y-2">
                                <p className="text-xs uppercase tracking-[0.2em] text-white/60 font-semibold">Full Word</p>
                                <h3 className="text-4xl font-black font-jp">{currentWord.kanji}</h3>
                                <p className="text-lg font-jp text-white/80">{currentWord.furigana}</p>
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <p className="text-xs uppercase tracking-widest text-white/60 font-semibold">Meaning</p>
                                    <p className="text-xl font-semibold mt-2">{currentWord.meaning}</p>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <p className="text-xs uppercase tracking-widest text-white/60 font-semibold">Hán Việt</p>
                                    <p className="text-xl font-semibold mt-2 uppercase">{currentWord.hanViet || '—'}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {selectedOption && (
                    <div className="border-t border-slate-100 bg-white px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="text-sm text-slate-500">
                            Next question in{" "}
                            <span className="font-semibold text-slate-900">
                                {(nextCountdown ?? autoAdvanceSeconds).toFixed(1)}s
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {lastAnswerStatus && (
                                <span className={clsx(
                                    "px-3 py-1 rounded-full text-xs font-semibold",
                                    lastAnswerStatus === 'correct' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                )}>
                                    {lastAnswerStatus === 'correct' ? 'Correct answer' : 'Wrong answer'}
                                </span>
                            )}
                            <button
                                onClick={goToNextQuestion}
                                className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all"
                            >
                                Next question
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};