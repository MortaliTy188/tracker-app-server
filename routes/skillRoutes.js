const express = require("express");
const router = express.Router();
const skillController = require("../controllers/skillController");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  skillActivityMiddleware,
} = require("../middlewares/activityMiddleware");

// Применяем middleware авторизации ко всем маршрутам навыков
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Skill:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор навыка
 *         name:
 *           type: string
 *           description: Название навыка
 *         description:
 *           type: string
 *           description: Описание навыка
 *         user_id:
 *           type: integer
 *           description: ID пользователя
 *         category_id:
 *           type: integer
 *           description: ID категории навыка
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Дата создания
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Дата обновления
 *     SkillInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Название навыка
 *         description:
 *           type: string
 *           description: Описание навыка
 *         category_id:
 *           type: integer
 *           description: ID категории навыка
 */

/**
 * @swagger
 * /api/skills:
 *   post:
 *     summary: Создать новый навык
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SkillInput'
 *     responses:
 *       201:
 *         description: Навык успешно создан
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
 *                     skill:
 *                       $ref: '#/components/schemas/Skill'
 *       400:
 *         description: Ошибка валидации
 *       409:
 *         description: Навык с таким названием уже существует
 */
router.post("/", skillController.createSkill);

/**
 * @swagger
 * /api/skills:
 *   get:
 *     summary: Получить все навыки пользователя
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Фильтр по категории
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по названию или описанию
 *     responses:
 *       200:
 *         description: Список навыков
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
 *                     skills:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Skill'
 *                     total:
 *                       type: integer
 */
router.get("/", skillController.getAllSkills);

/**
 * @swagger
 * /api/skills/stats:
 *   get:
 *     summary: Получить статистику по навыкам
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика навыков
 */
router.get("/stats", skillController.getSkillsStats);

/**
 * @swagger
 * /api/skills/{id}:
 *   get:
 *     summary: Получить навык по ID
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID навыка
 *     responses:
 *       200:
 *         description: Информация о навыке
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
 *                     skill:
 *                       $ref: '#/components/schemas/Skill'
 *       404:
 *         description: Навык не найден
 */
router.get("/:id", skillController.getSkillById);

/**
 * @swagger
 * /api/skills/{id}:
 *   put:
 *     summary: Обновить навык
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID навыка
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
 *               category_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Навык успешно обновлен
 *       404:
 *         description: Навык не найден
 *       409:
 *         description: Навык с таким названием уже существует
 */
router.put("/:id", skillController.updateSkill);

/**
 * @swagger
 * /api/skills/{id}:
 *   delete:
 *     summary: Удалить навык
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID навыка
 *     responses:
 *       200:
 *         description: Навык успешно удален
 *       404:
 *         description: Навык не найден
 */
router.delete("/:id", skillController.deleteSkill);

/**
 * @swagger
 * /api/skills/{id}/topics:
 *   get:
 *     summary: Получить все темы навыка
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID навыка
 *       - in: query
 *         name: status_id
 *         schema:
 *           type: integer
 *         description: Фильтр по статусу
 *     responses:
 *       200:
 *         description: Список тем навыка
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
 *       404:
 *         description: Навык не найден
 */
router.get("/:id/topics", skillController.getSkillTopics);

module.exports = router;
