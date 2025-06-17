const { Achievement, UserAchievement } = require("../models");
const AchievementManager = require("../utils/achievementManager");

class AchievementController {
  // Получить все достижения
  async getAllAchievements(req, res) {
    try {
      const achievements = await Achievement.findAll({
        where: { is_active: true },
        order: [
          ["rarity", "ASC"],
          ["points", "ASC"],
          ["name", "ASC"],
        ],
      });

      res.json({
        success: true,
        message: "Список всех достижений получен",
        data: { achievements },
      });
    } catch (error) {
      console.error("Ошибка получения списка достижений:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить достижения пользователя
  async getUserAchievements(req, res) {
    try {
      const userId = req.user.id;
      const { include_progress } = req.query;

      const userAchievements = await AchievementManager.getUserAchievements(
        userId,
        include_progress === "true"
      );

      res.json({
        success: true,
        message: "Достижения пользователя получены",
        data: { achievements: userAchievements },
      });
    } catch (error) {
      console.error("Ошибка получения достижений пользователя:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить статистику достижений пользователя
  async getUserAchievementStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await AchievementManager.getUserAchievementStats(userId);

      res.json({
        success: true,
        message: "Статистика достижений получена",
        data: { stats },
      });
    } catch (error) {
      console.error("Ошибка получения статистики достижений:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить прогресс по всем достижениям для пользователя
  async getUserProgress(req, res) {
    try {
      const userId = req.user.id;

      // Получаем все активные достижения
      const allAchievements = await Achievement.findAll({
        where: { is_active: true },
        order: [
          ["rarity", "ASC"],
          ["points", "ASC"],
        ],
      });

      // Получаем прогресс пользователя по каждому достижению
      const progressData = [];

      for (const achievement of allAchievements) {
        let userAchievement = await UserAchievement.findOne({
          where: {
            user_id: userId,
            achievement_id: achievement.id,
          },
        });

        if (!userAchievement) {
          // Создаем запись если её нет
          userAchievement = await UserAchievement.create({
            user_id: userId,
            achievement_id: achievement.id,
            progress: 0,
            is_completed: false,
          });
        }

        // Обновляем прогресс
        const currentProgress = await AchievementManager.calculateProgress(
          userId,
          achievement
        );
        const shouldComplete = currentProgress >= achievement.condition_value;

        if (
          userAchievement.progress !== currentProgress ||
          userAchievement.is_completed !== shouldComplete
        ) {
          await userAchievement.update({
            progress: currentProgress,
            is_completed: shouldComplete,
            completed_at:
              shouldComplete && !userAchievement.is_completed
                ? new Date()
                : userAchievement.completed_at,
          });
        }

        progressData.push({
          achievement: achievement,
          progress: currentProgress,
          max_progress: achievement.condition_value,
          percentage: Math.min(
            Math.round((currentProgress / achievement.condition_value) * 100),
            100
          ),
          is_completed: shouldComplete,
          completed_at: userAchievement.completed_at,
        });
      }

      res.json({
        success: true,
        message: "Прогресс по достижениям получен",
        data: { progress: progressData },
      });
    } catch (error) {
      console.error("Ошибка получения прогресса по достижениям:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Принудительно проверить все достижения пользователя
  async recheckAchievements(req, res) {
    try {
      const userId = req.user.id;

      // Запускаем проверку всех достижений
      await AchievementManager.checkAchievements(userId, "manual_check");

      // Получаем обновленную статистику
      const stats = await AchievementManager.getUserAchievementStats(userId);

      res.json({
        success: true,
        message: "Проверка достижений завершена",
        data: { stats },
      });
    } catch (error) {
      console.error("Ошибка при проверке достижений:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить топ пользователей по очкам достижений
  async getLeaderboard(req, res) {
    try {
      const { limit = 10 } = req.query;

      const leaderboard = await UserAchievement.findAll({
        attributes: [
          "user_id",
          [
            require("sequelize").fn(
              "SUM",
              require("sequelize").col("achievement.points")
            ),
            "total_points",
          ],
          [
            require("sequelize").fn(
              "COUNT",
              require("sequelize").col("UserAchievement.id")
            ),
            "achievements_count",
          ],
        ],
        where: { is_completed: true },
        include: [
          {
            model: Achievement,
            as: "achievement",
            attributes: [],
          },
          {
            model: require("../models").User,
            as: "user",
            attributes: ["id", "name", "level"],
          },
        ],
        group: ["user_id", "user.id", "user.name", "user.level"],
        order: [
          [
            require("sequelize").fn(
              "SUM",
              require("sequelize").col("achievement.points")
            ),
            "DESC",
          ],
        ],
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        message: "Таблица лидеров получена",
        data: { leaderboard },
      });
    } catch (error) {
      console.error("Ошибка получения таблицы лидеров:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить недавние достижения пользователя
  async getRecentAchievements(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 5 } = req.query;

      const recentAchievements = await UserAchievement.findAll({
        where: {
          user_id: userId,
          is_completed: true,
        },
        include: [
          {
            model: Achievement,
            as: "achievement",
          },
        ],
        order: [["completed_at", "DESC"]],
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        message: "Недавние достижения получены",
        data: { achievements: recentAchievements },
      });
    } catch (error) {
      console.error("Ошибка получения недавних достижений:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }
}

module.exports = new AchievementController();
