const {
  Achievement,
  UserAchievement,
  User,
  Topic,
  Skill,
  Note,
  SkillCategory,
  Friendship,
} = require("../models");
const { Op } = require("sequelize");
const ActivityLogger = require("./activityLogger");

/**
 * Утилита для управления системой достижений
 */
class AchievementManager {
  /**
   * Проверяет и обновляет прогресс достижений для пользователя
   * @param {number} userId - ID пользователя
   * @param {string} actionType - Тип действия
   * @param {Object} actionData - Данные действия
   */
  static async checkAchievements(userId, actionType, actionData = {}) {
    try {
      // Получаем все активные достижения
      const achievements = await Achievement.findAll({
        where: { is_active: true },
      });

      for (const achievement of achievements) {
        await this.checkSingleAchievement(
          userId,
          achievement,
          actionType,
          actionData
        );
      }
    } catch (error) {
      console.error("Ошибка при проверке достижений:", error);
    }
  }

  /**
   * Проверяет конкретное достижение для пользователя
   */
  static async checkSingleAchievement(
    userId,
    achievement,
    actionType,
    actionData
  ) {
    try {
      // Получаем или создаем запись о прогрессе пользователя
      let userAchievement = await UserAchievement.findOne({
        where: {
          user_id: userId,
          achievement_id: achievement.id,
        },
      });

      if (!userAchievement) {
        userAchievement = await UserAchievement.create({
          user_id: userId,
          achievement_id: achievement.id,
          progress: 0,
          is_completed: false,
        });
      }

      // Если достижение уже получено, пропускаем
      if (userAchievement.is_completed) {
        return;
      }

      // Вычисляем текущий прогресс
      const currentProgress = await this.calculateProgress(userId, achievement);

      // Обновляем прогресс
      const wasCompleted = userAchievement.is_completed;
      const shouldComplete = currentProgress >= achievement.condition_value;

      await userAchievement.update({
        progress: currentProgress,
        is_completed: shouldComplete,
        completed_at:
          shouldComplete && !wasCompleted
            ? new Date()
            : userAchievement.completed_at,
      }); // Если достижение только что получено, выводим уведомление
      if (shouldComplete && !wasCompleted) {
        console.log(
          `🎉 Пользователь ${userId} получил достижение: ${achievement.name}!`
        );

        // Логируем получение достижения
        try {
          await ActivityLogger.logAchievementEarned(userId, {
            id: achievement.id,
            title: achievement.name,
            type: achievement.type,
          });
          console.log(
            `📝 Логирована активность получения достижения: ${achievement.name}`
          );
        } catch (logError) {
          console.error(
            `Ошибка логирования достижения ${achievement.name}:`,
            logError
          );
        }

        return {
          achieved: true,
          achievement: achievement,
          progress: currentProgress,
        };
      }

      return {
        achieved: false,
        achievement: achievement,
        progress: currentProgress,
      };
    } catch (error) {
      console.error(
        `Ошибка при проверке достижения ${achievement.name}:`,
        error
      );
    }
  }

  /**
   * Вычисляет текущий прогресс для конкретного достижения
   */ static async calculateProgress(userId, achievement) {
    try {
      switch (achievement.type) {
        case "topics_completed":
          return await this.getCompletedTopicsCount(
            userId,
            achievement.condition_data
          );

        case "skills_created":
          return await this.getSkillsCount(userId, achievement.condition_data);

        case "notes_written":
          return await this.getNotesCount(userId, achievement.condition_data);

        case "level_reached":
          return await this.getUserLevel(userId);

        case "categories_mastered":
          return await this.getMasteredCategoriesCount(userId);

        case "first_action":
          return await this.checkFirstAction(
            userId,
            achievement.condition_data
          );
        case "special":
          return await this.checkSpecialAchievement(userId, achievement);

        case "streak_days":
          return await this.getStreakDays(userId);

        case "friends_added":
          return await this.getFriendsCount(userId);

        case "friend_requests_received":
          return await this.getReceivedRequestsCount(userId);

        case "friend_requests_sent":
          return await this.getSentRequestsCount(userId);

        case "friendship_duration":
          return await this.getLongestFriendshipDuration(userId);

        // Новые типы достижений для чата
        case "messages_sent":
          return await this.getMessagesSentCount(userId);

        case "messages_received":
          return await this.getMessagesReceivedCount(userId);

        case "unique_conversations":
          return await this.getUniqueConversationsCount(userId);

        case "quick_replies":
          return await this.getQuickRepliesCount(userId);

        case "night_messages":
          return await this.getNightMessagesCount(userId);

        case "emoji_messages":
          return await this.getEmojiMessagesCount(userId);

        case "long_messages":
          return await this.getLongMessagesCount(userId);

        case "conversation_marathon":
          return await this.getConversationMarathonCount(userId);

        case "edited_messages":
          return await this.getEditedMessagesCount(userId);

        default:
          return 0;
      }
    } catch (error) {
      console.error(
        `Ошибка при вычислении прогресса для ${achievement.type}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Получает количество завершенных топиков
   */
  static async getCompletedTopicsCount(userId, conditionData = {}) {
    const whereConditions = {
      progress: 100,
    };

    // Если указана конкретная категория
    if (conditionData && conditionData.category_id) {
      const topics = await Topic.count({
        where: whereConditions,
        include: [
          {
            model: Skill,
            as: "skill",
            where: {
              user_id: userId,
              category_id: conditionData.category_id,
            },
            attributes: [],
          },
        ],
      });
      return topics;
    }

    // Общее количество завершенных топиков
    const topics = await Topic.count({
      where: whereConditions,
      include: [
        {
          model: Skill,
          as: "skill",
          where: { user_id: userId },
          attributes: [],
        },
      ],
    });
    return topics;
  }

  /**
   * Получает количество созданных навыков
   */
  static async getSkillsCount(userId, conditionData = {}) {
    const whereConditions = { user_id: userId };

    if (conditionData && conditionData.category_id) {
      whereConditions.category_id = conditionData.category_id;
    }

    return await Skill.count({ where: whereConditions });
  }

  /**
   * Получает количество написанных заметок
   */
  static async getNotesCount(userId, conditionData = {}) {
    const notes = await Note.count({
      include: [
        {
          model: Topic,
          as: "topic",
          include: [
            {
              model: Skill,
              as: "skill",
              where: { user_id: userId },
              attributes: [],
            },
          ],
          attributes: [],
        },
      ],
    });
    return notes;
  }

  /**
   * Получает уровень пользователя как число
   */
  static async getUserLevel(userId) {
    const user = await User.findByPk(userId, {
      attributes: ["level"],
    });

    if (!user) return 0;

    // Преобразуем уровень в число для сравнения
    const levelMap = {
      новичок: 1,
      базовый: 2,
      продвинутый: 3,
      эксперт: 4,
    };

    return levelMap[user.level] || 0;
  }

  /**
   * Получает количество освоенных категорий (где есть хотя бы один завершенный топик)
   */
  static async getMasteredCategoriesCount(userId) {
    const categories = await SkillCategory.count({
      include: [
        {
          model: Skill,
          as: "skills",
          where: { user_id: userId },
          include: [
            {
              model: Topic,
              as: "topics",
              where: { progress: 100 },
              attributes: [],
            },
          ],
          attributes: [],
        },
      ],
      distinct: true,
    });
    return categories;
  }

  /**
   * Проверяет первое действие пользователя
   */
  static async checkFirstAction(userId, conditionData = {}) {
    const actionType = conditionData.action_type;

    switch (actionType) {
      case "first_skill":
        const skillsCount = await Skill.count({ where: { user_id: userId } });
        return skillsCount > 0 ? 1 : 0;

      case "first_topic":
        const topicsCount = await Topic.count({
          include: [
            {
              model: Skill,
              as: "skill",
              where: { user_id: userId },
              attributes: [],
            },
          ],
        });
        return topicsCount > 0 ? 1 : 0;

      case "first_note":
        const notesCount = await Note.count({
          include: [
            {
              model: Topic,
              as: "topic",
              include: [
                {
                  model: Skill,
                  as: "skill",
                  where: { user_id: userId },
                  attributes: [],
                },
              ],
              attributes: [],
            },
          ],
        });
        return notesCount > 0 ? 1 : 0;

      case "first_completed_topic":
        const completedTopicsCount = await this.getCompletedTopicsCount(userId);
        return completedTopicsCount > 0 ? 1 : 0;

      default:
        return 0;
    }
  }

  /**
   * Получает все достижения пользователя
   */
  static async getUserAchievements(userId, includeProgress = false) {
    const whereConditions = { user_id: userId };

    if (!includeProgress) {
      whereConditions.is_completed = true;
    }

    const userAchievements = await UserAchievement.findAll({
      where: whereConditions,
      include: [
        {
          model: Achievement,
          as: "achievement",
        },
      ],
      order: [
        ["completed_at", "DESC"],
        ["created_at", "DESC"],
      ],
    });

    return userAchievements;
  }

  /**
   * Получает статистику достижений пользователя
   */
  static async getUserAchievementStats(userId) {
    const totalAchievements = await Achievement.count({
      where: { is_active: true },
    });
    const completedAchievements = await UserAchievement.count({
      where: {
        user_id: userId,
        is_completed: true,
      },
    });

    const totalPoints =
      (await UserAchievement.sum("achievement.points", {
        where: { user_id: userId, is_completed: true },
        include: [
          {
            model: Achievement,
            as: "achievement",
            attributes: [],
          },
        ],
      })) || 0;
    return {
      total: totalAchievements,
      completed: completedAchievements,
      percentage:
        totalAchievements > 0
          ? Math.round((completedAchievements / totalAchievements) * 100)
          : 0,
      points: totalPoints,
    };
  }
  /**
   * Проверяет специальные достижения
   */ static async checkSpecialAchievement(userId, achievement) {
    try {
      // Проверяем по названию достижения
      switch (achievement.name) {
        case "Индивидуальность":
          // Проверяем, есть ли у пользователя аватар
          const user = await User.findByPk(userId);
          return user && user.avatar ? 1 : 0;

        case "Представительность":
          // Проверяем, заполнен ли профиль полностью
          const fullUser = await User.findByPk(userId);
          if (fullUser && fullUser.name && fullUser.email && fullUser.avatar) {
            return 1;
          }
          return 0;

        case "Ранняя пташка":
          // Проверяем, входил ли пользователь до 6:00
          return await this.checkEarlyBirdLogin(userId);

        case "Полуночник":
          // Проверяем, входил ли пользователь после 23:00
          return await this.checkNightOwlLogin(userId);

        case "Выходной энтузиаст":
          // Проверяем, входил ли пользователь в выходные
          return await this.checkWeekendLogin(userId);

        case "Открытость":
          // Проверяем, изменял ли пользователь настройки приватности
          return await this.checkPrivacySettingsChanged(userId);

        case "Первопроходец":
          // Проверяем, входит ли пользователь в первые 100
          // Если ID пользователя <= 100, то он точно один из первых 100
          return userId <= 100 ? 100 : 0; // Достижения по опыту
        case "Студент":
          const totalPoints1 = await this.getUserTotalPoints(userId);
          return totalPoints1 >= 100 ? 100 : totalPoints1;

        case "Бакалавр":
          const totalPoints2 = await this.getUserTotalPoints(userId);
          return totalPoints2 >= 500 ? 500 : totalPoints2;

        case "Магистр":
          const totalPoints3 = await this.getUserTotalPoints(userId);
          return totalPoints3 >= 1000 ? 1000 : totalPoints3;

        case "Доктор наук":
          const totalPoints4 = await this.getUserTotalPoints(userId);
          return totalPoints4 >= 2500 ? 2500 : totalPoints4;

        default:
          return 0;
      }
    } catch (error) {
      console.error("Ошибка при проверке специального достижения:", error);
      return 0;
    }
  }
  /**
   * Получает количество дней подряд активности
   */
  static async getStreakDays(userId) {
    try {
      const { ActivityLog } = require("../models");

      // Получаем все дни активности пользователя (исключая LOGIN/LOGOUT)
      // Группируем по дням и считаем только дни с продуктивной активностью
      const activityDays = await ActivityLog.findAll({
        where: {
          user_id: userId,
          action: {
            [Op.notIn]: ["LOGIN", "LOGOUT"], // Исключаем логин/логаут из активности
          },
        },
        attributes: [
          [
            require("sequelize").fn(
              "DATE",
              require("sequelize").col("created_at")
            ),
            "activity_date",
          ],
        ],
        group: [
          require("sequelize").fn(
            "DATE",
            require("sequelize").col("created_at")
          ),
        ],
        order: [
          [
            require("sequelize").fn(
              "DATE",
              require("sequelize").col("created_at")
            ),
            "DESC",
          ],
        ],
        raw: true,
      });

      if (activityDays.length === 0) {
        return 0;
      }

      // Подсчитываем стрик с сегодняшнего дня назад
      let streakCount = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Обнуляем время для корректного сравнения дат

      for (let i = 0; i < activityDays.length; i++) {
        const activityDate = new Date(activityDays[i].activity_date);
        activityDate.setHours(0, 0, 0, 0);

        // Вычисляем ожидаемую дату для текущего дня стрика
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - streakCount);

        // Если дата активности совпадает с ожидаемой датой, увеличиваем стрик
        if (activityDate.getTime() === expectedDate.getTime()) {
          streakCount++;
        } else if (activityDate.getTime() < expectedDate.getTime()) {
          // Если дата активности старше ожидаемой, стрик прерван
          break;
        }
        // Если дата активности новее ожидаемой, пропускаем (может быть несколько записей в один день)
      }

      return streakCount;
    } catch (error) {
      console.error("Ошибка при подсчете стриков:", error);
      return 0;
    }
  }

  /**
   * Проверяет вход до 6:00
   */
  static async checkEarlyBirdLogin(userId) {
    try {
      // Можно проверять логи активности или время последнего входа
      // Для упрощения проверим текущее время
      const now = new Date();
      return now.getHours() < 6 ? 1 : 0;
    } catch (error) {
      console.error("Ошибка при проверке раннего входа:", error);
      return 0;
    }
  }

  /**
   * Проверяет вход после 23:00
   */
  static async checkNightOwlLogin(userId) {
    try {
      const now = new Date();
      return now.getHours() >= 23 ? 1 : 0;
    } catch (error) {
      console.error("Ошибка при проверке позднего входа:", error);
      return 0;
    }
  }
  /**
   * Проверяет вход в выходные
   */
  static async checkWeekendLogin(userId) {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = воскресенье, 6 = суббота
      return dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;
    } catch (error) {
      console.error("Ошибка при проверке входа в выходные:", error);
      return 0;
    }
  }

  /**
   * Получает общее количество очков пользователя
   */
  static async getUserTotalPoints(userId) {
    try {
      const { UserAchievement, Achievement } = require("../models");
      const totalPoints = await UserAchievement.sum("achievement.points", {
        where: {
          user_id: userId,
          is_completed: true,
        },
        include: [
          {
            model: Achievement,
            as: "achievement",
            attributes: [],
          },
        ],
      });
      return totalPoints || 0;
    } catch (error) {
      console.error("Ошибка при получении общих очков:", error);
      return 0;
    }
  }

  /**
   * Получает количество друзей пользователя
   */
  static async getFriendsCount(userId) {
    try {
      const friendsCount = await Friendship.count({
        where: {
          [Op.or]: [{ requester_id: userId }, { addressee_id: userId }],
          status: "accepted",
        },
      });
      return friendsCount;
    } catch (error) {
      console.error("Ошибка при получении количества друзей:", error);
      return 0;
    }
  }

  /**
   * Получает количество полученных запросов на дружбу
   */
  static async getReceivedRequestsCount(userId) {
    try {
      const requestsCount = await Friendship.count({
        where: {
          addressee_id: userId,
          status: ["pending", "accepted"], // Считаем и ожидающие, и принятые
        },
      });
      return requestsCount;
    } catch (error) {
      console.error(
        "Ошибка при получении количества полученных запросов:",
        error
      );
      return 0;
    }
  }

  /**
   * Получает количество отправленных запросов на дружбу
   */
  static async getSentRequestsCount(userId) {
    try {
      const requestsCount = await Friendship.count({
        where: {
          requester_id: userId,
          status: ["pending", "accepted", "declined"], // Считаем все отправленные запросы
        },
      });
      return requestsCount;
    } catch (error) {
      console.error(
        "Ошибка при получении количества отправленных запросов:",
        error
      );
      return 0;
    }
  }

  /**
   * Получает длительность самой долгой дружбы в днях
   */
  static async getLongestFriendshipDuration(userId) {
    try {
      const friendships = await Friendship.findAll({
        where: {
          [Op.or]: [{ requester_id: userId }, { addressee_id: userId }],
          status: "accepted",
        },
        order: [["updated_at", "ASC"]], // Сортируем по дате принятия запроса
      });

      if (friendships.length === 0) {
        return 0;
      }

      // Находим самую давнюю дружбу
      const oldestFriendship = friendships[0];
      const friendshipStartDate = new Date(oldestFriendship.updated_at);
      const now = new Date();

      // Вычисляем разность в днях
      const diffInMs = now - friendshipStartDate;
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      return Math.max(diffInDays, 0);
    } catch (error) {
      console.error("Ошибка при получении длительности дружбы:", error);
      return 0;
    }
  }

  /**
   * Проверяет, изменял ли пользователь настройки приватности
   */
  static async checkPrivacySettingsChanged(userId) {
    try {
      const { ActivityLog } = require("../models");

      // Ищем записи об изменении профиля с деталями о приватности
      const privacyChanges = await ActivityLog.findAll({
        where: {
          user_id: userId,
          action: "PROFILE_UPDATE",
          details: {
            isPrivate: {
              [Op.ne]: null,
            },
          },
        },
        limit: 1,
      });

      return privacyChanges.length > 0 ? 1 : 0;
    } catch (error) {
      console.error(
        "Ошибка при проверке изменения настроек приватности:",
        error
      );
      return 0;
    }
  }

  // ========================================
  // Методы для достижений чата
  // ========================================

  /**
   * Получает количество отправленных сообщений
   */
  static async getMessagesSentCount(userId) {
    try {
      const { Message } = require("../models");

      const count = await Message.count({
        where: {
          sender_id: userId,
        },
      });
      return count;
    } catch (error) {
      console.error(
        "Ошибка при получении количества отправленных сообщений:",
        error
      );
      return 0;
    }
  }

  /**
   * Получает количество полученных сообщений
   */
  static async getMessagesReceivedCount(userId) {
    try {
      const { Message } = require("../models");

      const count = await Message.count({
        where: {
          receiver_id: userId,
        },
      });
      return count;
    } catch (error) {
      console.error(
        "Ошибка при получении количества полученных сообщений:",
        error
      );
      return 0;
    }
  }

  /**
   * Получает количество уникальных собеседников
   */
  static async getUniqueConversationsCount(userId) {
    try {
      const { Message } = require("../models");

      // Получаем уникальных получателей сообщений от пользователя
      const sentToUsers = await Message.findAll({
        where: { sender_id: userId },
        attributes: [
          [
            Message.sequelize.fn(
              "DISTINCT",
              Message.sequelize.col("receiver_id")
            ),
            "receiver_id",
          ],
        ],
        raw: true,
      });

      // Получаем уникальных отправителей сообщений пользователю
      const receivedFromUsers = await Message.findAll({
        where: { receiver_id: userId },
        attributes: [
          [
            Message.sequelize.fn(
              "DISTINCT",
              Message.sequelize.col("sender_id")
            ),
            "sender_id",
          ],
        ],
        raw: true,
      });

      // Объединяем и убираем дубликаты
      const uniqueUsers = new Set([
        ...sentToUsers.map((row) => row.receiver_id),
        ...receivedFromUsers.map((row) => row.sender_id),
      ]);

      return uniqueUsers.size;
    } catch (error) {
      console.error(
        "Ошибка при получении количества уникальных собеседников:",
        error
      );
      return 0;
    }
  }

  /**
   * Получает количество быстрых ответов (в течение 1 минуты)
   */
  static async getQuickRepliesCount(userId) {
    try {
      const { Message } = require("../models");

      // Находим сообщения, отправленные пользователем
      const userMessages = await Message.findAll({
        where: { sender_id: userId },
        order: [["created_at", "ASC"]],
        raw: true,
      });

      // Находим предыдущие сообщения от других пользователей
      const receivedMessages = await Message.findAll({
        where: { receiver_id: userId },
        order: [["created_at", "ASC"]],
        raw: true,
      });

      let quickRepliesCount = 0;

      for (const sentMessage of userMessages) {
        // Ищем последнее полученное сообщение перед отправкой
        const lastReceivedMessage = receivedMessages
          .filter(
            (msg) =>
              new Date(msg.created_at) < new Date(sentMessage.created_at) &&
              msg.sender_id === sentMessage.receiver_id
          )
          .pop();

        if (lastReceivedMessage) {
          const timeDiff =
            new Date(sentMessage.created_at) -
            new Date(lastReceivedMessage.created_at);
          const minutesDiff = timeDiff / (1000 * 60);

          if (minutesDiff <= 1) {
            quickRepliesCount++;
          }
        }
      }

      return quickRepliesCount;
    } catch (error) {
      console.error("Ошибка при получении количества быстрых ответов:", error);
      return 0;
    }
  }

  /**
   * Получает количество ночных сообщений (22:00 - 6:00)
   */
  static async getNightMessagesCount(userId) {
    try {
      const { Message } = require("../models");

      const nightMessages = await Message.findAll({
        where: {
          sender_id: userId,
          [Op.or]: [
            Message.sequelize.where(
              Message.sequelize.fn(
                "EXTRACT",
                Message.sequelize.literal("HOUR FROM created_at")
              ),
              { [Op.gte]: 22 }
            ),
            Message.sequelize.where(
              Message.sequelize.fn(
                "EXTRACT",
                Message.sequelize.literal("HOUR FROM created_at")
              ),
              { [Op.lt]: 6 }
            ),
          ],
        },
      });

      return nightMessages.length;
    } catch (error) {
      console.error("Ошибка при получении количества ночных сообщений:", error);
      return 0;
    }
  }

  /**
   * Получает количество сообщений с эмодзи
   */
  static async getEmojiMessagesCount(userId) {
    try {
      const { Message } = require("../models");

      // Регулярное выражение для поиска эмодзи
      const emojiRegex =
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;

      const allMessages = await Message.findAll({
        where: { sender_id: userId },
        attributes: ["content"],
        raw: true,
      });

      let emojiMessagesCount = 0;
      for (const message of allMessages) {
        if (emojiRegex.test(message.content)) {
          emojiMessagesCount++;
        }
      }

      return emojiMessagesCount;
    } catch (error) {
      console.error(
        "Ошибка при получении количества сообщений с эмодзи:",
        error
      );
      return 0;
    }
  }

  /**
   * Получает количество длинных сообщений (больше 500 символов)
   */
  static async getLongMessagesCount(userId) {
    try {
      const { Message } = require("../models");

      const count = await Message.count({
        where: {
          sender_id: userId,
          [Op.and]: [
            Message.sequelize.where(
              Message.sequelize.fn("LENGTH", Message.sequelize.col("content")),
              { [Op.gt]: 500 }
            ),
          ],
        },
      });

      return count;
    } catch (error) {
      console.error(
        "Ошибка при получении количества длинных сообщений:",
        error
      );
      return 0;
    }
  }

  /**
   * Получает максимальное количество сообщений в одном диалоге
   */
  static async getConversationMarathonCount(userId) {
    try {
      const { Message } = require("../models");

      // Получаем все диалоги пользователя
      const conversations = await Message.findAll({
        where: {
          [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
        },
        attributes: [
          [
            Message.sequelize.fn(
              "LEAST",
              Message.sequelize.col("sender_id"),
              Message.sequelize.col("receiver_id")
            ),
            "user1",
          ],
          [
            Message.sequelize.fn(
              "GREATEST",
              Message.sequelize.col("sender_id"),
              Message.sequelize.col("receiver_id")
            ),
            "user2",
          ],
          [
            Message.sequelize.fn("COUNT", Message.sequelize.col("id")),
            "message_count",
          ],
        ],
        group: [
          Message.sequelize.fn(
            "LEAST",
            Message.sequelize.col("sender_id"),
            Message.sequelize.col("receiver_id")
          ),
          Message.sequelize.fn(
            "GREATEST",
            Message.sequelize.col("sender_id"),
            Message.sequelize.col("receiver_id")
          ),
        ],
        order: [
          [Message.sequelize.fn("COUNT", Message.sequelize.col("id")), "DESC"],
        ],
        limit: 1,
        raw: true,
      });

      return conversations.length > 0
        ? parseInt(conversations[0].message_count)
        : 0;
    } catch (error) {
      console.error(
        "Ошибка при получении максимального количества сообщений в диалоге:",
        error
      );
      return 0;
    }
  }

  /**
   * Получает количество отредактированных сообщений
   */
  static async getEditedMessagesCount(userId) {
    try {
      const { Message } = require("../models");

      const count = await Message.count({
        where: {
          sender_id: userId,
          is_edited: true,
        },
      });

      return count;
    } catch (error) {
      console.error(
        "Ошибка при получении количества отредактированных сообщений:",
        error
      );
      return 0;
    }
  }
}

module.exports = AchievementManager;
