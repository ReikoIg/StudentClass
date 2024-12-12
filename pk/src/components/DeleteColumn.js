import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DeleteColumn = () => {
    const [columns, setColumns] = useState([]);
    const [selectedColumn, setSelectedColumn] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchColumns = async () => {
            try {
                const response = await fetch('http://localhost:5000/columns', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Ошибка при загрузке столбцов');
                }

                const columnsData = await response.json();
                setColumns(columnsData);
            } catch (error) {
                alert('Ошибка: ' + error.message);
            }
        };

        fetchColumns();
    }, [token]);

    const handleDelete = async () => {
        if (!selectedColumn) {
            alert('Пожалуйста, выберите столбец для удаления.');
            return;
        }

        if (window.confirm(`Вы уверены, что хотите удалить столбец "${selectedColumn}"?`)) {
            try {
                const response = await fetch('http://localhost:5000/delete-column', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ columnName: selectedColumn }),
                });

                if (response.ok) {
                    alert(`Столбец "${selectedColumn}" успешно удалён!`);
                    navigate('/admin-panel'); // Перенаправление обратно на админ-панель
                } else {
                    const errorData = await response.json();
                    alert('Ошибка: ' + errorData.error);
                }
            } catch (error) {
                alert('Ошибка сети. Пожалуйста, попробуйте еще раз.');
            }
        }
    };

    return (
        <div>
            <h1 id='ssa'>Удаление столбца</h1>
            <br></br>
            <div id='center'>
                <label htmlFor="columns">Выберите столбец для удаления:</label>
                <select
                    id="columns"
                    value={selectedColumn}
                    onChange={(e) => setSelectedColumn(e.target.value)}
                >
                    <option value="">-- Выберите столбец --</option>
                    {columns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                    ))}
                </select>
            </div>
            <div id='Lol'>
            <button onClick={handleDelete}>Удалить столбец</button>
            <button onClick={() => navigate('/admin-panel')}>Назад</button>
            </div>
        </div>
    );
};

export default DeleteColumn;