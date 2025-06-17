// Скрипт для безопасного обновления базы данных
const { sequelize, User } = require("./models");

async function migrateDatabase() {
  try {
    console.log("🔄 Начинаем миграцию базы данных...");

    // Проверяем, есть ли поле registrationDate
    try {
      await sequelize.query('SELECT "registrationDate" FROM "users" LIMIT 1');
      console.log("✅ Поле registrationDate уже существует");
    } catch (error) {
      console.log("➕ Добавляем поле registrationDate...");

      // Сначала добавляем поле с возможностью NULL
      await sequelize.query(
        'ALTER TABLE "users" ADD COLUMN "registrationDate" TIMESTAMP WITH TIME ZONE;'
      );

      // Обновляем существующих пользователей, устанавливая текущую дату
      await sequelize.query(
        'UPDATE "users" SET "registrationDate" = NOW() WHERE "registrationDate" IS NULL;'
      );

      // Теперь делаем поле NOT NULL
      await sequelize.query(
        'ALTER TABLE "users" ALTER COLUMN "registrationDate" SET NOT NULL;'
      );

      console.log("✅ Поле registrationDate добавлено и заполнено");
    }

    // Проверяем поле level
    try {
      await sequelize.query('SELECT "level" FROM "users" LIMIT 1');
      console.log("✅ Поле level уже существует");
    } catch (error) {
      console.log("➕ Добавляем поле level...");

      // Создаём enum если его нет
      await sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_users_level AS ENUM('новичок', 'базовый', 'продвинутый', 'эксперт');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Добавляем поле level
      await sequelize.query(
        'ALTER TABLE "users" ADD COLUMN "level" enum_users_level NOT NULL DEFAULT \'новичок\';'
      );

      console.log("✅ Поле level добавлено");
    }

    // Синхронизируем модели для создания новых таблиц (достижения)
    console.log("🔄 Синхронизируем модели...");
    await sequelize.sync({ alter: true });

    console.log("✅ Миграция базы данных завершена успешно!");
    return true;
  } catch (error) {
    console.error("❌ Ошибка миграции:", error);
    throw error;
  }
}

// Запускаем если файл вызывается напрямую
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log("🎉 Миграция завершена!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Критическая ошибка:", error);
      process.exit(1);
    });
}

module.exports = { migrateDatabase };
