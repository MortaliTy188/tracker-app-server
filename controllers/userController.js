const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  User,
  Skill,
  SkillCategory,
  Topic,
  TopicStatus,
  Note,
} = require("../models");
const UserValidation = require("./userValidation");

const JWT_SECRET = "secret_key"; // В продакшене должен быть в переменных окружения

class UserController {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      const validation = UserValidation.validateRegistrationData({
        name,
        email,
        password,
      });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Ошибки валидации",
          errors: validation.errors,
        });
      }

      const normalizedEmail = UserValidation.normalizeEmail(email);
      const sanitizedName = UserValidation.sanitizeName(name);

      const existingUser = await User.findOne({
        where: { email: normalizedEmail },
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Пользователь с таким email уже существует",
        });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = await User.create({
        name: sanitizedName,
        email: normalizedEmail,
        password: hashedPassword,
      });

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.status(201).json({
        success: true,
        message: "Пользователь успешно зарегистрирован",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email и пароль обязательны",
        });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Неверный email или пароль",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Неверный email или пароль",
        });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.json({
        success: true,
        message: "Успешная авторизация",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId, {
        attributes: ["id", "name", "email"], // Исключаем пароль
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Пользователь не найден",
        });
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error("Ошибка получения профиля:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, email } = req.body;

      if (!name && !email) {
        return res.status(400).json({
          success: false,
          message: "Необходимо указать имя или email для обновления",
        });
      }

      if (email) {
        const existingUser = await User.findOne({
          where: {
            email,
            id: { [require("sequelize").Op.ne]: userId }, // Исключаем текущего пользователя
          },
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "Пользователь с таким email уже существует",
          });
        }
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;

      await User.update(updateData, { where: { id: userId } });

      const updatedUser = await User.findByPk(userId, {
        attributes: ["id", "name", "email"],
      });

      res.json({
        success: true,
        message: "Профиль успешно обновлен",
        data: { user: updatedUser },
      });
    } catch (error) {
      console.error("Ошибка обновления профиля:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Текущий и новый пароль обязательны",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Новый пароль должен содержать минимум 6 символов",
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Пользователь не найден",
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Неверный текущий пароль",
        });
      }

      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      await User.update(
        { password: hashedNewPassword },
        { where: { id: userId } }
      );

      res.json({
        success: true,
        message: "Пароль успешно изменен",
      });
    } catch (error) {
      console.error("Ошибка смены пароля:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async getUserFullInfo(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId, {
        attributes: ["id", "name", "email"],
        include: [
          {
            model: Skill,
            as: "skills",
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
                    limit: 10, // Ограничиваем количество заметок
                    order: [["created_at", "DESC"]],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Пользователь не найден",
        });
      }

      const stats = {
        totalSkills: user.skills.length,
        totalTopics: user.skills.reduce(
          (sum, skill) => sum + skill.topics.length,
          0
        ),
        totalNotes: user.skills.reduce(
          (sum, skill) =>
            sum +
            skill.topics.reduce(
              (topicSum, topic) => topicSum + topic.notes.length,
              0
            ),
          0
        ),
        averageProgress:
          user.skills.length > 0
            ? Math.round(
                user.skills.reduce(
                  (sum, skill) =>
                    sum +
                      skill.topics.reduce(
                        (topicSum, topic) => topicSum + topic.progress,
                        0
                      ) /
                        skill.topics.length || 0,
                  0
                ) / user.skills.length
              )
            : 0,
      };

      res.json({
        success: true,
        data: {
          user,
          stats,
        },
      });
    } catch (error) {
      console.error("Ошибка получения полной информации:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Пароль обязателен для удаления аккаунта",
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Пользователь не найден",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Неверный пароль",
        });
      }

      await User.destroy({ where: { id: userId } });

      res.json({
        success: true,
        message: "Аккаунт успешно удален",
      });
    } catch (error) {
      console.error("Ошибка удаления аккаунта:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }
}

module.exports = new UserController();
