@echo off
setlocal

echo [1/6] Build backend executable
cd backend
pip install pyinstaller
pyinstaller build.spec

echo [2/6] Build frontend POS
cd ..\frontend-pos
npm run build

echo [3/6] Copy backend dist to Electron resources
if not exist resources\backend mkdir resources\backend
xcopy /E /I /Y ..\backend\dist\factutienda-backend resources\backend\

echo [4/6] Build electron installer
npx electron-builder build --win

echo [5/6] Build complete
echo Expected installer: dist\FactuTienda-Setup-1.0.0.exe

endlocal
