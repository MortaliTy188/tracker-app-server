const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");

// Импорт моделей и синхронизация БД
const { sequelize } = require("./models");
const syncDatabase = require("./setup/syncDatabase");

// Импорт конфигурации Swagger
const swaggerSpec = require("./config/swagger");

// Импорт маршрутов
const userRoutes = require("./routes/userRoutes");
const skillRoutes = require("./routes/skillRoutes");
const skillCategoryRoutes = require("./routes/skillCategoryRoutes");
const topicRoutes = require("./routes/topicRoutes");
const noteRoutes = require("./routes/noteRoutes");
const topicStatusRoutes = require("./routes/topicStatusRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const activityRoutes = require("./routes/activityRoutes");
const friendshipRoutes = require("./routes/friendshipRoutes");
const chatRoutes = require("./routes/chatRoutes");

// Импорт middleware
const {
  errorHandler,
  notFoundHandler,
  requestLogger,
  validateContentType,
  bodyLimitHandler,
} = require("./middlewares/errorHandler");

// Импорт утилиты для поиска порта
const PortFinder = require("./utils/portFinder");

// Импорт Socket.IO менеджера
const SocketManager = require("./utils/socketManager");

const app = express();
const server = createServer(app);
const DEFAULT_PORT = process.env.PORT || 3000;

// Middleware для обработки CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

// Настройка Socket.IO с CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  },
});

// Инициализация Socket.IO менеджера
const socketManager = new SocketManager(io);

// Статическая раздача загруженных файлов
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Статическая раздача публичных файлов (демо чата)
app.use("/public", express.static(path.join(__dirname, "public")));

// Middleware для логирования запросов
app.use(requestLogger);

// Middleware для парсинга JSON с ограничением размера
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Middleware для обработки ошибок размера тела запроса
app.use(bodyLimitHandler);

// Middleware для валидации Content-Type
app.use(validateContentType);

// Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Tracker App API Documentation",
  })
);

// Главная страница с информацией об API
app.get("/", (req, res) => {
  res.json({
    message: "Добро пожаловать в Tracker App API! 🚀",
    version: "1.0.0",
    documentation: `/api-docs`,
    endpoints: {
      users: "/api/users",
      skills: "/api/skills",
      categories: "/api/categories",
      topics: "/api/topics",
      notes: "/api/notes",
      statuses: "/api/statuses",
      feedback: "/api/feedback",
      activity: "/api/activity",
      friendship: "/api/friendship",
      chat: "/api/chat",
      swagger: "/api-docs",
      health: "/health",
    },
    status: "active",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Проверяем подключение к базе данных
    await sequelize.authenticate();

    res.json({
      status: "healthy",
      database: "connected",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API маршруты
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/categories", skillCategoryRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/statuses", topicStatusRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/friendship", friendshipRoutes);
app.use("/api/chat", chatRoutes);

// Middleware для обработки несуществующих маршрутов
app.use(notFoundHandler);

// Middleware для обработки ошибок (должен быть последним)
app.use(errorHandler);

// Функция запуска сервера
async function startServer() {
  try {
    console.log("🚀 Запуск Tracker App Server...\n");

    // Синхронизация базы данных
    console.log("📦 Синхронизация с базой данных...");
    await syncDatabase();

    // Поиск свободного порта
    const PORT = await PortFinder.getAvailablePort(DEFAULT_PORT);

    // Запуск сервера
    server.listen(PORT, () => {
      console.log(`\n✅ Сервер запущен успешно!`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
      console.log(`💬 Socket.IO готов для чата в реальном времени`);
      console.log(
        `👥 Онлайн пользователей: ${socketManager.getOnlineUsersCount()}`
      );
      console.log(`\n📋 Доступные маршруты:`);
      console.log(`\n👤 Пользователи:`);
      console.log(
        `   POST   /api/users/register        - Регистрация пользователя`
      );
      console.log(
        `   POST   /api/users/login           - Авторизация пользователя`
      );
      console.log(`   GET    /api/users/profile         - Получить профиль`);
      console.log(`   PUT    /api/users/profile         - Обновить профиль`);
      console.log(`   PUT    /api/users/change-password - Сменить пароль`);
      console.log(`   GET    /api/users/full-info       - Полная информация`);
      console.log(`   DELETE /api/users/delete-account  - Удалить аккаунт`);
      console.log(`\n🎯 Навыки:`);
      console.log(`   GET    /api/skills                - Получить все навыки`);
      console.log(`   POST   /api/skills                - Создать навык`);
      console.log(`   GET    /api/skills/stats          - Статистика навыков`);
      console.log(
        `   GET    /api/skills/:id            - Получить навык по ID`
      );
      console.log(`   PUT    /api/skills/:id            - Обновить навык`);
      console.log(`   DELETE /api/skills/:id            - Удалить навык`);
      console.log(`\n📁 Категории:`);
      console.log(
        `   GET    /api/categories            - Получить все категории`
      );
      console.log(`   POST   /api/categories            - Создать категорию`);
      console.log(
        `   GET    /api/categories/stats      - Статистика категорий`
      );
      console.log(
        `   GET    /api/categories/:id        - Получить категорию по ID`
      );
      console.log(`   PUT    /api/categories/:id        - Обновить категорию`);
      console.log(`   DELETE /api/categories/:id        - Удалить категорию`);
      console.log(`\n📚 Темы:`);
      console.log(`   GET    /api/topics                - Получить все темы`);
      console.log(`   POST   /api/topics                - Создать тему`);
      console.log(`   GET    /api/topics/stats          - Статистика тем`);
      console.log(`   GET    /api/topics/:id            - Получить тему по ID`);
      console.log(`   PUT    /api/topics/:id            - Обновить тему`);
      console.log(`   PUT    /api/topics/:id/progress   - Обновить прогресс`);
      console.log(`   DELETE /api/topics/:id            - Удалить тему`);
      console.log(`\n📝 Заметки:`);
      console.log(
        `   GET    /api/notes                 - Получить все заметки`
      );
      console.log(`   POST   /api/notes                 - Создать заметку`);
      console.log(`   GET    /api/notes/search          - Поиск заметок`);
      console.log(`   GET    /api/notes/recent          - Последние заметки`);
      console.log(`   GET    /api/notes/stats           - Статистика заметок`);
      console.log(
        `   GET    /api/notes/:id             - Получить заметку по ID`
      );
      console.log(`   PUT    /api/notes/:id             - Обновить заметку`);
      console.log(`   DELETE /api/notes/:id             - Удалить заметку`);
      console.log(`\n🏷️  Статусы:`);
      console.log(
        `   GET    /api/statuses              - Получить все статусы`
      );
      console.log(`   POST   /api/statuses              - Создать статус`);
      console.log(
        `   GET    /api/statuses/default      - Статусы по умолчанию`
      );
      console.log(
        `   POST   /api/statuses/default      - Создать статусы по умолчанию`
      );
      console.log(`   GET    /api/statuses/stats        - Статистика статусов`);
      console.log(
        `   GET    /api/statuses/:id          - Получить статус по ID`
      );
      console.log(`   PUT    /api/statuses/:id          - Обновить статус`);
      console.log(`   DELETE /api/statuses/:id          - Удалить статус`);
      console.log(`\n🔧 Для остановки сервера нажмите Ctrl+C`);
    });
  } catch (error) {
    console.error("❌ Ошибка запуска сервера:", error);
    process.exit(1);
  }
}

// Обработка завершения процесса
process.on("SIGINT", async () => {
  console.log("\n🛑 Получен сигнал завершения...");

  try {
    await sequelize.close();
    console.log("✅ Соединение с базой данных закрыто");
    console.log("👋 Сервер остановлен");
    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка при остановке сервера:", error);
    process.exit(1);
  }
});

// Обработка необработанных исключений
process.on("uncaughtException", (error) => {
  console.error("❌ Необработанное исключение:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Необработанное отклонение Promise:", reason);
  process.exit(1);
});

// Запуск сервера
startServer();
