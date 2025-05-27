const {
  User,
  Skill,
  SkillCategory,
  Topic,
  TopicStatus,
  Note,
} = require("../models");
const { Op } = require("sequelize");

class SkillController {
  // Создать новый навык
  async createSkill(req, res) {
    try {
      const userId = req.user.id;
      const { name, description, category_id } = req.body;

      // Валидация входных данных
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Название навыка обязательно",
        });
      }

      // Проверка существования категории (если указана)
      if (category_id) {
        const category = await SkillCategory.findByPk(category_id);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: "Категория не найдена",
          });
        }
      }

      // Проверка уникальности навыка для пользователя
      const existingSkill = await Skill.findOne({
        where: {
          name,
          user_id: userId,
        },
      });

      if (existingSkill) {
        return res.status(409).json({
          success: false,
          message: "Навык с таким названием уже существует",
        });
      }

      // Создание навыка
      const skill = await Skill.create({
        name: name.trim(),
        description: description ? description.trim() : null,
        user_id: userId,
        category_id: category_id || null,
      });

      // Получение созданного навыка с категорией
      const createdSkill = await Skill.findByPk(skill.id, {
        include: [
          {
            model: SkillCategory,
            as: "category",
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: "Навык успешно создан",
        data: { skill: createdSkill },
      });
    } catch (error) {
      console.error("Ошибка создания навыка:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить все навыки пользователя
  async getAllSkills(req, res) {
    try {
      const userId = req.user.id;
      const { category_id, search } = req.query;

      // Построение условий фильтрации
      const whereConditions = { user_id: userId };

      if (category_id) {
        whereConditions.category_id = category_id;
      }

      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const skills = await Skill.findAll({
        where: whereConditions,
        include: [
          {
            model: SkillCategory,
            as: "category",
          },
          {
            model: Topic,
            as: "topics",
            attributes: ["id", "name", "progress"],
            include: [
              {
                model: TopicStatus,
                as: "status",
              },
            ],
          },
        ],
        order: [["id", "DESC"]],
      });

      // Добавление статистики для каждого навыка
      const skillsWithStats = skills.map((skill) => {
        const topics = skill.topics || [];
        const stats = {
          totalTopics: topics.length,
          averageProgress:
            topics.length > 0
              ? Math.round(
                  topics.reduce((sum, topic) => sum + topic.progress, 0) /
                    topics.length
                )
              : 0,
          completedTopics: topics.filter((topic) => topic.progress === 100)
            .length,
        };

        return {
          ...skill.toJSON(),
          stats,
        };
      });

      res.json({
        success: true,
        data: {
          skills: skillsWithStats,
          total: skills.length,
        },
      });
    } catch (error) {
      console.error("Ошибка получения навыков:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить навык по ID
  async getSkillById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const skill = await Skill.findOne({
        where: {
          id,
          user_id: userId,
        },
        include: [
          {
            model: SkillCategory,
            as: "category",
          },
          {
            model: Topic,
            as: "topics",
            include: [
              {
                model: TopicStatus,
                as: "status",
              },
              {
                model: Note,
                as: "notes",
                limit: 5,
                order: [["created_at", "DESC"]],
              },
            ],
          },
        ],
      });

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Навык не найден",
        });
      }

      // Подсчет статистики
      const topics = skill.topics || [];
      const stats = {
        totalTopics: topics.length,
        averageProgress:
          topics.length > 0
            ? Math.round(
                topics.reduce((sum, topic) => sum + topic.progress, 0) /
                  topics.length
              )
            : 0,
        completedTopics: topics.filter((topic) => topic.progress === 100)
          .length,
        totalNotes: topics.reduce(
          (sum, topic) => sum + (topic.notes ? topic.notes.length : 0),
          0
        ),
      };

      res.json({
        success: true,
        data: {
          skill: {
            ...skill.toJSON(),
            stats,
          },
        },
      });
    } catch (error) {
      console.error("Ошибка получения навыка:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Обновить навык
  async updateSkill(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { name, description, category_id } = req.body;

      // Проверка существования навыка
      const skill = await Skill.findOne({
        where: {
          id,
          user_id: userId,
        },
      });

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Навык не найден",
        });
      }

      // Проверка данных для обновления
      if (!name && !description && category_id === undefined) {
        return res.status(400).json({
          success: false,
          message: "Необходимо указать данные для обновления",
        });
      }

      // Проверка категории (если указана)
      if (category_id && category_id !== null) {
        const category = await SkillCategory.findByPk(category_id);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: "Категория не найдена",
          });
        }
      }

      // Проверка уникальности названия (если обновляется)
      if (name && name !== skill.name) {
        const existingSkill = await Skill.findOne({
          where: {
            name: name.trim(),
            user_id: userId,
            id: { [Op.ne]: id },
          },
        });

        if (existingSkill) {
          return res.status(409).json({
            success: false,
            message: "Навык с таким названием уже существует",
          });
        }
      }

      // Обновление данных
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (description !== undefined)
        updateData.description = description ? description.trim() : null;
      if (category_id !== undefined) updateData.category_id = category_id;

      await skill.update(updateData);

      // Получение обновленного навыка
      const updatedSkill = await Skill.findByPk(id, {
        include: [
          {
            model: SkillCategory,
            as: "category",
          },
        ],
      });

      res.json({
        success: true,
        message: "Навык успешно обновлен",
        data: { skill: updatedSkill },
      });
    } catch (error) {
      console.error("Ошибка обновления навыка:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Удалить навык
  async deleteSkill(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const skill = await Skill.findOne({
        where: {
          id,
          user_id: userId,
        },
      });

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Навык не найден",
        });
      }

      // Удаление навыка (каскадно удалятся связанные темы и заметки)
      await skill.destroy();

      res.json({
        success: true,
        message: "Навык успешно удален",
      });
    } catch (error) {
      console.error("Ошибка удаления навыка:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить статистику по навыкам пользователя
  async getSkillsStats(req, res) {
    try {
      const userId = req.user.id;

      const skills = await Skill.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Topic,
            as: "topics",
            attributes: ["progress"],
          },
          {
            model: SkillCategory,
            as: "category",
            attributes: ["name"],
          },
        ],
      });

      // Подсчет общей статистики
      const totalSkills = skills.length;
      const totalTopics = skills.reduce(
        (sum, skill) => sum + skill.topics.length,
        0
      );

      const allProgresses = skills.flatMap((skill) =>
        skill.topics.map((topic) => topic.progress)
      );
      const averageProgress =
        allProgresses.length > 0
          ? Math.round(
              allProgresses.reduce((sum, progress) => sum + progress, 0) /
                allProgresses.length
            )
          : 0;

      const completedTopics = allProgresses.filter(
        (progress) => progress === 100
      ).length;

      // Статистика по категориям
      const categoryStats = skills.reduce((acc, skill) => {
        const categoryName = skill.category
          ? skill.category.name
          : "Без категории";
        if (!acc[categoryName]) {
          acc[categoryName] = {
            skillsCount: 0,
            topicsCount: 0,
            averageProgress: 0,
          };
        }

        acc[categoryName].skillsCount++;
        acc[categoryName].topicsCount += skill.topics.length;

        const topicProgresses = skill.topics.map((t) => t.progress);
        if (topicProgresses.length > 0) {
          const categoryProgress =
            topicProgresses.reduce((sum, p) => sum + p, 0) /
            topicProgresses.length;
          acc[categoryName].averageProgress = Math.round(
            (acc[categoryName].averageProgress *
              (acc[categoryName].skillsCount - 1) +
              categoryProgress) /
              acc[categoryName].skillsCount
          );
        }

        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          overview: {
            totalSkills,
            totalTopics,
            averageProgress,
            completedTopics,
            completionRate:
              totalTopics > 0
                ? Math.round((completedTopics / totalTopics) * 100)
                : 0,
          },
          categoryStats,
        },
      });
    } catch (error) {
      console.error("Ошибка получения статистики:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить все темы навыка
  async getSkillTopics(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { status_id } = req.query;

      // Проверяем существование навыка и принадлежность пользователю
      const skill = await Skill.findOne({
        where: {
          id,
          user_id: userId,
        },
      });

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Навык не найден",
        });
      }

      // Условия фильтрации тем
      const whereConditions = {
        skill_id: id,
      };

      if (status_id) {
        whereConditions.status_id = status_id;
      }

      // Получаем темы навыка
      const topics = await Topic.findAll({
        where: whereConditions,
        include: [
          {
            model: TopicStatus,
            as: "status",
            attributes: ["id", "name"],
          },
          {
            model: Note,
            as: "notes",
            attributes: ["id", "title", "created_at"],
            limit: 3,
            order: [["created_at", "DESC"]],
          },
        ],
        order: [["id", "DESC"]],
      });

      // Добавляем статистику для каждой темы
      const topicsWithStats = topics.map((topic) => {
        const notes = topic.notes || [];
        return {
          ...topic.toJSON(),
          stats: {
            totalNotes: notes.length,
            lastNoteDate: notes.length > 0 ? notes[0].created_at : null,
          },
        };
      });

      res.json({
        success: true,
        data: {
          topics: topicsWithStats,
          total: topics.length,
          skill: {
            id: skill.id,
            name: skill.name,
          },
        },
      });
    } catch (error) {
      console.error("Ошибка получения тем навыка:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }
}

module.exports = new SkillController();
