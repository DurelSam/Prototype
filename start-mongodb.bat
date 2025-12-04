@echo off
echo ====================================
echo Starting MongoDB Server
echo ====================================
echo.

:: Create data directory if it doesn't exist
if not exist "C:\data\db" (
    echo Creating data directory at C:\data\db
    mkdir "C:\data\db"
)

:: Start MongoDB server
echo Starting MongoDB on port 27017...
start "MongoDB Server" mongod --dbpath "C:\data\db"

echo.
echo MongoDB is starting in a new window...
echo You can close this window once MongoDB is running.
echo.
pause
