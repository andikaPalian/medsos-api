# 🚀 Media Social API — Enterprise Social Network Backend

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.0-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.0+-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Cloud-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.IO-4.0+-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Swagger](https://img.shields.io/badge/OpenAPI-3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](http://localhost:3000/docs)

An enterprise-grade, high-performance RESTful & Real-time WebSockets backend engine built for social media platforms. Designed with **Clean Layered Architecture**, **Factory Functions Dependency Injection**, **AES-256-GCM End-to-End Encryption**, and **Strict Type Safety**.

---

## 🌟 Key Features

### 🔐 1. Authentication & Security
- **Multi-Factor Auth**: Local registration with OTP email verification, Google OAuth 2.0 integration, and secure password reset workflows.
- **JWT Token Rotation**: Double-token auth architecture with HTTP-only cookies (`accessToken` & `refreshToken`).
- **End-to-End Encryption (E2EE)**: AES-256-GCM encryption for direct messages and uploaded attachments.
- **Defense in Depth Security**:
  - **Anti-CSRF Protection**: Origin checking & `X-CSRF-Token` header verification for cookie-authenticated state-changing requests.
  - **XSS Protection**: Automatic HTML entity escaping on incoming payloads with sensitive key preservation (`password`, `tokens`).
  - **Redis Rate Limiting**: Distributed rate limiters for auth endpoints, OTP emails, and global routes.
  - **Security Headers**: Helmet CSP, HSTS, and X-Frame-Options clickjacking defense.

### 📱 2. Social Core & Content Creation
- **Feed & Posts**: Create posts with captions, tags, and multi-file Cloudinary media (Image/Video). Cursor-based pagination feed.
- **Comments & Replies**: Multi-level threaded comment replies.
- **Likes & Counter Aggregations**: Real-time post likes and automated atomic counters.
- **Saved Posts**: Bookmark posts into private collections.

### 👥 3. Social Graph & Privacy
- **Follow System**: Public and Private account models with follow request approval workflows.
- **Close Friends**: Custom close friends lists for story privacy scoping.
- **Block System**: Bidirectional blocking that restricts posts, profiles, and direct messages.
- **Content Moderation**: Post reporting system.
- **User Search**: Case-insensitive search by username and full name.

### 💬 4. Real-time Encrypted Messaging
- **Direct Messaging**: AES-256-GCM encrypted 1-on-1 chat rooms with attachment download stream decryption.
- **Real-time Sockets**: Socket.IO integrated with Redis Pub/Sub adapter for multi-instance scaling.
- **Presence & State**: Online/Offline presence tracking, real-time typing indicators, and read receipts.

### ⏱️ 5. Stories & Automated Cron Cleanup
- **24-Hour Stories**: Expiring stories with close friends visibility control.
- **Background Cron Jobs**:
  - `story-cleanup.job.ts`: Automatically purges expired stories and associated Cloudinary media assets every 6 hours.
  - `token-cleanup.job.ts`: Daily purging of expired refresh tokens from database.

---

## 🏛️ Enterprise Architecture Overview

```
src/
├── core/                       # Core Layer (Shared Kernel)
│   ├── config/                 # Zod validated env, Prisma, Redis, Cloudinary, Cookie, Rate Limiter, Swagger, Passport
│   ├── constants/              # Centralized Numeric & Regex constants
│   ├── errors/                 # Standard Error Hierarchy (AppError, HttpError, DomainError, ValidationError)
│   ├── types/                  # Common TypeScript interfaces & Express global declarations
│   └── utils/                  # AES-256-GCM, Cloudinary, JWT, Email, OTP, Logger, Pagination, Security Context, XSS Sanitizer
├── infrastructure/             # Infrastructure Layer
│   ├── http/                   # Centralized HTTP Router, Response/Cookie Helpers, Middlewares (Auth, Validate, Rate-limit, XSS, CSRF)
│   └── socket/                 # Socket.IO Server, Registry, Presence Tracking, Redis Adapter
├── modules/                    # 14 Flattened Domain Modules
│   ├── auth/                   # Authentication & OAuth 2.0
│   ├── user/                   # User Profile & Privacy
│   ├── post/                   # Feed, Posts & Saved Items
│   ├── comment/                # Threaded Comments & Replies
│   ├── like/                   # Likes & Interactivity
│   ├── follow/                 # Follow Relationships & Approval
│   ├── story/                  # Expiring Stories & Media
│   ├── message/                # Encrypted Direct Messaging & Sockets
│   ├── notification/           # Real-time Notifications & Templates
│   ├── report/                 # Post Reporting
│   ├── block/                  # User Block System
│   ├── close-friend/           # Close Friends System
│   ├── search/                 # User Search
│   └── media/                  # Media Asset Upload & Cloudinary Utilities
└── jobs/                       # Background Cron Jobs
    ├── story-cleanup.job.ts    # Auto-purges expired stories & Cloudinary assets
    └── token-cleanup.job.ts    # Auto-purges expired refresh tokens
```

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Language & Runtime** | Node.js (v20+), TypeScript 5, Express 5 |
| **Database & ORM** | PostgreSQL 15+, Prisma ORM 7 |
| **Caching & Real-time** | Redis Cloud (`ioredis`), Socket.IO with Redis Adapter |
| **Storage & Media** | Cloudinary API, Multer (Memory Storage) |
| **Security & Auth** | Passport.js (Google OAuth), JWT, bcrypt, AES-256-GCM, Zod, Helmet |
| **Documentation** | Swagger UI Express (`swagger-ui-express`), Swagger JSDoc (OpenAPI 3.0) |
| **Task Scheduling** | `node-cron` |
| **Logging & Mail** | Winston Daily Rotate File, Nodemailer (SMTP/Brevo) |

---

## 🚦 Getting Started

### Prerequisites
Make sure you have the following installed locally:
- **Node.js**: v20.0.0 or higher
- **PostgreSQL**: v15.0 or higher
- **Redis**: Redis Cloud URL or Local Redis instance (`redis://localhost:6379`)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/andikaPalian/medsos-api.git
cd medsos-api
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (you can copy `.env.example`):
```bash
cp .env.example .env
```

Configure your `.env` variables:
```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/media-social?schema=public

# Redis
REDIS_URL=redis://default:password@hostname:16217

# JWT & Encryption
JWT_SECRET=your_32_byte_hex_secret
JWT_SECRET_REFRESH=your_32_byte_hex_secret
MESSAGE_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
FILE_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Cloudinary
CLOUDINARY_CLOUD_NAMES=your_cloud_name
CLOUDINARY_API_KEYS=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Database Synchronization
Push database schema and generate Prisma Client:
```bash
npx prisma db push
```

### 4. Running Development Server
Launch the development server with live reload:
```bash
npm run dev
```
The server will start at:
- **API Base URL**: `http://localhost:3000/api/v1`
- **Swagger Documentation**: `http://localhost:3000/docs`
- **Health Check**: `http://localhost:3000/health`

---

## 📖 API Documentation

Interactive OpenAPI 3.0 documentation is available via Swagger UI:
- **UI Dashboard**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **JSON Spec**: [http://localhost:3000/docs.json](http://localhost:3000/docs.json)

---

## ⚙️ NPM Scripts Reference

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts dev server using `tsx watch` |
| `npm run build` | Compiles TypeScript code to `./dist` |
| `npm start` | Runs compiled production app from `./dist/server.js` |
| `npx tsc --noEmit` | Executes TypeScript typecheck without emitting output |
| `npm run prisma:db:push` | Pushes Prisma schema changes to PostgreSQL database |

---

## 📄 License
This project is licensed under the [ISC License](LICENSE).
