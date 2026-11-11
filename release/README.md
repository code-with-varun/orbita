# Orbita — Release & Deployment (SDLC Phase 4)

Welcome to the **Release** directory for the **Orbita Work Management Platform** by **Runit Infotech**.

This directory holds release artifacts, deployment descriptors, configuration templates, and comprehensive release documentation.

---

## Directory Contents

| File | Purpose |
| :--- | :--- |
| **`DEPLOYMENT.md`** | Complete cloud deployment documentation (Vercel + Render + MongoDB Atlas) |
| **`RELEASE_NOTES.md`** | Feature matrix, release versions, changelog, and migration guides |
| **`render.yaml`** | Render Blueprint configuration for zero-downtime backend web service |
| **`vercel.json`** | Vercel configuration for SPA routing and API reverse-proxying |

---

## Cloud Deployment Summary

- **Frontend Hosting**: Vercel (Edge CDN, Single Page Application rewrite rules, auto-deploy from Git branch `main`).
- **Backend API Hosting**: Render Web Service (Node.js runtime, auto-restart, regional deployment in Singapore).
- **Database Engine**: MongoDB Atlas (Multi-cloud cluster with high availability and SSL encryption).
