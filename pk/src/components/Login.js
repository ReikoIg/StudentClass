// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data = await response.json();
            const { token, role } = data;

            // Сохраняем токен в локальном хранилище
            localStorage.setItem('token', token);

            // Направляем пользователя в зависимости от его роли
            if (role === 'admin') {
                navigate('/admin-panel'); // Панель администратора
            } else {
                navigate('/welcome'); // Страница приветствия
            }
        } else {
            const data = await response.text();
            setMessage(data);
        }
    };

    return (
        <div>
            <h1 id='Au'>Авторизация</h1>
            <br></br>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Логин"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Войти</button>
            </form>
            <p>{message}</p>
            <p>
                Нет учетной записи?{' '}
                <button id='btn1' onClick={() => navigate('/register')}>Зарегистрироваться</button>
            </p>
        </div>
    );
}