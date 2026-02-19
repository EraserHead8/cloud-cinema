import React, { useEffect } from 'react';

const VideoPlayer = ({ movie, isOpen, onClose }) => {
    if (!isOpen || !movie) return null;

    // Извлекаем только цифры ID
    const cleanId = movie.video_url?.replace(/\D/g, '');

    // Логируем в консоль для проверки (пользователь увидит в F12)
    console.log("Initiating Kodik player for ID:", cleanId);

    // Используем стабильное зеркало Kodik
    const playerSrc = `https://shiza.libdoor.cyou/serial/kp/${cleanId}/iframe`;

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col highlight-white/5">
            <div className="flex justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800">
                <h2 className="text-white text-xl font-bold">{movie.title}</h2>
                <button
                    onClick={onClose}
                    className="text-white hover:text-red-500 text-3xl px-4 transition-colors"
                >
                    ✕
                </button>
            </div>

            <div className="flex-1 w-full bg-black relative">
                <iframe
                    key={cleanId} // КРИТИЧЕСКИ ВАЖНО: заставляет iframe обновиться
                    src={playerSrc}
                    className="w-full h-full border-0 absolute inset-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media; fullscreen"
                    // Kodik требует определенных разрешений, sandbox может ломать его, но попробуем оставить минимальный
                    // Если не заработает - уберем sandbox
                    sandbox="allow-forms allow-scripts allow-same-origin allow-presentation"
                    title={`Player for ${movie.title}`}
                ></iframe>
            </div>
        </div>
    );
};

export default VideoPlayer;
