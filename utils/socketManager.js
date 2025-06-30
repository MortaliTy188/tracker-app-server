const jwt = require("jsonwebtoken");
const { User, Message, Friendship } = require("../models");
const { Op } = require("sequelize");

/**
 * Настройка Socket.IO для чата в реальном времени
 */
class SocketManager {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on("connection", (socket) => {
      console.log(`🔌 User connected: ${socket.userId} (${socket.id})`);

      // Сохраняем подключение пользователя
      this.connectedUsers.set(socket.userId, socket.id);

      // Уведомляем о статусе онлайн
      this.broadcastUserStatus(socket.userId, "online");

      // Обработчики событий чата
      socket.on("join_chat", this.handleJoinChat.bind(this, socket));
      socket.on("send_message", this.handleSendMessage.bind(this, socket));
      socket.on("typing_start", this.handleTypingStart.bind(this, socket));
      socket.on("typing_stop", this.handleTypingStop.bind(this, socket));
      socket.on("mark_as_read", this.handleMarkAsRead.bind(this, socket));

      // Обработчик отключения
      socket.on("disconnect", () => {
        console.log(`🔌 User disconnected: ${socket.userId} (${socket.id})`);
        this.connectedUsers.delete(socket.userId);
        this.broadcastUserStatus(socket.userId, "offline");
      });
    });
  }

  // Аутентификация через Socket.IO
  async authenticateSocket(socket, next) {
    try {
      console.log("🔐 Socket authentication attempt...");
      console.log(
        "🔐 Auth token:",
        socket.handshake.auth.token?.substring(0, 20) + "..."
      );
      console.log(
        "🔐 Authorization header:",
        socket.handshake.headers.authorization?.substring(0, 30) + "..."
      );

      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        console.log("❌ No token provided in socket handshake");
        return next(new Error("Authentication error"));
      }

      // Для демо: если токен начинается с "demo-token-user-", извлекаем ID пользователя
      if (token.startsWith("demo-token-user-")) {
        const userId = parseInt(token.replace("demo-token-user-", ""));
        const user = await User.findByPk(userId);

        if (!user) {
          return next(new Error("User not found"));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
        return;
      }

      // Обычная JWT аутентификация для реальных пользователей
      console.log("🔐 Attempting JWT verification...");
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
      console.log("🔐 JWT decoded, user ID:", decoded.id);

      const user = await User.findByPk(decoded.id);

      if (!user) {
        console.log("❌ User not found in database:", decoded.id);
        return next(new Error("User not found"));
      }

      console.log("✅ Socket authentication successful for user:", user.name);
      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  }

  // Присоединение к чату с конкретным пользователем
  async handleJoinChat(socket, data) {
    try {
      const { otherUserId } = data;
      const userId = socket.userId;

      // Проверяем дружбу
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
        socket.emit("error", { message: "Можно общаться только с друзьями" });
        return;
      }

      // Создаем уникальное имя комнаты для чата
      const roomName = this.getChatRoomName(userId, otherUserId);
      socket.join(roomName);

      console.log(`💬 User ${userId} joined chat room: ${roomName}`);
      socket.emit("chat_joined", { roomName, otherUserId });
    } catch (error) {
      console.error("Error joining chat:", error);
      socket.emit("error", { message: "Ошибка при подключении к чату" });
    }
  }

  // Отправка сообщения через Socket.IO
  async handleSendMessage(socket, data) {
    try {
      const { receiverId, content, messageType = "text" } = data;
      const senderId = socket.userId;

      // Проверяем дружбу
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
        socket.emit("error", {
          message: "Можно отправлять сообщения только друзьям",
        });
        return;
      }

      // Создаем сообщение в базе данных
      const message = await Message.create({
        sender_id: senderId,
        receiver_id: receiverId,
        content: content.trim(),
        message_type: messageType,
      });

      // Получаем сообщение с данными отправителя
      const messageWithSender = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "name", "avatar"],
          },
        ],
      });

      // Отправляем сообщение в комнату чата
      const roomName = this.getChatRoomName(senderId, receiverId);
      this.io.to(roomName).emit("new_message", messageWithSender);

      // Если получатель онлайн, но не в комнате чата, отправляем уведомление
      const receiverSocketId = this.connectedUsers.get(receiverId);
      if (receiverSocketId) {
        const receiverSocket = this.io.sockets.sockets.get(receiverSocketId);
        if (receiverSocket && !receiverSocket.rooms.has(roomName)) {
          receiverSocket.emit("message_notification", {
            senderId,
            senderName: socket.user.name,
            content: content.substring(0, 100), // Превью сообщения
            messageId: message.id,
          });
        }
      }

      console.log(`💬 Message sent from ${senderId} to ${receiverId}`);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Ошибка при отправке сообщения" });
    }
  }

  // Начало набора текста
  handleTypingStart(socket, data) {
    const { otherUserId } = data;
    const roomName = this.getChatRoomName(socket.userId, otherUserId);

    socket.to(roomName).emit("user_typing", {
      userId: socket.userId,
      userName: socket.user.name,
      isTyping: true,
    });
  }

  // Окончание набора текста
  handleTypingStop(socket, data) {
    const { otherUserId } = data;
    const roomName = this.getChatRoomName(socket.userId, otherUserId);

    socket.to(roomName).emit("user_typing", {
      userId: socket.userId,
      userName: socket.user.name,
      isTyping: false,
    });
  }

  // Отметка сообщений как прочитанных
  async handleMarkAsRead(socket, data) {
    try {
      const { otherUserId, messageIds } = data;
      const userId = socket.userId;

      let updateWhere;
      if (Array.isArray(messageIds) && messageIds.length > 0) {
        updateWhere = {
          id: messageIds,
          sender_id: otherUserId,
          receiver_id: userId,
          is_read: false,
        };
      } else {
        updateWhere = {
          sender_id: otherUserId,
          receiver_id: userId,
          is_read: false,
        };
      }

      await Message.update({ is_read: true }, { where: updateWhere });

      // Уведомляем отправителя о прочтении
      const roomName = this.getChatRoomName(userId, otherUserId);
      socket.to(roomName).emit("messages_read", {
        readerId: userId,
        messageIds: messageIds || null,
      });

      console.log(`👁️ Messages marked as read by ${userId}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      socket.emit("error", { message: "Ошибка при отметке сообщений" });
    }
  }

  // Трансляция статуса пользователя (онлайн/оффлайн)
  broadcastUserStatus(userId, status) {
    this.io.emit("user_status", {
      userId,
      status,
      timestamp: new Date(),
    });
  }

  // Генерация имени комнаты для чата
  getChatRoomName(userId1, userId2) {
    const sortedIds = [userId1, userId2].sort();
    return `chat_${sortedIds[0]}_${sortedIds[1]}`;
  }

  // Получить количество онлайн пользователей
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Проверить, онлайн ли пользователь
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = SocketManager;
