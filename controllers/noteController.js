const { Note, Topic, Skill, User } = require("../models");
const { Op } = require("sequelize");

class NoteController {
  async createNote(req, res) {
    try {
      const userId = req.user.id;
      const { title, content, topic_id } = req.body;

      if (!title || !content || !topic_id) {
        return res.status(400).json({
          success: false,
          message: "Заголовок, содержание и ID темы обязательны",
        });
      }

      const topic = await Topic.findOne({
        where: { id: topic_id },
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
          message: "Тема не найдена или не принадлежит пользователю",
        });
      }

      const note = await Note.create({
        title: title.trim(),
        content: content.trim(),
        topic_id,
      });

      const createdNote = await Note.findByPk(note.id, {
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
      });

      res.status(201).json({
        success: true,
        message: "Заметка успешно создана",
        data: { note: createdNote },
      });
    } catch (error) {
      console.error("Ошибка создания заметки:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async getNotes(req, res) {
    try {
      const userId = req.user.id;
      const { topic_id, skill_id, search, limit = 20, offset = 0 } = req.query;

      const whereConditions = {};
      const includeConditions = [
        {
          model: Topic,
          as: "topic",
          attributes: ["id", "name"],
          include: [
            {
              model: Skill,
              as: "skill",
              where: { user_id: userId },
              attributes: ["id", "name"],
            },
          ],
        },
      ];

      if (topic_id) {
        whereConditions.topic_id = topic_id;
      }

      if (skill_id) {
        includeConditions[0].include[0].where.id = skill_id;
      }

      if (search) {
        whereConditions[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows: notes } = await Note.findAndCountAll({
        where: whereConditions,
        include: includeConditions,
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: {
          notes,
          pagination: {
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            pages: Math.ceil(count / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Ошибка получения заметок:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async getNoteById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const note = await Note.findOne({
        where: { id },
        include: [
          {
            model: Topic,
            as: "topic",
            attributes: ["id", "name", "progress"],
            include: [
              {
                model: Skill,
                as: "skill",
                where: { user_id: userId },
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      });

      if (!note) {
        return res.status(404).json({
          success: false,
          message: "Заметка не найдена",
        });
      }

      res.json({
        success: true,
        data: { note },
      });
    } catch (error) {
      console.error("Ошибка получения заметки:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async updateNote(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { title, content } = req.body;

      const note = await Note.findOne({
        where: { id },
        include: [
          {
            model: Topic,
            as: "topic",
            include: [
              {
                model: Skill,
                as: "skill",
                where: { user_id: userId },
              },
            ],
          },
        ],
      });

      if (!note) {
        return res.status(404).json({
          success: false,
          message: "Заметка не найдена",
        });
      }

      if (!title && !content) {
        return res.status(400).json({
          success: false,
          message: "Необходимо указать заголовок или содержание для обновления",
        });
      }

      const updateData = {};
      if (title) updateData.title = title.trim();
      if (content) updateData.content = content.trim();

      await note.update(updateData);

      const updatedNote = await Note.findByPk(id, {
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
      });

      res.json({
        success: true,
        message: "Заметка успешно обновлена",
        data: { note: updatedNote },
      });
    } catch (error) {
      console.error("Ошибка обновления заметки:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async deleteNote(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const note = await Note.findOne({
        where: { id },
        include: [
          {
            model: Topic,
            as: "topic",
            include: [
              {
                model: Skill,
                as: "skill",
                where: { user_id: userId },
              },
            ],
          },
        ],
      });

      if (!note) {
        return res.status(404).json({
          success: false,
          message: "Заметка не найдена",
        });
      }

      await note.destroy();

      res.json({
        success: true,
        message: "Заметка успешно удалена",
      });
    } catch (error) {
      console.error("Ошибка удаления заметки:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async searchNotes(req, res) {
    try {
      const userId = req.user.id;
      const { query, limit = 20 } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Поисковый запрос обязателен",
        });
      }

      const notes = await Note.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.iLike]: `%${query}%` } },
            { content: { [Op.iLike]: `%${query}%` } },
          ],
        },
        include: [
          {
            model: Topic,
            as: "topic",
            attributes: ["id", "name"],
            include: [
              {
                model: Skill,
                as: "skill",
                where: { user_id: userId },
                attributes: ["id", "name"],
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        data: {
          notes,
          query,
          total: notes.length,
        },
      });
    } catch (error) {
      console.error("Ошибка поиска заметок:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async getRecentNotes(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;

      const notes = await Note.findAll({
        include: [
          {
            model: Topic,
            as: "topic",
            attributes: ["id", "name"],
            include: [
              {
                model: Skill,
                as: "skill",
                where: { user_id: userId },
                attributes: ["id", "name"],
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        data: {
          notes,
          total: notes.length,
        },
      });
    } catch (error) {
      console.error("Ошибка получения последних заметок:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async getNotesStats(req, res) {
    try {
      const userId = req.user.id;
      const { topic_id, skill_id } = req.query;

      const includeConditions = [
        {
          model: Topic,
          as: "topic",
          attributes: ["id", "name"],
          include: [
            {
              model: Skill,
              as: "skill",
              where: { user_id: userId },
              attributes: ["id", "name"],
            },
          ],
        },
      ];

      const whereConditions = {};

      if (topic_id) {
        whereConditions.topic_id = topic_id;
      }

      if (skill_id) {
        includeConditions[0].include[0].where.id = skill_id;
      }

      const notes = await Note.findAll({
        where: whereConditions,
        include: includeConditions,
        attributes: ["id", "created_at"],
      });

      // Группировка по дням
      const today = new Date();
      const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats = {
        totalNotes: notes.length,
        notesToday: notes.filter((note) => {
          const noteDate = new Date(note.created_at);
          return noteDate.toDateString() === today.toDateString();
        }).length,
        notesLast7Days: notes.filter(
          (note) => new Date(note.created_at) >= last7Days
        ).length,
        notesLast30Days: notes.filter(
          (note) => new Date(note.created_at) >= last30Days
        ).length,
        averageNotesPerDay:
          notes.length > 0
            ? Math.round(
                (notes.length /
                  Math.max(
                    1,
                    Math.ceil(
                      (today -
                        new Date(
                          Math.min(...notes.map((n) => new Date(n.created_at)))
                        )) /
                        (1000 * 60 * 60 * 24)
                    )
                  )) *
                  100
              ) / 100
            : 0,
      };

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      console.error("Ошибка получения статистики заметок:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }
}

module.exports = new NoteController();
