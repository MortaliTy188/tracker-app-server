const express = require("express");
const router = express.Router();
const topicStatusController = require("../controllers/topicStatusController");

/**
 * @swagger
 * components:
 *   schemas:
 *     TopicStatus:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор статуса
 *         name:
 *           type: string
 *           description: Название статуса
 *         description:
 *           type: string
 *           description: Описание статуса
 *         color:
 *           type: string
 *           description: Цвет статуса в формате HEX
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Дата создания
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Дата обновления
 *     StatusInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Название статуса
 *         description:
 *           type: string
 *           description: Описание статуса
 *         color:
 *           type: string
 *           pattern: '^#[0-9A-F]{6}$'
 *           description: Цвет статуса в формате HEX (например, #FF0000)
 */

/**
 * @swagger
 * /api/statuses:
 *   post:
 *     summary: Создать новый статус для тем
 *     tags: [Topic Statuses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusInput'
 *     responses:
 *       201:
 *         description: Статус успешно создан
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
 *                     status:
 *                       $ref: '#/components/schemas/TopicStatus'
 *       400:
 *         description: Ошибка валидации
 *       409:
 *         description: Статус с таким названием уже существует
 */
router.post("/", topicStatusController.createStatus);

/**
 * @swagger
 * /api/statuses:
 *   get:
 *     summary: Получить все статусы тем
 *     tags: [Topic Statuses]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по названию или описанию
 *       - in: query
 *         name: include_stats
 *         schema:
 *           type: boolean
 *         description: Включить статистику (количество тем)
 *     responses:
 *       200:
 *         description: Список статусов
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
 *                     statuses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TopicStatus'
 *                     total:
 *                       type: integer
 */
router.get("/", topicStatusController.getAllStatuses);

/**
 * @swagger
 * /api/statuses/default:
 *   get:
 *     summary: Получить статусы по умолчанию
 *     tags: [Topic Statuses]
 *     responses:
 *       200:
 *         description: Статусы по умолчанию и их состояние в системе
 */
router.get("/default", topicStatusController.getDefaultStatuses);

/**
 * @swagger
 * /api/statuses/default:
 *   post:
 *     summary: Создать статусы по умолчанию
 *     tags: [Topic Statuses]
 *     responses:
 *       200:
 *         description: Статусы по умолчанию созданы
 */
router.post("/default", topicStatusController.createDefaultStatuses);

/**
 * @swagger
 * /api/statuses/stats:
 *   get:
 *     summary: Получить статистику по всем статусам
 *     tags: [Topic Statuses]
 *     responses:
 *       200:
 *         description: Статистика статусов
 */
router.get("/stats", topicStatusController.getStatusesStats);

/**
 * @swagger
 * /api/statuses/{id}:
 *   get:
 *     summary: Получить статус по ID
 *     tags: [Topic Statuses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID статуса
 *       - in: query
 *         name: include_topics
 *         schema:
 *           type: boolean
 *         description: Включить связанные темы
 *     responses:
 *       200:
 *         description: Информация о статусе
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
 *                     status:
 *                       $ref: '#/components/schemas/TopicStatus'
 *       404:
 *         description: Статус не найден
 */
router.get("/:id", topicStatusController.getStatusById);

/**
 * @swagger
 * /api/statuses/{id}:
 *   put:
 *     summary: Обновить статус
 *     tags: [Topic Statuses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID статуса
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
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-F]{6}$'
 *     responses:
 *       200:
 *         description: Статус успешно обновлен
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Статус не найден
 *       409:
 *         description: Статус с таким названием уже существует
 */
router.put("/:id", topicStatusController.updateStatus);

/**
 * @swagger
 * /api/statuses/{id}:
 *   delete:
 *     summary: Удалить статус
 *     tags: [Topic Statuses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID статуса
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *         description: Принудительное удаление (обнулить status_id у связанных тем)
 *     responses:
 *       200:
 *         description: Статус успешно удален
 *       400:
 *         description: Статус используется темами
 *       404:
 *         description: Статус не найден
 */
router.delete("/:id", topicStatusController.deleteStatus);

module.exports = router;
