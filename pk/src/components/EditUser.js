// src/components/EditUser.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const EditUser = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [user, setUser] = useState({});
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');
    const isAdmin = token ? JSON.parse(atob(token.split('.')[1])).role === 'admin' : false;

    useEffect(() => {
        const fetchData = async () => {
            if (!isAdmin) {
                navigate('/welcome');
                return;
            }

            try {
                // Получение столбцов
                const columnsResponse = await fetch('http://localhost:5000/columns', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!columnsResponse.ok) {
                    throw new Error('Ошибка при загрузке столбцов');
                }

                const columnsData = await columnsResponse.json();
                setColumns(columnsData);

                // Получение данных пользователя
                const userResponse = await fetch(`http://localhost:5000/users/${id}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!userResponse.ok) {
                    throw new Error('Ошибка при загрузке данных пользователя');
                }

                const userData = await userResponse.json();
                setUser(userData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, isAdmin, navigate, token]);

    const handleChange = (e, column) => {
        setUser({ ...user, [column]: e.target.value });
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`http://localhost:5000/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(user),
            });

            if (response.ok) {
                alert('Данные пользователя успешно обновлены!');
                navigate('/admin-panel');
            } else {
                const errorData = await response.json();
                alert(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            alert('Ошибка сети. Пожалуйста, попробуйте еще раз.');
        }
    };

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }

    return (
        <div>
            <h1>Редактировать пользователя</h1>
            <form>
                {columns.map((col) => (
                    <div key={col}>
                        <label>{col.charAt(0).toUpperCase() + col.slice(1)}:</label>
                        <input
                            type="text"
                            value={user[col] || ''}
                            onChange={(e) => handleChange(e, col)}
                            disabled={col === 'id'} // Не разрешаем изменять ID
                        />
                    </div>
                ))}
            </form>
            <button onClick={handleSave}>Сохранить</button>
            <button onClick={() => navigate('/admin-panel')}>Отмена</button>
        </div>
    );
};

export default EditUser;