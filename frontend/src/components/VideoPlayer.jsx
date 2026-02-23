import React, { useEffect, useRef, useState } from 'react';

const VideoPlayer = ({ movie, isOpen, onClose }) => {
    const iframeRef = useRef(null);
    const [sourceIndex, setSourceIndex] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setSourceIndex(0);
        }
    }, [movie?.id, isOpen]);

    if (!isOpen || !movie) return null;

    const cleanId = movie.kp_id || movie.video_url?.replace(/\D/g, '') || '';

    const sources = [];
    if (movie.video_url?.startsWith('http')) {
        sources.push({ name: 'S1: Saved', url: movie.video_url });
    }
    if (cleanId) {
        sources.push({ name: "S2: Shiza", url: `https://shiza.libdoor.cyou/video/kp/${cleanId}` });
        sources.push({ name: "S3: VidSrc", url: `https://vidsrc.me/embed/movie?kp=${cleanId}` });
        sources.push({ name: "S4: Alloha", url: `https://api.alloha.tv/?kp=${cleanId}` });
        sources.push({ name: "S5: Kodik", url: `https://kodik.info/video/${cleanId}` });
    }

    const currentSource = sourceIndex !== null ? sources[sourceIndex] : null;

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col highlight-white/5">
            <div className="flex justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800 z-10 relative shadow-md">
                <div className="flex items-center gap-4">
                    <h2 className="text-white text-xl font-bold hidden md:block">{movie.title}</h2>
                    <div className="flex gap-2 relative z-20">
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
                    className="text-white hover:text-red-500 text-3xl px-4 transition-colors relative z-20"
                >
                    ✕
                </button>
            </div>

            <div className="flex-1 w-full bg-black relative flex justify-center items-center">
                {currentSource && currentSource.url ? (
                    <iframe
                        key={sourceIndex} // Force re-render on source change
                        ref={iframeRef}
                        src={currentSource.url}
                        className="w-full h-full border-0 block"
                        allowFullScreen
                        allow="autoplay; encrypted-media; fullscreen"
                        referrerPolicy="no-referrer"
                        title={`Player for ${movie.title}`}
                    ></iframe>
                ) : (
                    <div className="text-zinc-500 text-xl font-medium px-4 text-center">Выберите источник видео выше</div>
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;
