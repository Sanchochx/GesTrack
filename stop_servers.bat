@echo off
echo ========================================
echo   GesTrack - Deteniendo Servidores
echo ========================================
echo.

REM Detener procesos Python (Backend)
echo [1/2] Deteniendo Backend Flask...
taskkill /FI "WINDOWTITLE eq GesTrack Backend*" /T /F 2>nul
if %errorlevel%==0 (
    echo Backend detenido correctamente.
) else (
    echo Backend no estaba corriendo.
)

REM Detener procesos Node (Frontend)
echo [2/2] Deteniendo Frontend React...
taskkill /FI "WINDOWTITLE eq GesTrack Frontend*" /T /F 2>nul
if %errorlevel%==0 (
    echo Frontend detenido correctamente.
) else (
    echo Frontend no estaba corriendo.
)

echo.
echo ========================================
echo   Servidores detenidos
echo ========================================
echo.
pause
