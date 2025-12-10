@echo off
echo ===================================================
echo   RESETTING DATABASE (LARGE SCALE MODE)
echo ===================================================
echo.
echo  This will create:
echo  - 6 Offices
echo  - 65 Officers
echo  - 600 Offenders
echo.
echo  Please CLOSE the app window first.
pause

cd /d "c:\Users\mnews\OneDrive\Documents\AI_Projects\parole-officer-poc"

echo.
echo  1. Wiping Database...
python full_reset_db.py

echo.
echo  2. Creating Admin & Base Users...
python seed_initial_users.py

echo.
echo  3. Generating Large Dataset (This may take a moment)...
python seed_scale_data.py

echo.
echo  DONE! You can now start the app.
pause
