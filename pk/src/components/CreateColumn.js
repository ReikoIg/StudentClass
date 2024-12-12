// src/components/CreateColumn.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateColumn = () => {
    const [columnName, setColumnName] = useState('');
    const navigate = useNavigate();

    const handleCreateColumn = async () => {
        if (columnName) {
            try {
                const response = await fetch('http://localhost:5000/create-column', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`, // Добавляем токен
                    },
                    body: JSON.stringify({ columnName }),
                });
    
                if (response.ok) {
                    const data = await response.json();
                    alert(data.message);
                    setColumnName(''); // Сбросить значение поля ввода
                    navigate('/admin-panel'); // Перенаправить обратно в панель администратора
                } else {
                    const errorData = await response.json();
                    alert(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`);
                }
            } catch (error) {
                alert('Ошибка сети. Пожалуйста, попробуйте еще раз.');
            }
        } else {
            alert('Пожалуйста, введите название столбца.');
        }
    };

    return (
        <div>
            <h1 id='Stolb'>Создать новый столбец</h1>
            <br />
            <input
                type="text"
                placeholder="Название столбца"
                value={columnName}
                onChange={(e) => { setColumnName(e.target.value); }}
                required
            />
            <div id='btn3'>
                <button onClick={handleCreateColumn}>Создать</button>
                <button onClick={() => navigate('/admin-panel')}>Вернуться</button> 
            </div>
        </div>
    );
};

export default CreateColumn;