const { ActivityLog } = require("../models");
const { Op } = require("sequelize");

class ActivityLogger {
  /**
   * Основной метод для логирования активности
   * @param {number} userId - ID пользователя
   * @param {string} action - Тип действия
   * @param {object} details - Дополнительная информация
   * @param {object} req - Объект запроса Express
   */
  static async log(userId, action, details = {}, req = null) {
    try {
      const logData = {
        user_id: userId,
        action,
        details,
      };

      if (req) {
        logData.ip_address =
          req.ip ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          (req.connection?.socket ? req.connection.socket.remoteAddress : null);
        logData.user_agent = req.get("User-Agent");
      }

      const activityLog = await ActivityLog.create(logData);

      console.log(`Activity logged: ${action} for user ${userId}`);
      return activityLog;
    } catch (error) {
      console.error("Error logging activity:", error);
      throw error;
    }
  } // Методы для аутентификации
  static async logLogin(userId, req) {
    return this.log(userId, "LOGIN", { loginTime: new Date() }, req);
  }

  static async logLogout(userId, req) {
    return this.log(userId, "LOGOUT", { logoutTime: new Date() }, req);
  } // Методы для профиля пользователя
  static async logProfileUpdate(
    userId,
    changedFields,
    oldValues,
    newValues,
    req
  ) {
    return this.log(
      userId,
      "PROFILE_UPDATE",
      {
        changedFields,
        oldValues,
        newValues,
      },
      req
    );
  }

  static async logAvatarChange(userId, oldAvatar, newAvatar, req) {
    return this.log(
      userId,
      "AVATAR_CHANGE",
      {
        oldAvatar,
        newAvatar,
      },
      req
    );
  }

  static async logEmailChange(userId, oldEmail, newEmail, req) {
    return this.log(
      userId,
      "EMAIL_CHANGE",
      {
        oldEmail,
        newEmail,
      },
      req
    );
  }

  static async logUsernameChange(userId, oldUsername, newUsername, req) {
    return this.log(
      userId,
      "USERNAME_CHANGE",
      {
        oldUsername,
        newUsername,
      },
      req
    );
  }

  static async logPasswordChange(userId, req) {
    return this.log(
      userId,
      "PASSWORD_CHANGE",
      {
        changeTime: new Date(),
      },
      req
    );
  } // Методы для навыков
  static async logSkillCreated(userId, skillData, req) {
    return this.log(
      userId,
      "SKILL_CREATED",
      {
        skillId: skillData.id,
        skillTitle: skillData.title,
        categoryId: skillData.category_id,
      },
      req
    );
  }

  static async logSkillUpdated(userId, skillData, changedFields, req) {
    return this.log(
      userId,
      "SKILL_UPDATED",
      {
        skillId: skillData.id,
        skillTitle: skillData.title,
        changedFields,
      },
      req
    );
  }

  static async logSkillDeleted(userId, skillData, req) {
    return this.log(
      userId,
      "SKILL_DELETED",
      {
        skillId: skillData.id,
        skillTitle: skillData.title,
      },
      req
    );
  }

  // Методы для топиков
  static async logTopicCreated(userId, topicData, req) {
    return this.log(
      userId,
      "TOPIC_CREATED",
      {
        topicId: topicData.id,
        topicTitle: topicData.name, // Исправлено: используем name вместо title
        skillId: topicData.skill_id,
        skillName: topicData.skill?.name || null, // Добавляем название навыка
        description: topicData.description,
        progress: topicData.progress,
        estimatedHours: topicData.estimated_hours,
      },
      req
    );
  }
  static async logTopicCompleted(userId, topicData, req) {
    return this.log(
      userId,
      "TOPIC_COMPLETED",
      {
        topicId: topicData.id,
        topicTitle: topicData.name, // Исправлено: используем name вместо title
        skillId: topicData.skill_id,
        skillName: topicData.skill?.name || null, // Добавляем название навыка
        progress: topicData.progress,
        completedAt: new Date(),
      },
      req
    );
  }
  static async logTopicUpdated(userId, topicData, changedFields, req) {
    return this.log(
      userId,
      "TOPIC_UPDATED",
      {
        topicId: topicData.id,
        topicTitle: topicData.name, // Исправлено: используем name вместо title
        skillId: topicData.skill_id,
        skillName: topicData.skill?.name || null, // Добавляем название навыка
        changedFields,
      },
      req
    );
  }

  // Методы для заметок
  static async logNoteCreated(userId, noteData, req) {
    return this.log(
      userId,
      "NOTE_CREATED",
      {
        noteId: noteData.id,
        noteTitle: noteData.title || "Untitled",
        topicId: noteData.topic_id,
      },
      req
    );
  }

  static async logNoteUpdated(userId, noteData, changedFields, req) {
    return this.log(
      userId,
      "NOTE_UPDATED",
      {
        noteId: noteData.id,
        noteTitle: noteData.title || "Untitled",
        changedFields,
      },
      req
    );
  }

  static async logNoteDeleted(userId, noteData, req) {
    return this.log(
      userId,
      "NOTE_DELETED",
      {
        noteId: noteData.id,
        noteTitle: noteData.title || "Untitled",
        topicId: noteData.topic_id,
      },
      req
    );
  }

  // Методы для достижений
  static async logAchievementEarned(userId, achievementData, req) {
    return this.log(
      userId,
      "ACHIEVEMENT_EARNED",
      {
        achievementId: achievementData.id,
        achievementTitle: achievementData.title,
        achievementType: achievementData.type,
        earnedAt: new Date(),
      },
      req
    );
  }

  // Методы для обратной связи
  static async logFeedbackSubmitted(userId, feedbackData, req) {
    return this.log(
      userId,
      "FEEDBACK_SUBMITTED",
      {
        feedbackId: feedbackData.id,
        rating: feedbackData.rating,
        submittedAt: new Date(),
      },
      req
    );
  }

  /**
   * Получить историю активности пользователя
   * @param {number} userId - ID пользователя
   * @param {object} options - Опции фильтрации
   */
  static async getUserActivity(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      action = null,
      startDate = null,
      endDate = null,
    } = options;

    const where = { user_id: userId };

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: require("../models").User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    return {
      logs: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      hasNext: page * limit < count,
      hasPrev: page > 1,
    };
  }

  /**
   * Получить статистику активности пользователя
   * @param {number} userId - ID пользователя
   * @param {object} options - Опции фильтрации
   */
  static async getActivityStats(userId, options = {}) {
    const { startDate, endDate } = options;
    const where = { user_id: userId };

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }

    const { sequelize } = require("../models");

    const stats = await ActivityLog.findAll({
      attributes: [
        "action",
        [sequelize.fn("COUNT", sequelize.col("action")), "count"],
      ],
      where,
      group: ["action"],
      order: [[sequelize.fn("COUNT", sequelize.col("action")), "DESC"]],
    });

    return stats;
  }
}

module.exports = ActivityLogger;
