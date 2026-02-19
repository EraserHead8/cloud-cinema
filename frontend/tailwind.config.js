/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cinema-bg': '#0f172a',
                'cinema-card': '#1e293b',
                'cinema-accent': '#3b82f6',
            }
        },
    },
    plugins: [],
}
