# LAN Share

A high-performance local network file sharing system. No cloud, no accounts, just your LAN.

## Features
- 🚀 **Streaming Uploads**: Handles files of any size without blowing up RAM.
- 📱 **Mobile-First**: Scan QR code $\rightarrow$ upload from phone.
- 🛡️ **Secure**: 4-digit PIN protection for all access.
- 📁 **File Gallery**: Browse, search, and download shared files.
- 🖱️ **UX**: Drag-and-drop upload with real-time progress bars.

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 16+ **or** Docker (recommended)

### Installation
```bash
npm install
```

### Database Migration
```bash
# The app uses Drizzle ORM with PostgreSQL. Run migrations to set up the schema.
# Make sure PostgreSQL is running and DATABASE_URL is set in .env first.
npm run db:push
```

### Run
```bash
npm run dev
```

The server will start on `http://localhost:3000`. Look at the terminal logs to find your **LAN Share PIN**.

## How to use
1. Start the server.
2. Open the URL on your laptop.
3. Scan the QR code displayed in the `Host Panel` with your phone.
4. Enter the PIN to unlock access.
5. Drop files!
