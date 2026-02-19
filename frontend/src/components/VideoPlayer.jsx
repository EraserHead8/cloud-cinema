import React, { useState } from 'react';

const VideoPlayer = ({ movie, isOpen, onClose }) => {
    const [source, setSource] = useState('kodik');

    if (!isOpen || !movie) return null;

    const cleanId = movie.video_url?.replace(/\D/g, '');

    const sources = {
        kodik: { label: 'Kodik (Shiza)', url: `https://shiza.libdoor.cyou/video/kp/${cleanId}` },
        collaps: { label: 'Collaps (BHF)', url: `https://api.bhf.im/embed/kp/${cleanId}` },
        alloha: { label: 'Alloha', url: `https://api.alloha.tv/?kp=${cleanId}` }
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col highlight-white/5">
            <div className="flex justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800">
                <div className="flex gap-4 items-center">
                    <h2 className="text-white font-bold text-lg md:text-xl truncate max-w-[200px] md:max-w-md">{movie.title}</h2>

                    <div className="flex bg-zinc-800 rounded-lg p-1 space-x-1">
                        {Object.entries(sources).map(([key, data]) => (
                            <button
                                key={key}
                                onClick={() => setSource(key)}
                                className={`px-3 py-1 rounded-md text-xs uppercase font-medium transition-colors ${source === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                            >
                                {data.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="text-white hover:text-red-500 text-3xl px-4 transition-colors"
                >
                    ✕
                </button>
            </div>

            <div className="flex-1 w-full bg-black relative">
                <iframe
                    key={`${cleanId}-${source}`}
                    src={sources[source].url}
                    className="w-full h-full border-0 absolute inset-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media; fullscreen"
                    referrerPolicy="no-referrer"
                    title={`Player for ${movie.title}`}
                ></iframe>
            </div>
        </div>
    );
};

export default VideoPlayer;
