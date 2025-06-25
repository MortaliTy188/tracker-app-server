const { User, Friendship } = require("../models");
const { Op } = require("sequelize");

// Отправить запрос на дружбу
const sendFriendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { addresseeId } = req.body;

    // Проверяем, что пользователь не пытается отправить запрос самому себе
    if (requesterId === parseInt(addresseeId)) {
      return res.status(400).json({
        success: false,
        message: "Нельзя отправить запрос на дружбу самому себе",
      });
    }

    // Проверяем, что адресат существует
    const addressee = await User.findByPk(addresseeId);
    if (!addressee) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    // Проверяем, не существует ли уже запрос или дружба
    const existingFriendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requester_id: requesterId, addressee_id: addresseeId },
          { requester_id: addresseeId, addressee_id: requesterId },
        ],
      },
    });

    if (existingFriendship) {
      let message = "";
      switch (existingFriendship.status) {
        case "pending":
          message = "Запрос на дружбу уже отправлен";
          break;
        case "accepted":
          message = "Вы уже друзья";
          break;
        case "declined":
          message = "Запрос на дружбу был отклонен";
          break;
        case "blocked":
          message = "Один из пользователей заблокирован";
          break;
      }
      return res.status(400).json({
        success: false,
        message: message,
      });
    }

    // Создаем новый запрос на дружбу
    const friendship = await Friendship.create({
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Запрос на дружбу отправлен",
      data: {
        id: friendship.id,
        requester_id: friendship.requester_id,
        addressee_id: friendship.addressee_id,
        status: friendship.status,
        created_at: friendship.created_at,
      },
    });
  } catch (error) {
    console.error("Ошибка при отправке запроса на дружбу:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
};

// Принять запрос на дружбу
const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendshipId } = req.params;

    console.log(
      `✅ Accept request - User ID: ${userId}, Friendship ID: ${friendshipId}`
    );

    const friendship = await Friendship.findByPk(friendshipId);

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Запрос на дружбу не найден",
      });
    }

    console.log(
      `✅ Friendship found - Requester ID: ${friendship.requester_id}, Addressee ID: ${friendship.addressee_id}, Status: ${friendship.status}`
    );

    // Проверяем, что текущий пользователь является адресатом запроса
    if (parseInt(friendship.addressee_id) !== parseInt(userId)) {
      console.log(
        `❌ Access denied - Expected addressee: ${friendship.addressee_id}, Actual user: ${userId}`
      );
      return res.status(403).json({
        success: false,
        message: "Нет прав для выполнения этого действия",
      });
    }

    // Проверяем статус запроса
    if (friendship.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Запрос уже обработан",
      });
    }

    // Обновляем статус на "accepted"
    friendship.status = "accepted";
    friendship.updated_at = new Date();
    await friendship.save();

    res.json({
      success: true,
      message: "Запрос на дружбу принят",
      data: {
        id: friendship.id,
        requester_id: friendship.requester_id,
        addressee_id: friendship.addressee_id,
        status: friendship.status,
        updated_at: friendship.updated_at,
      },
    });
  } catch (error) {
    console.error("Ошибка при принятии запроса на дружбу:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
};

// Отклонить запрос на дружбу
const declineFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendshipId } = req.params;

    console.log(
      `❌ Decline request - User ID: ${userId}, Friendship ID: ${friendshipId}`
    );

    const friendship = await Friendship.findByPk(friendshipId);

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Запрос на дружбу не найден",
      });
    }

    console.log(
      `❌ Friendship found - Requester ID: ${friendship.requester_id}, Addressee ID: ${friendship.addressee_id}, Status: ${friendship.status}`
    );

    // Проверяем, что текущий пользователь является адресатом запроса
    if (parseInt(friendship.addressee_id) !== parseInt(userId)) {
      console.log(
        `❌ Access denied - Expected addressee: ${friendship.addressee_id}, Actual user: ${userId}`
      );
      return res.status(403).json({
        success: false,
        message: "Нет прав для выполнения этого действия",
      });
    }

    // Проверяем статус запроса
    if (friendship.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Запрос уже обработан",
      });
    }

    // Обновляем статус на "declined"
    friendship.status = "declined";
    friendship.updated_at = new Date();
    await friendship.save();

    res.json({
      success: true,
      message: "Запрос на дружбу отклонен",
      data: {
        id: friendship.id,
        requester_id: friendship.requester_id,
        addressee_id: friendship.addressee_id,
        status: friendship.status,
        updated_at: friendship.updated_at,
      },
    });
  } catch (error) {
    console.error("Ошибка при отклонении запроса на дружбу:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
};

// Удалить друга или отменить запрос
const removeFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendshipId } = req.params;

    console.log(
      `🗑️ Remove friend - User ID: ${userId}, Friendship ID: ${friendshipId}`
    );

    const friendship = await Friendship.findByPk(friendshipId);

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Дружба не найдена",
      });
    }

    console.log(
      `🗑️ Friendship found - Requester ID: ${friendship.requester_id}, Addressee ID: ${friendship.addressee_id}, Status: ${friendship.status}`
    );

    // Проверяем, что текущий пользователь участвует в этой дружбе
    if (
      parseInt(friendship.requester_id) !== parseInt(userId) &&
      parseInt(friendship.addressee_id) !== parseInt(userId)
    ) {
      console.log(
        `❌ Access denied - User ${userId} is not part of friendship between ${friendship.requester_id} and ${friendship.addressee_id}`
      );
      return res.status(403).json({
        success: false,
        message: "Нет прав для выполнения этого действия",
      });
    }

    // Удаляем запись о дружбе
    await friendship.destroy();

    res.json({
      success: true,
      message: "Дружба удалена",
    });
  } catch (error) {
    console.error("Ошибка при удалении дружбы:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
};

// Получить список друзей
const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Получаем принятые дружбы где пользователь является отправителем
    const sentFriendships = await Friendship.findAll({
      where: {
        requester_id: userId,
        status: "accepted",
      },
      include: [
        {
          model: User,
          as: "addressee",
          attributes: ["id", "name", "avatar", "level", "isPrivate"],
        },
      ],
      order: [["updated_at", "DESC"]],
    });

    // Получаем принятые дружбы где пользователь является получателем
    const receivedFriendships = await Friendship.findAll({
      where: {
        addressee_id: userId,
        status: "accepted",
      },
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "name", "avatar", "level", "isPrivate"],
        },
      ],
      order: [["updated_at", "DESC"]],
    });

    // Объединяем и форматируем друзей
    const allFriendships = [
      ...sentFriendships.map((f) => ({
        friendshipId: f.id,
        friend: f.addressee,
        friendsSince: f.updated_at,
      })),
      ...receivedFriendships.map((f) => ({
        friendshipId: f.id,
        friend: f.requester,
        friendsSince: f.updated_at,
      })),
    ];

    // Сортируем по дате обновления и применяем пагинацию
    allFriendships.sort(
      (a, b) => new Date(b.friendsSince) - new Date(a.friendsSince)
    );
    const totalFriends = allFriendships.length;
    const paginatedFriends = allFriendships.slice(
      offset,
      offset + parseInt(limit)
    );

    const friends = paginatedFriends.map((item) => ({
      friendshipId: item.friendshipId,
      id: item.friend.id,
      name: item.friend.name,
      avatar: item.friend.avatar,
      level: item.friend.level,
      isPrivate: item.friend.isPrivate,
      friendsSince: item.friendsSince,
    }));

    res.json({
      success: true,
      data: {
        friends,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalFriends,
          totalPages: Math.ceil(totalFriends / limit),
        },
      },
    });
  } catch (error) {
    console.error("Ошибка при получении списка друзей:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
};

// Получить входящие запросы на дружбу
const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    console.log(`📥 Getting pending requests for user ${userId}`);

    // Используем связи для получения данных в одном запросе
    const requests = await Friendship.findAndCountAll({
      where: {
        addressee_id: userId,
        status: "pending",
      },
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "name", "avatar", "level"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    console.log(`📥 Found ${requests.count} pending requests`);

    const pendingRequests = requests.rows.map((request) => ({
      friendshipId: request.id,
      requester: {
        id: request.requester.id,
        name: request.requester.name,
        avatar: request.requester.avatar,
        level: request.requester.level,
      },
      requestDate: request.created_at,
    }));

    res.json({
      success: true,
      data: {
        pendingRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: requests.count,
          totalPages: Math.ceil(requests.count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Ошибка при получении входящих запросов:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
};

// Получить исходящие запросы на дружбу
const getSentRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Используем связи для получения данных в одном запросе
    const requests = await Friendship.findAndCountAll({
      where: {
        requester_id: userId,
        status: "pending",
      },
      include: [
        {
          model: User,
          as: "addressee",
          attributes: ["id", "name", "avatar", "level"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    const sentRequests = requests.rows.map((request) => ({
      friendshipId: request.id,
      addressee: {
        id: request.addressee.id,
        name: request.addressee.name,
        avatar: request.addressee.avatar,
        level: request.addressee.level,
      },
      requestDate: request.created_at,
    }));

    res.json({
      success: true,
      data: {
        sentRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: requests.count,
          totalPages: Math.ceil(requests.count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Ошибка при получении исходящих запросов:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
};

// Получить статус дружбы с конкретным пользователем
const getFriendshipStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    if (userId === parseInt(targetUserId)) {
      return res.json({
        success: true,
        data: { status: "self" },
      });
    }

    const friendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requester_id: userId, addressee_id: targetUserId },
          { requester_id: targetUserId, addressee_id: userId },
        ],
      },
    });

    if (!friendship) {
      return res.json({
        success: true,
        data: { status: "none" },
      });
    }

    let status = friendship.status;
    let canAccept = false;
    let canDecline = false;
    let canCancel = false;

    if (friendship.status === "pending") {
      if (friendship.addressee_id === userId) {
        // Текущий пользователь получил запрос
        canAccept = true;
        canDecline = true;
        status = "received_request";
      } else {
        // Текущий пользователь отправил запрос
        canCancel = true;
        status = "sent_request";
      }
    }

    res.json({
      success: true,
      data: {
        status,
        friendshipId: friendship.id,
        canAccept,
        canDecline,
        canCancel,
        createdAt: friendship.created_at,
        updatedAt: friendship.updated_at,
      },
    });
  } catch (error) {
    console.error("Ошибка при получении статуса дружбы:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  getSentRequests,
  getFriendshipStatus,
};
