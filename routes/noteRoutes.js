const express = require("express");
const router = express.Router();
const noteController = require("../controllers/noteController");
const authMiddleware = require("../middlewares/authMiddleware");

// Применяем middleware авторизации ко всем маршрутам заметок
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Note:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор заметки
 *         title:
 *           type: string
 *           description: Заголовок заметки
 *         content:
 *           type: string
 *           description: Содержание заметки
 *         topic_id:
 *           type: integer
 *           description: ID темы
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Дата создания
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Дата обновления
 *     NoteInput:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - topic_id
 *       properties:
 *         title:
 *           type: string
 *           description: Заголовок заметки
 *         content:
 *           type: string
 *           description: Содержание заметки
 *         topic_id:
 *           type: integer
 *           description: ID темы
 */

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Создать новую заметку
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NoteInput'
 *     responses:
 *       201:
 *         description: Заметка успешно создана
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
 *                     note:
 *                       $ref: '#/components/schemas/Note'
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Тема не найдена
 */
router.post("/", noteController.createNote);

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Получить все заметки пользователя
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topic_id
 *         schema:
 *           type: integer
 *         description: Фильтр по теме
 *       - in: query
 *         name: skill_id
 *         schema:
 *           type: integer
 *         description: Фильтр по навыку
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по заголовку или содержанию
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Количество записей на страницу
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение для пагинации
 *     responses:
 *       200:
 *         description: Список заметок
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
 *                     notes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Note'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */
router.get("/", noteController.getNotes);

/**
 * @swagger
 * /api/notes/search:
 *   get:
 *     summary: Поиск заметок по содержанию
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Поисковый запрос
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Максимальное количество результатов
 *     responses:
 *       200:
 *         description: Результаты поиска
 *       400:
 *         description: Поисковый запрос обязателен
 */
router.get("/search", noteController.searchNotes);

/**
 * @swagger
 * /api/notes/recent:
 *   get:
 *     summary: Получить последние заметки пользователя
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество заметок
 *     responses:
 *       200:
 *         description: Последние заметки
 */
router.get("/recent", noteController.getRecentNotes);

/**
 * @swagger
 * /api/notes/stats:
 *   get:
 *     summary: Получить статистику по заметкам
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topic_id
 *         schema:
 *           type: integer
 *         description: Фильтр по теме
 *       - in: query
 *         name: skill_id
 *         schema:
 *           type: integer
 *         description: Фильтр по навыку
 *     responses:
 *       200:
 *         description: Статистика заметок
 */
router.get("/stats", noteController.getNotesStats);

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Получить заметку по ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID заметки
 *     responses:
 *       200:
 *         description: Информация о заметке
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
 *                     note:
 *                       $ref: '#/components/schemas/Note'
 *       404:
 *         description: Заметка не найдена
 */
router.get("/:id", noteController.getNoteById);

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: Обновить заметку
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID заметки
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Заметка успешно обновлена
 *       400:
 *         description: Необходимо указать данные для обновления
 *       404:
 *         description: Заметка не найдена
 */
router.put("/:id", noteController.updateNote);

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Удалить заметку
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID заметки
 *     responses:
 *       200:
 *         description: Заметка успешно удалена
 *       404:
 *         description: Заметка не найдена
 */
router.delete("/:id", noteController.deleteNote);

module.exports = router;
