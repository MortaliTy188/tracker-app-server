const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const UserAchievement = sequelize.define(
  "UserAchievement",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    achievement_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "achievements",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Текущий прогресс к получению достижения",
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "user_achievements",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "achievement_id"],
      },
    ],
  }
);

module.exports = UserAchievement;
