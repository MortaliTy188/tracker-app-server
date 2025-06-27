const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Achievement = sequelize.define(
  "Achievement",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "🏆",
    },
    type: {
      type: DataTypes.ENUM(
        "topics_completed", // За количество завершенных топиков
        "skills_created", // За количество созданных навыков
        "notes_written", // За количество написанных заметок
        "streak_days", // За streak дни активности
        "level_reached", // За достижение определенного уровня
        "categories_mastered", // За освоение категорий навыков
        "progress_milestone", // За достижение определенного процента прогресса
        "time_spent", // За время, проведенное в обучении
        "first_action", // За первые действия
        "friends_added", // За добавление друзей
        "friend_requests_received", // За получение запросов на дружбу
        "friend_requests_sent", // За отправку запросов на дружбу
        "friendship_duration", // За длительность дружбы
        "messages_sent", // За отправленные сообщения
        "messages_received", // За полученные сообщения
        "unique_conversations", // За общение с уникальными пользователями
        "quick_replies", // За быстрые ответы
        "night_messages", // За ночные сообщения
        "emoji_messages", // За использование эмодзи
        "long_messages", // За длинные сообщения
        "conversation_marathon", // За продолжительные беседы
        "edited_messages", // За отредактированные сообщения
        "special" // Специальные достижения
      ),
      allowNull: false,
    },
    condition_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment:
        "Значение условия для получения достижения (например, количество топиков)",
    },
    condition_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment:
        "Дополнительные данные для условий (например, specific category_id)",
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      comment: "Очки за получение достижения",
    },
    rarity: {
      type: DataTypes.ENUM("common", "rare", "epic", "legendary"),
      allowNull: false,
      defaultValue: "common",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "achievements",
    timestamps: false,
  }
);

module.exports = Achievement;
