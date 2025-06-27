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
const { deleteOldAvatar } = require("../middlewares/imageUpload");
const UserValidation = require("./userValidation");
const {
  getUserProgressStats,
  updateUserLevel,
} = require("../utils/levelCalculator");
const AchievementManager = require("../utils/achievementManager");
const ActivityLogger = require("../utils/activityLogger");

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

      // Проверяем достижения при регистрации
      await AchievementManager.checkAchievements(user.id, "registration", {
        userId: user.id,
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
            level: user.level,
            registrationDate: user.registrationDate,
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

      // Проверяем временные достижения при входе
      await AchievementManager.checkAchievements(user.id, "login", {
        loginTime: new Date(),
      });

      res.json({
        success: true,
        message: "Успешная авторизация",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            level: user.level,
            registrationDate: user.registrationDate,
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

  async uploadAvatar(req, res) {
    try {
      const userId = req.user.id;

      if (!req.processedFile) {
        return res.status(400).json({
          success: false,
          message: "Файл изображения не был загружен",
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Пользователь не найден",
        });
      }
      if (user.avatar) {
        deleteOldAvatar(user.avatar);
      }

      await user.update({
        avatar: req.processedFile.url,
      }); // Логируем смену аватара
      await ActivityLogger.log(
        userId,
        "AVATAR_CHANGE",
        {
          oldAvatar: user.avatar,
          newAvatar: req.processedFile.url,
          fileSize: req.file.size,
          fileName: req.processedFile.filename,
        },
        req
      );

      // Проверяем достижения после загрузки аватара
      await AchievementManager.checkAchievements(userId, "avatar_uploaded", {
        avatar: req.processedFile.url,
      });

      res.json({
        success: true,
        message: "Аватарка успешно загружена",
        data: {
          avatar: req.processedFile.url,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: req.processedFile.url,
            level: user.level,
            registrationDate: user.registrationDate,
          },
        },
      });
    } catch (error) {
      console.log("Ошибка загрузки аватарки: ", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async deleteAvatar(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Пользователь не найден",
        });
      }

      if (!user.avatar) {
        return res.status(400).json({
          success: false,
          message: "У пользователя нет аватарки",
        });
      }
      deleteOldAvatar(user.avatar);

      const oldAvatarUrl = user.avatar;

      await user.update({
        avatar: null,
      });

      // Логируем удаление аватара
      await ActivityLogger.log(
        userId,
        "AVATAR_CHANGE",
        {
          oldAvatar: oldAvatarUrl,
          newAvatar: null,
          action: "delete",
        },
        req
      );
      res.json({
        success: true,
        message: "Аватарка успешно удалена",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: null,
            level: user.level,
            registrationDate: user.registrationDate,
          },
        },
      });
    } catch (error) {
      console.log("Ошибка удаления аватарки: ", error);
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
        attributes: [
          "id",
          "name",
          "email",
          "avatar",
          "level",
          "registrationDate",
          "isPrivate",
        ], // Исключаем пароль
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
        attributes: [
          "id",
          "name",
          "email",
          "avatar",
          "level",
          "registrationDate",
        ],
      });

      // Проверяем достижения после обновления профиля
      await AchievementManager.checkAchievements(userId, "profile_updated", {
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
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

      // Логируем активность смены пароля
      await ActivityLogger.logPasswordChange(userId, req);

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

  async updatePrivacySettings(req, res) {
    try {
      const userId = req.user.id;
      const { isPrivate } = req.body;

      // Валидация входных данных
      if (typeof isPrivate !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isPrivate должно быть булевым значением",
        });
      }

      // Обновляем настройки приватности
      await User.update({ isPrivate }, { where: { id: userId } });

      // Проверяем достижения
      await AchievementManager.checkAchievements(userId, "privacy_change", {
        isPrivate,
        changeTime: new Date(),
      });

      // Получаем обновленного пользователя
      const updatedUser = await User.findByPk(userId, {
        attributes: [
          "id",
          "name",
          "email",
          "avatar",
          "level",
          "registrationDate",
          "isPrivate",
        ],
      });

      res.json({
        success: true,
        message: `Профиль ${
          isPrivate ? "скрыт" : "открыт"
        } для других пользователей`,
        data: { user: updatedUser },
      });
    } catch (error) {
      console.error("Ошибка обновления настроек приватности:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  async getPublicProfile(req, res) {
    try {
      const { userId } = req.params;
      const requesterId = req.user?.id; // ID пользователя, который запрашивает

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "ID пользователя обязателен",
        });
      }

      // Находим пользователя
      const user = await User.findByPk(userId, {
        attributes: [
          "id",
          "name",
          "avatar",
          "level",
          "registrationDate",
          "isPrivate",
        ],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Пользователь не найден",
        });
      }

      // Если это тот же пользователь, показываем полную информацию
      if (requesterId && requesterId.toString() === userId.toString()) {
        const fullUser = await User.findByPk(userId, {
          attributes: [
            "id",
            "name",
            "email",
            "avatar",
            "level",
            "registrationDate",
            "isPrivate",
          ],
        });

        return res.json({
          success: true,
          data: { user: fullUser, isOwnProfile: true },
        });
      }

      // Если профиль приватный, показываем ограниченную информацию
      if (user.isPrivate) {
        return res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              isPrivate: true,
            },
            isPrivate: true,
            message: "Этот профиль скрыт пользователем",
          },
        });
      }

      // Получаем публичную статистику для открытых профилей
      const achievements = await AchievementManager.getUserAchievementStats(
        userId
      );
      const progressStats = await getUserProgressStats(userId);

      // Удаляем поле isPrivate из публичного ответа
      const { isPrivate, ...publicUser } = user.toJSON();

      res.json({
        success: true,
        data: {
          user: publicUser,
          stats: {
            achievements: achievements,
            progress: progressStats,
          },
          isPrivate: false,
        },
      });
    } catch (error) {
      console.error("Ошибка получения публичного профиля:", error);
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
        attributes: [
          "id",
          "name",
          "email",
          "level",
          "registrationDate",
          "avatar",
          "isPrivate",
        ],
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
      if (user.avatar) {
        deleteOldAvatar(user.avatar);
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

  // Получить статистику прогресса пользователя
  async getProgressStats(req, res) {
    try {
      const userId = req.user.id;

      const progressStats = await getUserProgressStats(userId);

      res.json({
        success: true,
        message: "Статистика прогресса получена",
        data: {
          progressStats,
        },
      });
    } catch (error) {
      console.error("Ошибка получения статистики прогресса:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }
  // Пересчитать уровень пользователя вручную
  async recalculateLevel(req, res) {
    try {
      const userId = req.user.id;

      const levelInfo = await updateUserLevel(userId);

      // Проверяем достижения за уровень после обновления
      try {
        await AchievementManager.checkAchievements(userId, "level_updated", {
          new_level: levelInfo.level,
          completed_topics: levelInfo.completedTopics,
        });
      } catch (achievementError) {
        console.error(
          "Ошибка при проверке достижений за уровень:",
          achievementError
        );
        // Не прерываем основной процесс при ошибке достижений
      }

      res.json({
        success: true,
        message: "Уровень пользователя обновлен",
        data: {
          levelInfo,
        },
      });
    } catch (error) {
      console.error("Ошибка пересчета уровня:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }
  async getAllUsers(req, res) {
    try {
      const currentUserId = req.user ? req.user.id : null;
      const { page = 1, limit = 20, search = "" } = req.query;
      const offset = (page - 1) * limit; // Условие поиска
      const whereCondition = {};

      console.log("🔍 getAllUsers - Current user ID:", currentUserId);

      if (search) {
        whereCondition.name = {
          [require("sequelize").Op.iLike]: `%${search}%`,
        };
      }

      // Исключаем текущего пользователя из списка, если он авторизован
      if (currentUserId) {
        whereCondition.id = {
          [require("sequelize").Op.ne]: currentUserId,
        };
        console.log("🔍 getAllUsers - Excluding current user from results");
      } else {
        console.log("🔍 getAllUsers - No current user to exclude");
      }

      console.log("🔍 getAllUsers - Where condition:", whereCondition);

      // Получаем пользователей с пагинацией
      const { count, rows: users } = await User.findAndCountAll({
        where: whereCondition,
        attributes: [
          "id",
          "name",
          "avatar",
          "level",
          "registrationDate",
          "isPrivate",
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["registrationDate", "DESC"]],
      });

      console.log("🔍 getAllUsers - Found users count:", users.length);
      console.log(
        "🔍 getAllUsers - User IDs:",
        users.map((u) => u.id)
      );
      if (currentUserId && users.some((u) => u.id === currentUserId)) {
        console.log(
          "⚠️ WARNING: Current user found in results! This should not happen."
        );
      } else {
        console.log("✅ Current user correctly excluded from results");
      }

      // Если пользователь авторизован, получаем информацию о дружбе
      let friendshipStatuses = {};
      if (currentUserId) {
        const Friendship = require("../models/friendshipModel");
        const { Op } = require("sequelize");

        const friendships = await Friendship.findAll({
          where: {
            [Op.or]: [
              { requester_id: currentUserId },
              { addressee_id: currentUserId },
            ],
          },
        });

        // Создаем мапу статусов дружбы
        console.log(
          `📊 Found ${friendships.length} friendships for user ${currentUserId}`
        );
        friendships.forEach((friendship) => {
          const otherUserId =
            friendship.requester_id === currentUserId
              ? friendship.addressee_id
              : friendship.requester_id;

          let status = friendship.status;
          if (status === "pending") {
            status =
              friendship.addressee_id === currentUserId
                ? "received_request"
                : "sent_request";
          } else if (status === "accepted") {
            status = "accepted";
          }

          console.log(
            `📊 Friendship: ${friendship.requester_id} -> ${friendship.addressee_id}, original status: ${friendship.status}, final status: ${status}, other user: ${otherUserId}`
          );

          friendshipStatuses[otherUserId] = {
            status,
            friendshipId: friendship.id,
          };
        });

        console.log(`📊 Final friendship statuses map:`, friendshipStatuses);
      }

      // Получаем статистику для каждого пользователя
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          try {
            // Определяем статус дружбы
            let friendshipStatus = "none";
            let friendshipId = null;

            if (currentUserId && friendshipStatuses[user.id]) {
              friendshipStatus = friendshipStatuses[user.id].status;
              friendshipId = friendshipStatuses[user.id].friendshipId;
              console.log(
                `📊 User ${user.name} (${user.id}) friendship status: ${friendshipStatus}, friendshipId: ${friendshipId}`
              );
            } else {
              console.log(
                `📊 User ${user.name} (${user.id}) has no friendship record`
              );
            }

            // Для приватных профилей не показываем детальную статистику
            if (user.isPrivate) {
              return {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                level: user.level,
                registrationDate: user.registrationDate,
                isPrivate: true,
                friendship: {
                  status: friendshipStatus,
                  friendshipId,
                },
                stats: {
                  message: "Статистика скрыта пользователем",
                },
              };
            }

            // Получаем статистику достижений
            const achievementStats =
              await AchievementManager.getUserAchievementStats(user.id);

            // Получаем статистику прогресса
            const progressStats = await getUserProgressStats(user.id);

            return {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              level: user.level,
              registrationDate: user.registrationDate,
              isPrivate: false,
              friendship: {
                status: friendshipStatus,
                friendshipId,
              },
              stats: {
                achievements: {
                  completed: achievementStats.completed,
                  total: achievementStats.total,
                  points: achievementStats.points,
                },
                progress: {
                  totalSkills: progressStats.totalSkills,
                  totalTopics: progressStats.totalTopics,
                  completedTopics: progressStats.completedTopics,
                  completionPercentage:
                    progressStats.totalTopics > 0
                      ? Math.round(
                          (progressStats.completedTopics /
                            progressStats.totalTopics) *
                            100
                        )
                      : 0,
                },
              },
            };
          } catch (error) {
            console.error(
              `Ошибка получения статистики для пользователя ${user.id}:`,
              error
            );
            // Возвращаем базовую информацию при ошибке
            return {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              level: user.level,
              registrationDate: user.registrationDate,
              isPrivate: user.isPrivate,
              friendship: {
                status: "none",
                friendshipId: null,
              },
              stats: {
                error: "Не удалось загрузить статистику",
              },
            };
          }
        })
      );

      // Подсчитываем общую статистику
      const totalPages = Math.ceil(count / limit);
      const publicUsersCount = usersWithStats.filter(
        (u) => !u.isPrivate
      ).length;
      const privateUsersCount = usersWithStats.filter(
        (u) => u.isPrivate
      ).length;

      res.json({
        success: true,
        message: "Список пользователей получен",
        data: {
          users: usersWithStats,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalUsers: count,
            usersPerPage: parseInt(limit),
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
          summary: {
            totalUsers: count,
            publicUsers: publicUsersCount,
            privateUsers: privateUsersCount,
          },
        },
      });
    } catch (error) {
      console.error("Ошибка получения списка пользователей:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }
}

module.exports = new UserController();
