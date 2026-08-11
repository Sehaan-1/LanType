# LanType (LAN Share)

LanType is a high-performance, self-hosted local area network (LAN) file sharing platform. It provides an immediate, cross-device file transfer experience across Wi-Fi or wired networks without relying on third-party cloud providers, external accounts, or Internet connectivity.

The system features real-time streaming uploads for large payloads, automatic QR code network provisioning, session-based 4-digit PIN authentication, local subnet IP discovery, and a responsive web client optimized for both mobile and desktop environments.

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Option A: Quick Start with Docker Compose (Recommended)](#option-a-quick-start-with-docker-compose-recommended)
  - [Option B: Local Node.js Development](#option-b-local-nodejs-development)
- [Architecture](#architecture)
  - [Directory Structure](#directory-structure)
  - [System Architecture](#system-architecture)
  - [Request Lifecycle](#request-lifecycle)
  - [Database Schema](#database-schema)
- [Streaming and File Storage Mechanics](#streaming-and-file-storage-mechanics)
- [Security Model](#security-model)
- [API Reference](#api-reference)
  - [Authentication Endpoints](#authentication-endpoints)
  - [File Operations](#file-operations)
  - [Server and Health Operations](#server-and-health-operations)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Production Deployment](#production-deployment)
  - [Docker Compose Deployment](#docker-compose-deployment)
  - [Reverse Proxy Configuration (Nginx / Caddy)](#reverse-proxy-configuration-nginx--caddy)
  - [Manual Linux Systemd Service](#manual-linux-systemd-service)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

- **Direct Stream Uploads**: Utilizes Node.js web stream pipelines to stream files directly from the HTTP request body to disk, eliminating server RAM exhaustion even when transferring multi-gigabyte files.
- **PIN-Gated Network Security**: Protects access behind an ephemeral or persisted 4-digit numeric PIN. Host machines on localhost have administrative visibility, while network clients must authenticate to view or transfer files.
- **Automated LAN Discovery and QR Provisioning**: Detects the host's routable private IPv4 subnet address and generates a QR code to allow instant mobile connection over the local Wi-Fi network.
- **Conflict-Resistant Storage**: Automatic filename sanitization protects against path traversal vulnerabilities and collision handling auto-indexes duplicate files without overwriting existing data.
- **Cross-Platform Responsive Client**: Touch-friendly interface tailored for iOS, Android, macOS, Windows, and Linux browsers with drag-and-drop support, upload progress bars, inline image previews, and instant downloads.
- **No Cloud Dependencies**: Operates entirely within your local intranet. Metadata is stored in PostgreSQL and files reside directly on the local host filesystem.

---

## Tech Stack

| Layer | Technology | Details |
| --- | --- | --- |
| **Framework** | Next.js 16 (App Router) | Server components, dynamic route handlers, API endpoints |
| **Frontend Library** | React 19 | Client state, drag-and-drop handling, dynamic UI rendering |
| **Styling** | Tailwind CSS 4 | Responsive mobile-first interface and utility layouts |
| **Database** | PostgreSQL 16 | Relational storage for metadata, sessions, and server configuration |
| **ORM / Migrations** | Drizzle ORM | Type-safe queries, schema declarations, and migration tooling |
| **Database Driver** | pg (node-postgres) | Connection pool management for PostgreSQL |
| **Streaming I/O** | Node.js Streams (`stream/promises`) | Non-blocking chunked disk writes via `stream.pipeline` |
| **Tooling & Utilities** | TypeScript 5, QRCode, NanoID | Type safety, QR code rasterization, cryptographically secure tokens |
| **Containerization** | Docker & Docker Compose | Multi-stage production container and container orchestration |

---

## Prerequisites

Before running the application, ensure the following dependencies are installed on your host system:

- **Node.js**: Version 20.x LTS or higher (if running outside Docker)
- **npm**: Version 10.x or higher (or pnpm / yarn)
- **PostgreSQL**: Version 16.x or higher (if running outside Docker)
- **Docker & Docker Compose**: Recommended for zero-configuration setup

---

## Getting Started

### Option A: Quick Start with Docker Compose (Recommended)

The fastest way to launch the full stack (PostgreSQL database + Next.js web application) is using Docker Compose.

```bash
# 1. Clone the repository
git clone https://github.com/Sehaan-1/LanType.git
cd LanType

# 2. Copy the environment configuration
cp .env.example .env

# 3. Start containers in detached mode
docker compose up -d --build
```

Once running:
- Open your browser and navigate to `http://localhost:3000`.
- The Host Panel will display your server's LAN IP, QR code, and current 4-digit PIN.
- Other devices on the same Wi-Fi or LAN subnet can scan the QR code or navigate to `http://<YOUR_LOCAL_IP>:3000`.

To view application logs or retrieve the initial PIN:
```bash
docker compose logs -f app
```

---

### Option B: Local Node.js Development

#### 1. Clone and Install Dependencies

```bash
git clone https://github.com/Sehaan-1/LanType.git
cd LanType
npm install
```

#### 2. Configure Environment Variables

Create a local `.env` file:

```bash
cp .env.example .env
```

Ensure the `DATABASE_URL` matches your local PostgreSQL credentials:

```env
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/lanshare
NODE_ENV=development
PORT=3000
```

#### 3. Start PostgreSQL and Initialize Database Schema

If running PostgreSQL via Docker:

```bash
docker run --name lanshare-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=lanshare \
  -p 5432:5432 \
  -d postgres:16-alpine
```

Push the database schema using Drizzle Kit:

```bash
npm run db:push
```

#### 4. Run the Development Server

```bash
npm run dev
```

The server starts on `http://localhost:3000`. The generated PIN will be printed directly in the terminal output on the initial server bootstrap.

---

## Architecture

### Directory Structure

```
LanType/
├── .env.example            # Sample environment variables
├── .gitignore              # Git ignore rules
├── Dockerfile              # Multi-stage production container definition
├── README.md               # Project documentation
├── docker-compose.yml      # Multi-container orchestration (PostgreSQL + App)
├── drizzle.config.json     # Drizzle Kit CLI configuration
├── eslint.config.mjs       # ESLint configuration
├── next.config.ts          # Next.js build and runtime configuration
├── package.json            # Node.js dependencies and script definitions
├── postcss.config.mjs      # PostCSS configuration for Tailwind CSS
├── tsconfig.json           # TypeScript configuration
├── uploads/                # Local directory for stored files (persisted on disk)
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── auth/           # PIN verification and session cookie management
    │   │   ├── files/          # File listing endpoint
    │   │   │   └── [id]/       # File streaming download and deletion endpoint
    │   │   ├── health/         # Database connectivity health check
    │   │   ├── server-info/    # LAN IP, stats, QR code, and host check
    │   │   └── upload/         # Multi-part chunked streaming upload route
    │   ├── globals.css         # Base styles and Tailwind CSS imports
    │   ├── layout.tsx          # Root layout with typography and metadata
    │   └── page.tsx            # Root page and application bootstrapper
    ├── components/
    │   ├── Background.tsx      # Ambient background aesthetics
    │   ├── FileGallery.tsx     # File browser, search, download, and delete actions
    │   ├── HostPanel.tsx       # Host dashboard (QR code, PIN, IP status)
    │   ├── LanShareApp.tsx     # Client-side state coordinator and tab router
    │   ├── Logo.tsx            # SVG branding and icon components
    │   ├── PinGate.tsx         # 4-digit PIN unlock interface with keypad
    │   ├── Toast.tsx           # Toast notification provider and UI
    │   └── UploadZone.tsx      # Drag-and-drop upload zone with progress
    ├── db/
    │   ├── index.ts            # PostgreSQL pool connection and Drizzle client
    │   └── schema.ts           # Drizzle table definitions and TypeScript types
    └── lib/
        ├── auth.ts             # PIN logic, cookie validation, localhost checks
        ├── files.ts            # Path sanitization, unique naming, streaming utilities
        ├── format.ts           # Byte formatting and date formatters
        └── lan.ts              # Routable LAN IPv4 network interface resolution
```

---

### System Architecture

```
+-----------------------------------------------------------------------------+
|                               Local Area Network                            |
|                                                                             |
|  +---------------------------+             +-----------------------------+  |
|  |       Host Machine        |             |    Mobile / Client Device   |  |
|  |  (Browser on Localhost)   |             |   (Browser via LAN Wi-Fi)   |  |
|  +-------------+-------------+             +--------------+--------------+  |
|                |                                          |                 |
|                | http://localhost:3000                    | http://192.168.x.x:3000
|                | (Host Privileges: Pin visible)           | (PIN Gate Required)
|                v                                          v                 |
|  +-----------------------------------------------------------------------+  |
|  |                         Next.js Application                           |  |
|  |                                                                       |  |
|  |  +--------------------------+     +--------------------------------+  |  |
|  |  |     App Router Pages     |     |       API Route Handlers       |  |  |
|  |  |    (React 19 UI / SSR)   |     |    (Auth, Stream Upload, Sync) |  |  |
|  |  +--------------------------+     +---------------+----------------+  |  |
|  |                                                   |                   |  |
|  +---------------------------------------------------+-------------------+  |
|                                                      |                      |
|                         +----------------------------+                      |
|                         |                            |                      |
|                         v                            v                      |
|             +-----------------------+    +-----------------------+          |
|             |  PostgreSQL Database  |    | Local Disk (`uploads`) |          |
|             |  - files metadata     |    | - chunked binary data |          |
|             |  - sessions           |    | - collision-safe name |          |
|             |  - server_config      |    +-----------------------+          |
|             +-----------------------+                                       |
+-----------------------------------------------------------------------------+
```

---

### Request Lifecycle

1. **Host Bootstrapping**: When `HomePage` loads (`src/app/page.tsx`), `ensureUploadDir()` creates the storage directory on disk if missing, and `ensurePin()` initializes or retrieves the 4-digit PIN in the database.
2. **Client Inspection**:
   - The browser queries `GET /api/server-info`.
   - The server verifies if the request is originating from `localhost` via `isLocalHostRequest()`.
   - If from localhost or if an active session cookie is present, the PIN is revealed in the Host Panel.
   - If from an unauthenticated LAN IP, the PIN is hidden and the UI renders the `PinGate` component.
3. **PIN Authentication**:
   - The user inputs the 4-digit PIN via `POST /api/auth`.
   - The server validates against `server_config.pin`.
   - On success, a cryptographic token is saved into `sessions` with a 24-hour expiration date and set as an `httpOnly`, `SameSite=Lax` cookie (`lanshare_session`).
4. **File Uploading**:
   - The client posts files to `POST /api/upload` via `multipart/form-data`.
   - `requireAuth()` verifies the session token.
   - Streams are piped directly to disk through `streamToDisk()` without memory buffering.
   - Metadata (original name, stored name, MIME type, size, uploader IP) is saved into the `files` PostgreSQL table.
5. **File Downloading**:
   - Authenticated client requests `GET /api/files/[id]`.
   - The server checks the record, validates file presence on disk, prevents path traversal, and returns a Node readable stream with appropriate `Content-Disposition` and `Content-Type` headers.

---

### Database Schema

The database schema is defined in [src/db/schema.ts](file:///c:/Users/INDIA%20TECHNOLOGY/Documents/LAN/src/db/schema.ts) using Drizzle ORM:

#### 1. `files` Table
Stores metadata for uploaded files.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `serial` | Primary Key | Auto-incrementing identifier |
| `original_name` | `text` | NOT NULL | Client-submitted filename |
| `stored_name` | `text` | NOT NULL, UNIQUE | Sanitized, collision-safe filename on disk |
| `mime_type` | `text` | Nullable | MIME type provided by upload header |
| `size` | `bigint` | NOT NULL, Default `0` | File size in bytes |
| `uploaded_at` | `timestamp with time zone` | NOT NULL, Default `now()` | Timestamp of upload |
| `uploader_ip` | `text` | Nullable | IP address of client who uploaded the file |

#### 2. `sessions` Table
Manages active authentication sessions.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `serial` | Primary Key | Auto-incrementing identifier |
| `token` | `varchar(64)` | NOT NULL, UNIQUE | 32-byte hex cryptographic random string |
| `created_at` | `timestamp with time zone` | NOT NULL, Default `now()` | Session creation timestamp |
| `expires_at` | `timestamp with time zone` | NOT NULL | Expiration timestamp (24 hours from creation) |

#### 3. `server_config` Table
Stores runtime server configuration and the shared PIN.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `integer` | Primary Key, Default `1` | Singleton row identifier |
| `pin` | `varchar(4)` | NOT NULL | Active 4-digit numeric access PIN |
| `updated_at` | `timestamp with time zone` | NOT NULL, Default `now()` | Last PIN update or rotation timestamp |

---

## Streaming and File Storage Mechanics

Standard HTTP multipart uploads in Node.js frameworks often buffer entire files into memory, leading to out-of-memory (OOM) crashes on large files (such as 4K videos or operating system images).

LanType handles uploads using non-blocking stream pipelines:

```
Request Body (Web ReadableStream)
             |
             v
   Readable.fromWeb(...)
             |
             v
  fs.createWriteStream(diskPath)
             |
             v
 stream/promises pipeline()
```

- **Memory Footprint**: Constant memory usage (~few megabytes for small buffers) regardless of whether the file is 10 MB or 50 GB.
- **Path Sanitization**: `safeFilename()` strips directory separators, non-printable characters, and reserved system characters.
- **Collision Resolution**: `uniquePath()` checks if a file exists on disk. If found, it safely appends `(1)`, `(2)`, etc., preventing accidental overwrites.

---

## Security Model

1. **PIN Protection**: All API endpoints (upload, file listing, file download, file deletion) require authentication. Unauthenticated requests receive HTTP 401 Unauthorized responses.
2. **Host Privilege Detection**: Requests originating from `127.0.0.1`, `::1`, or `localhost` are identified as the host machine. Only the host machine can view the active PIN without first authenticating.
3. **Session Cookies**: Session tokens are cryptographically generated (32 bytes entropy), stored with an explicit expiration date in PostgreSQL, and served via `httpOnly` cookies with `SameSite=Lax` attributes.
4. **Path Traversal Protection**: File download routes resolve disk paths using `path.basename()` and strictly enforce that the final path remains within the predefined `uploads/` directory boundary.

---

## API Reference

### Authentication Endpoints

#### Check Authentication Status
- **Method**: `GET`
- **Path**: `/api/auth`
- **Response (Authenticated)**:
  ```json
  {
    "authenticated": true
  }
  ```
- **Response (Unauthenticated)**:
  ```json
  {
    "authenticated": false,
    "pinRequired": true
  }
  ```

#### Authenticate with PIN
- **Method**: `POST`
- **Path**: `/api/auth`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "pin": "4829"
  }
  ```
- **Response (Success - 200)**:
  ```json
  {
    "ok": true
  }
  ```
  *Sets `lanshare_session` HTTP-only cookie.*
- **Response (Failure - 401)**:
  ```json
  {
    "error": "Incorrect PIN"
  }
  ```

---

### File Operations

#### List Shared Files
- **Method**: `GET`
- **Path**: `/api/files`
- **Authentication**: Required
- **Response (200)**:
  ```json
  {
    "files": [
      {
        "id": 1,
        "originalName": "presentation.pdf",
        "storedName": "presentation.pdf",
        "mimeType": "application/pdf",
        "size": 4194304,
        "sizeLabel": "4 MB",
        "uploadedAt": "2026-08-11T10:00:00.000Z",
        "icon": "document",
        "isImage": false,
        "downloadUrl": "/api/files/1",
        "previewUrl": null
      }
    ]
  }
  ```

#### Upload Files
- **Method**: `POST`
- **Path**: `/api/upload`
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Form Fields**: `files` (one or multiple file binaries)
- **Response (200)**:
  ```json
  {
    "ok": true,
    "count": 1,
    "files": [
      {
        "id": 1,
        "originalName": "dataset.csv",
        "storedName": "dataset.csv",
        "size": 1048576,
        "sizeLabel": "1 MB",
        "mimeType": "text/csv"
      }
    ]
  }
  ```

#### Download / Stream File
- **Method**: `GET`
- **Path**: `/api/files/:id`
- **Query Parameters**:
  - `inline=1` (Optional): Sets `Content-Disposition: inline` for browser viewing (e.g. images).
- **Authentication**: Required
- **Response**: Binary file stream with `Content-Disposition`, `Content-Type`, and `Content-Length` headers.

#### Delete File
- **Method**: `DELETE`
- **Path**: `/api/files/:id`
- **Authentication**: Required
- **Response (200)**:
  ```json
  {
    "ok": true
  }
  ```

---

### Server and Health Operations

#### Get Server Information
- **Method**: `GET`
- **Path**: `/api/server-info`
- **Response (200)**:
  ```json
  {
    "baseUrl": "http://192.168.1.50:3000",
    "lanIp": "192.168.1.50",
    "uploadDir": "/app/uploads",
    "qrDataUrl": "data:image/png;base64,...",
    "pin": "4829",
    "isHost": true,
    "authenticated": true,
    "stats": {
      "totalFiles": 12,
      "totalBytes": 104857600
    }
  }
  ```

#### Health Check
- **Method**: `GET`
- **Path**: `/api/health`
- **Response (200)**:
  ```json
  {
    "ok": true
  }
  ```

---

## Environment Variables

| Variable | Required | Default | Description | Example |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Yes | - | PostgreSQL connection connection URI | `postgresql://postgres:password@db:5432/lanshare` |
| `NODE_ENV` | No | `development` | Node execution environment (`development`, `production`, `test`) | `production` |
| `PORT` | No | `3000` | HTTP port on which the Next.js server listens | `3000` |

---

## Available Scripts

The following scripts are defined in `package.json`:

| Script | Command | Description |
| --- | --- | --- |
| `npm run dev` | `next dev` | Starts the Next.js local development server |
| `npm run build` | `next build` | Compiles the production build |
| `npm run start` | `next start` | Starts the built production server |
| `npm run db:push` | `drizzle-kit push` | Applies schema changes directly to PostgreSQL |
| `npm run db:studio`| `drizzle-kit studio`| Launches Drizzle Studio Web UI to inspect database |
| `npm run lint` | `eslint .` | Runs ESLint rules across the codebase |
| `npm run typecheck`| `tsc --noEmit` | Validates TypeScript types across the project |

---

## Production Deployment

### Docker Compose Deployment

The root `docker-compose.yml` configures an isolated network with healthy database initialization and persistent storage volumes:

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: lanshare
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:password@db:5432/lanshare
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads

volumes:
  postgres_data:
```

Launch with:
```bash
docker compose up -d
```

---

### Reverse Proxy Configuration (Nginx / Caddy)

When placing LanType behind a reverse proxy, configure request body size limits and streaming headers to prevent proxy timeouts or upload rejections.

#### Nginx Configuration Snippet

```nginx
server {
    listen 80;
    server_name lanshare.local;

    # Allow large file uploads
    client_max_body_size 0;

    # Disable proxy buffering for upload streaming
    proxy_request_buffering off;
    proxy_buffering off;
    proxy_read_timeout 600s;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Caddy Configuration Snippet

```caddy
lanshare.local {
    reverse_proxy 127.0.0.1:3000 {
        # Streaming settings
        transport http {
            read_buffer 0
        }
    }
}
```

---

### Manual Linux Systemd Service

To run LanType as a background daemon on a Linux server without Docker:

1. Build the application:
   ```bash
   npm ci
   npm run build
   ```

2. Create `/etc/systemd/system/lantype.service`:
   ```ini
   [Unit]
   Description=LanType File Share Service
   After=network.target postgresql.service

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/lantype
   Environment=NODE_ENV=production
   Environment=PORT=3000
   Environment=DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/lanshare
   ExecStart=/usr/bin/npm run start
   Restart=always
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable lantype
   sudo systemctl start lantype
   ```

---

## Troubleshooting

### Database Connection Refused
- **Symptom**: `Error: connect ECONNREFUSED 127.0.0.1:5432` or application fails on startup.
- **Resolution**:
  1. Check if PostgreSQL is running: `docker compose ps` or `sudo systemctl status postgresql`.
  2. Verify your `DATABASE_URL` in `.env` matches the running port and credentials.
  3. Ensure migrations have been applied: `npm run db:push`.

### Mobile Devices Cannot Access the Web Interface
- **Symptom**: Scanning the QR code results in a connection timeout on mobile.
- **Resolution**:
  1. Confirm the phone is connected to the exact same Wi-Fi SSID / local subnet as the host machine.
  2. Verify that host firewall rules permit inbound traffic on TCP port `3000` (e.g. `sudo ufw allow 3000/tcp` on Ubuntu or Windows Defender Firewall prompt).
  3. If running in a virtual machine or container bridge, verify port `3000` is forwarded to the host interface.

### Uploads Terminating Prematurely
- **Symptom**: Large uploads fail after several megabytes or minutes.
- **Resolution**:
  1. If running behind Nginx or Cloudflare, ensure request buffering is disabled (`proxy_request_buffering off;`) and client max body size is disabled (`client_max_body_size 0;`).
  2. Verify the host drive has sufficient disk space available in the `uploads/` mount.

### Wrong LAN IP Detected on Multi-Interface Machines
- **Symptom**: The displayed QR code points to an internal VPN adapter (e.g. Tailscale, Docker `172.x.x.x`) instead of the Wi-Fi IP (`192.168.x.x`).
- **Resolution**:
  - LanType prioritizes standard private IP ranges (`192.168.x.x`, `10.x.x.x`). If an unintended adapter is selected, you can access the server directly via your desired interface IP in the browser address bar.

---

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository and create a feature branch (`git checkout -b feature/improvement`).
2. Ensure TypeScript checks and linters pass cleanly:
   ```bash
   npm run typecheck
   npm run lint
   ```
3. Commit changes with clear, descriptive commit messages.
4. Submit a Pull Request describing the enhancements and test cases.

---

## License

This project is licensed under the MIT License.
