@echo off
setlocal
cd /d "%~dp0"
echo.
echo ================================================
echo  STOCK BOOK - NETLIFY PREVIEW DEPLOYMENT
 echo ================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install Node.js LTS 20 or newer first.
  echo https://nodejs.org/en/download
  pause
  exit /b 1
)
node -v
call node scripts\preflight-integrated.mjs
if errorlevel 1 (
  echo Preflight failed. Do not deploy until the issue is fixed.
  pause
  exit /b 1
)
echo.
echo Installing project dependencies...
call npm install
if errorlevel 1 (
  echo npm install failed.
  pause
  exit /b 1
)
echo.
echo Opening Netlify login...
call npx netlify-cli@latest login
if errorlevel 1 (
  echo Netlify login did not complete.
  pause
  exit /b 1
)
echo.
echo Link this folder to a NEW Netlify staging site, or the staging site you intend to test.
call npx netlify-cli@latest link
if errorlevel 1 (
  echo Netlify link did not complete.
  pause
  exit /b 1
)
echo.
echo Creating a DRAFT preview deployment (not production)...
call npx netlify-cli@latest deploy
if errorlevel 1 (
  echo Preview deployment failed. Review the Netlify CLI output above.
  pause
  exit /b 1
)
echo.
echo Preview deployment created. Test login, catalog, sales, BILLZ sync, analytics, reports and /tg/.
echo Only after successful testing, deploy production with: npx netlify-cli@latest deploy --prod
pause
