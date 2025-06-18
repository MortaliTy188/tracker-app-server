const { Feedback } = require("../models");
const { Op } = require("sequelize");
const ActivityLogger = require("../utils/activityLogger");

class FeedbackController {
  // Create new feedback
  async createFeedback(req, res) {
    try {
      console.log("Получены данные на сервере:", req.body);
      const { user_name, user_email, email_theme, message } = req.body;

      console.log("Проверка полей:");
      console.log("user_name:", user_name);
      console.log("user_email:", user_email);
      console.log("email_theme:", email_theme);
      console.log("message:", message);

      if (!user_name || !user_email || !email_theme || !message) {
        return res.status(400).json({
          success: false,
          message: "Все поля обязательны для заполнения",
        });
      }

      // Валидация email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user_email)) {
        return res.status(400).json({
          success: false,
          message: "Некорректный формат email",
        });
      }

      const feedback = await Feedback.create({
        user_name: user_name.trim(),
        user_email: user_email.trim().toLowerCase(),
        email_theme: email_theme.trim(),
        message: message.trim(),
      });

      // Логирование отправки обратной связи (если пользователь авторизован)
      if (req.user && req.user.id) {
        await ActivityLogger.logFeedbackSubmitted(req.user.id, feedback, req);
      }

      res.status(201).json({
        success: true,
        message: "Обратная связь успешно отправлена",
        data: { feedback },
      });
    } catch (error) {
      console.error("Ошибка создания обратной связи:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Get all feedback
  async getAllFeedback(req, res) {
    try {
      const { page = 1, limit = 10, search, email } = req.query;

      const whereConditions = {};

      if (search) {
        whereConditions[Op.or] = [
          { user_name: { [Op.iLike]: `%${search}%` } },
          { email_theme: { [Op.iLike]: `%${search}%` } },
          { message: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (email) {
        whereConditions.user_email = { [Op.iLike]: `%${email}%` };
      }

      const feedback = await Feedback.findAll({
        where: whereConditions,
        order: [["id", "DESC"]],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
      });

      const total = await Feedback.count({ where: whereConditions });

      res.status(200).json({
        success: true,
        data: { feedback },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Ошибка получения обратной связи:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Get feedback by ID
  async getFeedbackById(req, res) {
    try {
      const { id } = req.params;

      const feedback = await Feedback.findByPk(id);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Обратная связь не найдена",
        });
      }

      res.status(200).json({
        success: true,
        data: { feedback },
      });
    } catch (error) {
      console.error("Ошибка получения обратной связи:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Get feedback by user email
  async getFeedbackByEmail(req, res) {
    try {
      const { email } = req.params;

      const feedback = await Feedback.findAll({
        where: { user_email: email },
        order: [["id", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: { feedback, total: feedback.length },
      });
    } catch (error) {
      console.error("Ошибка получения обратной связи пользователя:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Update feedback (only for admin purposes)
  async updateFeedback(req, res) {
    try {
      const { id } = req.params;
      const { user_name, user_email, email_theme, message } = req.body;

      const feedback = await Feedback.findByPk(id);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Обратная связь не найдена",
        });
      }

      const updateData = {};
      if (user_name) updateData.user_name = user_name.trim();
      if (user_email) {
        // Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user_email)) {
          return res.status(400).json({
            success: false,
            message: "Некорректный формат email",
          });
        }
        updateData.user_email = user_email.trim().toLowerCase();
      }
      if (email_theme) updateData.email_theme = email_theme.trim();
      if (message) updateData.message = message.trim();

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Необходимо указать данные для обновления",
        });
      }

      await feedback.update(updateData);

      const updatedFeedback = await Feedback.findByPk(id);

      res.status(200).json({
        success: true,
        message: "Обратная связь успешно обновлена",
        data: { feedback: updatedFeedback },
      });
    } catch (error) {
      console.error("Ошибка обновления обратной связи:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Delete feedback
  async deleteFeedback(req, res) {
    try {
      const { id } = req.params;

      const feedback = await Feedback.findByPk(id);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Обратная связь не найдена",
        });
      }

      await feedback.destroy();

      res.status(200).json({
        success: true,
        message: "Обратная связь успешно удалена",
      });
    } catch (error) {
      console.error("Ошибка удаления обратной связи:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Get feedback statistics
  async getFeedbackStats(req, res) {
    try {
      const totalFeedback = await Feedback.count();

      // Статистика по темам
      const { sequelize } = require("../models");
      const themeStats = await Feedback.findAll({
        attributes: [
          "email_theme",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["email_theme"],
        order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
      });

      // Поскольку у нас нет timestamps, просто возвращаем общее количество как "недавние"
      const recentFeedback = totalFeedback;

      res.status(200).json({
        success: true,
        data: {
          totalFeedback,
          recentFeedback,
          themeStats: themeStats.map((item) => ({
            theme: item.email_theme,
            count: parseInt(item.dataValues.count),
          })),
        },
      });
    } catch (error) {
      console.error("Ошибка получения статистики обратной связи:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }
}

module.exports = new FeedbackController();
