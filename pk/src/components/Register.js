// src/components/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        const response = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.text();
        setMessage(data);

        if (response.ok) {
            navigate('/login'); // Перенаправляем на страницу входа
        }
    };

    return (
        <div>
            <h1 id='Reg'>Регистрация</h1>
            <br></br>
            <form onSubmit={handleRegister}>
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
                <button type="submit">Зарегистрироваться</button>
            </form>
            <p>{message}</p>
            <p>
                Уже есть учетная запись?{' '}
                <button id='btn2' onClick={() => navigate('/login')}>Войти</button>
            </p>
        </div>
    );
}