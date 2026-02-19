import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ movie, isOpen, onClose }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !movie) return;

        // Remove 'KP:' prefix to get clean ID
        const kpId = movie.video_url?.startsWith('KP:') ? movie.video_url.replace('KP:', '') : null;

        if (!kpId) return;

        let observer = null;

        const initKinobox = () => {
            // Check if kbox is available globally and container exists
            if (typeof window.kbox !== 'undefined' && containerRef.current) {
                try {
                    // Clear container before init to prevent duplicates
                    containerRef.current.innerHTML = '';

                    // --- SANDBOX HACK START ---
                    // Watch for iframe creation and apply sandbox attributes to prevent redirects
                    observer = new MutationObserver((mutations) => {
                        const applySandbox = (node) => {
                            if (node.tagName === 'IFRAME') {
                                // Missing 'allow-top-navigation' prevents the iframe from redirecting the main window
                                node.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin allow-presentation');
                            }
                            if (node.querySelectorAll) {
                                node.querySelectorAll('iframe').forEach(iframe => {
                                    iframe.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin allow-presentation');
                                });
                            }
                        };
                        mutations.forEach(m => m.addedNodes.forEach(applySandbox));
                    });
                    observer.observe(containerRef.current, { childList: true, subtree: true });
                    // --- SANDBOX HACK END ---

                    window.kbox(containerRef.current, {
                        search: { kinopoisk: kpId },
                        menu: { enable: true, default: 'menu_list' },
                        players: {
                            alloha: { enable: true },
                            kodik: { enable: true },
                            collaps: { enable: true }
                        },
                        params: {
                            all: {
                                domain: "https://kinobox.tv",
                                referrer: "https://www.google.com"
                            }
                        }
                    });
                } catch (e) {
                    console.error("Kinobox init error:", e);
                }
            }
        };

        // Dynamically load script if not present
        if (!document.getElementById('kinobox-script')) {
            const script = document.createElement('script');
            script.id = 'kinobox-script';
            script.src = 'https://kinobox.tv/kinobox.min.js';
            script.async = true;
            script.onload = initKinobox;
            document.body.appendChild(script);
        } else {
            // If script already loaded, just init for new movie
            initKinobox();
        }

        return () => {
            if (observer) observer.disconnect();
        };

    }, [isOpen, movie]);

    if (!isOpen || !movie) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-zinc-900/90 backdrop-blur border-b border-zinc-800 z-10">
                <h2 className="text-white text-lg md:text-xl font-bold truncate max-w-[80%]">
                    {movie.title}
                </h2>
                <button
                    onClick={onClose}
                    className="text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-red-600/20 hover:border-red-500 border border-zinc-700 rounded-full w-10 h-10 flex items-center justify-center transition-all"
                >
                    ✕
                </button>
            </div>

            {/* Player Container */}
            <div className="flex-1 w-full relative bg-black flex items-center justify-center overflow-hidden">
                {movie.video_url?.startsWith('KP:') ? (
                    <div ref={containerRef} className="kinobox_player w-full h-full"></div>
                ) : (
                    <div className="text-white/50 text-xl flex flex-col items-center gap-2">
                        <span>⚠️</span>
                        <span>ID Кинопоиска не найден</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;
