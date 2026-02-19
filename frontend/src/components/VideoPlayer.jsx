import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const VideoPlayer = ({ movie, isOpen, onClose }) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const [streamUrl, setStreamUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Clean KP ID
    const kpId = movie?.video_url?.replace(/\D/g, '');

    // Fetch Stream from Backend (Collaps/Kodik Parser)
    useEffect(() => {
        if (!isOpen || !kpId) return;

        const fetchStream = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/video-stream/${kpId}`);
                if (!response.ok) throw new Error("Stream not available");
                const data = await response.json();

                if (data.url) {
                    setStreamUrl(data.url);
                } else {
                    throw new Error("Invalid response from server");
                }
            } catch (err) {
                console.error("Stream fetch error:", err);
                setError("Не удалось найти прямой поток. Попробуйте позже или выберите другой фильм.");
            } finally {
                setLoading(false);
            }
        };

        fetchStream();
    }, [isOpen, kpId]);

    // Initialize Video.js
    useEffect(() => {
        if (streamUrl && videoRef.current) {
            playerRef.current = videojs(videoRef.current, {
                controls: true,
                autoplay: true,
                preload: 'auto',
                fluid: true,
                sources: [{
                    src: streamUrl,
                    type: 'application/x-mpegURL'
                }],
                html5: {
                    hls: {
                        // Critical for bypassing referrer checks when playing segments
                        overrideNative: true,
                        enableLowInitialPlaylist: true,
                    }
                }
            });

            // Cleanup
            return () => {
                if (playerRef.current) {
                    playerRef.current.dispose();
                    playerRef.current = null;
                }
            };
        }
    }, [streamUrl]);

    if (!isOpen || !movie) return null;

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

            <div className="flex-1 w-full bg-black relative flex items-center justify-center">
                {loading && <div className="text-white text-lg animate-pulse">Парсинг потока (Collaps/Kodik)...</div>}

                {error && (
                    <div className="text-red-500 text-center p-4">
                        <p className="font-bold text-xl mb-2">Ошибка</p>
                        <p>{error}</p>
                        <p className="text-sm text-zinc-500 mt-2">ID: {kpId}</p>
                    </div>
                )}

                {!loading && !error && streamUrl && (
                    <div data-vjs-player className="w-full h-full">
                        <video
                            ref={videoRef}
                            className="video-js vjs-big-play-centered w-full h-full"
                            // КРИТИЧЕСКИ ВАЖНО:
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;
