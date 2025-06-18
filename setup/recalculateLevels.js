const { User } = require("../models");
const { updateUserLevel } = require("../utils/levelCalculator");

/**
 * Скрипт для пересчета уровней всех существующих пользователей
 */
async function recalculateAllUserLevels() {
  try {
    console.log("Начинаем пересчет уровней пользователей...");

    const users = await User.findAll({
      attributes: ["id", "name", "email"],
    });

    console.log(`Найдено ${users.length} пользователей`);

    let updated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        const levelInfo = await updateUserLevel(user.id);
        console.log(
          `Пользователь ${user.name} (ID: ${user.id}): уровень обновлен на "${levelInfo.level}" (${levelInfo.completedTopics} завершенных топиков)`
        );
        updated++;
      } catch (error) {
        console.error(
          `Ошибка при обновлении уровня пользователя ${user.name} (ID: ${user.id}):`,
          error.message
        );
        errors++;
      }
    }

    console.log(`\nПересчет завершен:`);
    console.log(`- Обновлено: ${updated} пользователей`);
    console.log(`- Ошибок: ${errors}`);
  } catch (error) {
    console.error("Ошибка при пересчете уровней:", error);
  }
}

// Запускаем скрипт только если он вызван напрямую
if (require.main === module) {
  recalculateAllUserLevels()
    .then(() => {
      console.log("Скрипт завершен");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Критическая ошибка:", error);
      process.exit(1);
    });
}

module.exports = {
  recalculateAllUserLevels,
};
