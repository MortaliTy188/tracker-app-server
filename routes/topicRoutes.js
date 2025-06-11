const express = require("express");
const router = express.Router();
const topicController = require("../controllers/topicController");
const authMiddleware = require("../middlewares/authMiddleware");

// Применяем middleware авторизации ко всем маршрутам тем
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Topic:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор темы
 *         name:
 *           type: string
 *           description: Название темы
 *         description:
 *           type: string
 *           description: Описание темы
 *         skill_id:
 *           type: integer
 *           description: ID навыка
 *         status_id:
 *           type: integer
 *           description: ID статуса
 *         progress:
 *           type: integer
 *           description: Прогресс изучения (0-100)
 *         estimated_hours:
 *           type: number
 *           description: Предполагаемое время изучения в часах
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Дата создания
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Дата обновления
 *     TopicInput:
 *       type: object
 *       required:
 *         - name
 *         - skill_id
 *       properties:
 *         name:
 *           type: string
 *           description: Название темы
 *         description:
 *           type: string
 *           description: Описание темы
 *         skill_id:
 *           type: integer
 *           description: ID навыка
 *         status_id:
 *           type: integer
 *           description: ID статуса
 *         progress:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Прогресс изучения (0-100)
 *         estimated_hours:
 *           type: number
 *           description: Предполагаемое время изучения в часах
 */

/**
 * @swagger
 * /api/topics:
 *   post:
 *     summary: Создать новую тему
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TopicInput'
 *     responses:
 *       201:
 *         description: Тема успешно создана
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
 *                     topic:
 *                       $ref: '#/components/schemas/Topic'
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Навык не найден
 *       409:
 *         description: Тема с таким названием уже существует в навыке
 */
router.post("/", topicController.createTopic);

/**
 * @swagger
 * /api/topics:
 *   get:
 *     summary: Получить все темы пользователя
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skill_id
 *         schema:
 *           type: integer
 *         description: Фильтр по навыку
 *       - in: query
 *         name: status_id
 *         schema:
 *           type: integer
 *         description: Фильтр по статусу
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по названию или описанию
 *       - in: query
 *         name: progress_min
 *         schema:
 *           type: integer
 *         description: Минимальный прогресс
 *       - in: query
 *         name: progress_max
 *         schema:
 *           type: integer
 *         description: Максимальный прогресс
 *     responses:
 *       200:
 *         description: Список тем
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
 *                     topics:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Topic'
 *                     total:
 *                       type: integer
 */
router.get("/", topicController.getTopics);

/**
 * @swagger
 * /api/topics/stats:
 *   get:
 *     summary: Получить статистику по темам
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skill_id
 *         schema:
 *           type: integer
 *         description: Фильтр по навыку
 *     responses:
 *       200:
 *         description: Статистика тем
 */
router.get("/stats", topicController.getTopicsStats);

/**
 * @swagger
 * /api/topics/{id}:
 *   get:
 *     summary: Получить тему по ID
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID темы
 *     responses:
 *       200:
 *         description: Информация о теме
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
 *                     topic:
 *                       $ref: '#/components/schemas/Topic'
 *       404:
 *         description: Тема не найдена
 */
router.get("/:id", topicController.getTopicById);

/**
 * @swagger
 * /api/topics/{id}:
 *   put:
 *     summary: Обновить тему
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID темы
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status_id:
 *                 type: integer
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               estimated_hours:
 *                 type: number
 *     responses:
 *       200:
 *         description: Тема успешно обновлена
 *       404:
 *         description: Тема не найдена
 *       409:
 *         description: Тема с таким названием уже существует в навыке
 */
router.put("/:id", topicController.updateTopic);

/**
 * @swagger
 * /api/topics/{id}/progress:
 *   put:
 *     summary: Обновить прогресс темы
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID темы
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - progress
 *             properties:
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Новый прогресс (0-100)
 *     responses:
 *       200:
 *         description: Прогресс успешно обновлен
 *       400:
 *         description: Некорректное значение прогресса
 *       404:
 *         description: Тема не найдена
 */
router.put("/:id/progress", topicController.updateProgress);

/**
 * @swagger
 * /api/topics/{id}:
 *   delete:
 *     summary: Удалить тему
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID темы
 *     responses:
 *       200:
 *         description: Тема успешно удалена
 *       404:
 *         description: Тема не найдена
 */
router.delete("/:id", topicController.deleteTopic);

/**
 * @swagger
 * /api/topics/{id}/status:
 *   put:
 *     summary: Изменить статус темы
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID темы
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status_id
 *             properties:
 *               status_id:
 *                 type: integer
 *                 description: Новый статус темы
 *     responses:
 *       200:
 *         description: Статус темы успешно изменен
 *       404:
 *         description: Тема или статус не найдены
 */
router.put("/:id/status", topicController.updateTopicStatus);

/**
 * @swagger
 * /api/topics/{id}/notes:
 *   get:
 *     summary: Получить все заметки темы
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID темы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Количество заметок
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение для пагинации
 *     responses:
 *       200:
 *         description: Список заметок темы
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
 *                     total:
 *                       type: integer
 *       404:
 *         description: Тема не найдена
 */
router.get("/:id/notes", topicController.getTopicNotes);

module.exports = router;
