import axios from 'axios';

const API_URL = 'http://localhost:8000';

// --- Axios instance with auth interceptor ---
const api = axios.create({ baseURL: API_URL });

// Request interceptor: attach Bearer token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: auto-logout on 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

// --- API functions ---
export const getLibrary = async () => {
    const response = await api.get('/library');
    return response.data;
};

export const addMovie = async (movieData) => {
    const response = await api.post('/add', movieData);
    return response.data;
};

export const sendCommand = async (text) => {
    const response = await api.post('/command', { text });
    return response.data;
};

export default api;
