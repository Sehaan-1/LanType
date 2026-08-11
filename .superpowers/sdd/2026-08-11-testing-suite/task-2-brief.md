# Task 2: Core Logic Hardening (Unit Tests)

**Goal:** Implement exhaustive unit tests for the file system logic in `src/lib/files.ts` to ensure no data loss, no path traversal, and correct collision handling.

**Files to Create:**
- `tests/unit/files.test.ts`

**Interfaces:**
- Consumes: `safeFilename`, `uniquePath`, `streamToDisk` from `@/lib/files`.

**Detailed Requirements:**

1. **`safeFilename(name)` Tests**:
    - **Path Traversal**: Test strings like `../../etc/passwd`, `..\..\windows\system32`, and mixed separators. None should result in a path containing `..` or drive letters.
    - **Illegal Characters**: Test null bytes (`\0`), control characters (`\x00-\x1f`), and symbols like `< > : " | ? * \ /`.
    - **Length Capping**: Test filenames > 200 characters. Verify they are truncated but keep their extension.
    - **Fallbacks**: Test empty strings or strings that become empty after cleaning (e.g., `...`). Verify they result in a `file-timestamp` format.

2. **`uniquePath(folder, name)` Tests**:
    - **No Collision**: Verify it returns the safe filename if the file doesn't exist.
    - **Basic Collision**: Create `test.txt`. Call `uniquePath` for `test.txt`. Verify it returns `test (1).txt`.
    - **Chain Collision**: Create `test.txt` and `test (1).txt`. Verify it returns `test (2).txt`.
    - **Upper Limit**: (Simulated or real) Verify that after 10,000 collisions, it falls back to the ISO timestamp format.

3. **`streamToDisk(file, destPath)` Tests**:
    - **Integrity**: Use a mock `File` with known content. Verify that the file written to disk is identical.
    - **Large Files**: Verify that streaming a large file (e.g., 100MB mock) doesn't crash the process.

**Deliverable:** All tests in `tests/unit/files.test.ts` passing via `npm run test:unit`.
