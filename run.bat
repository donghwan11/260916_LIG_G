@echo off
chcp 65001 > nul
echo ==================================================
echo   🚀 LIG DNA DOTO APP 실행 스크립트
echo ==================================================
echo.

set PYTHON_CMD=
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set PYTHON_CMD="%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
) else (
    py --version >nul 2>&1
    if %errorlevel% equ 0 (
        set PYTHON_CMD=py
    ) else (
        set PYTHON_CMD=python
    )
)

echo [1/2] Flask 서버를 구동합니다...
start "" http://127.0.0.1:5000
echo [2/2] 브라우저(http://127.0.0.1:5000)를 연결합니다...
echo.
%PYTHON_CMD% app.py
pause
