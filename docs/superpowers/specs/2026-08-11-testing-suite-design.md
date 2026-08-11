# Testing Suite Design: LAN Share

## Overview
This document outlines the comprehensive testing strategy for LAN Share to eliminate the risk of data loss, prevent security vulnerabilities (path traversal), and ensure a seamless local network file-sharing experience.

## Strategy
We are implementing a three-layer testing pyramid (Option 1: Safe & Steady).

### 1. Core Logic (Unit Tests)
**Goal**: Prevent data loss and corruption at the lowest level.
**Tool**: Vitest

#### Target: `src/lib/files.ts`
- **`safeFilename()`**: 
    - Verify removal of control characters and dangerous symbols.
    - Test path traversal attempts (e.g., `../../etc/passwd`).
    - Validate filename length capping (max 200 chars) while preserving extensions.
    - Ensure fallback naming for empty or invalid results.
- **`uniquePath()`**:
    - Verify collision handling: `file.txt` $\rightarrow$ `file (1).txt` $\rightarrow$ `file (2).txt`.
    - Test the limit of 10,000 collisions to ensure the timestamp fallback triggers.
- **`streamToDisk()`**:
    - Verify that `Readable.fromWeb` and `pipeline` correctly write the entire file.
    - Ensure memory usage remains constant regardless of input file size.

---

### 2. API & Integration Tests
**Goal**: Ensure the HTTP layer and database interact correctly.
**Tool**: Vitest + Drizzle Test Kit

#### Target: `src/app/api/`
- **Authentication**:
    - Verify `requireAuth()` blocks requests without a session cookie.
    - Verify valid session tokens grant access.
    - Test session expiration logic.
- **Upload Flow (`/api/upload`)**:
    - Validate the full chain: `Request` $\rightarrow$ `safeFilename` $\rightarrow$ `uniquePath` $\rightarrow$ `streamToDisk`.
    - Ensure database records are created only after successful disk writes.
- **File Retrieval (`/api/files/[id]`)**:
    - Verify 404 responses for non-existent IDs.
    - Verify successful streaming of existing files.

---

### 3. End-to-End (E2E) Tests
**Goal**: Verify the complete user journey from a browser perspective.
**Tool**: Playwright

#### Critical Paths:
- **Happy Path**: 
    - PIN entry $\rightarrow$ Dashboard $\rightarrow$ File Upload $\rightarrow$ Gallery Appearance $\rightarrow$ Download Verification.
- **Collision Handling**: 
    - Upload multiple files with identical names and verify they are all stored and downloadable via the UI.
- **Security Boundary**:
    - Attempt to navigate directly to `/` or `/api/...` without a PIN and verify redirection/blocking by `PinGate`.

## Success Criteria
- Zero path traversal vulnerabilities in `safeFilename`.
- No file overwrites during collisions in `uniquePath`.
- Flat memory profile during large file uploads.
- 100% pass rate on the "Happy Path" E2E journey.
