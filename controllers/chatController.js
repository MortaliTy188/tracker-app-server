const { User, Message, Friendship } = require("../models");
const { Op } = require("sequelize");
const AchievementManager = require("../utils/achievementManager");

/**
 * Контроллер для работы с сообщениями чата
 */
class ChatController {
  /**
   * Получить список чатов (диалогов) пользователя
   */
  static async getChats(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      console.log(`💬 Getting chats for user ${userId}`);

      // Получаем последние сообщения для каждого чата
      const chats = await Message.findAll({
        where: {
          [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
        },
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "name", "avatar", "level"],
          },
          {
            model: User,
            as: "receiver",
            attributes: ["id", "name", "avatar", "level"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Группируем сообщения по чатам
      const chatMap = new Map();

      chats.forEach((message) => {
        const otherUserId =
          message.sender_id === userId
            ? message.receiver_id
            : message.sender_id;

        const otherUser =
          message.sender_id === userId ? message.receiver : message.sender;

        if (!chatMap.has(otherUserId)) {
          chatMap.set(otherUserId, {
            chatId: otherUserId,
            user: otherUser,
            lastMessage: message,
            unreadCount: 0,
          });
        }
      });

      // Подсчитываем непрочитанные сообщения
      for (const [otherUserId, chat] of chatMap.entries()) {
        const unreadCount = await Message.count({
          where: {
            sender_id: otherUserId,
            receiver_id: userId,
            is_read: false,
          },
        });
        chat.unreadCount = unreadCount;
      }

      const chatsList = Array.from(chatMap.values());

      res.json({
        success: true,
        data: {
          chats: chatsList,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: chatsList.length,
          },
        },
      });
    } catch (error) {
      console.error("Ошибка при получении списка чатов:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  }

  /**
   * Получить историю сообщений с конкретным пользователем
   */
  static async getMessages(req, res) {
    try {
      const userId = req.user.id;
      const { otherUserId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      console.log(`💬 Getting messages between ${userId} and ${otherUserId}`);

      // Проверяем, что пользователи являются друзьями
      const friendship = await Friendship.findOne({
        where: {
          [Op.or]: [
            { requester_id: userId, addressee_id: otherUserId },
            { requester_id: otherUserId, addressee_id: userId },
          ],
          status: "accepted",
        },
      });

      if (!friendship) {
        return res.status(403).json({
          success: false,
          message: "Можно общаться только с друзьями",
        });
      }

      // Получаем сообщения между пользователями
      const messages = await Message.findAndCountAll({
        where: {
          [Op.or]: [
            { sender_id: userId, receiver_id: otherUserId },
            { sender_id: otherUserId, receiver_id: userId },
          ],
        },
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "name", "avatar"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Отмечаем сообщения как прочитанные
      await Message.update(
        { is_read: true },
        {
          where: {
            sender_id: otherUserId,
            receiver_id: userId,
            is_read: false,
          },
        }
      );

      res.json({
        success: true,
        data: {
          messages: messages.rows.reverse(), // Возвращаем в прямом порядке
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: messages.count,
            totalPages: Math.ceil(messages.count / limit),
          },
        },
      });
    } catch (error) {
      console.error("Ошибка при получении сообщений:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  }

  /**
   * Отправить сообщение
   */
  static async sendMessage(req, res) {
    try {
      const senderId = req.user.id;
      const { receiverId, content, messageType = "text" } = req.body;

      console.log(`💬 Sending message from ${senderId} to ${receiverId}`);

      // Проверяем, что получатель существует
      const receiver = await User.findByPk(receiverId);
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: "Получатель не найден",
        });
      }

      // Проверяем, что пользователи являются друзьями
      const friendship = await Friendship.findOne({
        where: {
          [Op.or]: [
            { requester_id: senderId, addressee_id: receiverId },
            { requester_id: receiverId, addressee_id: senderId },
          ],
          status: "accepted",
        },
      });

      if (!friendship) {
        return res.status(403).json({
          success: false,
          message: "Можно отправлять сообщения только друзьям",
        });
      }

      // Создаем сообщение
      const message = await Message.create({
        sender_id: senderId,
        receiver_id: receiverId,
        content: content.trim(),
        message_type: messageType,
      });

      // Получаем созданное сообщение с данными отправителя
      const messageWithSender = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "name", "avatar"],
          },
        ],
      });

      // Проверяем достижения чата для отправителя
      try {
        await AchievementManager.checkAchievements(senderId, "message_sent", {
          messageId: message.id,
          receiverId: receiverId,
          content: content,
          messageType: messageType,
        });
        console.log(
          `🏆 Проверены достижения чата для пользователя ${senderId}`
        );
      } catch (achievementError) {
        console.error("Ошибка при проверке достижений чата:", achievementError);
      }

      // Проверяем достижения чата для получателя
      try {
        await AchievementManager.checkAchievements(
          receiverId,
          "message_received",
          {
            messageId: message.id,
            senderId: senderId,
            content: content,
            messageType: messageType,
          }
        );
        console.log(
          `🏆 Проверены достижения чата для получателя ${receiverId}`
        );
      } catch (achievementError) {
        console.error(
          "Ошибка при проверке достижений чата для получателя:",
          achievementError
        );
      }

      res.status(201).json({
        success: true,
        data: messageWithSender,
        message: "Сообщение отправлено",
      });
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  }

  /**
   * Редактировать сообщение
   */
  static async editMessage(req, res) {
    try {
      const userId = req.user.id;
      const { messageId } = req.params;
      const { content } = req.body;

      const message = await Message.findByPk(messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Сообщение не найдено",
        });
      }

      if (message.sender_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Можно редактировать только свои сообщения",
        });
      }

      // Обновляем сообщение
      await message.update({
        content: content.trim(),
        is_edited: true,
        edited_at: new Date(),
      });

      // Проверяем достижения за редактирование сообщений
      try {
        await AchievementManager.checkAchievements(userId, "message_edited", {
          messageId: messageId,
          newContent: content,
        });
        console.log(
          `🏆 Проверены достижения за редактирование для пользователя ${userId}`
        );
      } catch (achievementError) {
        console.error(
          "Ошибка при проверке достижений за редактирование:",
          achievementError
        );
      }

      res.json({
        success: true,
        data: message,
        message: "Сообщение обновлено",
      });
    } catch (error) {
      console.error("Ошибка при редактировании сообщения:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  }

  /**
   * Удалить сообщение
   */
  static async deleteMessage(req, res) {
    try {
      const userId = req.user.id;
      const { messageId } = req.params;

      const message = await Message.findByPk(messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Сообщение не найдено",
        });
      }

      if (message.sender_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Можно удалять только свои сообщения",
        });
      }

      await message.destroy();

      res.json({
        success: true,
        message: "Сообщение удалено",
      });
    } catch (error) {
      console.error("Ошибка при удалении сообщения:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  }

  /**
   * Отметить сообщения как прочитанные
   */
  static async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { otherUserId } = req.params;

      await Message.update(
        { is_read: true },
        {
          where: {
            sender_id: otherUserId,
            receiver_id: userId,
            is_read: false,
          },
        }
      );

      res.json({
        success: true,
        message: "Сообщения отмечены как прочитанные",
      });
    } catch (error) {
      console.error("Ошибка при отметке сообщений как прочитанных:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  }
}

module.exports = ChatController;
