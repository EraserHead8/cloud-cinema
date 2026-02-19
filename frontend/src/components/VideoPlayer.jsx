import React, { useState } from 'react';

const VideoPlayer = ({ movie, isOpen, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!isOpen || !movie) return null;

    const kpId = movie.video_url?.startsWith('KP:') ? movie.video_url.replace('KP:', '') : null;

    // Самые стабильные iframe-балансеры на данный момент (без токенов)
    const players = kpId ? [
        { name: "Alloha", url: `https://api.alloha.tv/?kp=${kpId}` },
        { name: "VidSrc", url: `https://vidsrc.ru/embed/kp/${kpId}` },
        { name: "Vibix", url: `https://vibix.org/embed/kp/${kpId}` },
        { name: "KinoPlay", url: `https://kinoplay.app/api/iframe?kp=${kpId}` },
        { name: "VoidBoost", url: `https://voidboost.net/embed/${kpId}` }
    ] : [];

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
            <div className="flex justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800">
                <h2 className="text-white text-xl font-bold">{movie.title}</h2>
                <button onClick={onClose} className="text-white hover:text-red-500 text-2xl transition-colors">✕</button>
            </div>

            {players.length > 0 && (
                <div className="flex gap-2 p-3 bg-zinc-900 overflow-x-auto">
                    {players.map((p, idx) => (
                        <button
                            key={p.name}
                            onClick={() => setCurrentIndex(idx)}
                            className={`px-4 py-2 rounded font-medium transition-colors whitespace-nowrap ${currentIndex === idx
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                }`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex-1 w-full relative bg-black">
                {players.length > 0 ? (
                    <iframe
                        key={players[currentIndex].url}
                        src={players[currentIndex].url}
                        className="absolute inset-0 w-full h-full border-0"
                        allowFullScreen
                        allow="autoplay; fullscreen"
                    ></iframe>
                ) : (
                    <div className="text-white flex items-center justify-center h-full text-xl opacity-50">
                        ID Кинопоиска не найден
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;
