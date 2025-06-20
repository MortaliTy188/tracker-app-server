const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Friendship = sequelize.define(
  "Friendship",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    requester_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    addressee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "declined", "blocked"),
      allowNull: false,
      defaultValue: "pending",
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
    tableName: "friendships",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["requester_id", "addressee_id"],
      },
      {
        fields: ["requester_id"],
      },
      {
        fields: ["addressee_id"],
      },
      {
        fields: ["status"],
      },
    ],
  }
);

// Определяем ассоциации
Friendship.associate = (models) => {
  // Дружба принадлежит пользователю-отправителю
  Friendship.belongsTo(models.User, {
    foreignKey: "requester_id",
    as: "requester",
  });

  // Дружба принадлежит пользователю-получателю
  Friendship.belongsTo(models.User, {
    foreignKey: "addressee_id",
    as: "addressee",
  });
};

module.exports = Friendship;
