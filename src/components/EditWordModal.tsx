import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditWordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (word: { kanji: string; hanViet: string; furigana: string; meaning: string }) => void;
    word?: { kanji: string; hanViet: string; furigana: string; meaning: string };
}

export const EditWordModal: React.FC<EditWordModalProps> = ({
    isOpen,
    onClose,
    onSave,
    word,
}) => {
    const [kanji, setKanji] = useState('');
    const [hanViet, setHanViet] = useState('');
    const [furigana, setFurigana] = useState('');
    const [meaning, setMeaning] = useState('');

    useEffect(() => {
        if (word) {
            setKanji(word.kanji);
            setHanViet(word.hanViet);
            setFurigana(word.furigana);
            setMeaning(word.meaning);
        }
    }, [word, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ kanji, hanViet, furigana, meaning });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">Edit Word</h3>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kanji <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={kanji}
                                        onChange={(e) => setKanji(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent font-jp text-xl"
                                        placeholder="例: 食べる"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Furigana <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={furigana}
                                        onChange={(e) => setFurigana(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent font-jp"
                                        placeholder="例: たべる"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hán Việt
                                    </label>
                                    <input
                                        type="text"
                                        value={hanViet}
                                        onChange={(e) => setHanViet(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                        placeholder="Example: Thực"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Meaning <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={meaning}
                                        onChange={(e) => setMeaning(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                        placeholder="Example: to eat / ăn"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 justify-end pt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
