const User = require("../models/userModel");
const Friendship = require("../models/friendshipModel");
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

    const friendship = await Friendship.findByPk(friendshipId);

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Запрос на дружбу не найден",
      });
    }

    // Проверяем, что текущий пользователь является адресатом запроса
    if (friendship.addressee_id !== userId) {
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

    const friendship = await Friendship.findByPk(friendshipId);

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Запрос на дружбу не найден",
      });
    }

    // Проверяем, что текущий пользователь является адресатом запроса
    if (friendship.addressee_id !== userId) {
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

    const friendship = await Friendship.findByPk(friendshipId);

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Дружба не найдена",
      });
    }

    // Проверяем, что текущий пользователь участвует в этой дружбе
    if (
      friendship.requester_id !== userId &&
      friendship.addressee_id !== userId
    ) {
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

    // Получаем всех друзей пользователя (принятые запросы)
    const friendships = await Friendship.findAndCountAll({
      where: {
        [Op.or]: [{ requester_id: userId }, { addressee_id: userId }],
        status: "accepted",
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["updated_at", "DESC"]],
    }); // Получаем ID друзей
    const friendIds = friendships.rows.map((friendship) => {
      return friendship.requester_id === userId
        ? friendship.addressee_id
        : friendship.requester_id;
    });

    let friends = [];
    if (friendIds.length > 0) {
      // Получаем информацию о друзьях
      const friendsInfo = await User.findAll({
        where: {
          id: {
            [Op.in]: friendIds,
          },
        },
        attributes: ["id", "name", "avatar", "level", "isPrivate"],
      });

      // Формируем список друзей
      friends = friendships.rows.map((friendship) => {
        const friendId =
          friendship.requester_id === userId
            ? friendship.addressee_id
            : friendship.requester_id;

        const friendInfo = friendsInfo.find((f) => f.id === friendId);

        return {
          friendshipId: friendship.id,
          id: friendInfo.id,
          name: friendInfo.name,
          avatar: friendInfo.avatar,
          level: friendInfo.level,
          isPrivate: friendInfo.isPrivate,
          friendsSince: friendship.updated_at,
        };
      });
    }

    res.json({
      success: true,
      data: {
        friends,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: friendships.count,
          totalPages: Math.ceil(friendships.count / limit),
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

    const requests = await Friendship.findAndCountAll({
      where: {
        addressee_id: userId,
        status: "pending",
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    }); // Получаем ID запросчиков
    const requesterIds = requests.rows.map((request) => request.requester_id);

    let pendingRequests = [];
    if (requesterIds.length > 0) {
      // Получаем информацию о запросчиках
      const requestersInfo = await User.findAll({
        where: {
          id: {
            [Op.in]: requesterIds,
          },
        },
        attributes: ["id", "name", "avatar", "level"],
      });

      pendingRequests = requests.rows.map((request) => {
        const requesterInfo = requestersInfo.find(
          (u) => u.id === request.requester_id
        );

        return {
          friendshipId: request.id,
          requester: {
            id: requesterInfo.id,
            name: requesterInfo.name,
            avatar: requesterInfo.avatar,
            level: requesterInfo.level,
          },
          requestDate: request.created_at,
        };
      });
    }

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

    const requests = await Friendship.findAndCountAll({
      where: {
        requester_id: userId,
        status: "pending",
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    }); // Получаем ID адресатов
    const addresseeIds = requests.rows.map((request) => request.addressee_id);

    let sentRequests = [];
    if (addresseeIds.length > 0) {
      // Получаем информацию об адресатах
      const addresseesInfo = await User.findAll({
        where: {
          id: {
            [Op.in]: addresseeIds,
          },
        },
        attributes: ["id", "name", "avatar", "level"],
      });

      sentRequests = requests.rows.map((request) => {
        const addresseeInfo = addresseesInfo.find(
          (u) => u.id === request.addressee_id
        );

        return {
          friendshipId: request.id,
          addressee: {
            id: addresseeInfo.id,
            name: addresseeInfo.name,
            avatar: addresseeInfo.avatar,
            level: addresseeInfo.level,
          },
          requestDate: request.created_at,
        };
      });
    }

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
