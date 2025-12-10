@echo off
echo ===================================================
echo   RESETTING PAROLE OFFICER DATABASE
echo ===================================================
echo.
echo  WARNING: This will delete correctly all data and start fresh!
echo.
echo  Please make sure you have CLOSED the main app window before continuing.
echo.
pause

cd /d "c:\Users\mnews\OneDrive\Documents\AI_Projects\parole-officer-poc"

echo.
echo  Running reset script...
python full_reset_db.py

echo.
echo  Seeding initial data...
python seed_initial_users.py
python seed_mock_data.py

echo.
echo  DONE! You can close this window and restart the app.
pause
