const axios = require("axios");
const { Achievement, UserAchievement, User, sequelize } = require("../models");
const AchievementManager = require("../utils/achievementManager");
const DatabaseCleaner = require("../utils/databaseCleaner");
const testData = require("./testData");
const { initializeAchievements } = require("../initializeAchievements");

/**
 * Комплексные тесты системы достижений
 */
class AchievementTests {
  constructor() {
    this.testUserId = null;
    this.testToken = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
    };
  }

  /**
   * Запуск всех тестов достижений
   */
  async runAllTests(baseURL) {
    console.log("🏆 === ТЕСТИРОВАНИЕ СИСТЕМЫ ДОСТИЖЕНИЙ ===");

    try {
      // Подготовка тестовых данных
      await this.setupTestData(baseURL);

      // Запуск тестов
      await this.testAchievementInitialization();
      await this.testAchievementAPIEndpoints(baseURL);
      await this.testAchievementProgressCalculation();
      await this.testAchievementAutoUpdate(baseURL);
      await this.testFirstActionAchievements(baseURL);
      await this.testLevelAchievements();
      await this.testAchievementStatistics(baseURL);
      await this.testLeaderboard(baseURL);

      // Отчёт о результатах
      this.printTestResults();

      return this.testResults.failed === 0;
    } catch (error) {
      console.error("❌ Критическая ошибка в тестах достижений:", error);
      return false;
    }
  }
  /**
   * Подготовка тестовых данных
   */
  async setupTestData(baseURL) {
    console.log("\n🔧 Подготовка тестовых данных...");

    try {
      // Полная очистка базы данных
      await DatabaseCleaner.fullClean();

      // Загружаем базовые данные (статусы, категории)
      await testData.createTestData();

      // Инициализируем достижения
      await initializeAchievements();

      // Создаём тестового пользователя с уникальным email
      const timestamp = Date.now();
      const registerResponse = await axios.post(
        `${baseURL}/api/users/register`,
        {
          name: "Achievement Test User",
          email: `achievement_test_${timestamp}@test.com`,
          password: "testpass123",
        }
      );

      this.testToken = registerResponse.data.data.token;

      // Получаем ID пользователя
      const profileResponse = await axios.get(`${baseURL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${this.testToken}` },
      });

      this.testUserId = profileResponse.data.data.user.id;

      console.log("✅ Тестовые данные подготовлены");
    } catch (error) {
      console.error("❌ Ошибка подготовки тестовых данных:", error.message);
      throw error;
    }
  }

  /**
   * Тест 1: Инициализация достижений
   */
  async testAchievementInitialization() {
    console.log("\n🧪 Тест 1: Инициализация достижений");

    try {
      const achievements = await Achievement.findAll();
      const hasRequiredTypes =
        achievements.some((a) => a.type === "topics_completed") &&
        achievements.some((a) => a.type === "skills_created") &&
        achievements.some((a) => a.type === "notes_written") &&
        achievements.some((a) => a.type === "level_reached") &&
        achievements.some((a) => a.type === "first_action");

      if (achievements.length >= 10 && hasRequiredTypes) {
        this.recordTest(
          "Инициализация достижений",
          true,
          `Создано ${achievements.length} достижений`
        );
      } else {
        this.recordTest(
          "Инициализация достижений",
          false,
          "Недостаточно достижений или отсутствуют необходимые типы"
        );
      }
    } catch (error) {
      this.recordTest("Инициализация достижений", false, error.message);
    }
  }

  /**
   * Тест 2: API эндпоинты
   */
  async testAchievementAPIEndpoints(baseURL) {
    console.log("\n🧪 Тест 2: API эндпоинты достижений");

    // 2.1: GET /api/achievements - все достижения
    try {
      const response = await axios.get(`${baseURL}/api/achievements`);
      const { data } = response.data;

      if (
        response.status === 200 &&
        data.achievements &&
        data.achievements.length > 0
      ) {
        this.recordTest(
          "GET /api/achievements",
          true,
          `Получено ${data.achievements.length} достижений`
        );
      } else {
        this.recordTest(
          "GET /api/achievements",
          false,
          "Некорректный ответ API"
        );
      }
    } catch (error) {
      this.recordTest("GET /api/achievements", false, error.message);
    }

    // 2.2: GET /api/achievements/my - достижения пользователя
    try {
      const response = await axios.get(`${baseURL}/api/achievements/my`, {
        headers: { Authorization: `Bearer ${this.testToken}` },
      });

      if (
        response.status === 200 &&
        response.data.data.achievements !== undefined
      ) {
        this.recordTest(
          "GET /api/achievements/my",
          true,
          "Успешно получены достижения пользователя"
        );
      } else {
        this.recordTest(
          "GET /api/achievements/my",
          false,
          "Некорректный ответ API"
        );
      }
    } catch (error) {
      this.recordTest("GET /api/achievements/my", false, error.message);
    }

    // 2.3: GET /api/achievements/stats - статистика
    try {
      const response = await axios.get(`${baseURL}/api/achievements/stats`, {
        headers: { Authorization: `Bearer ${this.testToken}` },
      });

      const stats = response.data.data.stats;
      if (
        response.status === 200 &&
        typeof stats.total === "number" &&
        typeof stats.completed === "number" &&
        typeof stats.percentage === "number" &&
        typeof stats.points === "number"
      ) {
        this.recordTest(
          "GET /api/achievements/stats",
          true,
          `Статистика: ${stats.completed}/${stats.total} (${stats.percentage}%)`
        );
      } else {
        this.recordTest(
          "GET /api/achievements/stats",
          false,
          "Некорректная структура статистики"
        );
      }
    } catch (error) {
      this.recordTest("GET /api/achievements/stats", false, error.message);
    }
  }

  /**
   * Тест 3: Расчёт прогресса достижений
   */
  async testAchievementProgressCalculation() {
    console.log("\n🧪 Тест 3: Расчёт прогресса достижений");

    try {
      // Получаем достижение за топики
      const topicAchievement = await Achievement.findOne({
        where: { type: "topics_completed", condition_value: 1 },
      });

      if (!topicAchievement) {
        this.recordTest(
          "Расчёт прогресса",
          false,
          "Не найдено достижение за топики"
        );
        return;
      }

      // Проверяем начальный прогресс (должен быть 0)
      const initialProgress = await AchievementManager.calculateProgress(
        this.testUserId,
        topicAchievement
      );

      if (initialProgress === 0) {
        this.recordTest(
          "Начальный прогресс",
          true,
          "Прогресс корректно равен 0"
        );
      } else {
        this.recordTest(
          "Начальный прогресс",
          false,
          `Ожидался 0, получен ${initialProgress}`
        );
      }

      // Проверяем расчёт для достижения за навыки
      const skillAchievement = await Achievement.findOne({
        where: { type: "skills_created", condition_value: 1 },
      });

      if (skillAchievement) {
        const skillProgress = await AchievementManager.calculateProgress(
          this.testUserId,
          skillAchievement
        );
        if (skillProgress === 0) {
          this.recordTest(
            "Прогресс навыков",
            true,
            "Прогресс по навыкам корректен"
          );
        } else {
          this.recordTest(
            "Прогресс навыков",
            false,
            `Ожидался 0, получен ${skillProgress}`
          );
        }
      }
    } catch (error) {
      this.recordTest("Расчёт прогресса", false, error.message);
    }
  }

  /**
   * Тест 4: Автообновление достижений при действиях
   */
  async testAchievementAutoUpdate(baseURL) {
    console.log("\n🧪 Тест 4: Автообновление достижений при действиях");
    try {
      // Создаём категорию с уникальным именем
      const timestamp = Date.now();
      const categoryResponse = await axios.post(`${baseURL}/api/categories`, {
        name: `Тестовая категория для достижений ${timestamp}`,
        description: "Категория для тестирования достижений",
      });

      const categoryId = categoryResponse.data.data.category.id;
      // Создаём навык (должно обновить достижения)
      const skillResponse = await axios.post(
        `${baseURL}/api/skills`,
        {
          name: `Тестовый навык для достижений ${timestamp}`,
          description: "Навык для тестирования достижений",
          category_id: categoryId,
        },
        {
          headers: { Authorization: `Bearer ${this.testToken}` },
        }
      );

      const skillId = skillResponse.data.data.skill.id;

      // Проверяем, что достижение за первый навык обновилось
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Ждём обновления

      const firstSkillAchievement = await Achievement.findOne({
        where: {
          type: "first_action",
          condition_data: { action_type: "first_skill" },
        },
      });

      if (firstSkillAchievement) {
        const userAchievement = await UserAchievement.findOne({
          where: {
            user_id: this.testUserId,
            achievement_id: firstSkillAchievement.id,
          },
        });

        if (userAchievement && userAchievement.progress >= 1) {
          this.recordTest(
            "Автообновление при создании навыка",
            true,
            "Достижение корректно обновлено"
          );
        } else {
          this.recordTest(
            "Автообновление при создании навыка",
            false,
            "Достижение не обновилось"
          );
        }
      }
      // Создаём топик (должно обновить достижения)
      const topicResponse = await axios.post(
        `${baseURL}/api/topics`,
        {
          name: `Тестовый топик для достижений ${timestamp}`,
          description: "Топик для тестирования достижений",
          skill_id: skillId,
          progress: 0,
        },
        {
          headers: { Authorization: `Bearer ${this.testToken}` },
        }
      );

      const topicId = topicResponse.data.data.topic.id;

      // Завершаем топик
      await axios.put(
        `${baseURL}/api/topics/${topicId}/progress`,
        {
          progress: 100,
        },
        {
          headers: { Authorization: `Bearer ${this.testToken}` },
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Ждём обновления

      // Проверяем достижение за первый завершённый топик
      const firstTopicAchievement = await Achievement.findOne({
        where: {
          type: "topics_completed",
          condition_value: 1,
        },
      });

      if (firstTopicAchievement) {
        const userTopicAchievement = await UserAchievement.findOne({
          where: {
            user_id: this.testUserId,
            achievement_id: firstTopicAchievement.id,
          },
        });

        if (userTopicAchievement && userTopicAchievement.is_completed) {
          this.recordTest(
            "Автообновление при завершении топика",
            true,
            "Достижение получено"
          );
        } else {
          this.recordTest(
            "Автообновление при завершении топика",
            false,
            "Достижение не получено"
          );
        }
      }
    } catch (error) {
      this.recordTest("Автообновление достижений", false, error.message);
    }
  }

  /**
   * Тест 5: Достижения за первые действия
   */
  async testFirstActionAchievements(baseURL) {
    console.log("\n🧪 Тест 5: Достижения за первые действия");

    try {
      // Принудительно проверяем все достижения
      await axios.post(
        `${baseURL}/api/achievements/recheck`,
        {},
        {
          headers: { Authorization: `Bearer ${this.testToken}` },
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Ждём обновления

      // Проверяем, сколько достижений получено
      const completedAchievements = await UserAchievement.findAll({
        where: {
          user_id: this.testUserId,
          is_completed: true,
        },
        include: [{ model: Achievement, as: "achievement" }],
      });

      const firstActionAchievements = completedAchievements.filter(
        (ua) => ua.achievement.type === "first_action"
      );

      if (firstActionAchievements.length >= 2) {
        this.recordTest(
          "Достижения за первые действия",
          true,
          `Получено ${firstActionAchievements.length} достижений за первые действия`
        );
      } else {
        this.recordTest(
          "Достижения за первые действия",
          false,
          `Получено только ${firstActionAchievements.length} достижений`
        );
      }
    } catch (error) {
      this.recordTest("Достижения за первые действия", false, error.message);
    }
  }

  /**
   * Тест 6: Достижения за уровни
   */
  async testLevelAchievements() {
    console.log("\n🧪 Тест 6: Достижения за уровни");

    try {
      // Симулируем повышение уровня пользователя
      await User.update(
        { level: "базовый" },
        { where: { id: this.testUserId } }
      );

      // Проверяем достижение
      await AchievementManager.checkAchievements(
        this.testUserId,
        "level_changed"
      );

      const levelAchievement = await Achievement.findOne({
        where: {
          type: "level_reached",
          condition_value: 2, // базовый уровень
        },
      });

      if (levelAchievement) {
        const userLevelAchievement = await UserAchievement.findOne({
          where: {
            user_id: this.testUserId,
            achievement_id: levelAchievement.id,
          },
        });

        const progress = await AchievementManager.calculateProgress(
          this.testUserId,
          levelAchievement
        );

        if (progress >= 2) {
          this.recordTest(
            "Достижения за уровни",
            true,
            `Прогресс уровня: ${progress}`
          );
        } else {
          this.recordTest(
            "Достижения за уровни",
            false,
            `Прогресс уровня некорректен: ${progress}`
          );
        }
      } else {
        this.recordTest(
          "Достижения за уровни",
          false,
          "Не найдено достижение за уровень"
        );
      }
    } catch (error) {
      this.recordTest("Достижения за уровни", false, error.message);
    }
  }

  /**
   * Тест 7: Статистика достижений
   */
  async testAchievementStatistics(baseURL) {
    console.log("\n🧪 Тест 7: Статистика достижений");

    try {
      const response = await axios.get(`${baseURL}/api/achievements/stats`, {
        headers: { Authorization: `Bearer ${this.testToken}` },
      });

      const stats = response.data.data.stats;

      // Проверяем корректность расчёта статистики
      const actualCompleted = await UserAchievement.count({
        where: { user_id: this.testUserId, is_completed: true },
      });

      const actualTotal = await Achievement.count({
        where: { is_active: true },
      });

      if (stats.completed === actualCompleted && stats.total === actualTotal) {
        this.recordTest(
          "Статистика достижений",
          true,
          `${stats.completed}/${stats.total} (${stats.percentage}%) - ${stats.points} очков`
        );
      } else {
        this.recordTest(
          "Статистика достижений",
          false,
          `Ожидалось ${actualCompleted}/${actualTotal}, получено ${stats.completed}/${stats.total}`
        );
      }
    } catch (error) {
      this.recordTest("Статистика достижений", false, error.message);
    }
  }

  /**
   * Тест 8: Таблица лидеров
   */
  async testLeaderboard(baseURL) {
    console.log("\n🧪 Тест 8: Таблица лидеров");

    try {
      const response = await axios.get(
        `${baseURL}/api/achievements/leaderboard?limit=5`
      );

      const leaderboard = response.data.data.leaderboard;

      if (Array.isArray(leaderboard)) {
        const hasTestUser = leaderboard.some(
          (entry) => entry.user && entry.user.id === this.testUserId
        );

        if (hasTestUser) {
          this.recordTest(
            "Таблица лидеров",
            true,
            `Найден тестовый пользователь в таблице из ${leaderboard.length} записей`
          );
        } else {
          this.recordTest(
            "Таблица лидеров",
            true,
            `Таблица лидеров работает (${leaderboard.length} записей)`
          );
        }
      } else {
        this.recordTest(
          "Таблица лидеров",
          false,
          "Некорректный формат таблицы лидеров"
        );
      }
    } catch (error) {
      this.recordTest("Таблица лидеров", false, error.message);
    }
  }

  /**
   * Записать результат теста
   */
  recordTest(testName, passed, details = "") {
    this.testResults.total++;
    if (passed) {
      this.testResults.passed++;
      console.log(`✅ ${testName} - ${details}`);
    } else {
      this.testResults.failed++;
      console.log(`❌ ${testName} - ${details}`);
    }

    this.testResults.details.push({
      name: testName,
      passed,
      details,
    });
  }

  /**
   * Вывод результатов тестирования
   */
  printTestResults() {
    console.log("\n🏆 === РЕЗУЛЬТАТЫ ТЕСТОВ ДОСТИЖЕНИЙ ===");
    console.log(`✅ Успешно: ${this.testResults.passed}`);
    console.log(`❌ Неудачно: ${this.testResults.failed}`);
    console.log(`📊 Всего: ${this.testResults.total}`);

    const successRate =
      this.testResults.total > 0
        ? Math.round((this.testResults.passed / this.testResults.total) * 100)
        : 0;

    console.log(`🎯 Процент успеха: ${successRate}%`);

    if (this.testResults.failed === 0) {
      console.log("🎉 Все тесты системы достижений прошли успешно!");
    } else {
      console.log("⚠️ Некоторые тесты системы достижений завершились неудачно");
    }
  }

  /**
   * Быстрый тест основных функций
   */
  async runQuickTest(baseURL) {
    console.log("🏆 === БЫСТРЫЙ ТЕСТ ДОСТИЖЕНИЙ ===");

    try {
      await this.setupTestData(baseURL);
      await this.testAchievementInitialization();
      await this.testAchievementAPIEndpoints(baseURL);

      this.printTestResults();
      return this.testResults.failed === 0;
    } catch (error) {
      console.error("❌ Ошибка быстрого теста:", error);
      return false;
    }
  }
}

module.exports = AchievementTests;
