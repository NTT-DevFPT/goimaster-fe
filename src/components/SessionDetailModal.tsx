import React from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { QuizSessionResult } from '../types';

interface SessionDetailModalProps {
    session: QuizSessionResult;
    details: { wordId: string; isCorrect: boolean; kanji?: string; meaning?: string }[];
    onClose: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ session, details, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Session Details</h2>
                        <p className="text-sm text-gray-500">{new Date(session.date).toLocaleString()} • {session.mode}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1 bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                {session.correctAnswers}
                            </div>
                            <div>
                                <p className="text-xs uppercase text-green-600 font-bold">Correct</p>
                                <p className="text-sm text-green-800">Words mastered</p>
                            </div>
                        </div>
                        <div className="flex-1 bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                                {session.totalQuestions - session.correctAnswers}
                            </div>
                            <div>
                                <p className="text-xs uppercase text-red-600 font-bold">Incorrect</p>
                                <p className="text-sm text-red-800">Need review</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="font-bold text-gray-800 mb-4">Word Performance</h3>
                    <div className="space-y-3">
                        {details.map((detail, index) => (
                            <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    {detail.isCorrect ? (
                                        <CheckCircle className="text-green-500" size={24} />
                                    ) : (
                                        <XCircle className="text-red-500" size={24} />
                                    )}
                                    <div>
                                        <p className="font-bold text-lg font-jp text-gray-800">{detail.kanji || '?'}</p>
                                        <p className="text-sm text-gray-500">{detail.meaning || '?'}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${detail.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {detail.isCorrect ? 'Correct' : 'Missed'}
                                </div>
                            </div>
                        ))}
                        {details.length === 0 && (
                            <p className="text-center text-gray-500 py-8">No detailed records available for this session.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
