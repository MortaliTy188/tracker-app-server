const { Topic, Skill } = require("../models");

/**
 * Определяет уровень пользователя на основе количества завершенных топиков
 */
function calculateUserLevel(completedTopicsCount) {
  if (completedTopicsCount >= 100) {
    return "эксперт";
  } else if (completedTopicsCount >= 50) {
    return "продвинутый";
  } else if (completedTopicsCount >= 20) {
    return "продвинутый";
  } else if (completedTopicsCount >= 5) {
    return "базовый";
  } else {
    return "новичок";
  }
}

/**
 * Подсчитывает количество завершенных топиков для пользователя
 * @param {number} userId - ID пользователя
 * @returns {Promise<number>} Количество завершенных топиков
 */
async function getCompletedTopicsCount(userId) {
  try {
    const completedTopics = await Topic.count({
      where: {
        progress: 100,
      },
      include: [
        {
          model: Skill,
          as: "skill",
          where: { user_id: userId },
          attributes: [],
        },
      ],
    });

    return completedTopics;
  } catch (error) {
    console.error("Ошибка при подсчете завершенных топиков:", error);
    return 0;
  }
}

/**
 * Обновляет уровень пользователя на основе завершенных топиков
 * @param {number} userId - ID пользователя
 * @returns {Promise<{level: string, completedTopics: number}>} Новый уровень и количество завершенных топиков
 */
async function updateUserLevel(userId) {
  try {
    const { User } = require("../models");

    const completedTopicsCount = await getCompletedTopicsCount(userId);
    const newLevel = calculateUserLevel(completedTopicsCount);

    // Получаем старый уровень для сравнения
    const user = await User.findByPk(userId, { attributes: ["level"] });
    const oldLevel = user ? user.level : null;

    await User.update({ level: newLevel }, { where: { id: userId } });

    // Проверяем достижения за уровень, если уровень изменился
    if (oldLevel !== newLevel) {
      try {
        const AchievementManager = require("../utils/achievementManager");
        await AchievementManager.checkAchievements(userId, "level_changed", {
          old_level: oldLevel,
          new_level: newLevel,
          completed_topics: completedTopicsCount,
        });
      } catch (achievementError) {
        console.error(
          "Ошибка при проверке достижений за уровень:",
          achievementError
        );
        // Не прерываем основной процесс при ошибке достижений
      }
    }

    return {
      level: newLevel,
      completedTopics: completedTopicsCount,
    };
  } catch (error) {
    console.error("Ошибка при обновлении уровня пользователя:", error);
    throw error;
  }
}

/**
 * Получает статистику прогресса пользователя
 * @param {number} userId - ID пользователя
 * @returns {Promise<Object>} Статистика пользователя
 */
async function getUserProgressStats(userId) {
  try {
    const completedTopicsCount = await getCompletedTopicsCount(userId);
    const level = calculateUserLevel(completedTopicsCount);

    // Определяем следующий уровень и количество топиков до него
    let nextLevel = null;
    let topicsToNextLevel = 0;

    if (completedTopicsCount < 5) {
      nextLevel = "Средний";
      topicsToNextLevel = 5 - completedTopicsCount;
    } else if (completedTopicsCount < 20) {
      nextLevel = "Продвинутый";
      topicsToNextLevel = 20 - completedTopicsCount;
    } else if (completedTopicsCount < 50) {
      nextLevel = "Профессионал";
      topicsToNextLevel = 50 - completedTopicsCount;
    } else if (completedTopicsCount < 100) {
      nextLevel = "Эксперт";
      topicsToNextLevel = 100 - completedTopicsCount;
    }

    return {
      currentLevel: level,
      completedTopics: completedTopicsCount,
      nextLevel,
      topicsToNextLevel,
    };
  } catch (error) {
    console.error("Ошибка при получении статистики прогресса:", error);
    throw error;
  }
}

module.exports = {
  calculateUserLevel,
  getCompletedTopicsCount,
  updateUserLevel,
  getUserProgressStats,
};
