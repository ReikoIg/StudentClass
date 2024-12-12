import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateUser = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user'); // По умолчанию 'user'
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:5000/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`, // Передаем токен
                },
                body: JSON.stringify({ username, password, role }),
            });

            if (response.ok) {
                alert('Учетная запись создана!');
                navigate('/admin-panel'); // Перенаправление на Админ Панель
            } else {
                const errorMessage = await response.text();
                alert('Ошибка: ' + errorMessage);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при создании учетной записи.');
        }
    };

    return (
        <div>
            <h1 id='Sos'>Создание учетной записи</h1>
            <br />
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Логин:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Пароль:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="role">Роль:</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="user">Пользователь</option>
                        <option value="admin">Администратор</option>
                    </select>
                </div>
                <div id="Knopki2">
                    <button type="submit">Создать учетную запись</button>
                    <button className="action-button" onClick={() => navigate('/admin-panel')}>Назад</button>
                </div>
            </form>
        </div>
    );
};

export default CreateUser;