const express = require("express");
const router = express.Router();
const ChatController = require("../controllers/chatController");
const authMiddleware = require("../middlewares/authMiddleware");

// Применяем middleware авторизации ко всем маршрутам чата
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID сообщения
 *         sender_id:
 *           type: integer
 *           description: ID отправителя
 *         receiver_id:
 *           type: integer
 *           description: ID получателя
 *         content:
 *           type: string
 *           description: Содержимое сообщения
 *         message_type:
 *           type: string
 *           enum: [text, image, file]
 *           description: Тип сообщения
 *         is_read:
 *           type: boolean
 *           description: Прочитано ли сообщение
 *         is_edited:
 *           type: boolean
 *           description: Редактировалось ли сообщение
 *         created_at:
 *           type: string
 *           format: date-time
 *         edited_at:
 *           type: string
 *           format: date-time
 *         sender:
 *           $ref: '#/components/schemas/User'
 *
 *     Chat:
 *       type: object
 *       properties:
 *         chatId:
 *           type: integer
 *           description: ID чата (ID собеседника)
 *         user:
 *           $ref: '#/components/schemas/User'
 *         lastMessage:
 *           $ref: '#/components/schemas/Message'
 *         unreadCount:
 *           type: integer
 *           description: Количество непрочитанных сообщений
 *
 *     SendMessageRequest:
 *       type: object
 *       required:
 *         - receiverId
 *         - content
 *       properties:
 *         receiverId:
 *           type: integer
 *           description: ID получателя
 *         content:
 *           type: string
 *           description: Содержимое сообщения
 *         messageType:
 *           type: string
 *           enum: [text, image, file]
 *           default: text
 *           description: Тип сообщения
 */

/**
 * @swagger
 * /api/chat/chats:
 *   get:
 *     summary: Получить список чатов
 *     description: Возвращает список всех чатов пользователя
 *     tags: [Чат]
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
 *         description: Количество элементов на странице
 *     responses:
 *       200:
 *         description: Список чатов
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
 *                     chats:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Chat'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get("/chats", ChatController.getChats);

/**
 * @swagger
 * /api/chat/messages/{otherUserId}:
 *   get:
 *     summary: Получить сообщения с пользователем
 *     description: Возвращает историю сообщений с указанным пользователем
 *     tags: [Чат]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: otherUserId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID собеседника
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
 *           default: 50
 *         description: Количество сообщений на странице
 *     responses:
 *       200:
 *         description: История сообщений
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       403:
 *         description: Можно общаться только с друзьями
 */
router.get("/messages/:otherUserId", ChatController.getMessages);

/**
 * @swagger
 * /api/chat/send:
 *   post:
 *     summary: Отправить сообщение
 *     description: Отправляет сообщение указанному пользователю
 *     tags: [Чат]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
 *     responses:
 *       201:
 *         description: Сообщение отправлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *                 message:
 *                   type: string
 *       403:
 *         description: Можно отправлять сообщения только друзьям
 *       404:
 *         description: Получатель не найден
 */
router.post("/send", ChatController.sendMessage);

/**
 * @swagger
 * /api/chat/message/{messageId}:
 *   put:
 *     summary: Редактировать сообщение
 *     description: Редактирует содержимое сообщения
 *     tags: [Чат]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID сообщения
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Новое содержимое сообщения
 *     responses:
 *       200:
 *         description: Сообщение обновлено
 *       403:
 *         description: Можно редактировать только свои сообщения
 *       404:
 *         description: Сообщение не найдено
 */
router.put("/message/:messageId", ChatController.editMessage);

/**
 * @swagger
 * /api/chat/message/{messageId}:
 *   delete:
 *     summary: Удалить сообщение
 *     description: Удаляет сообщение
 *     tags: [Чат]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID сообщения
 *     responses:
 *       200:
 *         description: Сообщение удалено
 *       403:
 *         description: Можно удалять только свои сообщения
 *       404:
 *         description: Сообщение не найдено
 */
router.delete("/message/:messageId", ChatController.deleteMessage);

/**
 * @swagger
 * /api/chat/read/{otherUserId}:
 *   patch:
 *     summary: Отметить сообщения как прочитанные
 *     description: Отмечает все сообщения от указанного пользователя как прочитанные
 *     tags: [Чат]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: otherUserId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID собеседника
 *     responses:
 *       200:
 *         description: Сообщения отмечены как прочитанные
 */
router.patch("/read/:otherUserId", ChatController.markAsRead);

// Альтернативный маршрут для совместимости с фронтендом
router.post("/mark-read/:otherUserId", ChatController.markAsRead);

module.exports = router;
