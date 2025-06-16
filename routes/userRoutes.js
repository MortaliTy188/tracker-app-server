const express = require("express");
const router = express.Router();
const { uploadAvatar, processAvatar } = require("../middlewares/imageUpload");
const userController = require("../controllers/userController");
const authenticateJWT = require("../middlewares/authMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

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
 *       example:
 *         id: 1
 *         name: "Иван Иванов"
 *         email: "ivan@example.com"
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
 *                       description: Пользователь с навыками, темами и заметками
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalSkills:
 *                           type: integer
 *                         totalTopics:
 *                           type: integer
 *                         totalNotes:
 *                           type: integer
 *                         averageProgress:
 *                           type: integer
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

module.exports = router;
