# Orbita — Cloud Deployment Guide

This guide details how to deploy and maintain the **Orbita Work Management Platform** in live production environments.

---

## 1. Cloud Architecture Overview

```
 [ Client Browser ]
        │
        ▼ (HTTPS)
 [ Vercel Frontend ] ──── (Proxies /api/*) ────► [ Render Web Service ]
   React 18 + Vite                                 Node.js + Express API
   Global CDN Edge                                       │
                                                         ▼ (TLS Mongoose)
                                                [ MongoDB Atlas Database ]
                                                   Standard/Shared Cluster
```

---

## 2. Backend Deployment on Render

1. **Repository Setup**:
   - Connect your GitHub repository: `https://github.com/code-with-varun/orbita.git`.
   - Branch: `main`.

2. **Web Service Specifications** (configured via `render.yaml`):
   - **Environment**: Node
   - **Region**: Singapore (or closest to your target audience)
   - **Build Command**: `npm install`
   - **Start Command**: `node development/server/server.js`

3. **Required Environment Variables**:
   - `PORT`: `5001`
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@cluster.mongodb.net/orbita?retryWrites=true&w=majority`
   - `JWT_SECRET`: Secure random string (e.g. 64-char hex)
   - `CREDENTIAL_SECRET`: 32-byte secret for AES-256 vault encryption

---

## 3. Frontend Deployment on Vercel

1. **Project Setup**:
   - Import Git repository into Vercel.
   - Framework Preset: **Vite**

2. **Build and Output Settings** (configured via `vercel.json`):
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **API Proxy Configuration**:
   - All calls to `/api/:path*` are transparently rewritten to `https://orbita-backend.onrender.com/api/:path*`.
   - All browser routes `/(.*)` are served with `/index.html` to support client-side routing.

---

## 4. Database Setup (MongoDB Atlas)

1. Create a MongoDB Atlas cluster (M0 Free or M10+ Production).
2. Configure **Database Access**:
   - Create a database user with `readWriteAnyDatabase` privileges.
3. Configure **Network Access**:
   - Add IP Access List: `0.0.0.0/0` (Allow Access from Anywhere) to permit connections from Render's dynamic IP range.
4. Auto-Initialization:
   - On initial start, the server automatically provisions the default Superadmin account (`superadmin@orbita.com` / `superadmin123`).

