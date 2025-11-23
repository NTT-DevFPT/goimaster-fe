import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Word, QuizModeType, WordStats } from '../types';
import { Timer, CheckCircle, XCircle, LogOut, Play, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to shuffle array
const shuffle = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export const QuizSession: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { getWords, updateStats, saveHistory } = useApp();
  
  // Setup State
  const [isPlaying, setIsPlaying] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [duration, setDuration] = useState(60); 
  const [mode, setMode] = useState<QuizModeType>(QuizModeType.KANJI_TO_MEANING);

  // Game State
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [lastAnswerStatus, setLastAnswerStatus] = useState<'correct' | 'wrong' | null>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  
  // Refs for logic that doesn't need re-renders
  const timerRef = useRef<number | null>(null);
  const statsQueueRef = useRef<WordStats[]>([]);

  useEffect(() => {
    if (lessonId) {
      setWords(getWords(lessonId));
    }
  }, [lessonId]);

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

  const startGame = () => {
    if (words.length < 4) {
      alert("Need at least 4 words to start a quiz!");
      return;
    }
    setTimeLeft(duration);
    setIsPlaying(true);
    setSessionStats({ correct: 0, total: 0 });
    statsQueueRef.current = [];
    nextQuestion();
  };

  const endGame = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Save stats
    if (lessonId && statsQueueRef.current.length > 0) {
        updateStats(statsQueueRef.current);
        saveHistory({
            id: crypto.randomUUID(),
            lessonId,
            date: new Date().toISOString(),
            durationSeconds: duration - timeLeft,
            totalQuestions: sessionStats.total,
            correctAnswers: sessionStats.correct,
            mode
        });
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setLastAnswerStatus(null);

    // Random word logic (Infinite)
    const randomIndex = Math.floor(Math.random() * words.length);
    const target = words[randomIndex];
    setCurrentWord(target);

    // Generate distractors
    const others = words.filter(w => w.id !== target.id);
    const distractors = shuffle(others).slice(0, 3);
    const pool = shuffle([target, ...distractors]);
    setOptions(pool);
  };

  const handleAnswer = (wordId: string) => {
    if (selectedOption || !currentWord) return;
    
    setSelectedOption(wordId);
    const correct = wordId === currentWord.id;
    setLastAnswerStatus(correct ? 'correct' : 'wrong');

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

    // Auto advance regardless of timer state (logic allows finishing the question)
    // But if timer is 0, we don't go to next question.
    setTimeout(() => {
        if (timeLeft > 0) {
            nextQuestion();
        } else {
            // Wait a sec then show result if time ran out during animation
            endGame(); 
        }
    }, 800);
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
                            min="30" 
                            max="300" 
                            step="30" 
                            value={duration} 
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600 mb-2"
                        />
                        <div className="flex justify-between font-mono font-bold text-slate-500 text-sm">
                            <span>30s</span>
                            <span className="text-brand-600 text-lg">{duration}s</span>
                            <span>300s</span>
                        </div>
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
                    <button onClick={() => { setSessionStats({total: 0, correct: 0}); setIsPlaying(false); }} className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all">
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
        
        {/* Fullscreen Feedback Overlay */}
        <AnimatePresence>
            {lastAnswerStatus && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={clsx(
                        "absolute inset-0 z-50 flex items-center justify-center rounded-3xl backdrop-blur-sm pointer-events-none",
                        lastAnswerStatus === 'correct' ? "bg-green-500/10" : "bg-red-500/10"
                    )}
                >
                    <motion.div 
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1.2 }}
                        className={lastAnswerStatus === 'correct' ? "text-green-500" : "text-red-500"}
                    >
                        {lastAnswerStatus === 'correct' ? <CheckCircle size={100} fill="currentColor" className="text-white" /> : <XCircle size={100} fill="currentColor" className="text-white" />}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-brand-600 font-bold">
                 <Trophy size={20} />
                 <span>{sessionStats.correct * 10} pts</span>
            </div>
            
            <div className={clsx("font-mono font-black text-2xl flex items-center gap-2", timeLeft < 10 ? "text-red-500 animate-pulse" : "text-slate-700")}>
                <Timer size={24} />
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>

            <button onClick={endGame} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                <LogOut size={20} />
            </button>
        </div>

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
        </div>
    </div>
  );
};