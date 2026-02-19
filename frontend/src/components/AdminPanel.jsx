import React, { useState } from 'react';
import { Send, Mic } from 'lucide-react';
import { sendCommand } from '../api';

const AdminPanel = ({ onCommandSent }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const isSecure = typeof window !== 'undefined' && window.isSecureContext;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        setLoading(true);
        setMessage(null);
        try {
            const result = await sendCommand(input);

            if (result.status === 'selection_needed') {
                // Show selection UI
                setSearchResults(result.data || []);
                setMessage({ type: 'info', text: result.message });
                setInput('');
            } else {
                setMessage({ type: result.status === 'error' ? 'error' : 'success', text: result.message });
                setInput('');
                setSearchResults([]);
                if (result.status === 'success' && onCommandSent) onCommandSent();
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (index) => {
        setLoading(true);
        setMessage(null);
        try {
            const result = await sendCommand(`select ${index + 1}`);
            setMessage({ type: result.status === 'error' ? 'error' : 'success', text: result.message });
            setSearchResults([]);
            if (result.status === 'success' && onCommandSent) onCommandSent();
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Ошибка при выборе фильма' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-white font-sans">
            {/* Header */}
            <div className="flex-1 flex flex-col items-center p-6 space-y-4 overflow-y-auto">
                <h1 className="text-3xl font-bold tracking-tighter text-red-600 mt-4">КИНО-ПУЛЬТ</h1>

                <div className="text-zinc-500 text-center text-sm">
                    <p>{loading ? 'Ищу...' : 'Голосовое управление'}</p>
                    <p className="mt-1 opacity-50">Напишите «Добавь фильм Интерстеллар»</p>
                </div>

                {message && (
                    <div className={`px-4 py-2 rounded-md text-sm font-medium w-full max-w-lg text-center ${message.type === 'success' ? 'bg-green-900/30 text-green-400' :
                            message.type === 'info' ? 'bg-blue-900/30 text-blue-400' :
                                'bg-red-900/30 text-red-400'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Search Results — Selection Cards */}
                {searchResults.length > 0 && (
                    <div className="w-full max-w-lg space-y-2">
                        {searchResults.map((film, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelect(index)}
                                disabled={loading}
                                className="w-full flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-red-600/50 rounded-lg p-3 transition-all text-left disabled:opacity-50"
                            >
                                <img
                                    src={film.poster_url}
                                    alt={film.title}
                                    className="w-12 h-16 object-cover rounded-md flex-shrink-0 bg-zinc-700"
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/96x128/1a1a1a/555?text=?'; }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm truncate">{film.title}</p>
                                    <p className="text-zinc-500 text-xs">
                                        {film.rating && `⭐ ${film.rating}`}
                                    </p>
                                </div>
                                <span className="text-zinc-600 font-mono text-lg flex-shrink-0">{index + 1}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Fixed Bottom Control Bar */}
            <div className="p-4 safe-area-bottom">
                <form onSubmit={handleSubmit} className="relative w-full max-w-lg mx-auto">
                    <div
                        className={`absolute left-3 top-1/2 -translate-y-1/2 ${isSecure ? 'text-zinc-500' : 'text-zinc-700 cursor-not-allowed'}`}
                        title={isSecure ? 'Микрофон' : 'Голосовой ввод работает только через HTTPS'}
                    >
                        <Mic size={20} />
                    </div>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={searchResults.length > 0 ? "Или введите select 1..." : "Название фильма..."}
                        className="w-full bg-zinc-900 text-white rounded-full py-4 pl-10 pr-20 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium border border-zinc-800"
                        disabled={loading}
                    />

                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full transition-colors z-20 shadow-lg disabled:opacity-50"
                        disabled={!input.trim() || loading}
                    >
                        <Send size={18} fill="currentColor" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminPanel;
