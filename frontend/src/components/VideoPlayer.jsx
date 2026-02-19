import React from 'react';

const VideoPlayer = ({ movie, isOpen, onClose }) => {
    if (!isOpen || !movie) return null;

    // Очищаем ID от префикса KP: и букв
    const cleanId = movie.video_url?.replace(/\D/g, '');

    // Используем зеркало, которое лучше всего работает в РФ/СНГ (как в LazyMedia)
    const playerUrl = `https://1236812837.svetaapi.com/video/kp/${cleanId}`;

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
            <div className="flex justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800">
                <h2 className="text-white font-bold">{movie.title}</h2>
                <button onClick={onClose} className="text-white text-2xl px-4 hover:text-red-500">✕</button>
            </div>
            <div className="flex-1 bg-black relative">
                <iframe
                    key={cleanId}
                    src={playerUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    // КРИТИЧЕСКИ ВАЖНО для обхода блокировок:
                    referrerPolicy="no-referrer"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-presentation"
                ></iframe>
            </div>
        </div>
    );
};

export default VideoPlayer;
