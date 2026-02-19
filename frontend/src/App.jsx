import React, { useState, useEffect } from 'react';
import MovieGrid from './components/MovieGrid';
import AdminPanel from './components/AdminPanel';
import Auth from './components/Auth';
import { getLibrary } from './api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [movies, setMovies] = useState([]);

  const fetchMovies = async () => {
    try {
      const data = await getLibrary();
      setMovies(data);
    } catch (error) {
      console.error("Failed to fetch library", error);
    }
  };

  useEffect(() => {
    if (!token) return;

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile) {
        setIsMobile(mobile);
      }
    };

    window.addEventListener('resize', handleResize);

    // Initial fetch
    fetchMovies();
    const interval = setInterval(fetchMovies, 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, [isMobile, token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setMovies([]);
  };

  // --- AUTH GATE ---
  if (!token) {
    return <Auth onLogin={(t) => setToken(t)} />;
  }

  // --- MOBILE: Admin Panel only ---
  if (isMobile) {
    return <AdminPanel onCommandSent={fetchMovies} />;
  }

  // --- DESKTOP: Cinema ---
  return (
    <div className="min-h-screen bg-cinema-bg text-white font-sans">
      <div className="container mx-auto">
        <header className="px-8 pt-8 pb-4 flex justify-between items-center bg-gradient-to-b from-cinema-bg to-transparent sticky top-0 z-40">
          <h1 className="text-4xl font-black tracking-tight text-white/90 drop-shadow-md">
            <span className="text-cinema-accent">Cloud</span>Cinema
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-xs font-bold tracking-widest text-gray-500 uppercase border border-gray-700 px-3 py-1 rounded-full">TV Mode</div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold tracking-widest text-red-400 hover:text-red-300 uppercase border border-red-900/50 hover:border-red-600/50 px-3 py-1 rounded-full transition-colors"
            >
              Выйти
            </button>
          </div>
        </header>
        <main>
          <MovieGrid movies={movies} />
        </main>
      </div>
    </div>
  );
}

export default App;
