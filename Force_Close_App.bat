@echo off
echo ===================================================
echo   FORCE CLOSING PAROLE APP
echo ===================================================
echo.
echo  Killing all Python processes...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM uvicorn.exe /T 2>nul

echo.
echo  Killing all Node/NPM processes...
taskkill /F /IM node.exe /T 2>nul

echo.
echo  Cleanup Complete.
echo  You can now run Start_Parole_App.bat cleanly.
pause
