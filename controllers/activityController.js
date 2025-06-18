const ActivityLogger = require("../utils/activityLogger");
const { ActivityLog, User } = require("../models");
const { Op } = require("sequelize");

class ActivityController {
  /**
   * Получить активность текущего пользователя
   */
  static async getMyActivity(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, action, startDate, endDate } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
      };

      if (action) options.action = action;
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      const result = await ActivityLogger.getUserActivity(userId, options);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error getting user activity:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка при получении активности пользователя",
        error: error.message,
      });
    }
  }

  /**
   * Получить активность конкретного пользователя (для админов)
   */
  static async getUserActivity(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, action, startDate, endDate } = req.query;

      // Проверка прав доступа
      // if (!req.user.isAdmin && req.user.id !== parseInt(userId)) {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'Недостаточно прав для просмотра активности другого пользователя'
      //   });
      // }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
      };

      if (action) options.action = action;
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      const result = await ActivityLogger.getUserActivity(
        parseInt(userId),
        options
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error getting user activity:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка при получении активности пользователя",
        error: error.message,
      });
    }
  }

  /**
   * Получить статистику активности пользователя
   */
  static async getActivityStats(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      const options = {};
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      const stats = await ActivityLogger.getActivityStats(userId, options);

      // Преобразуем результат в более удобный формат
      const formattedStats = stats.map((stat) => ({
        action: stat.action,
        count: parseInt(stat.dataValues.count),
      }));

      res.json({
        success: true,
        data: formattedStats,
      });
    } catch (error) {
      console.error("Error getting activity stats:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка при получении статистики активности",
        error: error.message,
      });
    }
  }

  /**
   * Получить общую статистику по всем пользователям (для админов)
   */
  static async getGlobalActivityStats(req, res) {
    try {
      const { startDate, endDate, action } = req.query;

      const where = {};

      if (action) where.action = action;
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[Op.gte] = new Date(startDate);
        if (endDate) where.created_at[Op.lte] = new Date(endDate);
      }

      const { sequelize } = require("../models");

      // Статистика по действиям
      const actionStats = await ActivityLog.findAll({
        attributes: [
          "action",
          [sequelize.fn("COUNT", sequelize.col("action")), "count"],
        ],
        where,
        group: ["action"],
        order: [[sequelize.fn("COUNT", sequelize.col("action")), "DESC"]],
      });

      // Статистика по пользователям
      const userStats = await ActivityLog.findAll({
        attributes: [
          "user_id",
          [sequelize.fn("COUNT", sequelize.col("user_id")), "count"],
        ],
        where,
        group: ["user_id"],
        order: [[sequelize.fn("COUNT", sequelize.col("user_id")), "DESC"]],
        limit: 10,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["username", "email"],
          },
        ],
      });

      // Активность по дням (последние 7 дней)
      const dailyStats = await ActivityLog.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("created_at")), "date"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        where: {
          ...where,
          created_at: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        group: [sequelize.fn("DATE", sequelize.col("created_at"))],
        order: [[sequelize.fn("DATE", sequelize.col("created_at")), "ASC"]],
      });

      res.json({
        success: true,
        data: {
          actionStats: actionStats.map((stat) => ({
            action: stat.action,
            count: parseInt(stat.dataValues.count),
          })),
          topUsers: userStats.map((stat) => ({
            userId: stat.user_id,
            username: stat.user.username,
            email: stat.user.email,
            activityCount: parseInt(stat.dataValues.count),
          })),
          dailyActivity: dailyStats.map((stat) => ({
            date: stat.dataValues.date,
            count: parseInt(stat.dataValues.count),
          })),
        },
      });
    } catch (error) {
      console.error("Error getting global activity stats:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка при получении глобальной статистики активности",
        error: error.message,
      });
    }
  }

  /**
   * Получить детальную информацию о записи активности
   */
  static async getActivityDetails(req, res) {
    try {
      const { activityId } = req.params;

      const activity = await ActivityLog.findByPk(activityId, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "username", "email"],
          },
        ],
      });

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: "Запись активности не найдена",
        });
      }

      // Проверка прав доступа
      if (activity.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Недостаточно прав для просмотра этой записи",
        });
      }

      res.json({
        success: true,
        data: activity,
      });
    } catch (error) {
      console.error("Error getting activity details:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка при получении деталей активности",
        error: error.message,
      });
    }
  }

  /**
   * Удалить старые записи активности (очистка логов)
   */
  static async cleanupOldLogs(req, res) {
    try {
      const { daysToKeep = 90 } = req.body;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysToKeep));

      const deletedCount = await ActivityLog.destroy({
        where: {
          created_at: {
            [Op.lt]: cutoffDate,
          },
        },
      });

      res.json({
        success: true,
        message: `Удалено ${deletedCount} старых записей активности`,
        data: {
          deletedCount,
          cutoffDate,
        },
      });
    } catch (error) {
      console.error("Error cleaning up old logs:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка при очистке старых логов",
        error: error.message,
      });
    }
  }
}

module.exports = ActivityController;
