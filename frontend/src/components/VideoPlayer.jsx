import React, { useEffect, useRef, useState } from 'react';
import axios from '../api'; // Use our api instance
// video.js import is kept for potential future direct stream support, 
// but currently we use iframe as per Vibix requirement.
import 'video.js/dist/video-js.css';

const VideoPlayer = ({ movie, isOpen, onClose }) => {
    const [streamUrl, setStreamUrl] = useState(null);
    // videoRef is unused for iframe approach but kept for structure compliance if needed later
    const videoRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !movie) return;

        const kpId = movie.video_url?.startsWith('KP:') ? movie.video_url.replace('KP:', '') : null;
        if (!kpId) return;

        // Fetch stream URL from backend
        axios.get(`/api/stream/${kpId}`)
            .then(response => {
                if (response.data && response.data.url) {
                    setStreamUrl(response.data.url);
                }
            })
            .catch(error => {
                console.error("Error fetching stream:", error);
            });

        // Cleanup not strictly needed for iframe source, but good practice if we used video.js
        return () => {
            setStreamUrl(null);
        };
    }, [isOpen, movie]);

    if (!isOpen || !movie) return null;

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
            <div className="p-4 flex justify-between items-center bg-zinc-900 border-b border-zinc-800">
                <h2 className="text-white text-lg font-bold">{movie.title}</h2>
                <button onClick={onClose} className="text-zinc-400 hover:text-red-500 transition-colors">
                    ✕ ЗАКРЫТЬ
                </button>
            </div>
            <div className="flex-1 relative bg-black flex items-center justify-center">
                {streamUrl ? (
                    <iframe
                        src={streamUrl}
                        className="w-full h-full border-0"
                        allowFullScreen
                        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                        title={movie.title}
                    />
                ) : (
                    <div className="text-white/50">Загрузка плеера...</div>
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;
