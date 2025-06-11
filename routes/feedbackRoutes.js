const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Feedback:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор обратной связи
 *         user_name:
 *           type: string
 *           description: Имя пользователя
 *         user_email:
 *           type: string
 *           format: email
 *           description: Email пользователя
 *         email_theme:
 *           type: string
 *           description: Тема сообщения
 *         message:
 *           type: text
 *           description: Сообщение обратной связи
 *     FeedbackInput:
 *       type: object
 *       required:
 *         - user_name
 *         - user_email
 *         - email_theme
 *         - message
 *       properties:
 *         user_name:
 *           type: string
 *           description: Имя пользователя
 *         user_email:
 *           type: string
 *           format: email
 *           description: Email пользователя
 *         email_theme:
 *           type: string
 *           description: Тема сообщения
 *         message:
 *           type: string
 *           description: Сообщение обратной связи
 */

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Создать новую обратную связь
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackInput'
 *     responses:
 *       201:
 *         description: Обратная связь успешно создана
 *       400:
 *         description: Некорректные данные
 */
router.post("/", feedbackController.createFeedback);

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     summary: Получить все обратные связи
 *     tags: [Feedback]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Количество записей на страницу
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по имени, теме или сообщению
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Фильтр по email
 *     responses:
 *       200:
 *         description: Список обратных связей
 */
router.get("/", feedbackController.getAllFeedback);

/**
 * @swagger
 * /api/feedback/stats:
 *   get:
 *     summary: Получить статистику обратной связи
 *     tags: [Feedback]
 *     responses:
 *       200:
 *         description: Статистика обратной связи
 */
router.get("/stats", feedbackController.getFeedbackStats);

/**
 * @swagger
 * /api/feedback/{id}:
 *   get:
 *     summary: Получить обратную связь по ID
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID обратной связи
 *     responses:
 *       200:
 *         description: Информация об обратной связи
 *       404:
 *         description: Обратная связь не найдена
 */
router.get("/:id", feedbackController.getFeedbackById);

/**
 * @swagger
 * /api/feedback/email/{email}:
 *   get:
 *     summary: Получить обратную связь по email пользователя
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email пользователя
 *     responses:
 *       200:
 *         description: Список обратных связей пользователя
 */
router.get("/email/:email", feedbackController.getFeedbackByEmail);

/**
 * @swagger
 * /api/feedback/{id}:
 *   put:
 *     summary: Обновить обратную связь
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID обратной связи
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackInput'
 *     responses:
 *       200:
 *         description: Обратная связь успешно обновлена
 *       404:
 *         description: Обратная связь не найдена
 */
router.put("/:id", feedbackController.updateFeedback);

/**
 * @swagger
 * /api/feedback/{id}:
 *   delete:
 *     summary: Удалить обратную связь
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID обратной связи
 *     responses:
 *       200:
 *         description: Обратная связь успешно удалена
 *       404:
 *         description: Обратная связь не найдена
 */
router.delete("/:id", feedbackController.deleteFeedback);

module.exports = router;
