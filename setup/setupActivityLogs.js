const { sequelize } = require("../models");

/**
 * Создает таблицу activity_logs если она не существует
 * и добавляет индексы для оптимизации запросов
 */
async function createActivityLogTable() {
  try {
    console.log("🔄 Создание таблицы activity_logs...");

    // SQL для создания ENUM типа для действий
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_activity_logs_action') THEN
          CREATE TYPE enum_activity_logs_action AS ENUM (
            'LOGIN',
            'LOGOUT', 
            'PROFILE_UPDATE',
            'AVATAR_CHANGE',
            'EMAIL_CHANGE',
            'USERNAME_CHANGE',
            'TOPIC_CREATED',
            'TOPIC_COMPLETED',
            'TOPIC_UPDATED',
            'NOTE_CREATED',
            'NOTE_UPDATED',
            'NOTE_DELETED',
            'PASSWORD_CHANGE',
            'SKILL_CREATED',
            'SKILL_UPDATED',
            'SKILL_DELETED',
            'ACHIEVEMENT_EARNED',
            'FEEDBACK_SUBMITTED',
            'FRIEND_REQUEST_SENT',
            'FRIEND_REQUEST_ACCEPTED',
            'FRIEND_REQUEST_DECLINED',
            'FRIEND_REMOVED'
          );
        END IF;
      END
      $$;
    `);

    // SQL для создания таблицы activity_logs
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "activity_logs" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "action" enum_activity_logs_action NOT NULL,
        "details" JSONB DEFAULT '{}',
        "ip_address" VARCHAR(45),
        "user_agent" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Создаем индексы для оптимизации
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_activity_logs_user_id_created_at" 
      ON "activity_logs" ("user_id", "created_at" DESC);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_activity_logs_action_created_at" 
      ON "activity_logs" ("action", "created_at" DESC);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_activity_logs_created_at" 
      ON "activity_logs" ("created_at" DESC);
    `);

    console.log("✅ Таблица activity_logs создана успешно с индексами.");
  } catch (error) {
    console.error("❌ Ошибка создания таблицы activity_logs:", error);
    throw error;
  }
}

/**
 * Очистка старых логов активности (старше 90 дней)
 */
async function cleanupOldActivityLogs(daysToKeep = 90) {
  try {
    console.log(`🧹 Очистка логов активности старше ${daysToKeep} дней...`);

    const result = await sequelize.query(`
      DELETE FROM "activity_logs" 
      WHERE "created_at" < NOW() - INTERVAL '${daysToKeep} days'
    `);

    console.log(
      `✅ Удалено ${result[1].rowCount || 0} старых записей активности.`
    );
  } catch (error) {
    console.error("❌ Ошибка очистки старых логов:", error);
  }
}

// Запуск если файл вызывается напрямую
if (require.main === module) {
  (async () => {
    try {
      await createActivityLogTable();

      // Опционально очистим старые логи
      if (process.argv.includes("--cleanup")) {
        const days = process.argv.find((arg) => arg.startsWith("--days="));
        const daysToKeep = days ? parseInt(days.split("=")[1]) : 90;
        await cleanupOldActivityLogs(daysToKeep);
      }

      console.log("🎉 Настройка activity_logs завершена");
      process.exit(0);
    } catch (error) {
      console.error("❌ Ошибка:", error);
      process.exit(1);
    }
  })();
}

module.exports = {
  createActivityLogTable,
  cleanupOldActivityLogs,
};
