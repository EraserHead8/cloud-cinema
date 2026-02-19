import React from 'react';

const VideoPlayer = ({ movie, isOpen, onClose }) => {
    if (!isOpen || !movie) return null;

    const kpId = movie.video_url?.startsWith('KP:') ? movie.video_url.replace('KP:', '') : movie.video_url;

    // vidsrc.cc сейчас работает стабильнее в РФ, чем xyz
    const playerSrc = `https://vidsrc.cc/v2/embed/movie/${kpId}`;

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col highlight-white/5">
            <div className="flex justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800">
                <h2 className="text-white text-xl font-bold">{movie.title}</h2>
                <button
                    onClick={onClose}
                    className="text-white hover:text-red-500 text-2xl px-4 transition-colors"
                >
                    ✕
                </button>
            </div>

            <div className="flex-1 w-full bg-black relative">
                <iframe
                    src={playerSrc}
                    className="w-full h-full border-0 absolute inset-0"
                    allowFullScreen
                    webkitallowfullscreen="true"
                    mozallowfullscreen="true"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    // Sandbox без allow-top-navigation, чтобы не было редиректов на рекламу
                    sandbox="allow-forms allow-scripts allow-same-origin allow-presentation"
                    title={`Player for ${movie.title}`}
                ></iframe>
            </div>
        </div>
    );
};

export default VideoPlayer;
