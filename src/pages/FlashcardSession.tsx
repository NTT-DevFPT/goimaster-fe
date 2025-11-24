import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Word } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const FlashcardSession: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { getWords } = useApp();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const loadWords = async () => {
      if (lessonId) {
        const wordsData = await getWords(lessonId);
        setWords(wordsData);
      }
    };
    loadWords();
  }, [lessonId, getWords]);

  if (words.length === 0) return <div className="p-8 text-center text-slate-500">No words in this lesson. Import words first.</div>;

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 150); // Small delay to allow flip back
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
    }, 150);
  };

  const currentWord = words[currentIndex];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] items-center justify-center animate-fade-in">
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 px-4">
         <Link to={`/lesson/${lessonId}`} className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 font-medium">
            <ChevronLeft size={20} /> Exit
         </Link>
         <div className="text-slate-400 font-mono font-medium">
            {currentIndex + 1} / {words.length}
         </div>
      </div>

      <div className="relative w-full max-w-sm aspect-[4/5] perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        <div 
            className={`w-full h-full relative transform-style-3d transition-transform duration-500 shadow-2xl rounded-3xl ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-3xl flex flex-col items-center justify-center p-8 border border-slate-100">
            <span className="text-xs font-bold tracking-widest text-brand-500 uppercase mb-8">Kanji</span>
            <h2 className="text-8xl font-black font-jp text-slate-800 mb-8">{currentWord.kanji}</h2>
            <p className="text-slate-400 text-sm animate-pulse font-medium mt-auto">Tap to flip</p>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 backface-hidden bg-gradient-to-br from-brand-600 to-accent-600 rounded-3xl rotate-y-180 flex flex-col items-center justify-center p-8 text-white shadow-inner"
          >
             <div className="text-center space-y-6 w-full">
                <div>
                    <span className="text-brand-200 text-xs uppercase tracking-wider font-bold">Furigana</span>
                    <p className="text-3xl font-jp font-medium mt-1">{currentWord.furigana}</p>
                </div>
                
                <div className="w-16 h-1 bg-white/20 mx-auto rounded-full"></div>

                <div>
                    <span className="text-brand-200 text-xs uppercase tracking-wider font-bold">Han-Viet</span>
                    <p className="text-2xl font-bold text-yellow-300 mt-1 uppercase">{currentWord.hanViet}</p>
                </div>

                <div className="w-16 h-1 bg-white/20 mx-auto rounded-full"></div>

                <div>
                    <span className="text-brand-200 text-xs uppercase tracking-wider font-bold">Meaning</span>
                    <p className="text-4xl font-bold mt-2 leading-tight">{currentWord.meaning}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 mt-10">
        <button 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="p-5 rounded-full bg-white shadow-lg shadow-slate-200 text-slate-400 hover:text-brand-600 hover:scale-110 transition-all"
        >
            <ChevronLeft size={28} />
        </button>
        <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="p-5 rounded-full bg-white shadow-lg shadow-slate-200 text-slate-400 hover:text-brand-600 hover:scale-110 transition-all"
        >
            <ChevronRight size={28} />
        </button>
      </div>
    </div>
  );
};