const express = require("express");
const router = express.Router();
const skillCategoryController = require("../controllers/skillCategoryController");

/**
 * @swagger
 * components:
 *   schemas:
 *     SkillCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор категории
 *         name:
 *           type: string
 *           description: Название категории
 *         description:
 *           type: string
 *           description: Описание категории
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Дата создания
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Дата обновления
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Название категории
 *         description:
 *           type: string
 *           description: Описание категории
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Создать новую категорию навыков
 *     tags: [Skill Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Категория успешно создана
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
 *                     category:
 *                       $ref: '#/components/schemas/SkillCategory'
 *       400:
 *         description: Ошибка валидации
 *       409:
 *         description: Категория с таким названием уже существует
 */
router.post("/", skillCategoryController.createCategory);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Получить все категории навыков
 *     tags: [Skill Categories]
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
 *         description: Включить статистику (количество навыков)
 *     responses:
 *       200:
 *         description: Список категорий
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SkillCategory'
 *                     total:
 *                       type: integer
 */
router.get("/", skillCategoryController.getAllCategories);

/**
 * @swagger
 * /api/categories/stats:
 *   get:
 *     summary: Получить статистику по всем категориям
 *     tags: [Skill Categories]
 *     responses:
 *       200:
 *         description: Статистика категорий
 */
router.get("/stats", skillCategoryController.getCategoriesStats);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Получить категорию по ID
 *     tags: [Skill Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID категории
 *       - in: query
 *         name: include_skills
 *         schema:
 *           type: boolean
 *         description: Включить связанные навыки
 *     responses:
 *       200:
 *         description: Информация о категории
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
 *                     category:
 *                       $ref: '#/components/schemas/SkillCategory'
 *       404:
 *         description: Категория не найдена
 */
router.get("/:id", skillCategoryController.getCategoryById);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Обновить категорию
 *     tags: [Skill Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID категории
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
 *     responses:
 *       200:
 *         description: Категория успешно обновлена
 *       404:
 *         description: Категория не найдена
 *       409:
 *         description: Категория с таким названием уже существует
 */
router.put("/:id", skillCategoryController.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Удалить категорию
 *     tags: [Skill Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID категории
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *         description: Принудительное удаление (обнулить category_id у связанных навыков)
 *     responses:
 *       200:
 *         description: Категория успешно удалена
 *       400:
 *         description: Категория используется навыками
 *       404:
 *         description: Категория не найдена
 */
router.delete("/:id", skillCategoryController.deleteCategory);

/**
 * @swagger
 * /api/categories/{id}/skills:
 *   get:
 *     summary: Получить все навыки категории
 *     tags: [Skill Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID категории
 *       - in: query
 *         name: include_topics
 *         schema:
 *           type: boolean
 *         description: Включить темы в ответ
 *     responses:
 *       200:
 *         description: Список навыков категории
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
 *       404:
 *         description: Категория не найдена
 */
router.get("/:id/skills", skillCategoryController.getCategorySkills);

module.exports = router;
