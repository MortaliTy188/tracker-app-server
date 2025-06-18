const { sequelize } = require("../models");

async function syncDatabase() {
  try {
    // Проверяем подключение к базе данных
    await sequelize.authenticate();
    console.log("✅ Подключение к базе данных установлено успешно.");

    // Синхронизируем модели с базой данных
    // { force: true } - пересоздает таблицы (ОСТОРОЖНО: удаляет данные!)
    // { alter: true } - обновляет структуру таблиц без удаления данных
    await sequelize.sync({ alter: true });
    console.log("✅ Все модели синхронизированы с базой данных.");
  } catch (error) {
    console.error("❌ Ошибка синхронизации базы данных:", error);
    process.exit(1);
  }
}

// Запускаем синхронизацию если файл вызывается напрямую
if (require.main === module) {
  syncDatabase().then(() => {
    console.log("🎉 Синхронизация завершена");
    process.exit(0);
  });
}

module.exports = syncDatabase;
