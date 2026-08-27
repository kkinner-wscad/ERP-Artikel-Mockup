@echo off
setlocal
cd /d "%~dp0"
where pnpm >nul 2>&1
if errorlevel 1 (
  echo pnpm wurde nicht gefunden. Bitte das Projekt zuerst ueber Codex einrichten.
  pause
  exit /b 1
)
start "ERP Artikel Mockup" cmd /k "pnpm dev"
timeout /t 4 /nobreak >nul
start "" http://localhost:3000
endlocal
