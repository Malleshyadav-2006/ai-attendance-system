@echo off
echo Starting AI Smart Attendance System...

start cmd /k "cd backend && uvicorn main:app --reload"
start cmd /k "cd frontend && npm run dev"

echo Backend running on http://localhost:8000
echo Frontend running on http://localhost:3000
echo.
echo Press any key to exit this launcher...
pause
