import React, { useRef, useState } from 'react';

const VideoPlayer = ({ movie, isOpen, onClose }) => {
    const iframeRef = useRef(null);
    const [sourceIndex, setSourceIndex] = useState(0);

    if (!isOpen || !movie) return null;

    const cleanId = movie.video_url?.replace(/\D/g, '');

    const sources = [
        { name: "S1: Shiza", url: `https://shiza.libdoor.cyou/video/kp/${cleanId}` },
        { name: "S2: VidSrc", url: `https://vidsrc.me/embed/movie?kp=${cleanId}` },
        { name: "S3: Alloha", url: `https://api.alloha.tv/?kp=${cleanId}` },
        { name: "S4: Kodik", url: `https://kodik.info/video/${cleanId}` } // Optional fallback
    ];

    const currentSource = sources[sourceIndex];

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col highlight-white/5">
            <div className="flex justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                    <h2 className="text-white text-xl font-bold hidden md:block">{movie.title}</h2>
                    <div className="flex gap-2">
                        {sources.map((src, index) => (
                            <button
                                key={index}
                                onClick={() => setSourceIndex(index)}
                                className={`px-3 py-1 rounded text-sm font-bold transition-all ${sourceIndex === index
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                    }`}
                            >
                                {src.name}
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
                    key={sourceIndex} // Force re-render on source change
                    ref={iframeRef}
                    src={currentSource.url}
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
