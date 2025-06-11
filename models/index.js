const sequelize = require("../config/db");

// Импорт всех моделей
const User = require("./userModel");
const SkillCategory = require("./skillCategoryModel");
const Skill = require("./skillModel");
const TopicStatus = require("./topicStatusModel");
const Topic = require("./topicModel");
const Note = require("./noteModel");
const Feedback = require("./feedbackModel");

// Определение связей между моделями

// User -> Skill (один пользователь может иметь много навыков)
User.hasMany(Skill, {
  foreignKey: "user_id",
  as: "skills",
});
Skill.belongsTo(User, {
  foreignKey: "user_id",
  as: "owner",
});

// SkillCategory -> Skill (одна категория может содержать много навыков)
SkillCategory.hasMany(Skill, {
  foreignKey: "category_id",
  as: "skills",
});
Skill.belongsTo(SkillCategory, {
  foreignKey: "category_id",
  as: "category",
});

// Skill -> Topic (один навык может иметь много тем)
Skill.hasMany(Topic, {
  foreignKey: "skill_id",
  as: "topics",
});
Topic.belongsTo(Skill, {
  foreignKey: "skill_id",
  as: "skill",
});

// TopicStatus -> Topic (один статус может быть у многих тем)
TopicStatus.hasMany(Topic, {
  foreignKey: "status_id",
  as: "topics",
});
Topic.belongsTo(TopicStatus, {
  foreignKey: "status_id",
  as: "status",
});

// Topic -> Note (одна тема может иметь много заметок)
Topic.hasMany(Note, {
  foreignKey: "topic_id",
  as: "notes",
});
Note.belongsTo(Topic, {
  foreignKey: "topic_id",
  as: "topic",
});

module.exports = {
  sequelize,
  User,
  SkillCategory,
  Skill,
  TopicStatus,
  Topic,
  Note,
  Feedback,
};
