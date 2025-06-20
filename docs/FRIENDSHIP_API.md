# API системы друзей

## Обзор

Этот документ описывает API для управления системой друзей в приложении. Система позволяет пользователям отправлять запросы на дружбу, принимать/отклонять их, управлять списком друзей и просматривать статус дружбы с другими пользователями.

## Статусы дружбы

- `pending` - запрос ожидает обработки
- `accepted` - дружба принята
- `declined` - запрос отклонен
- `blocked` - пользователь заблокирован
- `none` - нет связи между пользователями
- `self` - собственный профиль
- `sent_request` - отправлен исходящий запрос
- `received_request` - получен входящий запрос

## Endpoints

### 1. Отправить запрос на дружбу

**POST** `/api/friendship/request`

**Описание:** Отправляет запрос на дружбу указанному пользователю.

**Авторизация:** Требуется

**Тело запроса:**

```json
{
  "addresseeId": 5
}
```

**Ответ (201):**

```json
{
  "success": true,
  "message": "Запрос на дружбу отправлен",
  "data": {
    "id": 123,
    "requester_id": 1,
    "addressee_id": 5,
    "status": "pending",
    "created_at": "2025-06-20T10:30:00.000Z"
  }
}
```

**Возможные ошибки:**

- `400` - Попытка отправить запрос самому себе, запрос уже существует
- `404` - Пользователь не найден

### 2. Принять запрос на дружбу

**PATCH** `/api/friendship/{friendshipId}/accept`

**Описание:** Принимает входящий запрос на дружбу.

**Авторизация:** Требуется

**Параметры URL:**

- `friendshipId` - ID запроса на дружбу

**Ответ (200):**

```json
{
  "success": true,
  "message": "Запрос на дружбу принят",
  "data": {
    "id": 123,
    "requester_id": 5,
    "addressee_id": 1,
    "status": "accepted",
    "updated_at": "2025-06-20T10:35:00.000Z"
  }
}
```

**Возможные ошибки:**

- `400` - Запрос уже обработан
- `403` - Нет прав для выполнения действия
- `404` - Запрос не найден

### 3. Отклонить запрос на дружбу

**PATCH** `/api/friendship/{friendshipId}/decline`

**Описание:** Отклоняет входящий запрос на дружбу.

**Авторизация:** Требуется

**Параметры URL:**

- `friendshipId` - ID запроса на дружбу

**Ответ (200):**

```json
{
  "success": true,
  "message": "Запрос на дружбу отклонен",
  "data": {
    "id": 123,
    "requester_id": 5,
    "addressee_id": 1,
    "status": "declined",
    "updated_at": "2025-06-20T10:35:00.000Z"
  }
}
```

### 4. Удалить друга или отменить запрос

**DELETE** `/api/friendship/{friendshipId}/remove`

**Описание:** Удаляет дружбу или отменяет запрос на дружбу.

**Авторизация:** Требуется

**Параметры URL:**

- `friendshipId` - ID дружбы или запроса

**Ответ (200):**

```json
{
  "success": true,
  "message": "Дружба удалена"
}
```

### 5. Получить список друзей

**GET** `/api/friendship/friends`

**Описание:** Возвращает список всех друзей текущего пользователя.

**Авторизация:** Требуется

**Параметры запроса:**

- `page` (опционально) - номер страницы (по умолчанию: 1)
- `limit` (опционально) - количество элементов на странице (по умолчанию: 20, максимум: 100)

**Ответ (200):**

```json
{
  "success": true,
  "data": {
    "friends": [
      {
        "friendshipId": 123,
        "id": 5,
        "username": "user123",
        "firstName": "Иван",
        "lastName": "Петров",
        "avatar": "/uploads/avatars/avatar-5.jpg",
        "level": 12,
        "isPrivate": false,
        "friendsSince": "2025-06-20T10:35:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

### 6. Получить входящие запросы на дружбу

**GET** `/api/friendship/requests/pending`

**Описание:** Возвращает список всех входящих запросов на дружбу.

**Авторизация:** Требуется

**Параметры запроса:**

- `page` (опционально) - номер страницы
- `limit` (опционально) - количество элементов на странице

**Ответ (200):**

```json
{
  "success": true,
  "data": {
    "pendingRequests": [
      {
        "friendshipId": 124,
        "requester": {
          "id": 8,
          "username": "newuser",
          "firstName": "Мария",
          "lastName": "Сидорова",
          "avatar": "/uploads/avatars/avatar-8.jpg",
          "level": 5
        },
        "requestDate": "2025-06-20T11:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

### 7. Получить исходящие запросы на дружбу

**GET** `/api/friendship/requests/sent`

**Описание:** Возвращает список всех исходящих запросов на дружбу.

**Авторизация:** Требуется

**Параметры запроса:**

- `page` (опционально) - номер страницы
- `limit` (опционально) - количество элементов на странице

**Ответ (200):**

```json
{
  "success": true,
  "data": {
    "sentRequests": [
      {
        "friendshipId": 125,
        "addressee": {
          "id": 10,
          "username": "target_user",
          "firstName": "Алексей",
          "lastName": "Козлов",
          "avatar": "/uploads/avatars/avatar-10.jpg",
          "level": 8
        },
        "requestDate": "2025-06-20T11:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

### 8. Получить статус дружбы с пользователем

**GET** `/api/friendship/status/{targetUserId}`

**Описание:** Возвращает статус дружбы между текущим пользователем и указанным пользователем.

**Авторизация:** Требуется

**Параметры URL:**

- `targetUserId` - ID пользователя для проверки статуса

**Ответ (200):**

```json
{
  "success": true,
  "data": {
    "status": "received_request",
    "friendshipId": 126,
    "canAccept": true,
    "canDecline": true,
    "canCancel": false,
    "createdAt": "2025-06-20T11:30:00.000Z",
    "updatedAt": "2025-06-20T11:30:00.000Z"
  }
}
```

**Возможные значения в data:**

- `status`: один из статусов дружбы
- `friendshipId`: ID записи о дружбе (если существует)
- `canAccept`: можно ли принять запрос
- `canDecline`: можно ли отклонить запрос
- `canCancel`: можно ли отменить запрос

## Интеграция с API пользователей

API `/api/users/all` теперь включает информацию о статусе дружбы для авторизованных пользователей:

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 5,
        "name": "Иван Петров",
        "avatar": "/uploads/avatars/avatar-5.jpg",
        "level": 12,
        "registrationDate": "2025-06-01T10:00:00.000Z",
        "isPrivate": false,
        "friendship": {
          "status": "accepted",
          "friendshipId": 123
        },
        "stats": {
          // ... статистика пользователя
        }
      }
    ]
  }
}
```

## Примеры использования

### Отправка запроса на дружбу

```javascript
const response = await fetch("/api/friendship/request", {
  method: "POST",
  headers: {
    Authorization: "Bearer your-jwt-token",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    addresseeId: 5,
  }),
});
```

### Получение списка друзей

```javascript
const response = await fetch("/api/friendship/friends?page=1&limit=10", {
  method: "GET",
  headers: {
    Authorization: "Bearer your-jwt-token",
  },
});
```

### Принятие запроса на дружбу

```javascript
const response = await fetch("/api/friendship/123/accept", {
  method: "PATCH",
  headers: {
    Authorization: "Bearer your-jwt-token",
  },
});
```

## Рекомендации по использованию

1. **Пагинация**: Всегда используйте пагинацию для списков друзей и запросов
2. **Проверка статуса**: Проверяйте статус дружбы перед отображением соответствующих кнопок в UI
3. **Обработка ошибок**: Учитывайте различные сценарии ошибок (пользователь не найден, недостаточно прав и т.д.)
4. **Оптимизация**: Используйте API статуса дружбы для одиночных проверок, API пользователей - для массовых операций
