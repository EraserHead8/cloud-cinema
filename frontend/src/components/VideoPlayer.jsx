import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ movie, isOpen, onClose }) => {
    const iframeRef = useRef(null);

    if (!isOpen || !movie) return null;

    const cleanId = movie.video_url?.replace(/\D/g, '');
    const playerUrl = `https://shiza.libdoor.cyou/video/kp/${cleanId}`;
    const kinogoUrl = `https://kinogo.biz/index.php?do=search&subaction=search&story=${encodeURIComponent(movie.title)}`;

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col highlight-white/5">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800 gap-4 md:gap-0">
                <h2 className="text-white font-bold text-lg md:text-xl truncate max-w-[200px] md:max-w-md">{movie.title}</h2>

                <div className="flex items-center gap-3">
                    {/* Direct Link Button */}
                    <a
                        href={playerUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        Открыть плеер напрямую
                    </a>

                    {/* Kinogo Search Button */}
                    <a
                        href={kinogoUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        Найти на Kinogo
                    </a>

                    <button
                        onClick={onClose}
                        className="text-white hover:text-red-500 text-3xl px-2 transition-colors ml-2"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 w-full bg-black relative">
                <iframe
                    ref={iframeRef}
                    key={cleanId}
                    src={playerUrl}
                    className="w-full h-full border-0 absolute inset-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media; fullscreen"
                    // CRITICAL: Hide source origin to bypass blocks
                    referrerPolicy="no-referrer"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-presentation"
                    title={`Player for ${movie.title}`}
                ></iframe>
            </div>
        </div>
    );
};

export default VideoPlayer;
