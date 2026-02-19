# ☁️ CloudCinema

A self-hosted, personal cinema platform that aggregates content from various sources, providing a clean, ad-free interface for your TV and devices.

## 🚀 Features

- **Unified Search**: Search movies via Kinopoisk API.
- **Multi-Source Parsing**: Automatically finds playable links from Kodik, VideoCDN, Alloha, etc.
- **Smart Player**: Attempts direct playback in a custom UI, falls back to iframe if needed.
- **Multi-User Auth**: JWT-based authentication with isolated libraries for each family member.
- **TV Mode**: Optimized big-screen interface.
- **Mobile Admin Panel**: Control the TV interface from your phone (voice commands supported).

## 🛠 Tech Stack

- **Backend**: FastAPI (Python 3.10), SQLite, SQLAlchemy, PyJWT.
- **Frontend**: React (Vite), TailwindCSS, Axios.
- **Infrastructure**: Docker, Docker Compose, Nginx.
- **CI/CD**: GitHub Actions (SSH Deploy).

## 📦 Installation (Local)

1. **Clone the repo**
   ```bash
   git clone https://github.com/EraserHead8/cloud-cinema.git
   cd cloud-cinema
   ```

2. **Run with Docker**
   ```bash
   docker-compose up --build
   ```
   The app will be available at `http://localhost`.

3. **Manual Run (Dev)**
   - Backend: `cd backend && python -m uvicorn main:app --reload`
   - Frontend: `cd frontend && npm run dev`

## 🌍 Deployment

Push to the `main` branch to trigger automatic deployment to your VPS via GitHub Actions.
Requires `HOST`, `USERNAME`, `PASSWORD` secrets in GitHub repository settings.
