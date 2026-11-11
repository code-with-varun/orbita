# Orbita — Development (SDLC Phase 2)

Welcome to the **Development** directory for the **Orbita Work Management Platform** by **Runit Infotech**.

This directory contains the complete source code for both the frontend (React 18 + Vite) and the backend (Node.js + Express + MongoDB Atlas).

---

## Architecture & Layout

```
development/
├── src/                    # Frontend React 18 Application
│   ├── assets/             # Brand logos & icons
│   ├── components/         # 25+ Modular React Views & Modals
│   ├── utils/              # Data export (CSV, JSON, XLSX), date helpers
│   ├── App.jsx             # Main Application Root & Router
│   ├── index.css           # Global Theme & CSS Variables
│   └── main.jsx            # React DOM Entrypoint
├── server/                 # Backend Node.js / Express API
│   ├── cryptoUtils.js      # AES-256-GCM encryption & decryption engine
│   ├── db.js               # MongoDB Atlas Mongoose Models & Schemas
│   ├── server.js           # REST API Routes, Auth, Excel Exporter
│   └── api.php             # Legacy fallback API bridge
├── public/                 # Static assets, SVG logos & favicons
├── index.html              # HTML5 Web Application Shell
├── vite.config.js          # Vite Bundler & Dev Server Configuration
├── package.json            # Development dependencies & scripts
└── .env.example            # Environment configuration template
```

---

## Tech Stack

- **Frontend**: React 18, Vite 6, Lucide Icons, Vanilla CSS with custom properties (Dark/Light mode).
- **Backend**: Node.js 20+, Express 4, Mongoose 8/9, JSON Web Tokens, SheetJS (`xlsx`).
- **Database**: Cloud MongoDB Atlas (`orbita` database).
- **Security**: AES-256-GCM cipher encryption for sensitive credentials with unique IV & auth tags.

---

## Local Development Setup

### 1. Configure Environment Variables
Copy `.env.example` to `.env` in this directory (or at repository root):
```bash
cp .env.example .env
```
Ensure your `MONGODB_URI` and `PORT` are configured.

### 2. Run Development Servers
From this directory:
```bash
# Start Vite Frontend Dev Server (http://localhost:5173)
npm run dev

# Start Node.js Express API Server (http://localhost:5001)
npm run server
```

Alternatively, from the repository root:
```bash
npm run dev
npm run server
```

### 3. Production Build
```bash
npm run build
```
Generates minified bundles in `dist/`.
