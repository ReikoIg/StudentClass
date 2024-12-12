import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
    const navigate = useNavigate();

    const handleNavigateToAdminPanel = () => {
        navigate('/admin-panel');
    };

    return (
        <div>
            <h1 id='Wel'>Добро пожаловать!</h1>
            <p>Вы успешно вошли в систему!</p>
            <br></br>

            <button id='kn' onClick={handleNavigateToAdminPanel}>Ознакомиться с информацией</button>
        </div>
    );
}