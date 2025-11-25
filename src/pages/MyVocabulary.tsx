import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Search, BookOpen } from 'lucide-react';

interface PersonalWord {
    id: string;
    kanji: string;
    hanViet: string;
    furigana: string;
    meaning: string;
    addedAt: string;
}

export const MyVocabulary: React.FC = () => {
    const [words, setWords] = useState<PersonalWord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredWords, setFilteredWords] = useState<PersonalWord[]>([]);

    useEffect(() => {
        loadWords();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const filtered = words.filter(w =>
                w.kanji.toLowerCase().includes(query) ||
                w.furigana.toLowerCase().includes(query) ||
                w.meaning.toLowerCase().includes(query) ||
                w.hanViet.toLowerCase().includes(query)
            );
            setFilteredWords(filtered);
        } else {
            setFilteredWords(words);
        }
    }, [searchQuery, words]);

    const loadWords = async () => {
        try {
            setLoading(true);
            const data = await apiService.getPersonalWords();
            setWords(data);
            setFilteredWords(data);
        } catch (error) {
            console.error('Failed to load personal vocabulary:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-brand-500" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Vocabulary</h1>
                        <p className="text-gray-600 mt-1">All words you've added across your lessons</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-brand-600">{words.length}</p>
                    <p className="text-sm text-gray-500">Total Words</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by kanji, furigana, meaning, or hán việt..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
            </div>

            {/* Word Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-12">#</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Kanji</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Furigana</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hán Việt</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Meaning</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
                                        <p className="mt-2">Loading vocabulary...</p>
                                    </td>
                                </tr>
                            ) : filteredWords.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        {searchQuery ? 'No words found matching your search.' : 'No words added yet. Start by creating a lesson and adding words!'}
                                    </td>
                                </tr>
                            ) : (
                                filteredWords.map((word, index) => (
                                    <tr key={word.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4 text-sm text-gray-400">{index + 1}</td>
                                        <td className="px-6 py-4 font-jp text-2xl text-gray-900">{word.kanji || '—'}</td>
                                        <td className="px-6 py-4 font-jp text-gray-700">{word.furigana}</td>
                                        <td className="px-6 py-4 text-gray-600">{word.hanViet || '—'}</td>
                                        <td className="px-6 py-4 text-gray-700">{word.meaning}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
