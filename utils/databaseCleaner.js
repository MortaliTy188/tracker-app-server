const { sequelize } = require("../models");

/**
 * Утилита для полной очистки базы данных
 */
class DatabaseCleaner {
  /**
   * Полная очистка всех таблиц в правильном порядке
   */
  static async clearAllTables() {
    try {
      console.log("🗑️  Очистка базы данных...");

      // Очищаем все таблицы в правильном порядке (из-за FK constraints)
      await sequelize.query('DELETE FROM "user_achievements"', {
        type: sequelize.QueryTypes.DELETE,
      });
      await sequelize.query('DELETE FROM "Note"', {
        type: sequelize.QueryTypes.DELETE,
      });
      await sequelize.query('DELETE FROM "topics"', {
        type: sequelize.QueryTypes.DELETE,
      });
      await sequelize.query('DELETE FROM "skills"', {
        type: sequelize.QueryTypes.DELETE,
      });
      await sequelize.query('DELETE FROM "users"', {
        type: sequelize.QueryTypes.DELETE,
      });
      await sequelize.query('DELETE FROM "skill_category"', {
        type: sequelize.QueryTypes.DELETE,
      });
      await sequelize.query('DELETE FROM "topic_status"', {
        type: sequelize.QueryTypes.DELETE,
      });
      await sequelize.query('DELETE FROM "Feedback"', {
        type: sequelize.QueryTypes.DELETE,
      });
      await sequelize.query('DELETE FROM "achievements"', {
        type: sequelize.QueryTypes.DELETE,
      });

      console.log("✅ Все таблицы очищены");
    } catch (error) {
      console.error("❌ Ошибка очистки базы данных:", error.message);
      throw error;
    }
  }

  /**
   * Сброс автоинкрементов для PostgreSQL
   */
  static async resetSequences() {
    try {
      console.log("🔄 Сброс автоинкрементов...");

      // Сбрасываем автоинкременты для PostgreSQL
      await sequelize.query("ALTER SEQUENCE users_id_seq RESTART WITH 1", {
        type: sequelize.QueryTypes.RAW,
      });
      await sequelize.query("ALTER SEQUENCE skills_id_seq RESTART WITH 1", {
        type: sequelize.QueryTypes.RAW,
      });
      await sequelize.query(
        "ALTER SEQUENCE skill_category_id_seq RESTART WITH 1",
        { type: sequelize.QueryTypes.RAW }
      );
      await sequelize.query("ALTER SEQUENCE topics_id_seq RESTART WITH 1", {
        type: sequelize.QueryTypes.RAW,
      });
      await sequelize.query(
        "ALTER SEQUENCE topic_status_id_seq RESTART WITH 1",
        { type: sequelize.QueryTypes.RAW }
      );
      await sequelize.query('ALTER SEQUENCE "Note_id_seq" RESTART WITH 1', {
        type: sequelize.QueryTypes.RAW,
      });
      await sequelize.query('ALTER SEQUENCE "Feedback_id_seq" RESTART WITH 1', {
        type: sequelize.QueryTypes.RAW,
      });
      await sequelize.query(
        'ALTER SEQUENCE "achievements_id_seq" RESTART WITH 1',
        {
          type: sequelize.QueryTypes.RAW,
        }
      );
      await sequelize.query(
        'ALTER SEQUENCE "user_achievements_id_seq" RESTART WITH 1',
        {
          type: sequelize.QueryTypes.RAW,
        }
      );

      console.log("✅ Автоинкременты сброшены");
    } catch (error) {
      console.error("❌ Ошибка сброса автоинкрементов:", error.message);
      // Не прерываем выполнение, так как это не критично
    }
  }

  /**
   * Полная очистка базы данных с сбросом автоинкрементов
   */
  static async fullClean() {
    await this.clearAllTables();
    await this.resetSequences();
  }

  /**
   * Очистка только данных, связанных с достижениями
   */
  static async clearAchievementData() {
    try {
      console.log("🏆 Очистка данных достижений...");

      await sequelize.query('DELETE FROM "user_achievements"', {
        type: sequelize.QueryTypes.DELETE,
      });
      await sequelize.query('DELETE FROM "achievements"', {
        type: sequelize.QueryTypes.DELETE,
      });

      // Сброс автоинкрементов для таблиц достижений
      await sequelize.query(
        'ALTER SEQUENCE "achievements_id_seq" RESTART WITH 1',
        {
          type: sequelize.QueryTypes.RAW,
        }
      );
      await sequelize.query(
        'ALTER SEQUENCE "user_achievements_id_seq" RESTART WITH 1',
        {
          type: sequelize.QueryTypes.RAW,
        }
      );

      console.log("✅ Данные достижений очищены");
    } catch (error) {
      console.error("❌ Ошибка очистки данных достижений:", error.message);
      throw error;
    }
  }
}

module.exports = DatabaseCleaner;
