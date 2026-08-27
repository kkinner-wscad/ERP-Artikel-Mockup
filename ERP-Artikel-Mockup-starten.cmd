@echo off
setlocal
cd /d "%~dp0"

set "APP_PORT=3010"
set "CODEX_NODE_BIN=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "CODEX_PNPM=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"

if exist "%CODEX_NODE_BIN%\node.exe" if exist "%CODEX_PNPM%" (
  set "PATH=%CODEX_NODE_BIN%;%PATH%"
  set "PNPM_COMMAND=%CODEX_PNPM%"
  goto :runtime_ready
)

where pnpm >nul 2>&1
if not errorlevel 1 (
  set "PNPM_COMMAND=pnpm"
  goto :runtime_ready
)

echo.
echo Die lokale JavaScript-Laufzeit wurde nicht gefunden.
echo Auf diesem Rechner kann das Projekt ueber Codex eingerichtet werden.
echo Fuer andere Rechner werden Node.js 22 oder neuer und pnpm benoetigt.
echo.
pause
exit /b 1

:runtime_ready
if not exist "%~dp0node_modules" (
  echo Die Projektabhaengigkeiten fehlen und werden jetzt installiert.
  call "%PNPM_COMMAND%" install
  if errorlevel 1 (
    echo Die Installation ist fehlgeschlagen.
    pause
    exit /b 1
  )
)

powershell -NoProfile -Command "$c=Get-NetTCPConnection -LocalPort %APP_PORT% -State Listen -ErrorAction SilentlyContinue; if($c){exit 1}else{exit 0}"
if errorlevel 1 (
  echo Port %APP_PORT% ist bereits belegt.
  echo Bitte das bereits laufende ERP-Mockup schliessen und erneut starten.
  pause
  exit /b 1
)

start "ERP Artikel Mockup - Server" cmd /k ""%PNPM_COMMAND%" dev --host localhost --port %APP_PORT% --strictPort"

echo ERP Artikel Mockup wird gestartet ...
for /l %%I in (1,1,20) do (
  powershell -NoProfile -Command "try{$r=Invoke-WebRequest -UseBasicParsing 'http://localhost:%APP_PORT%/' -TimeoutSec 1; if($r.StatusCode -eq 200){exit 0}}catch{}; exit 1"
  if not errorlevel 1 goto :open_browser
  timeout /t 1 /nobreak >nul
)

echo Der lokale Server konnte nicht rechtzeitig gestartet werden.
echo Bitte die Meldung im Fenster "ERP Artikel Mockup - Server" pruefen.
pause
exit /b 1

:open_browser
start "" "http://localhost:%APP_PORT%/"
endlocal
