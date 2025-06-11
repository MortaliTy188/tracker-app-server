const jwt = require("jsonwebtoken");
const { User } = require("../models");

const JWT_SECRET = "secret_key"; // В продакшене должен быть в переменных окружения

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Токен авторизации не предоставлен",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Неверный формат токена авторизации",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    console.error("Ошибка авторизации:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Неверный токен авторизации",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Токен авторизации истек",
      });
    }

    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера при авторизации",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
