const {
  Skill,
  User,
  SkillCategory,
  Topic,
  TopicStatus,
  SkillComment,
  SkillLike,
} = require("../models");
const { Op } = require("sequelize");

// Получить все публичные навыки для библиотеки
const getPublicSkills = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category_id,
      search,
      sort_by = "created_at",
      sort_order = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { is_public: true };

    // Фильтр по категории
    if (category_id) {
      where.category_id = category_id;
    }

    // Поиск по названию или описанию
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: skills } = await Skill.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "username", "avatar_url"],
        },
        {
          model: SkillCategory,
          as: "category",
          attributes: ["id", "name"],
        },
        {
          model: Topic,
          as: "topics",
          include: [
            {
              model: TopicStatus,
              as: "status",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: SkillLike,
          as: "likes",
          attributes: ["type"],
        },
        {
          model: SkillComment,
          as: "comments",
          attributes: ["id"],
        },
      ],
      order: [[sort_by, sort_order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Добавляем статистику лайков и комментариев
    const skillsWithStats = skills.map((skill) => {
      const skillData = skill.toJSON();
      const likes = skillData.likes || [];
      const comments = skillData.comments || [];

      skillData.stats = {
        likesCount: likes.filter((like) => like.type === "like").length,
        dislikesCount: likes.filter((like) => like.type === "dislike").length,
        commentsCount: comments.length,
        topicsCount: skillData.topics?.length || 0,
        completedTopicsCount:
          skillData.topics?.filter(
            (topic) => topic.status?.name === "Завершено"
          ).length || 0,
      };

      // Убираем массивы лайков и комментариев из ответа
      delete skillData.likes;
      delete skillData.comments;

      return skillData;
    });

    res.json({
      success: true,
      data: {
        skills: skillsWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting public skills:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при получении публичных навыков",
      error: error.message,
    });
  }
};

// Получить детальную информацию о навыке
const getSkillDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const skill = await Skill.findOne({
      where: { id, is_public: true },
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "username", "avatar_url"],
        },
        {
          model: SkillCategory,
          as: "category",
          attributes: ["id", "name"],
        },
        {
          model: Topic,
          as: "topics",
          include: [
            {
              model: TopicStatus,
              as: "status",
              attributes: ["id", "name"],
            },
          ],
          order: [["created_at", "ASC"]],
        },
        {
          model: SkillLike,
          as: "likes",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "username"],
            },
          ],
        },
        {
          model: SkillComment,
          as: "comments",
          where: { parent_comment_id: null },
          required: false,
          include: [
            {
              model: User,
              as: "author",
              attributes: ["id", "name", "username", "avatar_url"],
            },
            {
              model: SkillComment,
              as: "replies",
              include: [
                {
                  model: User,
                  as: "author",
                  attributes: ["id", "name", "username", "avatar_url"],
                },
              ],
            },
          ],
          order: [["created_at", "DESC"]],
        },
      ],
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Навык не найден или не является публичным",
      });
    }

    const skillData = skill.toJSON();
    const likes = skillData.likes || [];

    // Добавляем статистику
    skillData.stats = {
      likesCount: likes.filter((like) => like.type === "like").length,
      dislikesCount: likes.filter((like) => like.type === "dislike").length,
      commentsCount: skillData.comments?.length || 0,
      topicsCount: skillData.topics?.length || 0,
      completedTopicsCount:
        skillData.topics?.filter((topic) => topic.status?.name === "Завершено")
          .length || 0,
    };

    // Проверяем лайк текущего пользователя
    if (req.user) {
      const userLike = likes.find((like) => like.user.id === req.user.id);
      skillData.userLike = userLike ? userLike.type : null;
    }

    res.json({
      success: true,
      data: { skill: skillData },
    });
  } catch (error) {
    console.error("Error getting skill details:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при получении деталей навыка",
      error: error.message,
    });
  }
};

// Поставить/убрать лайк навыку
const toggleSkillLike = async (req, res) => {
  try {
    const { skill_id } = req.params;
    const { type } = req.body; // "like" или "dislike"
    const user_id = req.user.id;

    // Проверяем, что навык существует и публичный
    const skill = await Skill.findOne({
      where: { id: skill_id, is_public: true },
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Навык не найден или не является публичным",
      });
    }

    // Проверяем существующий лайк
    const existingLike = await SkillLike.findOne({
      where: { skill_id, user_id },
    });

    if (existingLike) {
      if (existingLike.type === type) {
        // Убираем лайк/дизлайк
        await existingLike.destroy();
        return res.json({
          success: true,
          message: "Оценка удалена",
          data: { action: "removed", type },
        });
      } else {
        // Меняем тип лайка
        existingLike.type = type;
        await existingLike.save();
        return res.json({
          success: true,
          message: "Оценка изменена",
          data: { action: "updated", type },
        });
      }
    } else {
      // Создаем новый лайк
      await SkillLike.create({
        skill_id,
        user_id,
        type,
      });
      return res.json({
        success: true,
        message: "Оценка добавлена",
        data: { action: "added", type },
      });
    }
  } catch (error) {
    console.error("Error toggling skill like:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при изменении оценки навыка",
      error: error.message,
    });
  }
};

// Добавить комментарий к навыку
const addSkillComment = async (req, res) => {
  try {
    const { skill_id } = req.params;
    const { content, parent_comment_id } = req.body;
    const user_id = req.user.id;

    // Проверяем, что навык существует и публичный
    const skill = await Skill.findOne({
      where: { id: skill_id, is_public: true },
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Навык не найден или не является публичным",
      });
    }

    // Если это ответ на комментарий, проверяем родительский комментарий
    if (parent_comment_id) {
      const parentComment = await SkillComment.findOne({
        where: { id: parent_comment_id, skill_id },
      });

      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: "Родительский комментарий не найден",
        });
      }
    }

    const comment = await SkillComment.create({
      skill_id,
      user_id,
      content,
      parent_comment_id,
    });

    // Получаем комментарий с данными автора
    const commentWithAuthor = await SkillComment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "name", "username", "avatar_url"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Комментарий добавлен",
      data: { comment: commentWithAuthor },
    });
  } catch (error) {
    console.error("Error adding skill comment:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при добавлении комментария",
      error: error.message,
    });
  }
};

// Получить комментарии навыка
const getSkillComments = async (req, res) => {
  try {
    const { skill_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    // Проверяем, что навык существует и публичный
    const skill = await Skill.findOne({
      where: { id: skill_id, is_public: true },
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Навык не найден или не является публичным",
      });
    }

    const { count, rows: comments } = await SkillComment.findAndCountAll({
      where: { skill_id, parent_comment_id: null },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "name", "username", "avatar_url"],
        },
        {
          model: SkillComment,
          as: "replies",
          include: [
            {
              model: User,
              as: "author",
              attributes: ["id", "name", "username", "avatar_url"],
            },
          ],
          order: [["created_at", "ASC"]],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting skill comments:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при получении комментариев",
      error: error.message,
    });
  }
};

// Обновить статус публичности навыка (только для владельца)
const updateSkillPublicity = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_public } = req.body;
    const user_id = req.user.id;

    const skill = await Skill.findOne({
      where: { id, user_id },
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Навык не найден или вы не являетесь его владельцем",
      });
    }

    skill.is_public = is_public;
    await skill.save();

    res.json({
      success: true,
      message: `Навык ${is_public ? "опубликован" : "скрыт"}`,
      data: { skill },
    });
  } catch (error) {
    console.error("Error updating skill publicity:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при обновлении статуса публичности навыка",
      error: error.message,
    });
  }
};

module.exports = {
  getPublicSkills,
  getSkillDetails,
  toggleSkillLike,
  addSkillComment,
  getSkillComments,
  updateSkillPublicity,
};
