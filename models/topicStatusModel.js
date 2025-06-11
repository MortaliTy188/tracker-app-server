const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const TopicStatus = sequelize.define(
  "TopicStatus",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "topic_status",
    timestamps: false,
  }
);

module.exports = TopicStatus;
