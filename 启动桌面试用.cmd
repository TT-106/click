@echo off
cd /d "%~dp0"
if exist "output\desktop-build\WildernessCompanion-win32-x64\WildernessCompanion.exe" (
  start "" "output\desktop-build\WildernessCompanion-win32-x64\WildernessCompanion.exe"
  exit /b
)
call npm run desktop:dev
if errorlevel 1 pause
