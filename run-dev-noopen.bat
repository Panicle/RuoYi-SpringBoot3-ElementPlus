@echo off
cd /d %~dp0
call npx vite --host --port 8090
pause