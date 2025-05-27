const { TopicStatus, Topic } = require("../models");
const { Op } = require("sequelize");

class TopicStatusController {
  async createStatus(req, res) {
    try {
      const { name, description, color } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Название статуса обязательно",
        });
      }

      const existingStatus = await TopicStatus.findOne({
        where: { name: name.trim() },
      });

      if (existingStatus) {
        return res.status(409).json({
          success: false,
          message: "Статус с таким названием уже существует",
        });
      }

      const colorRegex = /^#[0-9A-F]{6}$/i;
      if (color && !colorRegex.test(color)) {
        return res.status(400).json({
          success: false,
          message: "Цвет должен быть в формате HEX (например, #FF0000)",
        });
      }

      const status = await TopicStatus.create({
        name: name.trim(),
        description: description ? description.trim() : null,
        color: color || null,
      });

      res.status(201).json({
        success: true,
        message: "Статус успешно создан",
        data: { status },
      });
    } catch (error) {
      console.error("Ошибка создания статуса:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async getAllStatuses(req, res) {
    try {
      const { search, include_stats } = req.query;

      const whereConditions = {};
      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const includeOptions = [];

      if (include_stats === "true") {
        includeOptions.push({
          model: Topic,
          as: "topics",
          attributes: ["id"],
        });
      }

      const statuses = await TopicStatus.findAll({
        where: whereConditions,
        include: includeOptions,
        order: [["name", "ASC"]],
      });

      let statusesWithStats = statuses;
      if (include_stats === "true") {
        statusesWithStats = statuses.map((status) => ({
          ...status.toJSON(),
          stats: {
            topicsCount: status.topics ? status.topics.length : 0,
          },
        }));
      }

      res.json({
        success: true,
        data: {
          statuses: statusesWithStats,
          total: statuses.length,
        },
      });
    } catch (error) {
      console.error("Ошибка получения статусов:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async getStatusById(req, res) {
    try {
      const { id } = req.params;
      const { include_topics } = req.query;

      const includeOptions = [];

      if (include_topics === "true") {
        includeOptions.push({
          model: Topic,
          as: "topics",
          attributes: ["id", "name", "progress", "created_at"],
        });
      }

      const status = await TopicStatus.findByPk(id, {
        include: includeOptions,
      });

      if (!status) {
        return res.status(404).json({
          success: false,
          message: "Статус не найден",
        });
      }

      // Добавление статистики
      const stats = {
        topicsCount: status.topics ? status.topics.length : 0,
      };

      res.json({
        success: true,
        data: {
          status: {
            ...status.toJSON(),
            stats,
          },
        },
      });
    } catch (error) {
      console.error("Ошибка получения статуса:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { name, description, color } = req.body;

      const status = await TopicStatus.findByPk(id);
      if (!status) {
        return res.status(404).json({
          success: false,
          message: "Статус не найден",
        });
      }

      if (!name && description === undefined && color === undefined) {
        return res.status(400).json({
          success: false,
          message: "Необходимо указать данные для обновления",
        });
      }

      if (name && name !== status.name) {
        const existingStatus = await TopicStatus.findOne({
          where: {
            name: name.trim(),
            id: { [Op.ne]: id },
          },
        });

        if (existingStatus) {
          return res.status(409).json({
            success: false,
            message: "Статус с таким названием уже существует",
          });
        }
      }

      // Валидация цвета (если обновляется)
      if (color) {
        const colorRegex = /^#[0-9A-F]{6}$/i;
        if (!colorRegex.test(color)) {
          return res.status(400).json({
            success: false,
            message: "Цвет должен быть в формате HEX (например, #FF0000)",
          });
        }
      }

      // Обновление данных
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (description !== undefined)
        updateData.description = description ? description.trim() : null;
      if (color !== undefined) updateData.color = color;

      await status.update(updateData);

      res.json({
        success: true,
        message: "Статус успешно обновлен",
        data: { status },
      });
    } catch (error) {
      console.error("Ошибка обновления статуса:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async deleteStatus(req, res) {
    try {
      const { id } = req.params;
      const { force } = req.query;

      const status = await TopicStatus.findByPk(id, {
        include: [
          {
            model: Topic,
            as: "topics",
            attributes: ["id"],
          },
        ],
      });

      if (!status) {
        return res.status(404).json({
          success: false,
          message: "Статус не найден",
        });
      }

      // Проверка наличия связанных тем
      const topicsCount = status.topics ? status.topics.length : 0;

      if (topicsCount > 0 && force !== "true") {
        return res.status(400).json({
          success: false,
          message: `Невозможно удалить статус. К нему привязано ${topicsCount} тем. Используйте параметр force=true для принудительного удаления.`,
          data: {
            topicsCount,
            canForceDelete: true,
          },
        });
      }

      // Если есть связанные темы и force=true, обнуляем status_id у тем
      if (topicsCount > 0 && force === "true") {
        await Topic.update({ status_id: null }, { where: { status_id: id } });
      }

      // Удаление статуса
      await status.destroy();

      res.json({
        success: true,
        message: "Статус успешно удален",
        data: {
          updatedTopics: force === "true" ? topicsCount : 0,
        },
      });
    } catch (error) {
      console.error("Ошибка удаления статуса:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить статистику по всем статусам
  async getStatusesStats(req, res) {
    try {
      const statuses = await TopicStatus.findAll({
        include: [
          {
            model: Topic,
            as: "topics",
            attributes: ["id", "progress"],
          },
        ],
      });

      const stats = {
        totalStatuses: statuses.length,
        statusesWithTopics: statuses.filter(
          (status) => status.topics && status.topics.length > 0
        ).length,
        emptyStatuses: statuses.filter(
          (status) => !status.topics || status.topics.length === 0
        ).length,
        statusDistribution: statuses
          .map((status) => {
            const topics = status.topics || [];
            const averageProgress =
              topics.length > 0
                ? Math.round(
                    topics.reduce((sum, topic) => sum + topic.progress, 0) /
                      topics.length
                  )
                : 0;

            return {
              id: status.id,
              name: status.name,
              color: status.color,
              topicsCount: topics.length,
              averageProgress,
            };
          })
          .sort((a, b) => b.topicsCount - a.topicsCount),
      };

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      console.error("Ошибка получения статистики статусов:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить статусы по умолчанию для создания тем
  async getDefaultStatuses(req, res) {
    try {
      // Возвращаем базовые статусы, которые должны быть в системе
      const defaultStatuses = [
        {
          name: "Не начато",
          description: "Тема еще не изучается",
          color: "#6c757d",
        },
        {
          name: "В процессе",
          description: "Тема изучается в данный момент",
          color: "#007bff",
        },
        {
          name: "На паузе",
          description: "Изучение временно приостановлено",
          color: "#ffc107",
        },
        {
          name: "Завершено",
          description: "Тема полностью изучена",
          color: "#28a745",
        },
        {
          name: "Требует повторения",
          description: "Тема нуждается в повторном изучении",
          color: "#dc3545",
        },
      ];

      // Проверяем, какие статусы уже существуют
      const existingStatuses = await TopicStatus.findAll({
        where: {
          name: {
            [Op.in]: defaultStatuses.map((s) => s.name),
          },
        },
      });

      const existingNames = existingStatuses.map((s) => s.name);
      const missingStatuses = defaultStatuses.filter(
        (s) => !existingNames.includes(s.name)
      );

      res.json({
        success: true,
        data: {
          existingStatuses,
          missingStatuses,
          allDefaultStatuses: defaultStatuses,
        },
      });
    } catch (error) {
      console.error("Ошибка получения статусов по умолчанию:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Создать статусы по умолчанию
  async createDefaultStatuses(req, res) {
    try {
      const defaultStatuses = [
        {
          name: "Не начато",
          description: "Тема еще не изучается",
          color: "#6c757d",
        },
        {
          name: "В процессе",
          description: "Тема изучается в данный момент",
          color: "#007bff",
        },
        {
          name: "На паузе",
          description: "Изучение временно приостановлено",
          color: "#ffc107",
        },
        {
          name: "Завершено",
          description: "Тема полностью изучена",
          color: "#28a745",
        },
        {
          name: "Требует повторения",
          description: "Тема нуждается в повторном изучении",
          color: "#dc3545",
        },
      ];

      const createdStatuses = [];
      const skippedStatuses = [];

      for (const statusData of defaultStatuses) {
        const existing = await TopicStatus.findOne({
          where: { name: statusData.name },
        });

        if (!existing) {
          const created = await TopicStatus.create(statusData);
          createdStatuses.push(created);
        } else {
          skippedStatuses.push(existing);
        }
      }

      res.json({
        success: true,
        message: `Создано ${createdStatuses.length} статусов, пропущено ${skippedStatuses.length} существующих`,
        data: {
          created: createdStatuses,
          skipped: skippedStatuses,
        },
      });
    } catch (error) {
      console.error("Ошибка создания статусов по умолчанию:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }
}

module.exports = new TopicStatusController();
