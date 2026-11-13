@echo off
cd /d "%~dp0"
echo Starting AlgoVision (Python server)...
py server.py || python server.py
pause
