// Middleware для обработки ошибок в приложении

const errorHandler = (err, req, res, next) => {
  console.error("Error details:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id || "anonymous",
  });

  // Ошибки валидации Sequelize
  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((error) => ({
      field: error.path,
      message: error.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Ошибки валидации данных",
      errors,
    });
  }

  // Ошибки уникальности Sequelize
  if (err.name === "SequelizeUniqueConstraintError") {
    const field = err.errors[0]?.path || "field";
    return res.status(409).json({
      success: false,
      message: `Значение поля '${field}' уже используется`,
    });
  }

  // Ошибки внешних ключей Sequelize
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Нарушение связи между данными",
    });
  }

  // Ошибки подключения к базе данных
  if (err.name === "SequelizeConnectionError") {
    return res.status(503).json({
      success: false,
      message: "Ошибка подключения к базе данных",
    });
  }

  // JWT ошибки
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Недействительный токен",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Токен истек",
    });
  }

  // Ошибки синтаксиса JSON
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Некорректный JSON в запросе",
    });
  }

  // Общие HTTP ошибки
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message || "Ошибка запроса",
    });
  }

  // Неизвестные ошибки
  res.status(500).json({
    success: false,
    message: "Внутренняя ошибка сервера",
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
};

// Middleware для обработки 404 ошибок
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Маршрут ${req.method} ${req.url} не найден`,
  });
};

// Middleware для логирования запросов
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      user: req.user?.id || "anonymous",
    };

    console.log("Request:", JSON.stringify(logData));
  });

  next();
};

// Middleware для валидации Content-Type
const validateContentType = (req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    if (!req.is("application/json")) {
      return res.status(400).json({
        success: false,
        message: "Content-Type должен быть application/json",
      });
    }
  }
  next();
};

// Middleware для ограничения размера тела запроса
const bodyLimitHandler = (err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Размер запроса слишком большой",
    });
  }
  next(err);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger,
  validateContentType,
  bodyLimitHandler,
};
