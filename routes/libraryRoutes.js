const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const optionalAuth = require("../middlewares/optionalAuth");
const {
  getPublicSkills,
  getSkillDetails,
  toggleSkillLike,
  addSkillComment,
  getSkillComments,
  updateSkillPublicity,
} = require("../controllers/libraryController");

/**
 * @swagger
 * components:
 *   schemas:
 *     PublicSkill:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         is_public:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         owner:
 *           $ref: '#/components/schemas/SkillOwner'
 *         category:
 *           $ref: '#/components/schemas/SkillCategory'
 *         topics:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Topic'
 *         stats:
 *           $ref: '#/components/schemas/SkillStats'
 *
 *     SkillOwner:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         username:
 *           type: string
 *         avatar_url:
 *           type: string
 *
 *     SkillStats:
 *       type: object
 *       properties:
 *         likesCount:
 *           type: integer
 *         dislikesCount:
 *           type: integer
 *         commentsCount:
 *           type: integer
 *         topicsCount:
 *           type: integer
 *         completedTopicsCount:
 *           type: integer
 *
 *     SkillComment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         content:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         author:
 *           $ref: '#/components/schemas/SkillOwner'
 *         replies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SkillComment'
 */

/**
 * @swagger
 * /api/library/skills:
 *   get:
 *     summary: Получить список публичных навыков
 *     tags: [Library]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Список публичных навыков
 */
router.get("/skills", optionalAuth, getPublicSkills);

/**
 * @swagger
 * /api/library/skills/{id}:
 *   get:
 *     summary: Получить детальную информацию о навыке
 *     tags: [Library]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Детальная информация о навыке
 *       404:
 *         description: Навык не найден
 */
router.get("/skills/:id", optionalAuth, getSkillDetails);

/**
 * @swagger
 * /api/library/skills/{skill_id}/like:
 *   post:
 *     summary: Поставить/убрать лайк навыку
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skill_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [like, dislike]
 *     responses:
 *       200:
 *         description: Лайк обновлен
 *       404:
 *         description: Навык не найден
 */
router.post("/skills/:skill_id/like", authMiddleware, toggleSkillLike);

/**
 * @swagger
 * /api/library/skills/{skill_id}/comments:
 *   get:
 *     summary: Получить комментарии к навыку
 *     tags: [Library]
 *     parameters:
 *       - in: path
 *         name: skill_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Список комментариев
 *   post:
 *     summary: Добавить комментарий к навыку
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skill_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               parent_comment_id:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Комментарий добавлен
 */
router.get("/skills/:skill_id/comments", getSkillComments);
router.post("/skills/:skill_id/comments", authMiddleware, addSkillComment);

/**
 * @swagger
 * /api/library/skills/{id}/publicity:
 *   put:
 *     summary: Обновить статус публичности навыка
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_public:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Статус публичности обновлен
 *       404:
 *         description: Навык не найден
 */
router.put("/skills/:id/publicity", authMiddleware, updateSkillPublicity);

module.exports = router;
