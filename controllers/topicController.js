const { Topic, TopicStatus, Skill, Note, User } = require("../models");
const { Op } = require("sequelize");

class TopicController {
  async createTopic(req, res) {
    try {
      const userId = req.user.id;
      const {
        name,
        description,
        skill_id,
        status_id,
        progress,
        estimated_hours,
      } = req.body;

      if (!name || !skill_id) {
        return res.status(400).json({
          success: false,
          message: "Название темы и ID навыка обязательны",
        });
      }

      const skill = await Skill.findOne({
        where: {
          id: skill_id,
          user_id: userId,
        },
      });

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Навык не найден или не принадлежит пользователю",
        });
      }

      if (status_id) {
        const status = await TopicStatus.findByPk(status_id);
        if (!status) {
          return res.status(404).json({
            success: false,
            message: "Статус не найден",
          });
        }
      }

      const topicProgress =
        progress !== undefined ? Math.max(0, Math.min(100, progress)) : 0;

      const existingTopic = await Topic.findOne({
        where: {
          name: name.trim(),
          skill_id,
        },
      });

      if (existingTopic) {
        return res.status(409).json({
          success: false,
          message: "Тема с таким названием уже существует в данном навыке",
        });
      }

      const topic = await Topic.create({
        name: name.trim(),
        description: description ? description.trim() : null,
        skill_id,
        status_id: status_id || 1, // По умолчанию статус "Не начато"
        progress: topicProgress,
        estimated_hours: estimated_hours || null,
      });

      const createdTopic = await Topic.findByPk(topic.id, {
        include: [
          {
            model: TopicStatus,
            as: "status",
          },
          {
            model: Skill,
            as: "skill",
            attributes: ["id", "name"],
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: "Тема успешно создана",
        data: { topic: createdTopic },
      });
    } catch (error) {
      console.error("Ошибка создания темы:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async getTopics(req, res) {
    try {
      const userId = req.user.id;
      const { skill_id, status_id, search, progress_min, progress_max } =
        req.query;

      const includeConditions = [
        {
          model: Skill,
          as: "skill",
          where: { user_id: userId },
          attributes: ["id", "name"],
        },
        {
          model: TopicStatus,
          as: "status",
        },
      ];

      const whereConditions = {};

      if (skill_id) {
        whereConditions.skill_id = skill_id;
      }

      if (status_id) {
        whereConditions.status_id = status_id;
      }

      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (progress_min !== undefined) {
        whereConditions.progress = { [Op.gte]: parseInt(progress_min) };
      }

      if (progress_max !== undefined) {
        if (whereConditions.progress) {
          whereConditions.progress[Op.lte] = parseInt(progress_max);
        } else {
          whereConditions.progress = { [Op.lte]: parseInt(progress_max) };
        }
      }

      const topics = await Topic.findAll({
        where: whereConditions,
        include: includeConditions,
        order: [["id", "DESC"]],
      });

      res.json({
        success: true,
        data: {
          topics,
          total: topics.length,
        },
      });
    } catch (error) {
      console.error("Ошибка получения тем:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить тему по ID
  async getTopicById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const topic = await Topic.findOne({
        where: { id },
        include: [
          {
            model: Skill,
            as: "skill",
            where: { user_id: userId },
            attributes: ["id", "name"],
          },
          {
            model: TopicStatus,
            as: "status",
          },
          {
            model: Note,
            as: "notes",
            order: [["created_at", "DESC"]],
            limit: 10,
          },
        ],
      });

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Тема не найдена",
        });
      }

      // Подсчет статистики
      const stats = {
        notesCount: topic.notes ? topic.notes.length : 0,
        progressPercentage: topic.progress,
        isCompleted: topic.progress === 100,
        estimatedHours: topic.estimated_hours,
      };

      res.json({
        success: true,
        data: {
          topic: {
            ...topic.toJSON(),
            stats,
          },
        },
      });
    } catch (error) {
      console.error("Ошибка получения темы:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Обновить тему
  async updateTopic(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { name, description, status_id, progress, estimated_hours } =
        req.body;

      // Проверка существования темы и принадлежности пользователю
      const topic = await Topic.findOne({
        where: { id },
        include: [
          {
            model: Skill,
            as: "skill",
            where: { user_id: userId },
          },
        ],
      });

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Тема не найдена",
        });
      }

      // Проверка данных для обновления
      if (
        !name &&
        !description &&
        status_id === undefined &&
        progress === undefined &&
        estimated_hours === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "Необходимо указать данные для обновления",
        });
      }

      // Проверка статуса (если указан)
      if (status_id) {
        const status = await TopicStatus.findByPk(status_id);
        if (!status) {
          return res.status(404).json({
            success: false,
            message: "Статус не найден",
          });
        }
      }

      // Проверка уникальности названия (если обновляется)
      if (name && name !== topic.name) {
        const existingTopic = await Topic.findOne({
          where: {
            name: name.trim(),
            skill_id: topic.skill_id,
            id: { [Op.ne]: id },
          },
        });

        if (existingTopic) {
          return res.status(409).json({
            success: false,
            message: "Тема с таким названием уже существует в данном навыке",
          });
        }
      }

      // Обновление данных
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (description !== undefined)
        updateData.description = description ? description.trim() : null;
      if (status_id !== undefined) updateData.status_id = status_id;
      if (progress !== undefined)
        updateData.progress = Math.max(0, Math.min(100, progress));
      if (estimated_hours !== undefined)
        updateData.estimated_hours = estimated_hours;

      await topic.update(updateData);

      // Получение обновленной темы
      const updatedTopic = await Topic.findByPk(id, {
        include: [
          {
            model: TopicStatus,
            as: "status",
          },
          {
            model: Skill,
            as: "skill",
            attributes: ["id", "name"],
          },
        ],
      });

      res.json({
        success: true,
        message: "Тема успешно обновлена",
        data: { topic: updatedTopic },
      });
    } catch (error) {
      console.error("Ошибка обновления темы:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Обновить прогресс темы
  async updateProgress(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { progress } = req.body;

      // Валидация прогресса
      if (progress === undefined || progress < 0 || progress > 100) {
        return res.status(400).json({
          success: false,
          message: "Прогресс должен быть числом от 0 до 100",
        });
      }

      // Проверка существования темы и принадлежности пользователю
      const topic = await Topic.findOne({
        where: { id },
        include: [
          {
            model: Skill,
            as: "skill",
            where: { user_id: userId },
          },
        ],
      });

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Тема не найдена",
        });
      }

      const oldProgress = topic.progress;
      await topic.update({ progress });

      res.json({
        success: true,
        message: "Прогресс успешно обновлен",
        data: {
          topic: {
            id: topic.id,
            name: topic.name,
            oldProgress,
            newProgress: progress,
            isCompleted: progress === 100,
          },
        },
      });
    } catch (error) {
      console.error("Ошибка обновления прогресса:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Удалить тему
  async deleteTopic(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const topic = await Topic.findOne({
        where: { id },
        include: [
          {
            model: Skill,
            as: "skill",
            where: { user_id: userId },
          },
        ],
      });

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Тема не найдена",
        });
      }

      // Удаление темы (каскадно удалятся связанные заметки)
      await topic.destroy();

      res.json({
        success: true,
        message: "Тема успешно удалена",
      });
    } catch (error) {
      console.error("Ошибка удаления темы:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить статистику по темам
  async getTopicsStats(req, res) {
    try {
      const userId = req.user.id;
      const { skill_id } = req.query;

      const whereConditions = {};
      const includeConditions = [
        {
          model: Skill,
          as: "skill",
          where: { user_id: userId },
          attributes: ["id", "name"],
        },
      ];

      if (skill_id) {
        whereConditions.skill_id = skill_id;
      }

      const topics = await Topic.findAll({
        where: whereConditions,
        include: includeConditions,
        attributes: ["id", "progress", "estimated_hours"],
      });

      const stats = {
        totalTopics: topics.length,
        completedTopics: topics.filter((t) => t.progress === 100).length,
        inProgressTopics: topics.filter(
          (t) => t.progress > 0 && t.progress < 100
        ).length,
        notStartedTopics: topics.filter((t) => t.progress === 0).length,
        averageProgress:
          topics.length > 0
            ? Math.round(
                topics.reduce((sum, t) => sum + t.progress, 0) / topics.length
              )
            : 0,
        totalEstimatedHours: topics.reduce(
          (sum, t) => sum + (t.estimated_hours || 0),
          0
        ),
        completionRate:
          topics.length > 0
            ? Math.round(
                (topics.filter((t) => t.progress === 100).length /
                  topics.length) *
                  100
              )
            : 0,
      };

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      console.error("Ошибка получения статистики тем:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Изменить статус темы
  async updateTopicStatus(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { status_id } = req.body;

      if (!status_id) {
        return res.status(400).json({
          success: false,
          message: "ID статуса обязателен",
        });
      }

      // Проверяем существование темы и принадлежность пользователю
      const topic = await Topic.findOne({
        where: { id },
        include: [
          {
            model: Skill,
            as: "skill",
            where: { user_id: userId },
            attributes: ["id", "name"],
          },
        ],
      });

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Тема не найдена",
        });
      }

      // Проверяем существование статуса
      const status = await TopicStatus.findByPk(status_id);
      if (!status) {
        return res.status(404).json({
          success: false,
          message: "Статус не найден",
        });
      }

      // Обновляем статус темы
      await topic.update({ status_id });

      // Получаем обновленную тему с полной информацией
      const updatedTopic = await Topic.findByPk(id, {
        include: [
          {
            model: Skill,
            as: "skill",
            attributes: ["id", "name"],
          },
          {
            model: TopicStatus,
            as: "status",
            attributes: ["id", "name"],
          },
        ],
      });

      res.json({
        success: true,
        message: "Статус темы успешно изменен",
        data: { topic: updatedTopic },
      });
    } catch (error) {
      console.error("Ошибка изменения статуса темы:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить заметки темы
  async getTopicNotes(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Проверяем существование темы и принадлежность пользователю
      const topic = await Topic.findOne({
        where: { id },
        include: [
          {
            model: Skill,
            as: "skill",
            where: { user_id: userId },
            attributes: ["id", "name"],
          },
        ],
      });

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Тема не найдена",
        });
      }

      // Получаем заметки темы
      const notes = await Note.findAll({
        where: { topic_id: id },
        include: [
          {
            model: Topic,
            as: "topic",
            attributes: ["id", "name"],
            include: [
              {
                model: Skill,
                as: "skill",
                attributes: ["id", "name"],
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Получаем общее количество заметок для пагинации
      const totalNotes = await Note.count({
        where: { topic_id: id },
      });

      res.json({
        success: true,
        data: {
          notes,
          total: totalNotes,
          topic: {
            id: topic.id,
            name: topic.name,
            skill: topic.skill,
          },
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: totalNotes > parseInt(offset) + parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Ошибка получения заметок темы:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }
}

module.exports = new TopicController();
