import React, { useEffect, useRef, useState } from 'react';
import VideoPlayer from './VideoPlayer';
import MovieCard from './MovieCard';
import { Play } from 'lucide-react';

const MovieGrid = ({ movies }) => {
    const firstCardRef = useRef(null);
    const [selectedMovie, setSelectedMovie] = useState(null);

    useEffect(() => {
        if (firstCardRef.current && movies.length > 0 && !selectedMovie) {
            setTimeout(() => firstCardRef.current?.focus(), 50);
        }
    }, [movies.length, selectedMovie]);

    if (movies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-zinc-500">
                <h2 className="text-xl font-medium">Библиотека пуста</h2>
                <p className="mt-2 text-sm opacity-50">Добавьте фильм через Пульт управления.</p>
            </div>
        );
    }

    const getStatusBadge = (movie) => {
        if (movie.status === 'error_no_source') {
            return <span className="text-[10px] font-bold tracking-wider text-white bg-red-600 px-1.5 py-0.5 rounded-sm uppercase">ОШИБКА</span>;
        }
        if (!movie.video_url || movie.status === 'PROCESSING' || movie.status === 'parsing') {
            return <span className="text-[10px] font-bold tracking-wider text-black bg-yellow-400 px-1.5 py-0.5 rounded-sm uppercase">ЗАГРУЗКА</span>;
        }
        if (movie.status === 'ready') {
            return <span className="text-[10px] font-bold tracking-wider text-black bg-green-400 px-1.5 py-0.5 rounded-sm uppercase">ГОТОВО</span>;
        }
        return null;
    };

    return (
        <>
            <div className="p-8 pb-32 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {movies.map((movie, index) => (
                    <MovieCard
                        key={movie.id}
                        movie={movie}
                        index={index}
                        isFirst={index === 0}
                        firstCardRef={firstCardRef}
                        onClick={setSelectedMovie}
                        onKeyDown={(e, m) => e.key === 'Enter' && setSelectedMovie(m)}
                    />
                ))}
            </div>

            {selectedMovie && (
                <VideoPlayer
                    movie={selectedMovie}
                    isOpen={!!selectedMovie}
                    onClose={() => setSelectedMovie(null)}
                />
            )}
        </>
    );
};

export default MovieGrid;
