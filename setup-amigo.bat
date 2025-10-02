@echo off
echo 🚀 Configurando projeto SampAI para seu amigo...
echo.

echo 📦 Instalando dependências do backend...
cd backend
npm install
cd ..

echo 📦 Instalando dependências do frontend...
npm install

echo.
echo ✅ Setup concluído!
echo.
echo 📋 Para rodar o projeto:
echo 1. Terminal 1: node backend/app.js
echo 2. Terminal 2: npx expo start
echo.
pause
