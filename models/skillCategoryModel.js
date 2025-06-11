const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const SkillCategoryModel = sequelize.define(
  "skillCategory",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "skill_category",
    timestamps: false,
  }
);

module.exports = SkillCategoryModel;
