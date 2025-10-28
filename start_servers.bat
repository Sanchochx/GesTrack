@echo off
echo ========================================
echo   GesTrack - Iniciando Servidores
echo ========================================
echo.

REM Iniciar Backend en nueva ventana
echo [1/2] Iniciando Backend Flask...
start "GesTrack Backend" cmd /k "cd /d "%~dp0backend" && py run.py"

REM Esperar 2 segundos
timeout /t 2 /nobreak >nul

REM Iniciar Frontend en nueva ventana
echo [2/2] Iniciando Frontend React...
start "GesTrack Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo   Servidores iniciados correctamente
echo ========================================
echo.
echo Backend:  http://127.0.0.1:5000
echo Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
