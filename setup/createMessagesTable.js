const { sequelize } = require("../models");

/**
 * Создание таблицы сообщений для системы чата
 */
async function createMessagesTable() {
  try {
    console.log("Создание таблицы messages...");

    // Создаем таблицу messages
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        is_edited BOOLEAN NOT NULL DEFAULT FALSE,
        edited_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Создаем индексы для оптимизации поиска
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
    `);

    console.log("✅ Таблица messages успешно создана");

    // Создаем функцию для автоматического обновления updated_at
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION update_messages_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Создаем триггер для автоматического обновления updated_at
    await sequelize.query(`
      DROP TRIGGER IF EXISTS trigger_update_messages_updated_at ON messages;
      CREATE TRIGGER trigger_update_messages_updated_at
        BEFORE UPDATE ON messages
        FOR EACH ROW
        EXECUTE FUNCTION update_messages_updated_at();
    `);

    console.log("✅ Триггеры для таблицы messages созданы");
  } catch (error) {
    console.error("❌ Ошибка при создании таблицы messages:", error);
    throw error;
  }
}

// Запускаем создание таблицы, если файл запущен напрямую
if (require.main === module) {
  createMessagesTable()
    .then(() => {
      console.log("🎉 Таблица messages готова к использованию!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Не удалось создать таблицу messages:", error);
      process.exit(1);
    });
}

module.exports = createMessagesTable;
