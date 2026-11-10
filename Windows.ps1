param([ValidateSet('Setup','Start','Test')][string]$Action = 'Start')
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (!(Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22 LTS first.' }
if ($Action -eq 'Setup') {
    if (!(Test-Path 'ai-detective-game/.env.local')) { Copy-Item 'ai-detective-game/.env.example' 'ai-detective-game/.env.local' }
    Write-Host 'Setup complete. API key is optional for local practice cases.'
} elseif ($Action -eq 'Test') {
    & node scripts/windows-smoke.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Smoke test failed' }
} else {
    Write-Host 'Open http://127.0.0.1:4173/ in Edge or Chrome. Press Ctrl+C to stop.'
    & node ai-detective-game/server.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Game server failed' }
}
