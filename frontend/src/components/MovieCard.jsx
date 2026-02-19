import React from 'react';
import { Play } from 'lucide-react';

const MovieCard = ({ movie, onClick, onKeyDown, isFirst, firstCardRef, onDelete }) => {
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
        <div
            ref={isFirst ? firstCardRef : null}
            tabIndex={0}
            onClick={() => onClick(movie)}
            onKeyDown={(e) => onKeyDown(e, movie)}
            className="group relative bg-zinc-800 rounded-md overflow-hidden aspect-[2/3] cursor-pointer
           transition-transform duration-300 ease-out 
           hover:scale-105 hover:z-50 hover:shadow-2xl hover:ring-2 hover:ring-white/20
           focus:scale-105 focus:z-50 focus:outline-none focus:ring-4 focus:ring-blue-600"
        >
            {/* Poster — Direct URL from Kinopoisk API, no CORS issues */}
            <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-full object-cover transition-opacity duration-500 opacity-90 group-hover:opacity-100"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://placehold.co/600x900/1a1a1a/ffffff?text=${encodeURIComponent(movie.title)}`;
                }}
            />

            {/* Gradient + Title + Status */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/40 to-transparent opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md line-clamp-2 mb-1">{movie.title}</h3>
                <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(movie)}
                    {movie.rating && (
                        <span className="text-[10px] font-bold tracking-wider text-yellow-400 opacity-75">{movie.rating}</span>
                    )}
                </div>
            </div>

            {/* Hover Play */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-md ring-1 ring-white/50">
                    <Play fill="white" className="text-white w-8 h-8 ml-1" />
                </div>
            </div>

            {/* Delete Button (Top Right) - Always visible and high z-index */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    onDelete && onDelete(movie);
                }}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 z-20 flex items-center justify-center hover:bg-red-700 shadow-md transition-colors"
                title="Удалить"
            >
                ✕
            </button>
        </div>
    );
};

export default MovieCard;
