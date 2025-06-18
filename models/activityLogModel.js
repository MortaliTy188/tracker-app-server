const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ActivityLog = sequelize.define(
  "ActivityLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    action: {
      type: DataTypes.ENUM(
        "LOGIN",
        "LOGOUT",
        "PROFILE_UPDATE",
        "AVATAR_CHANGE",
        "EMAIL_CHANGE",
        "USERNAME_CHANGE",
        "TOPIC_CREATED",
        "TOPIC_COMPLETED",
        "TOPIC_UPDATED",
        "NOTE_CREATED",
        "NOTE_UPDATED",
        "NOTE_DELETED",
        "PASSWORD_CHANGE",
        "SKILL_CREATED",
        "SKILL_UPDATED",
        "SKILL_DELETED",
        "ACHIEVEMENT_EARNED",
        "FEEDBACK_SUBMITTED"
      ),
      allowNull: false,
    },
    details: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    ip_address: {
      type: DataTypes.STRING(45), // IPv6 поддержка
    },
    user_agent: {
      type: DataTypes.TEXT,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "activity_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      {
        fields: ["user_id", "created_at"],
      },
      {
        fields: ["action", "created_at"],
      },
      {
        fields: ["created_at"],
      },
    ],
  }
);

module.exports = ActivityLog;
