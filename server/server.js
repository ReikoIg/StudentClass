// server.js

require('dotenv').config(); // Загрузка переменных окружения из .env файла

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt'); // Для хеширования паролей
const jwt = require('jsonwebtoken'); // Для генерации и проверки токенов
const rateLimit = require('express-rate-limit'); // Для ограничения количества запросов

const app = express();
const PORT = process.env.PORT || 5000;

// Конфигурация CORS
app.use(cors());

// Парсинг JSON тел запросов
app.use(bodyParser.json());

// Ограничение количества запросов для защиты от DDoS-атак и перебора
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов с одного IP за окно
    message: 'Слишком много запросов с этого IP, попробуйте позже.',
});

app.use(limiter);

// Получение секретного ключа из переменных окружения
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_jwt_secret_key';

// Путь к файлу базы данных SQLite
const dbPath = path.join(__dirname, 'newdb.sqlite');

// Проверка существования файла базы данных; если нет, создаем его
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, ''); // Создание нового файла базы данных
    console.log('Создан новый файл базы данных SQLite.');
}

// Подключение к базе данных SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Не удалось подключиться к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite.');
    }
});

// Создание таблицы пользователей, если она не существует
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
            -- Динамические столбцы будут добавлены через ALTER TABLE
        )
    `, (err) => {
        if (err) {
            console.error('Ошибка при создании таблицы users:', err.message);
        } else {
            console.log('Таблица users создана или уже существует.');
        }
    });
});

// Middleware для аутентификации пользователей
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Необходима авторизация.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен.' });
        }
        req.user = user; // Добавление информации о пользователе в запрос
        next();
    });
};

// Middleware для авторизации пользователей по ролям
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Доступ запрещен: недостаточно прав.' });
        }
        next();
    };
};

// Эндпоинт для регистрации новых пользователей
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Валидация входных данных
    if (!username || !password) {
        return res.status(400).json({ error: 'Логин и пароль обязательны.' });
    }

    if (username.length < 3) {
        return res.status(400).json({ error: 'Логин должен содержать минимум 3 символа.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Хешируем пароль

        const stmt = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')");
        stmt.run([username, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Пользователь с таким логином уже существует.' });
                }
                console.error('Ошибка при регистрации:', err.message);
                return res.status(500).json({ error: 'Ошибка регистрации.' });
            }
            res.status(201).json({ message: 'Пользователь успешно зарегистрирован.', userId: this.lastID });
        });
        stmt.finalize();
    } catch (error) {
        console.error('Ошибка хеширования пароля:', error.message);
        res.status(500).json({ error: 'Ошибка регистрации.' });
    }
});

// Эндпоинт для входа пользователей
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Валидация входных данных
    if (!username || !password) {
        return res.status(400).json({ error: 'Логин и пароль обязательны.' });
    }

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
        if (err) {
            console.error('Ошибка при входе:', err.message);
            return res.status(500).json({ error: 'Ошибка входа.' });
        }

        if (row && await bcrypt.compare(password, row.password)) {
            // Генерация JWT токена
            const token = jwt.sign(
                { id: row.id, username: row.username, role: row.role },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.status(200).json({ message: 'Успешный вход.', token, role: row.role });
        } else {
            res.status(401).json({ error: 'Неправильный логин или пароль.' });
        }
    });
});

// Эндпоинт для создания пользователей (доступно только админам)
app.post('/create-user', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { username, password, role } = req.body;

    // Валидация входных данных
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Логин, пароль и роль обязательны.' });
    }

    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Недопустимая роль. Доступны "user" или "admin".' });
    }

    if (username.length < 3) {
        return res.status(400).json({ error: 'Логин должен содержать минимум 3 символа.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const stmt = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
        stmt.run([username, hashedPassword, role], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Пользователь с таким логином уже существует.' });
                }
                console.error('Ошибка при создании пользователя:', err.message);
                return res.status(500).json({ error: 'Ошибка создания пользователя.' });
            }
            res.status(201).json({ message: `Пользователь успешно создан с ID: ${this.lastID}.`, userId: this.lastID });
        });
        stmt.finalize();
    } catch (error) {
        console.error('Ошибка хеширования пароля:', error.message);
        res.status(500).json({ error: 'Ошибка создания пользователя.' });
    }
});

// Эндпоинт для добавления администратора (доступно только админам)
app.post('/add-admin', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { username, password } = req.body;

    // Валидация входных данных
    if (!username || !password) {
        return res.status(400).json({ error: 'Логин и пароль обязательны.' });
    }

    if (username.length < 3) {
        return res.status(400).json({ error: 'Логин должен содержать минимум 3 символа.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const stmt = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')");
        stmt.run([username, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Пользователь с таким логином уже существует.' });
                }
                console.error('Ошибка при добавлении администратора:', err.message);
                return res.status(500).json({ error: 'Ошибка добавления администратора.' });
            }
            res.status(201).json({ message: `Администратор успешно добавлен с ID: ${this.lastID}.`, userId: this.lastID });
        });
        stmt.finalize();
    } catch (error) {
        console.error('Ошибка хеширования пароля:', error.message);
        res.status(500).json({ error: 'Ошибка добавления администратора.' });
    }
});

// Эндпоинт для получения всех пользователей (доступно только админам)
app.get('/users', authenticateToken, authorizeRole(['admin']), (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            console.error('Ошибка при получении пользователей:', err.message);
            return res.status(500).json({ error: 'Ошибка получения пользователей.' });
        }
        res.status(200).json(rows);
    });
});

// Эндпоинт для получения конкретного пользователя по ID (доступно только админам)
app.get('/users/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const userId = req.params.id;

    db.get("SELECT * FROM users WHERE id = ?", [userId], (err, row) => {
        if (err) {
            console.error(`Ошибка при получении пользователя с ID ${userId}:`, err.message);
            return res.status(500).json({ error: 'Ошибка получения пользователя.' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Пользователь не найден.' });
        }

        res.status(200).json(row);
    });
});

// Эндпоинт для обновления пользователя по ID (доступно только админам)
app.put('/users/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const userId = req.params.id;
    const updatedData = req.body;

    // Избегаем обновления ID напрямую
    if (updatedData.id) {
        delete updatedData.id;
    }

    // Формирование SET части запроса динамически
    const keys = Object.keys(updatedData);
    if (keys.length === 0) {
        return res.status(400).json({ error: 'Нет данных для обновления.' });
    }

    // Формируем строку для обновления
    const setStatement = keys.map((key) => `${key} = ?`).join(', ');
    const values = keys.map((key) => updatedData[key]);
    values.push(userId); // Добавляем ID пользователя для WHERE

    const sql = `UPDATE users SET ${setStatement} WHERE id = ?`;

    db.run(sql, values, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Пользователь с таким логином уже существует.' });
            }
            console.error(`Ошибка при обновлении пользователя с ID ${userId}:`, err.message);
            return res.status(500).json({ error: 'Ошибка обновления пользователя.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Пользователь не найден.' });
        }

        res.status(200).json({ message: 'Пользователь успешно обновлен.' });
    });
});

// Эндпоинт для удаления пользователя по ID (доступно только админам)
app.delete('/users/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const userId = req.params.id;

    db.run("DELETE FROM users WHERE id = ?", [userId], function(err) {
        if (err) {
            console.error(`Ошибка при удалении пользователя с ID ${userId}:`, err.message);
            return res.status(500).json({ error: 'Ошибка удаления пользователя.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Пользователь не найден.' });
        }

        res.status(200).json({ message: `Пользователь успешно удалён с ID: ${userId}.` });
    });
});

// Эндпоинт для получения списка столбцов таблицы users (доступно только админам)
app.get('/columns', authenticateToken, authorizeRole(['admin']), (req, res) => {
    db.all("PRAGMA table_info(users)", [], (err, columns) => {
        if (err) {
            console.error('Ошибка при получении информации о таблице users:', err.message);
            return res.status(500).json({ error: 'Ошибка получения информации о таблице.' });
        }

        const columnNames = columns.map(column => column.name);
        res.status(200).json(columnNames);
    });
});

// Эндпоинт для создания нового столбца в таблице users (доступно только админам)
app.post('/create-column', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const { columnName } = req.body;

    // Валидация входных данных
    if (!columnName) {
        return res.status(400).json({ error: 'Название столбца обязательно.' });
    }

    // Санация и валидация названия столбца
    const validColumnName = /^[A-Za-z_][A-Za-z0-9_]*$/.test(columnName);
    if (!validColumnName) {
        return res.status(400).json({
            error: 'Недопустимые символы в названии столбца. Разрешены только буквы, цифры и подчеркивания, и название должно начинаться с буквы или подчеркивания.'
        });
    }

    // Проверка на существование столбца
    db.all("PRAGMA table_info(users)", [], (err, columns) => {
        if (err) {
            console.error('Ошибка при получении информации о таблице users:', err.message);
            return res.status(500).json({ error: 'Ошибка получения информации о таблице.' });
        }

        if (columns.some(col => col.name.toLowerCase() === columnName.toLowerCase())) {
            return res.status(400).json({ error: `Столбец с именем "${columnName}" уже существует.` });
        }

        // Добавление нового столбца
        const alterTableQuery = `ALTER TABLE users ADD COLUMN ${columnName} TEXT`;

        db.run(alterTableQuery, (err) => {
            if (err) {
                console.error(`Ошибка при добавлении столбца "${columnName}":`, err.message);
                return res.status(500).json({ error: 'Ошибка при добавлении столбца.' });
            }

            res.status(200).json({ message: `Столбец "${columnName}" успешно добавлен.` });
        });
    });
});

// Централизованная обработка ошибок
app.use((err, req, res, next) => {
    console.error('Централизованная обработка ошибок:', err.stack);
    res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер работает на http://localhost:${PORT}`);
});
// Эндпоинт для получения информации о пользователях доступный для всех
// Эндпоинт для получения информации о пользователях для всех
app.get('/public-users', (req, res) => {
    db.all("SELECT id, username, role FROM users", [], (err, rows) => {
        if (err) {
            console.error('Ошибка при получении пользователей:', err.message);
            return res.status(500).json({ error: 'Ошибка получения пользователей.' });
        }
        res.status(200).json(rows);
    });
});
app.post('/delete-column', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const { columnName } = req.body;

    // Проверка названия столбца
    if (!columnName) {
        return res.status(400).json({ error: 'Название столбца обязательно к удалению.' });
    }

    db.run(`ALTER TABLE users DROP COLUMN ${columnName}`, function(err) {
        if (err) {
            console.error(`Ошибка при удалении столбца "${columnName}":`, err.message);
            return res.status(500).json({ error: 'Ошибка при удалении столбца.' });
        }
        res.status(200).json({ message: `Столбец "${columnName}" успешно удалён.` });
    });
});