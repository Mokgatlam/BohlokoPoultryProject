@echo off
echo ========================================
echo Chicken Processing Management System
echo ========================================
echo.
echo 🚀 Starting without Firebase Emulator (using real Firebase service)
echo.

echo [1/2] Starting Backend Server...
start /B cmd /c "cd chicken-processing-backend && node run-server.js"
timeout /t 5 /nobreak > nul

echo.
echo [2/2] Starting Frontend Server...
start /B cmd /c "cd chicken-processing-frontend && npx vite --port 3000"
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo ✅ All servers started!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:3001
echo 📊 Dashboard: web-dashboard.html (open in browser)
echo.
echo ⚠️  Note: Backend is using REAL Firebase service (not emulator)
echo.
echo Press any key to open the dashboard...
pause > nul

start "" "web-dashboard.html"
