const { sequelize, Skill, SkillComment, SkillLike } = require("../models");

async function addLibraryFeatures() {
  try {
    console.log("🔄 Добавление функций библиотеки...");

    // Добавляем поле is_public в таблицу skills если его нет
    const skillTableInfo = await sequelize
      .getQueryInterface()
      .describeTable("skills");

    if (!skillTableInfo.is_public) {
      await sequelize.getQueryInterface().addColumn("skills", "is_public", {
        type: sequelize.Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
      console.log("✅ Добавлено поле is_public в таблицу skills");
    }

    if (!skillTableInfo.created_at) {
      await sequelize.getQueryInterface().addColumn("skills", "created_at", {
        type: sequelize.Sequelize.DATE,
        defaultValue: sequelize.Sequelize.NOW,
      });
      console.log("✅ Добавлено поле created_at в таблицу skills");
    }

    if (!skillTableInfo.updated_at) {
      await sequelize.getQueryInterface().addColumn("skills", "updated_at", {
        type: sequelize.Sequelize.DATE,
        defaultValue: sequelize.Sequelize.NOW,
      });
      console.log("✅ Добавлено поле updated_at в таблицу skills");
    }

    // Создаем таблицы для комментариев и лайков
    await SkillComment.sync({ force: false });
    console.log("✅ Таблица skill_comments создана/обновлена");

    await SkillLike.sync({ force: false });
    console.log("✅ Таблица skill_likes создана/обновлена");

    console.log("🎉 Функции библиотеки успешно добавлены!");
  } catch (error) {
    console.error("❌ Ошибка при добавлении функций библиотеки:", error);
    throw error;
  }
}

// Запуск миграции
if (require.main === module) {
  addLibraryFeatures()
    .then(() => {
      console.log("✅ Миграция завершена");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Ошибка миграции:", error);
      process.exit(1);
    });
}

module.exports = addLibraryFeatures;
