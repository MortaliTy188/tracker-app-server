const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    message_type: {
      type: DataTypes.ENUM("text", "image", "file"),
      allowNull: false,
      defaultValue: "text",
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_edited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    edited_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "messages",
    timestamps: false,
    indexes: [
      {
        fields: ["sender_id", "receiver_id"],
      },
      {
        fields: ["created_at"],
      },
      {
        fields: ["is_read"],
      },
    ],
  }
);

// Определяем ассоциации
Message.associate = (models) => {
  // Сообщение принадлежит отправителю
  Message.belongsTo(models.User, {
    foreignKey: "sender_id",
    as: "sender",
  });

  // Сообщение принадлежит получателю
  Message.belongsTo(models.User, {
    foreignKey: "receiver_id",
    as: "receiver",
  });
};

module.exports = Message;
