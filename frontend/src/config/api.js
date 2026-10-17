// API base configuration for dual-environment support (Localhost & Cloud Deployment)
// When running locally in VS Code, import.meta.env.VITE_API_URL is undefined, so it defaults to ''
// (and Vite dev proxy automatically forwards /api to http://127.0.0.1:5000).
// When deployed on Netlify/Vercel, set VITE_API_URL to your live Render backend URL.
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
