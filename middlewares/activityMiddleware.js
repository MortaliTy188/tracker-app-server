const ActivityLogger = require("../utils/activityLogger");

/**
 * Middleware для автоматического логирования активности
 * @param {string} action - Тип действия для логирования
 * @param {function} getDetails - Функция для получения дополнительных деталей
 * @returns {function} Express middleware
 */
const activityMiddleware = (action, getDetails = () => ({})) => {
  return async (req, res, next) => {
    // Сохраняем оригинальные методы
    const originalSend = res.send;
    const originalJson = res.json;

    // Флаг для предотвращения двойного логирования
    let isLogged = false;

    // Переопределяем метод send
    res.send = function (body) {
      if (!isLogged) {
        logActivity.call(this, body);
        isLogged = true;
      }
      return originalSend.call(this, body);
    };

    // Переопределяем метод json
    res.json = function (body) {
      if (!isLogged) {
        logActivity.call(this, body);
        isLogged = true;
      }
      return originalJson.call(this, body);
    };

    // Функция для логирования
    function logActivity(responseBody) {
      // Логируем только если запрос успешен и есть авторизованный пользователь
      if (
        res.statusCode >= 200 &&
        res.statusCode < 300 &&
        req.user &&
        req.user.id
      ) {
        try {
          const details = getDetails(req, res, responseBody);
          ActivityLogger.log(req.user.id, action, details, req).catch(
            (error) => {
              console.error("Activity logging error:", error);
            }
          );
        } catch (error) {
          console.error("Activity middleware error:", error);
        }
      }
    }

    next();
  };
};

/**
 * Middleware для логирования изменений данных
 * Автоматически определяет изменения в данных запроса
 */
const dataChangeMiddleware = (action, getEntityId = null) => {
  return activityMiddleware(action, (req, res, responseBody) => {
    const details = {
      method: req.method,
      path: req.path,
      changedFields: req.body ? Object.keys(req.body) : [],
      requestData: req.body,
    };

    // Если предоставлена функция для получения ID сущности
    if (getEntityId && typeof getEntityId === "function") {
      details.entityId = getEntityId(req, res, responseBody);
    }

    // Добавляем ID из параметров маршрута, если есть
    if (req.params.id) {
      details.entityId = req.params.id;
    }

    return details;
  });
};

/**
 * Middleware для логирования аутентификации
 */
const authActivityMiddleware = {
  login: activityMiddleware("LOGIN", (req, res, responseBody) => ({
    method: "login",
    loginTime: new Date(),
    userAgent: req.get("User-Agent"),
    ipAddress: req.ip,
  })),

  logout: activityMiddleware("LOGOUT", (req, res) => ({
    method: "logout",
    logoutTime: new Date(),
  })),

  register: activityMiddleware("PROFILE_UPDATE", (req, res, responseBody) => ({
    method: "register",
    registrationTime: new Date(),
    username: req.body.username,
    email: req.body.email,
  })),
};

/**
 * Middleware для логирования операций с профилем
 */
const profileActivityMiddleware = {
  update: dataChangeMiddleware("PROFILE_UPDATE"),

  avatarChange: activityMiddleware("AVATAR_CHANGE", (req, res) => ({
    avatarFile: req.file ? req.file.filename : null,
    originalName: req.file ? req.file.originalname : null,
  })),

  passwordChange: activityMiddleware("PASSWORD_CHANGE", () => ({
    changeTime: new Date(),
  })),

  privacyChange: activityMiddleware(
    "PROFILE_UPDATE",
    (req, res, responseBody) => ({
      isPrivate: req.body.isPrivate,
      changeTime: new Date(),
    })
  ),
};

/**
 * Middleware для логирования операций с навыками
 */
const skillActivityMiddleware = {
  create: dataChangeMiddleware("SKILL_CREATED", (req, res, responseBody) => {
    return responseBody && responseBody.skill ? responseBody.skill.id : null;
  }),

  update: dataChangeMiddleware("SKILL_UPDATED"),

  delete: activityMiddleware("SKILL_DELETED", (req, res) => ({
    skillId: req.params.id,
    deletedAt: new Date(),
  })),
};

/**
 * Middleware для логирования операций с топиками
 */
const topicActivityMiddleware = {
  create: dataChangeMiddleware("TOPIC_CREATED", (req, res, responseBody) => {
    return responseBody && responseBody.topic ? responseBody.topic.id : null;
  }),

  update: dataChangeMiddleware("TOPIC_UPDATED"),

  complete: activityMiddleware("TOPIC_COMPLETED", (req, res) => ({
    topicId: req.params.id,
    completedAt: new Date(),
  })),
};

/**
 * Middleware для логирования операций с заметками
 */
const noteActivityMiddleware = {
  create: dataChangeMiddleware("NOTE_CREATED", (req, res, responseBody) => {
    return responseBody && responseBody.note ? responseBody.note.id : null;
  }),

  update: dataChangeMiddleware("NOTE_UPDATED"),

  delete: activityMiddleware("NOTE_DELETED", (req, res) => ({
    noteId: req.params.id,
    deletedAt: new Date(),
  })),
};

/**
 * Middleware для логирования достижений
 */
const achievementActivityMiddleware = {
  earn: activityMiddleware("ACHIEVEMENT_EARNED", (req, res, responseBody) => ({
    achievementId:
      req.params.id ||
      (responseBody && responseBody.achievement
        ? responseBody.achievement.id
        : null),
    earnedAt: new Date(),
  })),
};

/**
 * Middleware для логирования операций с друзьями
 */
const friendshipActivityMiddleware = {
  sendRequest: activityMiddleware(
    "FRIEND_REQUEST_SENT",
    (req, res, responseBody) => ({
      addresseeId: req.body.addresseeId,
      sentAt: new Date(),
    })
  ),

  acceptRequest: activityMiddleware("FRIEND_REQUEST_ACCEPTED", (req, res) => ({
    friendshipId: req.params.friendshipId,
    acceptedAt: new Date(),
  })),

  declineRequest: activityMiddleware("FRIEND_REQUEST_DECLINED", (req, res) => ({
    friendshipId: req.params.friendshipId,
    declinedAt: new Date(),
  })),

  removeFriend: activityMiddleware("FRIEND_REMOVED", (req, res) => ({
    friendshipId: req.params.friendshipId,
    removedAt: new Date(),
  })),
};

/**
 * Middleware для логирования обратной связи
 */
const feedbackActivityMiddleware = {
  submit: dataChangeMiddleware(
    "FEEDBACK_SUBMITTED",
    (req, res, responseBody) => {
      return responseBody && responseBody.feedback
        ? responseBody.feedback.id
        : null;
    }
  ),
};

module.exports = {
  activityMiddleware,
  dataChangeMiddleware,
  authActivityMiddleware,
  profileActivityMiddleware,
  skillActivityMiddleware,
  topicActivityMiddleware,
  noteActivityMiddleware,
  achievementActivityMiddleware,
  feedbackActivityMiddleware,
  friendshipActivityMiddleware,
};
