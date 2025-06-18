const express = require("express");
const router = express.Router();
const ActivityController = require("../controllers/activityController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Activity
 *   description: Управление логами активности пользователей
 */

/**
 * @swagger
 * /api/activity/my:
 *   get:
 *     summary: Получить мою активность
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
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
 *         description: Количество записей на странице
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Фильтр по типу действия
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата фильтра
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата фильтра
 *     responses:
 *       200:
 *         description: Список активности пользователя
 *       401:
 *         description: Не авторизован
 */
router.get("/my", authMiddleware, ActivityController.getMyActivity);

/**
 * @swagger
 * /api/activity/stats:
 *   get:
 *     summary: Получить статистику моей активности
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата фильтра
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата фильтра
 *     responses:
 *       200:
 *         description: Статистика активности пользователя
 *       401:
 *         description: Не авторизован
 */
router.get("/stats", authMiddleware, ActivityController.getActivityStats);

/**
 * @swagger
 * /api/activity/global-stats:
 *   get:
 *     summary: Получить глобальную статистику активности (для админов)
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата фильтра
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата фильтра
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Фильтр по типу действия
 *     responses:
 *       200:
 *         description: Глобальная статистика активности
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 */
router.get(
  "/global-stats",
  authMiddleware,
  ActivityController.getGlobalActivityStats
);

/**
 * @swagger
 * /api/activity/user/{userId}:
 *   get:
 *     summary: Получить активность конкретного пользователя
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
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
 *         description: Количество записей на странице
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Фильтр по типу действия
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата фильтра
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата фильтра
 *     responses:
 *       200:
 *         description: Список активности пользователя
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 */
router.get("/user/:userId", authMiddleware, ActivityController.getUserActivity);

/**
 * @swagger
 * /api/activity/{activityId}:
 *   get:
 *     summary: Получить детали записи активности
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID записи активности
 *     responses:
 *       200:
 *         description: Детали записи активности
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Запись не найдена
 */
router.get(
  "/:activityId",
  authMiddleware,
  ActivityController.getActivityDetails
);

/**
 * @swagger
 * /api/activity/cleanup:
 *   post:
 *     summary: Очистить старые логи активности
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysToKeep:
 *                 type: integer
 *                 default: 90
 *                 description: Количество дней для хранения логов
 *     responses:
 *       200:
 *         description: Логи успешно очищены
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 */
router.post("/cleanup", authMiddleware, ActivityController.cleanupOldLogs);

module.exports = router;
