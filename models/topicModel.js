const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Topic = sequelize.define(
  "Topic",
  {
    skill_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "skills",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "topic_status",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    estimated_hours: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    tableName: "topics",
    timestamps: false,
  }
);

module.exports = Topic;
