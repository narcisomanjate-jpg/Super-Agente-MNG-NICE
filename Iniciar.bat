@echo off
start cmd /k "npm run dev"
timeout /t 5
start http://localhost:3000