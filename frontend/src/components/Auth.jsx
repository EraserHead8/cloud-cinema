import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const Auth = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAuth = async (endpoint) => {
        if (!email.trim() || !password.trim()) {
            setError('Заполните все поля');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_URL}${endpoint}`, { email, password });
            const token = res.data.access_token;
            localStorage.setItem('token', token);
            onLogin(token);
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(detail || 'Ошибка соединения с сервером');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            {/* Glow effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black tracking-tight text-white mb-1">
                            <span className="text-red-500">Cloud</span>Cinema
                        </h1>
                        <p className="text-zinc-500 text-sm">Личный кинотеатр</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6 text-center">
                            {error}
                        </div>
                    )}

                    {/* Fields */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-zinc-800/50 text-white border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all placeholder:text-zinc-600"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Пароль</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                onKeyDown={(e) => e.key === 'Enter' && handleAuth('/api/login')}
                                className="w-full bg-zinc-800/50 text-white border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all placeholder:text-zinc-600"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleAuth('/api/login')}
                            disabled={loading}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-red-600/20 hover:shadow-red-600/40"
                        >
                            {loading ? '...' : 'Войти'}
                        </button>
                        <button
                            onClick={() => handleAuth('/api/register')}
                            disabled={loading}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 border border-zinc-700"
                        >
                            Регистрация
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
