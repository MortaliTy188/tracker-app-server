// Главный файл для запуска всех тестов системы уровней
const axios = require("axios");
const UserLevelTests = require("./userLevelTests");
const LevelCalculatorUnitTests = require("./levelCalculatorUnitTests");
const LevelAPITests = require("./levelAPITests");

class LevelTestSuite {
  constructor(baseURL = "http://localhost:3000") {
    this.baseURL = baseURL;
    this.axios = axios;
  }

  // Проверка доступности сервера
  async checkServerAvailability() {
    try {
      const response = await this.axios.get(`${this.baseURL}/api/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      // Если endpoint /api/health не существует, попробуем любой другой
      try {
        await this.axios.get(this.baseURL, { timeout: 5000 });
        return true;
      } catch (secondError) {
        return false;
      }
    }
  }

  // Запуск юнит-тестов (не требуют сервера)
  async runUnitTests() {
    console.log("🔧 Запуск юнит-тестов (не требуют сервера)");
    console.log("=".repeat(60));

    const unitTests = new LevelCalculatorUnitTests();
    return await unitTests.runAllUnitTests();
  }

  // Запуск интеграционных тестов (требуют сервера)
  async runIntegrationTests() {
    console.log("\n🌐 Проверка доступности сервера...");

    const serverAvailable = await this.checkServerAvailability();
    if (!serverAvailable) {
      console.log("❌ Сервер недоступен. Интеграционные тесты пропущены.");
      console.log("💡 Запустите сервер командой: npm start");
      return { passed: 0, failed: 0, skipped: true };
    }

    console.log("✅ Сервер доступен, запуск интеграционных тестов...");

    // Запуск тестов уровней пользователя
    const userLevelTests = new UserLevelTests();
    const userLevelResults = await userLevelTests.runAllTests(
      this.axios,
      this.baseURL
    );

    // Запуск API тестов
    const apiTests = new LevelAPITests();
    const apiResults = await apiTests.runAllAPITests(this.axios, this.baseURL);

    return {
      passed: userLevelResults.passed + apiResults.passed,
      failed: userLevelResults.failed + apiResults.failed,
      userLevelResults,
      apiResults,
    };
  }

  // Запуск всех тестов
  async runAllTests() {
    console.log("🎯 ПОЛНЫЙ НАБОР ТЕСТОВ СИСТЕМЫ УРОВНЕЙ ПОЛЬЗОВАТЕЛЯ");
    console.log("=".repeat(70));
    console.log(`🕒 Время запуска: ${new Date().toLocaleString()}`);
    console.log(`🌐 Базовый URL: ${this.baseURL}`);
    console.log("=".repeat(70));

    const startTime = Date.now();

    // Юнит-тесты
    const unitResults = await this.runUnitTests();

    // Интеграционные тесты
    const integrationResults = await this.runIntegrationTests();

    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    // Общая статистика
    const totalPassed = unitResults.passed + integrationResults.passed;
    const totalFailed = unitResults.failed + integrationResults.failed;
    const totalTests = totalPassed + totalFailed;
    const successRate =
      totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

    console.log("\n" + "=".repeat(70));
    console.log("📊 ОБЩИЕ РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ");
    console.log("=".repeat(70));
    console.log(`⏱️  Время выполнения: ${totalTime} секунд`);
    console.log(`🧪 Всего тестов: ${totalTests}`);
    console.log(`✅ Пройдено: ${totalPassed}`);
    console.log(`❌ Провалено: ${totalFailed}`);
    console.log(`📈 Успешность: ${successRate}%`);

    if (integrationResults.skipped) {
      console.log(`⏭️  Пропущено: интеграционные тесты (сервер недоступен)`);
    }

    console.log("\n📋 Детализация по категориям:");
    console.log(
      `   🔧 Юнит-тесты: ${unitResults.passed}/${
        unitResults.passed + unitResults.failed
      }`
    );

    if (!integrationResults.skipped) {
      console.log(
        `   👤 Тесты уровней: ${integrationResults.userLevelResults.passed}/${
          integrationResults.userLevelResults.passed +
          integrationResults.userLevelResults.failed
        }`
      );
      console.log(
        `   🌐 API тесты: ${integrationResults.apiResults.passed}/${
          integrationResults.apiResults.passed +
          integrationResults.apiResults.failed
        }`
      );
    }

    // Рекомендации
    console.log("\n💡 Рекомендации:");
    if (totalFailed === 0) {
      console.log(
        "   🎉 Все тесты пройдены! Система уровней работает корректно."
      );
    } else {
      console.log("   🔍 Обратите внимание на проваленные тесты выше.");
      console.log("   🛠️  Проверьте логику расчета уровней и API endpoints.");
    }

    if (integrationResults.skipped) {
      console.log(
        "   🚀 Запустите сервер для выполнения интеграционных тестов."
      );
    }

    console.log("\n" + "=".repeat(70));

    return {
      success: totalFailed === 0,
      totalTests,
      totalPassed,
      totalFailed,
      successRate: parseFloat(successRate),
      executionTime: parseFloat(totalTime),
      details: {
        unitTests: unitResults,
        integrationTests: integrationResults,
      },
    };
  }

  // Быстрый тест (только основные функции)
  async runQuickTest() {
    console.log("⚡ БЫСТРЫЙ ТЕСТ СИСТЕМЫ УРОВНЕЙ");
    console.log("=".repeat(50));

    // Только тест функции расчета уровня
    const unitTests = new LevelCalculatorUnitTests();
    const result = unitTests.testCalculateUserLevel();

    console.log("\n📊 Результат быстрого теста:");
    console.log(`✅ Пройдено: ${result.passed}`);
    console.log(`❌ Провалено: ${result.failed}`);

    return result.failed === 0;
  }
}

// Функция для запуска тестов из командной строки
async function runTestsFromCLI() {
  const args = process.argv.slice(2);
  const testSuite = new LevelTestSuite();

  if (args.includes("--quick")) {
    const success = await testSuite.runQuickTest();
    process.exit(success ? 0 : 1);
  } else if (args.includes("--unit-only")) {
    const results = await testSuite.runUnitTests();
    process.exit(results.failed === 0 ? 0 : 1);
  } else {
    const results = await testSuite.runAllTests();
    process.exit(results.success ? 0 : 1);
  }
}

// Запуск тестов, если файл вызван напрямую
if (require.main === module) {
  runTestsFromCLI().catch((error) => {
    console.error("❌ Критическая ошибка запуска тестов:", error);
    process.exit(1);
  });
}

module.exports = {
  LevelTestSuite,
  UserLevelTests,
  LevelCalculatorUnitTests,
  LevelAPITests,
};
