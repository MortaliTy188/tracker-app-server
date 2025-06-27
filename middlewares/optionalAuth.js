const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const JWT_SECRET = "secret_key"; // В продакшене должен быть в переменных окружения

// Middleware для опциональной авторизации
// Если токен предоставлен и валиден, добавляет пользователя в req.user
// Если токен не предоставлен или невалиден, продолжает без авторизации
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log(
      "🔒 OptionalAuth - Auth header:",
      authHeader ? "Present" : "Missing"
    );

    // Если нет заголовка авторизации, продолжаем без пользователя
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("🔒 OptionalAuth - No auth header, continuing without user");
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];

    // Если нет токена, продолжаем без пользователя
    if (!token) {
      console.log("🔒 OptionalAuth - No token, continuing without user");
      req.user = null;
      return next();
    }

    try {
      // Проверяем токен
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(
        "🔒 OptionalAuth - Token decoded successfully, user ID:",
        decoded.id
      );

      // Получаем пользователя из базы данных
      const user = await User.findByPk(decoded.id);

      if (user) {
        console.log("🔒 OptionalAuth - User found:", user.id, user.name);
        req.user = user;
      } else {
        console.log("🔒 OptionalAuth - User not found in database");
        req.user = null;
      }
    } catch (tokenError) {
      // Если токен невалиден, продолжаем без пользователя
      console.log(
        "🔒 OptionalAuth - Token verification failed:",
        tokenError.message
      );
      req.user = null;
    }

    next();
  } catch (error) {
    // В случае любой ошибки продолжаем без пользователя
    console.log("🔒 OptionalAuth - General error:", error.message);
    req.user = null;
    next();
  }
};

module.exports = optionalAuth;
