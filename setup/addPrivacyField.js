const { User } = require("../models");

/**
 * Миграция для добавления поля приватности профиля
 */
async function addPrivacyField() {
  console.log("🔄 Добавление поля приватности профиля...");

  try {
    // Добавляем поле isPrivate в таблицу users
    await User.sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN DEFAULT false NOT NULL;
    `);

    console.log("✅ Поле isPrivate успешно добавлено в таблицу users");

    // Проверяем результат
    const [results] = await User.sequelize.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'isPrivate';
    `);

    if (results.length > 0) {
      console.log("📋 Информация о поле:", results[0]);
    }
  } catch (error) {
    console.error("❌ Ошибка при добавлении поля приватности:", error);
    throw error;
  }
}

// Запускаем миграцию
addPrivacyField()
  .then(() => {
    console.log("\n✅ Миграция приватности профиля завершена");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Ошибка миграции:", error);
    process.exit(1);
  });
