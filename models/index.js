const sequelize = require("../config/db");

// Импорт всех моделей
const User = require("./userModel");
const SkillCategory = require("./skillCategoryModel");
const Skill = require("./skillModel");
const TopicStatus = require("./topicStatusModel");
const Topic = require("./topicModel");
const Note = require("./noteModel");
const Feedback = require("./feedbackModel");
const Achievement = require("./achievementModel");
const UserAchievement = require("./userAchievementModel");
const ActivityLog = require("./activityLogModel");
const Friendship = require("./friendshipModel");
const Message = require("./messageModel");

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

// User -> UserAchievement (один пользователь может иметь много достижений)
User.hasMany(UserAchievement, {
  foreignKey: "user_id",
  as: "userAchievements",
});
UserAchievement.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// Achievement -> UserAchievement (одно достижение может быть у многих пользователей)
Achievement.hasMany(UserAchievement, {
  foreignKey: "achievement_id",
  as: "userAchievements",
});
UserAchievement.belongsTo(Achievement, {
  foreignKey: "achievement_id",
  as: "achievement",
});

// User -> ActivityLog (один пользователь может иметь много записей в логе активности)
User.hasMany(ActivityLog, {
  foreignKey: "user_id",
  as: "activityLogs",
});
ActivityLog.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// User -> Friendship (пользователь может отправлять запросы на дружбу)
User.hasMany(Friendship, {
  foreignKey: "requester_id",
  as: "sentFriendRequests",
});

// User -> Friendship (пользователь может получать запросы на дружбу)
User.hasMany(Friendship, {
  foreignKey: "addressee_id",
  as: "receivedFriendRequests",
});

// Friendship -> User (дружба принадлежит отправителю)
Friendship.belongsTo(User, {
  foreignKey: "requester_id",
  as: "requester",
});

// Friendship -> User (дружба принадлежит получателю)
Friendship.belongsTo(User, {
  foreignKey: "addressee_id",
  as: "addressee",
});

// User -> Message (пользователь может отправлять сообщения)
User.hasMany(Message, {
  foreignKey: "sender_id",
  as: "sentMessages",
});

// User -> Message (пользователь может получать сообщения)
User.hasMany(Message, {
  foreignKey: "receiver_id",
  as: "receivedMessages",
});

// Message -> User (сообщение принадлежит отправителю)
Message.belongsTo(User, {
  foreignKey: "sender_id",
  as: "sender",
});

// Message -> User (сообщение принадлежит получателю)
Message.belongsTo(User, {
  foreignKey: "receiver_id",
  as: "receiver",
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
  Achievement,
  UserAchievement,
  ActivityLog,
  Friendship,
  Message,
};
