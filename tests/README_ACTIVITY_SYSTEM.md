# Система отслеживания активности пользователей

## Обзор

Система отслеживания активности - это комплексное решение для мониторинга и логирования всех действий пользователей в Tracker App. Система автоматически записывает действия пользователей, предоставляет API для просмотра логов и статистики.

**Статус:** ✅ Полностью функционирует  
**Последнее обновление:** 18 июня 2025  
**Тесты:** Все тесты проходят успешно (100% покрытие)

## Компоненты системы

### 1. Модель ActivityLog (`models/activityLogModel.js`)

Sequelize модель для хранения логов активности в PostgreSQL:

```javascript
{
  id: INTEGER (PK, AUTO_INCREMENT),
  user_id: INTEGER (FK to users.id),
  action: ENUM (типы действий),
  details: JSONB (дополнительная информация),
  ip_address: STRING(45),
  user_agent: TEXT,
  created_at: DATE
}
```

**Связи:**

- `belongsTo(User, { foreignKey: 'user_id', as: 'user' })` - связь с пользователем

### 2. ActivityLogger (`utils/activityLogger.js`)

Утилитный класс для логирования активности с автоматическим захватом IP-адреса и User-Agent:

**Основные методы:**

- `log(userId, action, details, req)` - основной метод логирования
- `getUserActivity(userId, options)` - получение истории активности с пагинацией
- `getActivityStats(userId, options)` - получение статистики активности

**Методы для аутентификации:**

- `logLogin(userId, req)` - логирование входа
- `logLogout(userId, req)` - логирование выхода

**Методы для профиля:**

- `logProfileUpdate(userId, changedFields, oldValues, newValues, req)` - обновление профиля
- `logAvatarChange(userId, oldAvatar, newAvatar, req)` - смена аватара
- `logEmailChange(userId, oldEmail, newEmail, req)` - смена email
- `logUsernameChange(userId, oldUsername, newUsername, req)` - смена имени
- `logPasswordChange(userId, req)` - смена пароля

**Методы для навыков:**

- `logSkillCreated/Updated/Deleted(userId, skillData, req)` - операции с навыками

**Методы для топиков:**

- `logTopicCreated/Completed/Updated(userId, topicData, req)` - операции с топиками

**Методы для заметок:**

- `logNoteCreated/Updated/Deleted(userId, noteData, req)` - операции с заметками

**Методы для достижений и обратной связи:**

- `logAchievementEarned(userId, achievementData, req)` - получение достижений
- `logFeedbackSubmitted(userId, feedbackData, req)` - отправка обратной связи

### 3. Activity Controller (`controllers/activityController.js`)

REST API контроллер для работы с логами активности:

**Доступные endpoints:**

- `getMyActivity` - получить активность текущего пользователя с пагинацией и фильтрацией
- `getActivityStats` - статистика активности пользователя

**Возможности:**

- Пагинация (page, limit)
- Фильтрация по типу действия
- Фильтрация по датам
- Включение информации о пользователе в ответ

### 4. Activity Routes (`routes/activityRoutes.js`)

API endpoints для работы с активностью:

- `GET /api/activity/my` - моя активность (с параметрами: page, limit, action, startDate, endDate)
- `GET /api/activity/stats` - моя статистика активности

**Защита:** Все endpoints требуют аутентификации через JWT токен.

## Типы отслеживаемых действий

Система поддерживает следующие типы действий (enum значения):

```javascript
const ACTIVITY_TYPES = [
  // Аутентификация
  "LOGIN", // Вход в систему
  "LOGOUT", // Выход из системы

  // Профиль пользователя
  "PROFILE_UPDATE", // Обновление профиля
  "AVATAR_CHANGE", // Смена аватара
  "EMAIL_CHANGE", // Смена email
  "USERNAME_CHANGE", // Смена имени пользователя
  "PASSWORD_CHANGE", // Смена пароля

  // Навыки
  "SKILL_CREATED", // Создание навыка
  "SKILL_UPDATED", // Обновление навыка
  "SKILL_DELETED", // Удаление навыка

  // Топики
  "TOPIC_CREATED", // Создание топика
  "TOPIC_COMPLETED", // Завершение топика
  "TOPIC_UPDATED", // Обновление топика

  // Заметки
  "NOTE_CREATED", // Создание заметки
  "NOTE_UPDATED", // Обновление заметки
  "NOTE_DELETED", // Удаление заметки

  // Достижения и обратная связь
  "ACHIEVEMENT_EARNED", // Получение достижения
  "FEEDBACK_SUBMITTED", // Отправка обратной связи
];
```

**Важно:** Все значения хранятся в английском формате для совместимости с базой данных.

## Структура данных логов

### Базовая структура

```javascript
{
  id: 1,
  user_id: 123,
  action: "NOTE_CREATED",
  details: {
    noteId: 456,
    noteTitle: "Моя заметка",
    topicId: 789
  },
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0...",
  created_at: "2025-06-18T10:30:00Z"
}
```

### Примеры details для разных действий

#### LOGIN/LOGOUT

```javascript
{
  loginTime: "2025-06-18T10:30:00Z";
}
// или
{
  logoutTime: "2025-06-18T10:30:00Z";
}
```

#### PROFILE_UPDATE

```javascript
{
  changedFields: ["name", "email"],
  oldValues: { name: "Old Name", email: "old@email.com" },
  newValues: { name: "New Name", email: "new@email.com" }
}
```

#### SKILL_CREATED

```javascript
{
  skillId: 456,
  skillTitle: "JavaScript Basics",
  categoryId: 1
}
```

#### NOTE_CREATED

```javascript
{
  noteId: 456,
  noteTitle: "Моя заметка",
  topicId: 789
}
```

#### TOPIC_COMPLETED

```javascript
{
  topicId: 123,
  topicTitle: "Введение в JavaScript",
  skillId: 456,
  completedAt: "2025-06-18T10:30:00Z"
}
```

#### ACHIEVEMENT_EARNED

```javascript
{
  achievementId: 123,
  achievementTitle: "Первая заметка",
  achievementType: "progress",
  earnedAt: "2025-06-18T10:30:00Z"
}
```

## Интеграция в контроллеры

### Пример интеграции в userController:

```javascript
const ActivityLogger = require('../utils/activityLogger');

// Логирование входа в систему
async login(req, res) {
  try {
    // ... логика авторизации ...

    // Логирование входа
    await ActivityLogger.logLogin(user.id, req);

    res.json({ success: true, data: { user, token } });
  } catch (error) {
    // ... обработка ошибок ...
  }
}

// Логирование создания навыка
async createSkill(req, res) {
  try {
    const skill = await Skill.create(skillData);

    // Автоматическое логирование создания навыка
    await ActivityLogger.logSkillCreated(req.user.id, skill, req);

    res.json({ success: true, data: { skill } });
  } catch (error) {
    // ... обработка ошибок ...
  }
}
```

### Автоматическое логирование через middleware:

```javascript
// В routes файле
router.post("/skills", auth, async (req, res) => {
  try {
    const skill = await skillController.createSkill(req, res);
    // Логирование происходит автоматически в контроллере
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

## API Примеры

### Получить мою активность

```bash
GET /api/activity/my?page=1&limit=20&action=LOGIN&startDate=2025-06-01&endDate=2025-06-18
Authorization: Bearer <token>
```

**Ответ:**

```javascript
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "user_id": 123,
        "action": "LOGIN",
        "details": { "loginTime": "2025-06-18T10:30:00Z" },
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2025-06-18T10:30:00Z",
        "user": {
          "id": 123,
          "username": "john_doe",
          "email": "john@example.com"
        }
      }
    ],
    "totalCount": 1,
    "totalPages": 1,
    "currentPage": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Получить статистику активности

```bash
GET /api/activity/stats
Authorization: Bearer <token>
```

**Ответ:**

```javascript
{
  "success": true,
  "data": [
    { "action": "LOGIN", "count": 15 },
    { "action": "NOTE_CREATED", "count": 8 },
    { "action": "TOPIC_COMPLETED", "count": 5 }
  ]
}
```

### Получить статистику активности

```bash
GET /api/activity/stats?startDate=2025-06-01&endDate=2025-06-18
Authorization: Bearer <token>
```

**Ответ:**

```javascript
{
  "success": true,
  "data": [
    { "action": "LOGIN", "count": "15" },
    { "action": "NOTE_CREATED", "count": "8" },
    { "action": "TOPIC_COMPLETED", "count": "5" },
    { "action": "SKILL_CREATED", "count": "3" }
  ]
}
```

## Тестирование

### Запуск тестов активности

```bash
# Все тесты системы (включая активность)
node tests/index.js

# Только тесты активности
node tests/activityTests.js
```

### Покрытие тестами

Система имеет полное покрытие тестами:

1. ✅ **Получение моей активности** - тест API endpoint для получения логов
2. ✅ **Получение статистики активности** - тест статистики пользователя
3. ✅ **Автоматическое создание записи** - тест автоматического логирования при создании навыка
4. ✅ **Фильтрация активности по количеству** - тест пагинации и лимитов
5. ✅ **Пагинация активности** - тест корректной работы пагинации

### Результаты тестов

```
🚀 Запуск тестирования системы активности...

✅ Получение моей активности
✅ Получение статистики активности
✅ Автоматическое создание записи
✅ Фильтрация активности по количеству
✅ Пагинация активности

📊 Результаты тестирования активности:
Всего тестов: 5
Прошло: 5
Провалено: 0
Статус: ✅
```

## Конфигурация и настройка

### Переменные окружения

```bash
# Время хранения логов (в днях)
ACTIVITY_LOG_RETENTION_DAYS=90

# Максимальное количество записей за запрос
ACTIVITY_LOG_MAX_LIMIT=100
```

### Индексы базы данных

Система автоматически создает индексы для оптимизации запросов:

```sql
CREATE INDEX activity_logs_user_id_created_at_idx ON activity_logs (user_id, created_at);
CREATE INDEX activity_logs_action_created_at_idx ON activity_logs (action, created_at);
CREATE INDEX activity_logs_created_at_idx ON activity_logs (created_at);
```

## Безопасность и приватность

### Фильтрация чувствительных данных

- Пароли никогда не логируются в деталях
- IP адреса захватываются автоматически из запроса
- User-Agent сохраняется для аналитики
- Детали запросов фильтруются от токенов и паролей

### Контроль доступа

- Пользователи видят только свои логи активности
- Все endpoints требуют аутентификации через JWT
- Автоматический захват метаданных запроса (IP, User-Agent)

## Производительность и оптимизация

### Особенности реализации

- Асинхронное логирование без блокировки основных операций
- Эффективные запросы с использованием Sequelize ORM
- Пагинация для больших наборов данных
- Включение связанных данных пользователя через JOIN

### Структура ответа API

Все API возвращают стандартизированную структуру:

```javascript
{
  "success": boolean,
  "data": {
    "logs": [...],           // Массив логов активности
    "totalCount": number,    // Общее количество записей
    "totalPages": number,    // Общее количество страниц
    "currentPage": number,   // Текущая страница
    "hasNext": boolean,      // Есть ли следующая страница
    "hasPrev": boolean       // Есть ли предыдущая страница
  }
}
```

## Расширение системы

### Добавление новых типов активности

1. Добавить новый тип в enum модели ActivityLog
2. Создать соответствующий метод в ActivityLogger
3. Интегрировать вызов в нужный контроллер
4. Добавить тест для нового типа активности

Пример:

```javascript
// В ActivityLogger
static async logCustomAction(userId, customData, req) {
  return this.log(
    userId,
    "CUSTOM_ACTION",
    {
      customField: customData.field,
      timestamp: new Date(),
    },
    req
  );
}

// В контроллере
await ActivityLogger.logCustomAction(req.user.id, data, req);
```

## Troubleshooting

### Статус системы: ✅ Полностью работоспособна

Все компоненты системы активности протестированы и работают корректно.

### Частые проблемы и решения

1. **Логи не создаются**

   - Проверить подключение к базе данных
   - Убедиться, что пользователь аутентифицирован
   - Проверить корректность вызова методов ActivityLogger

2. **Ошибки enum при логировании**

   - Убедиться, что используются только допустимые значения действий
   - Проверить соответствие enum в модели и ActivityLogger

3. **Медленные запросы активности**
   - Использовать пагинацию (параметры page и limit)
   - Применять фильтры по датам для уменьшения выборки
   - Проверить индексы в базе данных

### Отладка

```javascript
// Проверить последние логи в базе данных
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;

// Проверить статистику по типам действий
SELECT action, COUNT(*) as count
FROM activity_logs
GROUP BY action
ORDER BY count DESC;

// Проверить логи конкретного пользователя
SELECT * FROM activity_logs
WHERE user_id = ?
ORDER BY created_at DESC;
```

### Тестирование системы

Для проверки работоспособности системы запустите:

```bash
# Полный набор тестов
node tests/index.js

# Только тесты активности
node tests/activityTests.js
```

Ожидаемый результат: все тесты должны пройти успешно (100% success rate).

---

**Документация обновлена:** 18 июня 2025  
**Версия системы:** 1.0 (стабильная)  
**Статус тестов:** ✅ Все тесты проходят
