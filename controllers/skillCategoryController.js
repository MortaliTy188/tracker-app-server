const { SkillCategory, Skill } = require("../models");
const { Op } = require("sequelize");

class SkillCategoryController {
  // Создать новую категорию
  async createCategory(req, res) {
    try {
      const { name, description } = req.body;

      // Валидация входных данных
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Название категории обязательно",
        });
      }

      // Проверка уникальности названия категории
      const existingCategory = await SkillCategory.findOne({
        where: { name: name.trim() },
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: "Категория с таким названием уже существует",
        });
      }

      // Создание категории
      const category = await SkillCategory.create({
        name: name.trim(),
        description: description ? description.trim() : null,
      });

      res.status(201).json({
        success: true,
        message: "Категория успешно создана",
        data: { category },
      });
    } catch (error) {
      console.error("Ошибка создания категории:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить все категории
  async getAllCategories(req, res) {
    try {
      const { search, include_stats } = req.query;

      // Построение условий поиска
      const whereConditions = {};
      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const includeOptions = [];

      // Если нужна статистика, включаем связанные навыки
      if (include_stats === "true") {
        includeOptions.push({
          model: Skill,
          as: "skills",
          attributes: ["id"],
        });
      }

      const categories = await SkillCategory.findAll({
        where: whereConditions,
        include: includeOptions,
        order: [["name", "ASC"]],
      });

      // Добавление статистики если запрошена
      let categoriesWithStats = categories;
      if (include_stats === "true") {
        categoriesWithStats = categories.map((category) => ({
          ...category.toJSON(),
          stats: {
            skillsCount: category.skills ? category.skills.length : 0,
          },
        }));
      }

      res.json({
        success: true,
        data: {
          categories: categoriesWithStats,
          total: categories.length,
        },
      });
    } catch (error) {
      console.error("Ошибка получения категорий:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить категорию по ID
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const { include_skills } = req.query;

      const includeOptions = [];

      if (include_skills === "true") {
        includeOptions.push({
          model: Skill,
          as: "skills",
          attributes: ["id", "name", "description", "created_at"],
        });
      }

      const category = await SkillCategory.findByPk(id, {
        include: includeOptions,
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Категория не найдена",
        });
      }

      // Добавление статистики
      const stats = {
        skillsCount: category.skills ? category.skills.length : 0,
      };

      res.json({
        success: true,
        data: {
          category: {
            ...category.toJSON(),
            stats,
          },
        },
      });
    } catch (error) {
      console.error("Ошибка получения категории:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Обновить категорию
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Проверка существования категории
      const category = await SkillCategory.findByPk(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Категория не найдена",
        });
      }

      // Проверка данных для обновления
      if (!name && description === undefined) {
        return res.status(400).json({
          success: false,
          message: "Необходимо указать данные для обновления",
        });
      }

      // Проверка уникальности названия (если обновляется)
      if (name && name !== category.name) {
        const existingCategory = await SkillCategory.findOne({
          where: {
            name: name.trim(),
            id: { [Op.ne]: id },
          },
        });

        if (existingCategory) {
          return res.status(409).json({
            success: false,
            message: "Категория с таким названием уже существует",
          });
        }
      }

      // Обновление данных
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (description !== undefined)
        updateData.description = description ? description.trim() : null;

      await category.update(updateData);

      res.json({
        success: true,
        message: "Категория успешно обновлена",
        data: { category },
      });
    } catch (error) {
      console.error("Ошибка обновления категории:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Удалить категорию
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const { force } = req.query;

      const category = await SkillCategory.findByPk(id, {
        include: [
          {
            model: Skill,
            as: "skills",
            attributes: ["id"],
          },
        ],
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Категория не найдена",
        });
      }

      // Проверка наличия связанных навыков
      const skillsCount = category.skills ? category.skills.length : 0;

      if (skillsCount > 0 && force !== "true") {
        return res.status(400).json({
          success: false,
          message: `Невозможно удалить категорию. К ней привязано ${skillsCount} навыков. Используйте параметр force=true для принудительного удаления.`,
          data: {
            skillsCount,
            canForceDelete: true,
          },
        });
      }

      // Если есть связанные навыки и force=true, обнуляем category_id у навыков
      if (skillsCount > 0 && force === "true") {
        await Skill.update(
          { category_id: null },
          { where: { category_id: id } }
        );
      }

      // Удаление категории
      await category.destroy();

      res.json({
        success: true,
        message: "Категория успешно удалена",
        data: {
          updatedSkills: force === "true" ? skillsCount : 0,
        },
      });
    } catch (error) {
      console.error("Ошибка удаления категории:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить статистику по всем категориям
  async getCategoriesStats(req, res) {
    try {
      const categories = await SkillCategory.findAll({
        include: [
          {
            model: Skill,
            as: "skills",
            attributes: ["id"],
          },
        ],
      });

      const stats = {
        totalCategories: categories.length,
        categoriesWithSkills: categories.filter(
          (cat) => cat.skills && cat.skills.length > 0
        ).length,
        emptyCategories: categories.filter(
          (cat) => !cat.skills || cat.skills.length === 0
        ).length,
        categoryDistribution: categories
          .map((category) => ({
            id: category.id,
            name: category.name,
            skillsCount: category.skills ? category.skills.length : 0,
          }))
          .sort((a, b) => b.skillsCount - a.skillsCount),
      };

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      console.error("Ошибка получения статистики категорий:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }

  // Получить навыки категории
  async getCategorySkills(req, res) {
    try {
      const { id } = req.params;
      const { include_topics } = req.query;

      // Проверяем существование категории
      const category = await SkillCategory.findByPk(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Категория не найдена",
        });
      }

      // Условия включения связанных данных
      const includeConditions = [
        {
          model: SkillCategory,
          as: "category",
          attributes: ["id", "name"],
        },
      ];

      if (include_topics === "true") {
        includeConditions.push({
          model: Topic,
          as: "topics",
          include: [
            {
              model: TopicStatus,
              as: "status",
              attributes: ["id", "name"],
            },
          ],
        });
      }

      // Получаем навыки категории
      const skills = await Skill.findAll({
        where: {
          category_id: id,
        },
        include: includeConditions,
        order: [["id", "DESC"]],
      });

      // Добавляем статистику для каждого навыка
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
          category: {
            id: category.id,
            name: category.name,
          },
        },
      });
    } catch (error) {
      console.error("Ошибка получения навыков категории:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      });
    }
  }
}

module.exports = new SkillCategoryController();
