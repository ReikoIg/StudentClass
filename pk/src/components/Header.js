
import React from "react";
import { Link } from "react-router-dom"; // Импортируем Link для навигации

export default function Header() {
    return (
        <header>
            <div>
                <span className='logo'>UchetPA</span>
                <ul id="Cvet" className='nav'>
                    <li><Link to="/">О нас</Link></li>
                    <li><Link to="/contacts">Контакты</Link></li>
                    <li><Link to="/login">Авторизация</Link></li> {/* Ссылка на страницу входа */}
                </ul>
            </div>
            <div className='presentation'></div>
        </header>
    );
}