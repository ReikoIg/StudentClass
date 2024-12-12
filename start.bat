@echo off

REM Переход в папку server и установка зависимостей
cd server
npm install
npm install express sqlite3 dotenv body-parser cors bcrypt jsonwebtoken express-rate-limit

REM Запуск сервера
node server.js

REM Переход в папку pk и установка зависимостей для React-приложения
cd ..\pk
npm install
npm install react-scripts@latest
npm install react-dom@latest
npm install react@18 react-dom@18

REM Запуск React-приложения
npm start

pause
