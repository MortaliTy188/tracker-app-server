const express = require("express");
const router = express.Router();
const achievementController = require("../controllers/achievementController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     Achievement:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         icon:
 *           type: string
 *         type:
 *           type: string
 *         condition_value:
 *           type: integer
 *         points:
 *           type: integer
 *         rarity:
 *           type: string
 *           enum: [common, rare, epic, legendary]
 *
 *     UserAchievement:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         progress:
 *           type: integer
 *         is_completed:
 *           type: boolean
 *         completed_at:
 *           type: string
 *           format: date-time
 *         achievement:
 *           $ref: '#/components/schemas/Achievement'
 */

/**
 * @swagger
 * /api/achievements:
 *   get:
 *     summary: Получить все доступные достижения
 *     tags: [Achievements]
 *     responses:
 *       200:
 *         description: Список всех достижений
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
 *                     achievements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Achievement'
 */
router.get("/", achievementController.getAllAchievements);

/**
 * @swagger
 * /api/achievements/my:
 *   get:
 *     summary: Получить достижения пользователя
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: include_progress
 *         schema:
 *           type: boolean
 *         description: Включить достижения в процессе (не только завершенные)
 *     responses:
 *       200:
 *         description: Достижения пользователя
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
 *                     achievements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserAchievement'
 *       401:
 *         description: Не авторизован
 */
router.get("/my", authMiddleware, achievementController.getUserAchievements);

/**
 * @swagger
 * /api/achievements/stats:
 *   get:
 *     summary: Получить статистику достижений пользователя
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика достижений
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         percentage:
 *                           type: integer
 *                         points:
 *                           type: integer
 *       401:
 *         description: Не авторизован
 */
router.get(
  "/stats",
  authMiddleware,
  achievementController.getUserAchievementStats
);

/**
 * @swagger
 * /api/achievements/progress:
 *   get:
 *     summary: Получить прогресс по всем достижениям
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Прогресс по всем достижениям
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
 *                     progress:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           achievement:
 *                             $ref: '#/components/schemas/Achievement'
 *                           progress:
 *                             type: integer
 *                           max_progress:
 *                             type: integer
 *                           percentage:
 *                             type: integer
 *                           is_completed:
 *                             type: boolean
 *       401:
 *         description: Не авторизован
 */
router.get("/progress", authMiddleware, achievementController.getUserProgress);

/**
 * @swagger
 * /api/achievements/recheck:
 *   post:
 *     summary: Принудительно проверить все достижения пользователя
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Проверка завершена
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
 *                     stats:
 *                       type: object
 *       401:
 *         description: Не авторизован
 */
router.post(
  "/recheck",
  authMiddleware,
  achievementController.recheckAchievements
);

/**
 * @swagger
 * /api/achievements/leaderboard:
 *   get:
 *     summary: Получить таблицу лидеров по очкам достижений
 *     tags: [Achievements]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество записей в таблице лидеров
 *     responses:
 *       200:
 *         description: Таблица лидеров
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
 *                     leaderboard:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               level:
 *                                 type: string
 *                           total_points:
 *                             type: integer
 *                           achievements_count:
 *                             type: integer
 */
router.get("/leaderboard", achievementController.getLeaderboard);

/**
 * @swagger
 * /api/achievements/recent:
 *   get:
 *     summary: Получить недавние достижения пользователя
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Количество недавних достижений
 *     responses:
 *       200:
 *         description: Недавние достижения
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
 *                     achievements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserAchievement'
 *       401:
 *         description: Не авторизован
 */
router.get(
  "/recent",
  authMiddleware,
  achievementController.getRecentAchievements
);

module.exports = router;
