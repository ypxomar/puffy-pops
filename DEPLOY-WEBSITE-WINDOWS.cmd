@echo off
setlocal
cd /d "%~dp0"

echo [1/6] Installing website dependencies...
call npm install
if errorlevel 1 goto :failed

echo [2/6] Signing in to Cloudflare...
call npx wrangler login
if errorlevel 1 goto :failed

echo [3/6] Add the private session secret.
echo Paste the existing ADMIN_SESSION_SECRET when Wrangler asks for it.
call npx wrangler secret put ADMIN_SESSION_SECRET
if errorlevel 1 goto :failed

echo [4/6] Add the browser-restricted Google Maps key.
echo Paste GOOGLE_MAPS_BROWSER_KEY when Wrangler asks for it.
call npx wrangler secret put GOOGLE_MAPS_BROWSER_KEY
if errorlevel 1 goto :failed

echo [5/6] Add the server-only Google Maps key.
echo Paste GOOGLE_MAPS_SERVER_KEY when Wrangler asks for it.
call npx wrangler secret put GOOGLE_MAPS_SERVER_KEY
if errorlevel 1 goto :failed

echo [6/6] Building and deploying the website and API...
call npm run deploy:cloudflare
if errorlevel 1 goto :failed

echo.
echo Deployment complete.
echo Check https://YOUR-WORKER.workers.dev/api/app/health
echo It must show protocol 5 and compatibleProtocols [4,5].
pause
exit /b 0

:failed
echo.
echo Deployment failed. Copy the complete error shown above.
pause
exit /b 1
