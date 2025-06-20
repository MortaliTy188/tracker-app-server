const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const JWT_SECRET = "secret_key"; // В продакшене должен быть в переменных окружения

// Middleware для опциональной авторизации
// Если токен предоставлен и валиден, добавляет пользователя в req.user
// Если токен не предоставлен или невалиден, продолжает без авторизации
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Если нет заголовка авторизации, продолжаем без пользователя
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];

    // Если нет токена, продолжаем без пользователя
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      // Проверяем токен
      const decoded = jwt.verify(token, JWT_SECRET);

      // Получаем пользователя из базы данных
      const user = await User.findByPk(decoded.id);

      if (user) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (tokenError) {
      // Если токен невалиден, продолжаем без пользователя
      req.user = null;
    }

    next();
  } catch (error) {
    // В случае любой ошибки продолжаем без пользователя
    req.user = null;
    next();
  }
};

module.exports = optionalAuth;
