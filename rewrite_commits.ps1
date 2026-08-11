#!/usr/bin/env powershell
# Fix commit 52def55 message (just cherry-picked with wrong msg) then do the rest

# Fix the last commit's message
git commit --amend -m "unit tests for fs helpers, tighten safeFilename"

# Now cherry-pick the remaining 4
$remaining = @(
    @{ hash = "0803095d5b0275f4ac58536344b4a8b710274ee2"; msg = "add integration tests for the API routes" },
    @{ hash = "5311d74ecb0a7374ce067464fd87a58855ed5cbd"; msg = "fix wrong status code on upload + tweak mock setup" },
    @{ hash = "ffa325e59c8b76f247979504c47ca0445df7f9c9"; msg = "add e2e tests for file upload flow" },
    @{ hash = "7efec8432c6a3d4f47adb1404c722dd462827d4a"; msg = "ignore .superpowers folder" }
)

for ($i = 0; $i -lt $remaining.Count; $i++) {
    $hash = $remaining[$i].hash
    $msg  = $remaining[$i].msg
    Write-Host "[$($i+1)/$($remaining.Count)] Cherry-picking $hash -> '$msg'"
    $result = git cherry-pick $hash 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Conflict detected, resolving..."
        git checkout --theirs . 2>&1 | Out-Null
        git add . 2>&1 | Out-Null
        git cherry-pick --continue --no-edit 2>&1 | Out-Null
    }
    git commit --amend -m $msg 2>&1 | Out-Null
    Write-Host "  Done."
}

Write-Host ""
Write-Host "=== Final log ==="
git log --oneline -12

Write-Host ""
Write-Host "Force-moving main to rewrite-temp tip..."
git branch -f main HEAD
Write-Host "Done. Now run: git checkout main"
