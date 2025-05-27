# 🚀 Tracker App API

Приложение для отслеживания навыков и прогресса обучения с REST API.

## 📋 Содержание

- [Установка и запуск](#установка-и-запуск)
- [API Эндпоинты](#api-эндпоинты)
- [Структура проекта](#структура-проекта)
- [База данных](#база-данных)

## 🔧 Установка и запуск

### Предварительные требования

- Node.js (версия 16 или выше)
- PostgreSQL
- npm или yarn

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных

Убедитесь, что PostgreSQL запущен и создайте базу данных:

```sql
CREATE DATABASE tracker;
```

Обновите настройки подключения в `config/db.js` если необходимо.

### 3. Синхронизация базы данных

```bash
npm run sync-db
```

### 4. Запуск сервера

```bash
# Разработка (с автоперезагрузкой)
npm run dev

# Продакшн
npm start
```

Сервер запустится на `http://localhost:3000`

## 🌐 API Эндпоинты

### Основные

- `GET /` - Информация об API
- `GET /health` - Проверка состояния сервера
- `GET /api-docs` - Swagger документация

### Пользователи (`/api/users`)

#### Аутентификация

- `POST /api/users/register` - Регистрация нового пользователя
- `POST /api/users/login` - Авторизация пользователя

#### Профиль (требует авторизации)

- `GET /api/users/profile` - Получить профиль текущего пользователя
- `PUT /api/users/profile` - Обновить данные профиля
- `PUT /api/users/change-password` - Сменить пароль
- `GET /api/users/full-info` - Полная информация с навыками и темами
- `DELETE /api/users/delete-account` - Удалить аккаунт пользователя

### Категории навыков (`/api/categories`)

- `GET /api/categories` - Получить все категории
- `POST /api/categories` - Создать новую категорию
- `GET /api/categories/stats` - Статистика по категориям
- `GET /api/categories/:id` - Получить категорию по ID
- `PUT /api/categories/:id` - Обновить категорию
- `DELETE /api/categories/:id` - Удалить категорию
- `GET /api/categories/:id/skills` - Получить навыки категории

### Навыки (`/api/skills`)

- `GET /api/skills` - Получить все навыки пользователя
- `POST /api/skills` - Создать новый навык
- `GET /api/skills/stats` - Статистика по навыкам
- `GET /api/skills/:id` - Получить навык по ID
- `PUT /api/skills/:id` - Обновить навык
- `DELETE /api/skills/:id` - Удалить навык
- `GET /api/skills/:id/topics` - Получить темы навыка

### Темы (`/api/topics`)

- `GET /api/topics` - Получить все темы с фильтрацией
- `POST /api/topics` - Создать новую тему
- `GET /api/topics/stats` - Статистика по темам
- `GET /api/topics/:id` - Получить тему по ID
- `PUT /api/topics/:id` - Обновить тему
- `DELETE /api/topics/:id` - Удалить тему
- `GET /api/topics/:id/notes` - Получить заметки темы
- `PUT /api/topics/:id/status` - Изменить статус темы

### Заметки (`/api/notes`)

- `GET /api/notes` - Получить все заметки пользователя (фильтрация: topic_id, skill_id, поиск, пагинация)
- `POST /api/notes` - Создать новую заметку
- `GET /api/notes/stats` - Статистика по заметкам
- `GET /api/notes/search` - Поиск заметок по содержимому
- `GET /api/notes/recent` - Получить последние заметки пользователя
- `GET /api/notes/:id` - Получить заметку по ID
- `PUT /api/notes/:id` - Обновить заметку
- `DELETE /api/notes/:id` - Удалить заметку

### Статусы тем (`/api/statuses`)

- `GET /api/statuses` - Получить все статусы
- `POST /api/statuses` - Создать новый статус
- `GET /api/statuses/default` - Получить статусы по умолчанию
- `POST /api/statuses/default` - Создать статусы по умолчанию
- `GET /api/statuses/stats` - Статистика по статусам
- `GET /api/statuses/:id` - Получить статус по ID
- `PUT /api/statuses/:id` - Обновить статус
- `DELETE /api/statuses/:id` - Удалить статус

## 🧪 Полное тестирование API через Swagger UI

### Пошаговое руководство по тестированию

#### 1. Откройте Swagger UI

Перейдите по адресу: `http://localhost:3000/api-docs`

#### 2. Авторизация в Swagger

1. Зарегистрируйте нового пользователя через `/api/users/register`
2. Авторизуйтесь через `/api/users/login` и скопируйте полученный токен
3. Нажмите кнопку **"Authorize"** в верхней части Swagger UI
4. Введите токен в формате: `Bearer YOUR_JWT_TOKEN`
5. Нажмите **"Authorize"** и затем **"Close"**

#### 3. Тестирование по порядку

**Шаг 1: Создание базовых данных**

```
1. POST /api/statuses/default - Создать статусы по умолчанию
2. POST /api/categories - Создать категорию навыка
3. POST /api/skills - Создать навык
```

**Шаг 2: Работа с темами и заметками**

```
4. POST /api/topics - Создать тему
5. PUT /api/topics/{id}/status - Изменить статус темы
6. POST /api/notes - Создать заметку для темы
```

**Шаг 3: Получение данных**

```
7. GET /api/users/full-info - Полная информация пользователя
8. GET /api/skills/stats - Статистика по навыкам
9. GET /api/topics/stats - Статистика по темам
10. GET /api/notes/search - Поиск заметок
```

#### 4. Примеры тестовых данных

**Создание категории:**

```json
{
  "name": "Программирование",
  "description": "Навыки разработки программного обеспечения"
}
```

**Создание навыка:**

```json
{
  "title": "Node.js разработка",
  "description": "Изучение серверной разработки на Node.js",
  "category_id": 1
}
```

**Создание темы:**

```json
{
  "title": "Express.js основы",
  "description": "Изучение фреймворка Express для создания API",
  "skill_id": 1,
  "status_id": 2
}
```

**Создание заметки:**

```json
{
  "content": "Express - это минималистичный веб-фреймворк для Node.js. Основные возможности: роутинг, middleware, шаблонизация.",
  "topic_id": 1
}
```

#### 5. Проверка связей между данными

Убедитесь, что:

- Навыки привязаны к пользователю и категории
- Темы привязаны к навыкам и имеют статусы
- Заметки привязаны к темам
- При удалении родительских записей корректно обрабатываются связи

#### 6. Тестирование ошибок

Протестируйте обработку ошибок:

- Попытка доступа без токена авторизации
- Создание записи с несуществующим foreign key
- Валидация обязательных полей
- Обновление несуществующих записей

## 📁 Структура проекта

```
tracker-app/
├── index.js                 # Главный файл приложения
├── package.json             # Зависимости и скрипты
├── syncDatabase.js          # Синхронизация БД
├── config/
│   ├── db.js               # Конфигурация БД
│   └── swagger.js          # Настройки Swagger
├── controllers/
│   ├── userController.js   # Контроллер пользователей
│   ├── skillController.js  # Контроллер навыков
│   ├── skillCategoryController.js # Контроллер категорий
│   ├── topicController.js  # Контроллер тем
│   ├── noteController.js   # Контроллер заметок
│   ├── topicStatusController.js # Контроллер статусов
│   └── userValidation.js   # Валидация данных
├── middlewares/
│   ├── authMiddleware.js   # JWT аутентификация
│   └── errorHandler.js     # Обработка ошибок
├── models/
│   ├── index.js            # Связи между моделями
│   ├── userModel.js        # Модель пользователя
│   ├── skillModel.js       # Модель навыков
│   ├── skillCategoryModel.js # Модель категорий
│   ├── topicModel.js       # Модель тем
│   ├── noteModel.js        # Модель заметок
│   └── topicStatusModel.js # Модель статусов
├── routes/
│   ├── userRoutes.js       # Маршруты пользователей
│   ├── skillRoutes.js      # Маршруты навыков
│   ├── skillCategoryRoutes.js # Маршруты категорий
│   ├── topicRoutes.js      # Маршруты тем
│   ├── noteRoutes.js       # Маршруты заметок
│   └── topicStatusRoutes.js # Маршруты статусов
└── tests/
    └── userApiTest.js      # Тесты API
```

## 📖 Описание основных файлов

### 🔧 Конфигурация и инициализация

#### `index.js` - Главный файл приложения

Основной файл Express сервера с полной настройкой:

- Инициализация Express приложения
- Настройка CORS для кроссдоменных запросов
- Подключение middleware для обработки запросов и ошибок
- Настройка Swagger UI документации
- Подключение всех маршрутов API
- Обработка сигналов завершения процесса
- Health check эндпоинт для мониторинга

#### `config/db.js` - Конфигурация базы данных

Настройка подключения к PostgreSQL через Sequelize:

- Параметры подключения к БД
- Настройки пула соединений
- Логирование SQL запросов

#### `config/swagger.js` - Настройки Swagger

Конфигурация автоматической генерации API документации:

- Информация о API (название, версия, описание)
- Настройки серверов
- Схемы авторизации (JWT Bearer токены)
- Автоматический сбор документации из JSDoc комментариев

#### `syncDatabase.js` - Синхронизация базы данных

Утилита для синхронизации моделей Sequelize с БД:

- Проверка подключения к базе данных
- Создание/обновление таблиц
- Безопасная миграция структуры БД

### Модели данных

- `models/userModel.js` — User: id, name, email, password (bcrypt hash)
- `models/skillModel.js` — Skill: id, name, description, user_id, category_id
- `models/skillCategoryModel.js` — SkillCategory: id, name, description
- `models/topicModel.js` — Topic: id, name, description, skill_id, status_id, progress, estimated_hours
- `models/noteModel.js` — Note: id, title, content, topic_id, created_at
- `models/topicStatusModel.js` — TopicStatus: id, name, description, color

### 🗄️ Модели данных

#### `models/index.js` - Связи между моделями

Центральный файл для определения всех связей:

- User ↔ Skill (один ко многим)
- SkillCategory ↔ Skill (один ко многим)
- Skill ↔ Topic (один ко многим)
- TopicStatus ↔ Topic (один ко многим)
- Topic ↔ Note (один ко многим)
- Настройка foreign key constraints и каскадных операций

#### Модели сущностей:

- `userModel.js` - Пользователи (id, name, email, password_hash)
- `skillModel.js` - Навыки (id, title, description, owner_id, category_id)
- `skillCategoryModel.js` - Категории навыков (id, name, description)
- `topicModel.js` - Темы/задачи (id, title, description, skill_id, status_id)
- `noteModel.js` - Заметки (id, content, topic_id)
- `topicStatusModel.js` - Статусы тем (id, name, color)

### 🎮 Контроллеры

#### `userController.js` - Контроллер пользователей

Полный функционал управления пользователями:

- `register` - Регистрация с валидацией и хешированием пароля
- `login` - Авторизация с генерацией JWT токена
- `getProfile` - Получение профиля пользователя
- `updateProfile` - Обновление данных профиля
- `changePassword` - Смена пароля с проверкой старого
- `getUserFullInfo` - Полная информация с навыками и темами
- `deleteAccount` - Удаление аккаунта пользователя

#### Контроллеры для других сущностей:

- `skillController.js` - CRUD операции для навыков
- `skillCategoryController.js` - Управление категориями
- `topicController.js` - Управление темами с фильтрацией
- `noteController.js` - Управление заметками
- `topicStatusController.js` - Управление статусами

#### `userValidation.js` - Валидация данных

Класс для валидации пользовательских данных:

- Проверка формата email
- Валидация пароля (длина, сложность)
- Проверка имени пользователя
- Стандартизированный формат ошибок

### 🛡️ Middleware

#### `authMiddleware.js` - JWT аутентификация

Middleware для проверки авторизации:

- Извлечение JWT токена из заголовка Authorization
- Верификация токена и декодирование
- Проверка существования пользователя в БД
- Добавление данных пользователя в req.user

#### `errorHandler.js` - Обработка ошибок

Комплексная система обработки ошибок:

- Обработка ошибок Sequelize (валидация, уникальность, FK)
- Логирование ошибок с контекстом запроса
- Стандартизированные ответы API
- Middleware для валидации Content-Type
- Обработка превышения лимита размера запроса

- **authMiddleware.js** — JWT-аутентификация для защищённых маршрутов.
- **errorHandler.js** — Централизованная обработка ошибок, валидация, логирование, 404.
- **requestLogger** — Логирование всех запросов (метод, URL, статус, время, IP, user).
- **validateContentType** — Проверка Content-Type для POST/PUT/PATCH.
- **bodyLimitHandler** — Ограничение размера тела запроса.

## 📊 Swagger Documentation

- Автоматически собирается из JSDoc-комментариев в файлах маршрутов и контроллеров.
- Поддержка авторизации через Bearer JWT.
- Примеры схем и ответов для всех эндпоинтов.
- Доступно по адресу: `http://localhost:3000/api-docs`

## 🧪 Тестирование

- Для запуска всех тестов:
  ```
  npm test
  ```
- Покрытие: пользователи, категории, навыки, темы, заметки, статусы.
- Тесты используют реальные HTTP-запросы через axios.
- Перед тестами база очищается и наполняется тестовыми данными.

## 📖 Описание основных файлов

### Модели данных

- `models/userModel.js` — User: id, name, email, password (bcrypt hash)
- `models/skillModel.js` — Skill: id, name, description, user_id, category_id
- `models/skillCategoryModel.js` — SkillCategory: id, name, description
- `models/topicModel.js` — Topic: id, name, description, skill_id, status_id, progress, estimated_hours
- `models/noteModel.js` — Note: id, title, content, topic_id, created_at
- `models/topicStatusModel.js` — TopicStatus: id, name, description, color

### 🔧 Конфигурация и инициализация

#### `index.js` - Главный файл приложения

Основной файл Express сервера с полной настройкой:

- Инициализация Express приложения
- Настройка CORS для кроссдоменных запросов
- Подключение middleware для обработки запросов и ошибок
- Настройка Swagger UI документации
- Подключение всех маршрутов API
- Обработка сигналов завершения процесса
- Health check эндпоинт для мониторинга

#### `config/db.js` - Конфигурация базы данных

Настройка подключения к PostgreSQL через Sequelize:

- Параметры подключения к БД
- Настройки пула соединений
- Логирование SQL запросов

#### `config/swagger.js` - Настройки Swagger

Конфигурация автоматической генерации API документации:

- Информация о API (название, версия, описание)
- Настройки серверов
- Схемы авторизации (JWT Bearer токены)
- Автоматический сбор документации из JSDoc комментариев

#### `syncDatabase.js` - Синхронизация базы данных

Утилита для синхронизации моделей Sequelize с БД:

- Проверка подключения к базе данных
- Создание/обновление таблиц
- Безопасная миграция структуры БД

## 🔧 Особенности архитектуры

### MVC Pattern:

- **Models** - модели данных с Sequelize
- **Views** - JSON API ответы
- **Controllers** - бизнес-логика обработки запросов

### Middleware Architecture:

- Аутентификация JWT
- Валидация данных
- Обработка ошибок
- Логирование запросов
- CORS политики

### Error Handling:

- Централизованная обработка ошибок
- Стандартизированные ответы API
- Логирование с контекстом
- Обработка ошибок Sequelize

### API Design:

- RESTful архитектура
- Consistent response format
- Comprehensive Swagger documentation
- Proper HTTP status codes

## 🔐 Аутентификация

API использует JWT токены для аутентификации. После успешного входа токен должен передаваться в заголовке:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🚨 Обработка ошибок

API возвращает стандартизированные ответы:

### Успешный ответ:

```json
{
    "success": true,
    "message": "Операция выполнена успешно",
    "data": { ... }
}
```

### Ошибка:

```json
{
    "success": false,
    "message": "Описание ошибки",
    "errors": [ ... ]
}
```

## 🔍 Логирование

Сервер логирует все запросы с информацией:

- HTTP метод и URL
- Статус ответа
- Время выполнения
- IP адрес
- ID пользователя (если авторизован)

---

## 🎯 Готово к тестированию!

1. Запустите сервер: `npm run dev`
2. Откройте swagger
3. Начните с регистрации пользователя
4. Протестируйте все эндпоинты

**Swagger документация:** http://localhost:3000/api-docs
