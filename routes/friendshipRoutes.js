const express = require("express");
const router = express.Router();
const friendshipController = require("../controllers/friendshipController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     FriendRequest:
 *       type: object
 *       properties:
 *         addresseeId:
 *           type: integer
 *           description: ID пользователя, которому отправляется запрос на дружбу
 *       required:
 *         - addresseeId
 *       example:
 *         addresseeId: 5
 *
 *     Friend:
 *       type: object
 *       properties:
 *         friendshipId:
 *           type: integer
 *           description: ID записи о дружбе
 *         id:
 *           type: integer
 *           description: ID пользователя-друга
 *         username:
 *           type: string
 *           description: Имя пользователя
 *         firstName:
 *           type: string
 *           description: Имя
 *         lastName:
 *           type: string
 *           description: Фамилия
 *         avatar:
 *           type: string
 *           description: Путь к аватару
 *         level:
 *           type: integer
 *           description: Уровень пользователя
 *         isPrivate:
 *           type: boolean
 *           description: Приватность профиля
 *         friendsSince:
 *           type: string
 *           format: date-time
 *           description: Дата начала дружбы
 *
 *     FriendshipStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [none, pending, accepted, declined, blocked, self, received_request, sent_request]
 *           description: Статус дружбы
 *         friendshipId:
 *           type: integer
 *           description: ID записи о дружбе (если существует)
 *         canAccept:
 *           type: boolean
 *           description: Можно ли принять запрос
 *         canDecline:
 *           type: boolean
 *           description: Можно ли отклонить запрос
 *         canCancel:
 *           type: boolean
 *           description: Можно ли отменить запрос
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания дружбы
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата обновления дружбы
 *
 *   responses:
 *     FriendshipSuccess:
 *       description: Успешная операция с дружбой
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *
 *     FriendsList:
 *       description: Список друзей
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               data:
 *                 type: object
 *                 properties:
 *                   friends:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Friend'
 *                   pagination:
 *                     $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /api/friendship/request:
 *   post:
 *     summary: Отправить запрос на дружбу
 *     description: Отправляет запрос на дружбу указанному пользователю
 *     tags: [Дружба]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FriendRequest'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/FriendshipSuccess'
 *       400:
 *         description: Ошибка валидации или запрос уже существует
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/request", authMiddleware, friendshipController.sendFriendRequest);

/**
 * @swagger
 * /api/friendship/{friendshipId}/accept:
 *   patch:
 *     summary: Принять запрос на дружбу
 *     description: Принимает входящий запрос на дружбу
 *     tags: [Дружба]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendshipId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID запроса на дружбу
 *     responses:
 *       200:
 *         $ref: '#/components/responses/FriendshipSuccess'
 *       400:
 *         description: Запрос уже обработан
 *       403:
 *         description: Нет прав для выполнения действия
 *       404:
 *         description: Запрос не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.patch(
  "/:friendshipId/accept",
  authMiddleware,
  friendshipController.acceptFriendRequest
);

/**
 * @swagger
 * /api/friendship/{friendshipId}/decline:
 *   patch:
 *     summary: Отклонить запрос на дружбу
 *     description: Отклоняет входящий запрос на дружбу
 *     tags: [Дружба]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendshipId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID запроса на дружбу
 *     responses:
 *       200:
 *         $ref: '#/components/responses/FriendshipSuccess'
 *       400:
 *         description: Запрос уже обработан
 *       403:
 *         description: Нет прав для выполнения действия
 *       404:
 *         description: Запрос не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.patch(
  "/:friendshipId/decline",
  authMiddleware,
  friendshipController.declineFriendRequest
);

/**
 * @swagger
 * /api/friendship/{friendshipId}/remove:
 *   delete:
 *     summary: Удалить друга или отменить запрос
 *     description: Удаляет дружбу или отменяет запрос на дружбу
 *     tags: [Дружба]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendshipId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID дружбы или запроса
 *     responses:
 *       200:
 *         $ref: '#/components/responses/FriendshipSuccess'
 *       403:
 *         description: Нет прав для выполнения действия
 *       404:
 *         description: Дружба не найдена
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.delete(
  "/:friendshipId/remove",
  authMiddleware,
  friendshipController.removeFriend
);

/**
 * @swagger
 * /api/friendship/friends:
 *   get:
 *     summary: Получить список друзей
 *     description: Возвращает список всех друзей текущего пользователя
 *     tags: [Дружба]
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
 *           maximum: 100
 *         description: Количество элементов на странице
 *     responses:
 *       200:
 *         $ref: '#/components/responses/FriendsList'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/friends", authMiddleware, friendshipController.getFriends);

/**
 * @swagger
 * /api/friendship/requests/pending:
 *   get:
 *     summary: Получить входящие запросы на дружбу
 *     description: Возвращает список всех входящих запросов на дружбу
 *     tags: [Дружба]
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
 *           maximum: 100
 *         description: Количество элементов на странице
 *     responses:
 *       200:
 *         description: Список входящих запросов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     pendingRequests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           friendshipId:
 *                             type: integer
 *                           requester:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               username:
 *                                 type: string
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               avatar:
 *                                 type: string
 *                               level:
 *                                 type: integer
 *                           requestDate:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get(
  "/requests/pending",
  authMiddleware,
  friendshipController.getPendingRequests
);

/**
 * @swagger
 * /api/friendship/requests/sent:
 *   get:
 *     summary: Получить исходящие запросы на дружбу
 *     description: Возвращает список всех исходящих запросов на дружбу
 *     tags: [Дружба]
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
 *           maximum: 100
 *         description: Количество элементов на странице
 *     responses:
 *       200:
 *         description: Список исходящих запросов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     sentRequests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           friendshipId:
 *                             type: integer
 *                           addressee:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               username:
 *                                 type: string
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               avatar:
 *                                 type: string
 *                               level:
 *                                 type: integer
 *                           requestDate:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get(
  "/requests/sent",
  authMiddleware,
  friendshipController.getSentRequests
);

/**
 * @swagger
 * /api/friendship/status/{targetUserId}:
 *   get:
 *     summary: Получить статус дружбы с пользователем
 *     description: Возвращает статус дружбы между текущим пользователем и указанным пользователем
 *     tags: [Дружба]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя для проверки статуса дружбы
 *     responses:
 *       200:
 *         description: Статус дружбы
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FriendshipStatus'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get(
  "/status/:targetUserId",
  authMiddleware,
  friendshipController.getFriendshipStatus
);

module.exports = router;
