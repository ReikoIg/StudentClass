import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]); // Хранение списка пользователей
    const [columns, setColumns] = useState([]); // Хранение списка столбцов
    const [loading, setLoading] = useState(true); // Состояние загрузки
    const [selectedUserIds, setSelectedUserIds] = useState([]); // Хранение выделенных пользователей
    const [error, setError] = useState(null); // Хранение ошибок

    const parseJwt = (token) => {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    };

    const token = localStorage.getItem('token'); // Получение токена из локального хранилища
    const isAdmin = token ? parseJwt(token).role === 'admin' : false; // Проверка, является ли пользователь администратором

    useEffect(() => {
        const fetchData = async () => {
            if (!isAdmin) {
                navigate('/welcome'); // Если не админ, перенаправляем на страницу приветствия
                return;
            }

            try {
                // Получение списка столбцов
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

                // Получение списка пользователей
                const usersResponse = await fetch('http://localhost:5000/users', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!usersResponse.ok) {
                    throw new Error('Ошибка при загрузке пользователей');
                }

                const usersData = await usersResponse.json();
                setUsers(usersData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false); // Завершение загрузки данных
            }
        };

        fetchData(); // Вызов функции для загрузки данных
    }, [isAdmin, navigate, token]);

    const handleRowClick = (userId) => {
        if (selectedUserIds.includes(userId)) {
            setSelectedUserIds(selectedUserIds.filter((id) => id !== userId)); // Удаляем из выделенных
        } else {
            setSelectedUserIds([...selectedUserIds, userId]); // Добавляем в выделенные
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedUserIds.length === 0) {
            alert('Выберите хотя бы одну учетную запись для удаления.');
            return;
        }

        if (window.confirm('Вы точно хотите удалить выбранные учетные записи?')) {
            try {
                await Promise.all(selectedUserIds.map(async (userId) => {
                    const response = await fetch(`http://localhost:5000/users/${userId}`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!response.ok) {
                        console.error('Ошибка при удалении учетной записи с ID:', userId);
                    }
                }));

                alert('Выбранные учетные записи успешно удалены!');
                setUsers(users.filter(user => !selectedUserIds.includes(user.id))); 
                setSelectedUserIds([]); // Очищаем выделенные ID
            } catch (error) {
                console.error('Ошибка:', error);
            }
        }
    };

    if (loading) {
        return <div>Загрузка...</div>; // Показать сообщение во время загрузки данных
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>; // Показать ошибку, если она произошла
    }

    return (
        <div>
            <h1 id='Panel'>Панель администратора</h1>
            <table id='Stol'>
                <thead>
                    <tr>
                        <th>ID</th>
                        {columns.filter(col => col !== 'id').map((col) => (
                            <th key={col}>{col.charAt(0).toUpperCase() + col.slice(1)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr 
                            key={user.id}
                            onClick={() => handleRowClick(user.id)} 
                            style={{ backgroundColor: selectedUserIds.includes(user.id) ? '#d3d3d3' : 'transparent', cursor: 'pointer' }}
                        >
                            {columns.map((col) => (
                                <td key={col}>{user[col] || ''}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {isAdmin && ( // Показывать кнопки только для администраторов
                <div id="Knopki">
                    <button className="action-button" onClick={() => navigate('/create-user')}>Создать учетную запись</button>
                    <button 
                        className="action-button" 
                        onClick={() => {
                            if (selectedUserIds.length === 1) {
                                navigate(`/edit-user/${selectedUserIds[0]}`);
                            } else {
                                alert('Выберите ровно одну учетную запись для редактирования.');
                            }
                        }} >    
                        Редактировать учетную запись
                    </button>
                    <button className="action-button" onClick={handleDeleteSelected}>Удалить учетные записи</button>
                    <button className="action-button" onClick={() => navigate('/create-column')}>Создать столбец</button>
                    <button className="action-button" onClick={() => navigate('/delete-column')}>Удалить столбец</button> {/* Новая кнопка */}
                </div>
            )}
        </div>
    );
};

export default AdminPanel;