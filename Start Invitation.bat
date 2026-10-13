@echo off
setlocal
cd /d "%~dp0"
title Kenvi ^& Puru - Reception Invitation

where node >nul 2>nul
if errorlevel 1 goto :nonode

echo.
echo   Starting the invitation... a browser tab will open in a moment.
echo   Keep this window open while you view it. Close it (or press Ctrl+C) to stop.
echo.
node "tools\serve.mjs" %*
if errorlevel 1 (
  echo.
  echo   The local server could not start. Opening the invitation directly instead.
  start "" "%~dp0index.html"
  pause
)
goto :eof

:nonode
echo.
echo   Node.js is not installed, so the invitation will open directly from the file.
echo   Everything works this way too. For the local server (and to preview on your phone),
echo   install Node.js:   winget install OpenJS.NodeJS.LTS
echo.
start "" "%~dp0index.html"
timeout /t 6 >nul
