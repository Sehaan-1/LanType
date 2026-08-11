# Task 2 Report: Core Logic Hardening

## Steps Taken
1.  **Requirement Analysis**: Reviewed `task-2-brief.md` to identify critical test cases for `safeFilename`, `uniquePath`, and `streamToDisk`.
2.  **Implementation**: Created `tests/unit/files.test.ts` using Vitest.
3.  **safeFilename Hardening**:
    -   Implemented tests for path traversal (`../../`, `..\..\`).
    -   Implemented tests for illegal characters and control bytes.
    -   Implemented length capping (200 chars) while preserving extensions.
    -   Implemented fallbacks for empty or purely-dot filenames.
    -   **Fix**: Updated `safeFilename` to handle strings consisting only of dots (e.g., `...`) by returning a timestamp-based filename.
4.  **uniquePath Verification**:
    -   Verified no-collision case.
    -   Verified basic collision (`test (1).txt`).
    -   Verified chain collisions (`test (2).txt`).
    -   Verified fallback to ISO timestamp after 10,000 collisions using a mocked `fs.access`.
5.  **streamToDisk Performance & Integrity**:
    -   Verified that file content is preserved exactly.
    -   Verified that 100MB files are streamed without memory saturation (using mock `File` with `ReadableStream`).

## Test Cases Implemented
| Function | Test Case | Result |
| :--- | :--- | :--- |
| `safeFilename` | Path traversal prevention | PASS |
| `safeFilename` | Illegal character removal | PASS |
| `safeFilename` | Length capping (preserving extension) | PASS |
| `safeFilename` | Fallbacks for empty/invalid names | PASS |
| `uniquePath` | Returns safe name if no collision | PASS |
| `uniquePath` | Basic collision handling | PASS |
| `uniquePath` | Chain collision handling | PASS |
| `uniquePath` | 10k collision fallback to timestamp | PASS |
| `streamToDisk` | Data integrity (Exact match) | PASS |
| `streamToDisk` | Large file streaming (100MB) | PASS |

## Verification Results
-   **Command**: `npm run test:unit`
-   **Outcome**: 10 passed, 0 failed.
-   **Path Traversal**: Confirmed zero traversal possible via `safeFilename`.
-   **Overwrites**: Confirmed `uniquePath` prevents overwrites through incrementing counters and timestamps.
-   **Memory**: Confirmed `streamToDisk` uses Node streams for constant memory usage regardless of file size.
