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

    // Логирование для отладки
    console.log("Library API - Query params:", {
      page,
      limit,
      category_id,
      search,
      sort_by,
      sort_order,
    });
    console.log("Library API - Where condition:", where);

    // Separate count query without includes to avoid inflated count due to JOINs
    const count = await Skill.count({
      where,
    });

    // Определяем порядок сортировки для базы данных
    let dbOrder = [[sort_by, sort_order]];
    let needsPostSorting = false;

    // Для сортировки по статистике используем сортировку по умолчанию в БД и потом сортируем в коде
    if (["likes", "dislikes", "comments"].includes(sort_by)) {
      dbOrder = [["created_at", "DESC"]]; // По умолчанию сортируем по дате создания
      needsPostSorting = true;
    }

    // Main query with all includes
    const skills = await Skill.findAll({
      where,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "avatar"],
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
          attributes: ["type", "user_id"],
        },
        {
          model: SkillComment,
          as: "comments",
          attributes: ["id"],
        },
      ],
      order: dbOrder,
      // Если нужна сортировка по статистике, загружаем все записи без лимита и offset
      limit: needsPostSorting ? undefined : parseInt(limit),
      offset: needsPostSorting ? undefined : parseInt(offset),
    });

    console.log("Library API - Results:", {
      count,
      skillsLength: skills.length,
      totalPages: Math.ceil(count / limit),
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

      // Проверяем лайк текущего пользователя
      if (req.user) {
        console.log(`Library API - Skill ${skillData.id} all likes:`, likes);
        console.log(
          `Library API - Looking for user_id:`,
          req.user.id,
          typeof req.user.id
        );
        // Приводим к числу для корректного сравнения
        const userId = parseInt(req.user.id);
        const userLike = likes.find((like) => {
          console.log(
            `Comparing like.user_id ${
              like.user_id
            } (${typeof like.user_id}) with userId ${userId} (${typeof userId})`
          );
          return parseInt(like.user_id) === userId;
        });
        skillData.userLike = userLike ? userLike.type : null;
        console.log(
          `Library API - Skill ${skillData.id} userLike for user ${req.user.id}:`,
          skillData.userLike
        );
        console.log(`Library API - Found userLike object:`, userLike);
      } else {
        skillData.userLike = null;
      }

      // Убираем массивы лайков и комментариев из ответа
      delete skillData.likes;
      delete skillData.comments;

      return skillData;
    });

    // Сортировка по статистике, если необходимо
    if (needsPostSorting) {
      skillsWithStats.sort((a, b) => {
        let aValue, bValue;

        if (sort_by === "likes") {
          aValue = a.stats.likesCount;
          bValue = b.stats.likesCount;
        } else if (sort_by === "dislikes") {
          aValue = a.stats.dislikesCount;
          bValue = b.stats.dislikesCount;
        } else if (sort_by === "comments") {
          aValue = a.stats.commentsCount;
          bValue = b.stats.commentsCount;
        }

        if (sort_order === "ASC") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });

      // Применяем пагинацию после сортировки
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedSkills = skillsWithStats.slice(startIndex, endIndex);

      return res.json({
        success: true,
        data: {
          skills: paginatedSkills,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    }

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
          attributes: ["id", "name", "avatar"],
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
              attributes: ["id", "name"],
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
              attributes: ["id", "name", "avatar"],
            },
            {
              model: SkillComment,
              as: "replies",
              include: [
                {
                  model: User,
                  as: "author",
                  attributes: ["id", "name", "avatar"],
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
      console.log(`SkillDetails API - All likes:`, likes);
      console.log(
        `SkillDetails API - Looking for user_id:`,
        req.user.id,
        typeof req.user.id
      );
      // Приводим к числу для корректного сравнения
      const userId = parseInt(req.user.id);
      const userLike = likes.find((like) => {
        // В getSkillDetails лайки включают данные пользователя
        const likeUserId = like.user
          ? parseInt(like.user.id)
          : parseInt(like.user_id);
        console.log(`Comparing likeUserId ${likeUserId} with userId ${userId}`);
        return likeUserId === userId;
      });
      skillData.userLike = userLike ? userLike.type : null;
      console.log(`SkillDetails API - userLike:`, skillData.userLike);
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
          attributes: ["id", "name", "avatar"],
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
          attributes: ["id", "name", "avatar"],
        },
        {
          model: SkillComment,
          as: "replies",
          include: [
            {
              model: User,
              as: "author",
              attributes: ["id", "name", "avatar"],
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

// Копировать навык из библиотеки
const copySkillFromLibrary = async (req, res) => {
  try {
    const { skill_id } = req.params;
    const user_id = req.user.id;

    // Проверяем, что навык существует и публичный
    const originalSkill = await Skill.findOne({
      where: { id: skill_id, is_public: true },
      include: [
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
          model: SkillCategory,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!originalSkill) {
      return res.status(404).json({
        success: false,
        message: "Навык не найден или не является публичным",
      });
    }

    // Проверяем, что пользователь не копирует свой собственный навык
    if (originalSkill.user_id === user_id) {
      return res.status(400).json({
        success: false,
        message: "Нельзя копировать свой собственный навык",
      });
    }

    // Проверяем, что у пользователя еще нет копии этого навыка
    const existingCopy = await Skill.findOne({
      where: {
        user_id,
        name: originalSkill.name,
        description: originalSkill.description,
      },
    });

    if (existingCopy) {
      return res.status(400).json({
        success: false,
        message: "У вас уже есть копия этого навыка",
      });
    }

    // Получаем статус "Не начато"
    const notStartedStatus = await TopicStatus.findOne({
      where: { name: "Не начато" },
    });

    if (!notStartedStatus) {
      return res.status(500).json({
        success: false,
        message: "Не найден статус 'Не начато'",
      });
    }

    // Создаем копию навыка
    const newSkill = await Skill.create({
      user_id,
      name: originalSkill.name,
      description: originalSkill.description,
      category_id: originalSkill.category_id,
      is_public: false, // По умолчанию скопированный навык приватный
    });

    // Копируем топики с обнуленным прогрессом
    const topics = originalSkill.topics || [];
    for (const topic of topics) {
      await Topic.create({
        skill_id: newSkill.id,
        name: topic.name,
        description: topic.description,
        status_id: notStartedStatus.id, // Всегда "Не начато"
        progress: 0, // Обнуляем прогресс
        estimated_hours: topic.estimated_hours || 0,
      });
    }

    // Получаем созданный навык с топиками для ответа
    const skillWithTopics = await Skill.findByPk(newSkill.id, {
      include: [
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
          model: SkillCategory,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Навык успешно скопирован",
      data: { skill: skillWithTopics },
    });
  } catch (error) {
    console.error("Error copying skill from library:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при копировании навыка",
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
  copySkillFromLibrary,
};
