// Главный файл для запуска всех тестов
const axios = require("axios");
const { sequelize } = require("../models");
const DatabaseCleaner = require("../utils/databaseCleaner");
const PortFinder = require("../utils/portFinder");
const testData = require("./testData");
const userTests = require("./userApiTest");
const skillTests = require("./skillTests");
const categoryTests = require("./categoryTests");
const topicTests = require("./topicTests");
const noteTests = require("./noteTests");
const statusTests = require("./statusTests");
const avatarTests = require("./avatarTests");
const FeedbackTests = require("./feedbackTests");
const AchievementTests = require("./achievementTests");

class TestRunner {
  constructor() {
    this.baseURL = null; // Будет установлен после обнаружения порта
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
    };
  }
  // Очистка базы данных перед тестами
  async clearDatabase() {
    try {
      await DatabaseCleaner.fullClean();
    } catch (error) {
      console.error("❌ Ошибка очистки базы данных:", error.message);
      throw error;
    }
  }

  // Загрузка тестовых данных
  async loadTestData() {
    try {
      console.log("📦 Загрузка тестовых данных...");
      await testData.createTestData();
      console.log("✅ Тестовые данные загружены");
    } catch (error) {
      console.error("❌ Ошибка загрузки тестовых данных:", error.message);
      throw error;
    }
  }

  // Проверка доступности сервера  // Проверка доступности сервера
  async checkServerAvailability() {
    try {
      // Если baseURL еще не установлен, автоматически определяем порт
      if (!this.baseURL) {
        await this.discoverServerPort();
      }

      console.log(`🔍 Проверка доступности сервера на ${this.baseURL}...`);
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });

      if (response.data.status === "healthy") {
        console.log("✅ Сервер доступен");
        return true;
      } else {
        console.log("❌ Сервер недоступен");
        return false;
      }
    } catch (error) {
      console.log("❌ Сервер недоступен:", error.message);
      console.log("💡 Убедитесь, что сервер запущен: npm run dev");
      return false;
    }
  }

  // Запись результата теста
  recordTestResult(testName, success, details = "") {
    this.testResults.total++;
    if (success) {
      this.testResults.passed++;
      console.log(`✅ ${testName}`);
    } else {
      this.testResults.failed++;
      console.log(`❌ ${testName} - ${details}`);
    }

    this.testResults.details.push({
      name: testName,
      success,
      details,
    });
  }

  // Автоматическое определение порта сервера
  async discoverServerPort() {
    const DEFAULT_PORT = 3000;
    const MAX_PORT_CHECK = 3010;

    console.log("🔍 Поиск запущенного сервера...");

    for (let port = DEFAULT_PORT; port <= MAX_PORT_CHECK; port++) {
      try {
        const response = await axios.get(`http://localhost:${port}/health`, {
          timeout: 2000,
        });

        if (response.data.status === "healthy") {
          this.baseURL = `http://localhost:${port}`;
          console.log(`✅ Сервер найден на порту ${port}`);
          return port;
        }
      } catch (error) {
        // Порт не отвечает, продолжаем поиск
        continue;
      }
    }

    // Если сервер не найден, используем порт по умолчанию
    this.baseURL = `http://localhost:${DEFAULT_PORT}`;
    console.log(
      `⚠️  Сервер не найден, используем порт по умолчанию: ${DEFAULT_PORT}`
    );
    return DEFAULT_PORT;
  }

  // Запуск всех тестов
  async runAllTests() {
    console.log("🚀 Запуск полного тестирования API Tracker App");
    console.log("=============================================\n");

    try {
      // 1. Проверка сервера
      const serverAvailable = await this.checkServerAvailability();
      if (!serverAvailable) {
        console.log("\n❌ Тестирование прервано: сервер недоступен");
        return false;
      }

      // 2. Очистка базы данных
      await this.clearDatabase();

      // 3. Загрузка тестовых данных
      await this.loadTestData();

      console.log("\n📋 Начинаем тестирование API...\n"); // 4. Тесты пользователей
      console.log("👤 Тестирование API пользователей");
      console.log("================================");
      const token = await this.runUserTests();

      // 5. Тесты статусов
      console.log("\n🏷️  Тестирование API статусов");
      console.log("=============================");
      await this.runStatusTests();

      // 6. Тесты категорий
      console.log("\n📁 Тестирование API категорий");
      console.log("=============================");
      await this.runCategoryTests();

      // 7. Тесты навыков
      console.log("\n🎯 Тестирование API навыков");
      console.log("===========================");
      await this.runSkillTests();

      // 8. Тесты тем
      console.log("\n📚 Тестирование API тем");
      console.log("=======================");
      await this.runTopicTests();

      // 9. Тесты заметок
      console.log("\n📝 Тестирование API заметок");
      console.log("===========================");
      await this.runNoteTests();

      // 10. Тесты аватарок (требуют токен авторизации)
      if (token) {
        console.log("\n🖼️ Тестирование API аватарок");
        console.log("=============================");
        await this.runAvatarTests(token);
      } else {
        console.log("\n⚠️ Пропускаем тесты аватарок - нет токена авторизации");
      } // 11. Тесты обратной связи
      console.log("\n📬 Тестирование API обратной связи");
      console.log("==================================");
      await this.runFeedbackTests();

      // 12. Тесты системы достижений
      console.log("\n🏆 Тестирование системы достижений");
      console.log("==================================");
      await this.runAchievementTests();

      // Отчет о результатах
      this.printTestResults();

      return this.testResults.failed === 0;
    } catch (error) {
      console.error("\n❌ Критическая ошибка при тестировании:", error.message);
      return false;
    }
  }
  // Запуск тестов пользователей
  async runUserTests() {
    try {
      const token = await userTests.testRegistration(axios, this.baseURL);
      this.recordTestResult("Регистрация пользователя", !!token);

      if (token) {
        const profile = await userTests.testGetProfile(
          axios,
          this.baseURL,
          token
        );
        this.recordTestResult("Получение профиля", !!profile);

        const updated = await userTests.testUpdateProfile(
          axios,
          this.baseURL,
          token,
          {
            name: "Обновленное Имя",
          }
        );
        this.recordTestResult("Обновление профиля", !!updated);

        const fullInfo = await userTests.testGetFullInfo(
          axios,
          this.baseURL,
          token
        );
        this.recordTestResult("Получение полной информации", !!fullInfo);
      }

      return token; // Возвращаем токен для использования в других тестах
    } catch (error) {
      this.recordTestResult("Тесты пользователей", false, error.message);
      return null;
    }
  }

  // Запуск тестов статусов
  async runStatusTests() {
    try {
      await statusTests.runAllTests(axios, this.baseURL);
      this.recordTestResult("Тестирование статусов", true);
    } catch (error) {
      this.recordTestResult("Тестирование статусов", false, error.message);
    }
  }

  // Запуск тестов категорий
  async runCategoryTests() {
    try {
      await categoryTests.runAllTests(axios, this.baseURL);
      this.recordTestResult("Тестирование категорий", true);
    } catch (error) {
      this.recordTestResult("Тестирование категорий", false, error.message);
    }
  }

  // Запуск тестов навыков
  async runSkillTests() {
    try {
      await skillTests.runAllTests(axios, this.baseURL);
      this.recordTestResult("Тестирование навыков", true);
    } catch (error) {
      this.recordTestResult("Тестирование навыков", false, error.message);
    }
  }

  // Запуск тестов тем
  async runTopicTests() {
    try {
      await topicTests.runAllTests(axios, this.baseURL);
      this.recordTestResult("Тестирование тем", true);
    } catch (error) {
      this.recordTestResult("Тестирование тем", false, error.message);
    }
  }

  // Запуск тестов заметок
  async runNoteTests() {
    try {
      await noteTests.runAllTests(axios, this.baseURL);
      this.recordTestResult("Тестирование заметок", true);
    } catch (error) {
      this.recordTestResult("Тестирование заметок", false, error.message);
    }
  }

  // Запуск тестов аватарок
  async runAvatarTests(token) {
    try {
      console.log("\n🖼️ Запуск тестов аватарок...");
      const results = await avatarTests.runAllTests(axios, this.baseURL, token);

      this.recordTestResult("Тестирование аватарок", results.success);

      // Записываем детальные результаты
      if (results.details && Array.isArray(results.details)) {
        results.details.forEach((test) => {
          this.recordTestResult(
            `Avatar: ${test.test}`,
            test.status === "passed",
            test.error
          );
        });
      }

      return results.success;
    } catch (error) {
      console.error("Критическая ошибка в тестах аватарок:", error);
      this.recordTestResult("Тестирование аватарок", false, error.message);
      return false;
    }
  }

  // Запуск тестов обратной связи
  async runFeedbackTests() {
    try {
      const feedbackTests = new FeedbackTests(this.baseURL);
      const results = await feedbackTests.runAllTests();

      // Записываем результаты отдельных тестов
      if (results && results.details && Array.isArray(results.details)) {
        results.details.forEach((test) => {
          this.recordTestResult(
            `Feedback: ${test.name}`,
            test.status === "passed",
            test.error
          );
        });
      }

      const testsPassed =
        results && typeof results.failed === "number"
          ? results.failed === 0
          : false;
      this.recordTestResult("Тестирование обратной связи", testsPassed);
    } catch (error) {
      this.recordTestResult(
        "Тестирование обратной связи",
        false,
        error.message
      );
    }
  }

  // Запуск тестов системы достижений
  async runAchievementTests() {
    try {
      const achievementTests = new AchievementTests();
      const success = await achievementTests.runAllTests(this.baseURL);

      // Интегрируем результаты в общую статистику
      this.testResults.passed += achievementTests.testResults.passed;
      this.testResults.failed += achievementTests.testResults.failed;
      this.testResults.total += achievementTests.testResults.total;

      // Добавляем детали тестов
      achievementTests.testResults.details.forEach((detail) => {
        this.testResults.details.push({
          name: `Достижения: ${detail.name}`,
          success: detail.passed,
          details: detail.details,
        });
      });

      return success;
    } catch (error) {
      console.error("❌ Ошибка в тестах достижений:", error.message);
      this.recordTestResult("Система достижений", false, error.message);
      return false;
    }
  }

  // Вывод результатов тестирования
  printTestResults() {
    console.log("\n📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ");
    console.log("==========================");
    console.log(`Всего тестов: ${this.testResults.total}`);
    console.log(`Прошло успешно: ${this.testResults.passed}`);
    console.log(`Провалилось: ${this.testResults.failed}`);
    console.log(
      `Процент успеха: ${Math.round(
        (this.testResults.passed / this.testResults.total) * 100
      )}%`
    );

    if (this.testResults.failed > 0) {
      console.log("\n❌ Провалившиеся тесты:");
      this.testResults.details
        .filter((test) => !test.success)
        .forEach((test) => {
          console.log(`   - ${test.name}: ${test.details}`);
        });
    }

    if (this.testResults.failed === 0) {
      console.log("\n🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!");
    } else {
      console.log("\n⚠️  Некоторые тесты провалились. Проверьте логи выше.");
    }
  }
}

// Запуск тестов если файл вызывается напрямую
if (require.main === module) {
  const runner = new TestRunner();

  runner
    .runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Критическая ошибка:", error);
      process.exit(1);
    });
}

module.exports = TestRunner;
