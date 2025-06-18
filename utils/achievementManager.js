const {
  Achievement,
  UserAchievement,
  User,
  Topic,
  Skill,
  Note,
  SkillCategory,
} = require("../models");
const { Op } = require("sequelize");

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
      });

      // Если достижение только что получено, выводим уведомление
      if (shouldComplete && !wasCompleted) {
        console.log(
          `🎉 Пользователь ${userId} получил достижение: ${achievement.name}!`
        );
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
        case "Первопроходец":
          // Проверяем, входит ли пользователь в первые 100
          // Если ID пользователя <= 100, то он точно один из первых 100
          return userId <= 100 ? 100 : 0;

        // Достижения по опыту
        case "Студент":
          const totalPoints1 = await this.getUserTotalPoints(userId);
          return totalPoints1 >= 100 ? 1 : 0;

        case "Бакалавр":
          const totalPoints2 = await this.getUserTotalPoints(userId);
          return totalPoints2 >= 500 ? 1 : 0;

        case "Магистр":
          const totalPoints3 = await this.getUserTotalPoints(userId);
          return totalPoints3 >= 1000 ? 1 : 0;

        case "Доктор наук":
          const totalPoints4 = await this.getUserTotalPoints(userId);
          return totalPoints4 >= 2500 ? 1 : 0;

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
      // Здесь должна быть логика подсчета стриков
      // Пока возвращаем 0, но нужно реализовать
      // подсчет последовательных дней активности
      return 0;
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
}

module.exports = AchievementManager;
