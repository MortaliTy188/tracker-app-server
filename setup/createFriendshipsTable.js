const { sequelize } = require("../models");

async function createFriendshipsTable() {
  try {
    console.log("Создание таблицы friendships...");

    // Создаем таблицу friendships
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(requester_id, addressee_id)
      );
    `);

    // Создаем индексы
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
    `);

    console.log("Таблица friendships успешно создана");
  } catch (error) {
    console.error("Ошибка при создании таблицы friendships:", error);
    throw error;
  }
}

// Запускаем миграцию, если файл вызван напрямую
if (require.main === module) {
  createFriendshipsTable()
    .then(() => {
      console.log("Миграция friendships завершена успешно");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Ошибка миграции friendships:", error);
      process.exit(1);
    });
}

module.exports = createFriendshipsTable;
