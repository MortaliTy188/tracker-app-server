const express = require("express");
const router = express.Router();
const { uploadAvatar, processAvatar } = require("../middlewares/imageUpload");
const userController = require("../controllers/userController");
const authenticateJWT = require("../middlewares/authMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const optionalAuth = require("../middlewares/optionalAuth");
const {
  profileActivityMiddleware,
} = require("../middlewares/activityMiddleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор пользователя
 *         name:
 *           type: string
 *           description: Имя пользователя
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Пароль пользователя
 *         avatar:
 *           type: string
 *           nullable: true
 *           description: Путь к аватару пользователя
 *         level:
 *           type: string
 *           description: Уровень пользователя (Новичок, Средний, Продвинутый, Профессионал, Эксперт)
 *         registrationDate:
 *           type: string
 *           format: date-time
 *           description: Дата регистрации пользователя
 *         isPrivate:
 *           type: boolean
 *           description: Приватность профиля (true - приватный, false - публичный)
 *           default: false
 *       example:
 *         id: 1
 *         name: "Иван Иванов"
 *         email: "ivan@example.com"
 *         avatar: "/uploads/avatars/avatar-1-123456789.webp"
 *         level: "Новичок"
 *         registrationDate: "2024-01-15T10:30:00Z"
 *         isPrivate: false
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *               description: JWT токен
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Сообщение об ошибке
 *         error:
 *           type: string
 *           description: Детали ошибки
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Пользователи]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Иван Иванов"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ivan@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Некорректные данные
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Пользователь уже существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/register", userController.register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Авторизация пользователя
 *     tags: [Пользователи]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ivan@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Неверные учетные данные
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", userController.login);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Получить профиль текущего пользователя
 *     tags: [Пользователи]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Пользователь не найден
 */
router.get("/profile", authenticateJWT, userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Обновить профиль пользователя
 *     tags: [Пользователи]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Новое имя"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newemail@example.com"
 *     responses:
 *       200:
 *         description: Профиль обновлен
 *       400:
 *         description: Некорректные данные
 *       409:
 *         description: Email уже используется
 */
router.put("/profile", authenticateJWT, userController.updateProfile);

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Изменить пароль
 *     tags: [Пользователи]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Пароль изменен
 *       400:
 *         description: Некорректные данные
 *       401:
 *         description: Неверный текущий пароль
 */
router.put("/change-password", authenticateJWT, userController.changePassword);

/**
 * @swagger
 * /api/users/full-info:
 *   get:
 *     summary: Получить полную информацию пользователя со всеми данными
 *     tags: [Пользователи]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Полная информация пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           description: ID пользователя
 *                         name:
 *                           type: string
 *                           description: Имя пользователя
 *                         email:
 *                           type: string
 *                           description: Email пользователя
 *                         level:
 *                           type: string
 *                           description: Уровень пользователя
 *                         registrationDate:
 *                           type: string
 *                           format: date-time
 *                           description: Дата регистрации
 *                         avatar:
 *                           type: string
 *                           nullable: true
 *                           description: Путь к аватару пользователя
 *                         skills:
 *                           type: array
 *                           description: Массив навыков со связанными темами и заметками
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalSkills:
 *                           type: integer
 *                           description: Общее количество навыков
 *                         totalTopics:
 *                           type: integer
 *                           description: Общее количество тем
 *                         totalNotes:
 *                           type: integer
 *                           description: Общее количество заметок
 *                         averageProgress:
 *                           type: integer
 *                           description: Средний прогресс по всем темам
 */
router.get("/full-info", authenticateJWT, userController.getUserFullInfo);

/**
 * @swagger
 * /api/users/delete-account:
 *   delete:
 *     summary: Удалить аккаунт пользователя
 *     tags: [Пользователи]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Аккаунт удален
 *       400:
 *         description: Пароль обязателен
 *       401:
 *         description: Неверный пароль
 */
router.delete("/delete-account", authenticateJWT, userController.deleteAccount);

/**
 * @swagger
 * /api/users/avatar:
 *   post:
 *     summary: Загрузить аватарку пользователя
 *     tags: [Пользователи]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Файл изображения (JPEG, PNG, WebP, GIF, максимум 5MB)
 *     responses:
 *       200:
 *         description: Аватарка успешно загружена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Аватарка успешно загружена"
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatar:
 *                       type: string
 *                       example: "/uploads/avatars/avatar-1-1640995200000.webp"
 *                       description: URL загруженной аватарки
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         avatar:
 *                           type: string
 *       400:
 *         description: Ошибка загрузки файла
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Размер файла слишком большой (максимум 5MB)"
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Пользователь не найден
 */
router.post(
  "/avatar",
  authMiddleware,
  uploadAvatar,
  processAvatar,
  userController.uploadAvatar
);

/**
 * @swagger
 * /api/users/avatar:
 *   delete:
 *     summary: Удалить аватарку пользователя
 *     tags: [Пользователи]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Аватарка успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Аватарка успешно удалена"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         avatar:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *       400:
 *         description: У пользователя нет аватарки
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "У пользователя нет аватарки"
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Пользователь не найден
 */
router.delete("/avatar", authMiddleware, userController.deleteAvatar);

/**
 * @swagger
 * /api/users/progress-stats:
 *   get:
 *     summary: Получить статистику прогресса пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика прогресса получена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Статистика прогресса получена"
 *                 data:
 *                   type: object
 *                   properties:
 *                     progressStats:
 *                       type: object
 *                       properties:
 *                         currentLevel:
 *                           type: string
 *                           example: "Продвинутый"
 *                         completedTopics:
 *                           type: integer
 *                           example: 25
 *                         nextLevel:
 *                           type: string
 *                           example: "Профессионал"
 *                         topicsToNextLevel:
 *                           type: integer
 *                           example: 25
 *       401:
 *         description: Не авторизован
 */
router.get("/progress-stats", authMiddleware, userController.getProgressStats);

/**
 * @swagger
 * /api/users/recalculate-level:
 *   post:
 *     summary: Пересчитать уровень пользователя вручную
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Уровень пользователя обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Уровень пользователя обновлен"
 *                 data:
 *                   type: object
 *                   properties:
 *                     levelInfo:
 *                       type: object
 *                       properties:
 *                         level:
 *                           type: string
 *                           example: "Продвинутый"
 *                         completedTopics:
 *                           type: integer
 *                           example: 25
 *       401:
 *         description: Не авторизован
 */
router.post(
  "/recalculate-level",
  authMiddleware,
  userController.recalculateLevel
);

/**
 * @swagger
 * /api/users/privacy:
 *   put:
 *     summary: Обновить настройки приватности профиля
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isPrivate
 *             properties:
 *               isPrivate:
 *                 type: boolean
 *                 description: Сделать профиль приватным (true) или публичным (false)
 *             example:
 *               isPrivate: true
 *     responses:
 *       200:
 *         description: Настройки приватности успешно обновлены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Неверные данные
 *       401:
 *         description: Не авторизован
 */
router.put(
  "/privacy",
  authMiddleware,
  profileActivityMiddleware.privacyChange,
  userController.updatePrivacySettings
);

/**
 * @swagger
 * /api/users/public/{userId}:
 *   get:
 *     summary: Получить публичный профиль пользователя
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Публичный профиль пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         avatar:
 *                           type: string
 *                         level:
 *                           type: string
 *                         registrationDate:
 *                           type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         achievements:
 *                           type: object
 *                         progress:
 *                           type: object
 *                     isPrivate:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                       description: Сообщение для приватных профилей
 *       404:
 *         description: Пользователь не найден
 */
router.get("/public/:userId", userController.getPublicProfile);

/**
 * @swagger
 * /api/users/all:
 *   get:
 *     summary: Получить список всех пользователей с краткой статистикой
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Количество пользователей на странице
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по имени пользователя
 *     responses:
 *       200:
 *         description: Список пользователей с краткой статистикой
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           avatar:
 *                             type: string
 *                           level:
 *                             type: string
 *                           registrationDate:
 *                             type: string
 *                           isPrivate:
 *                             type: boolean
 *                           stats:
 *                             type: object
 *                             properties:
 *                               achievements:
 *                                 type: object
 *                                 properties:
 *                                   completed:
 *                                     type: integer
 *                                   total:
 *                                     type: integer
 *                                   points:
 *                                     type: integer
 *                               progress:
 *                                 type: object
 *                                 properties:
 *                                   totalSkills:
 *                                     type: integer
 *                                   totalTopics:
 *                                     type: integer
 *                                   completedTopics:
 *                                     type: integer
 *                                   completionPercentage:
 *                                     type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalUsers:
 *                           type: integer
 *                         usersPerPage:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                         publicUsers:
 *                           type: integer
 *                         privateUsers:
 *                           type: integer
 */
router.get("/all", optionalAuth, userController.getAllUsers);

module.exports = router;
