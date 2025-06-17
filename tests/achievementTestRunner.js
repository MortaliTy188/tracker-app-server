// Автономный запуск тестов системы достижений
const AchievementTests = require("./achievementTests");

class AchievementTestRunner {
  constructor() {
    this.baseURL = "http://localhost:3000";
  }

  async run() {
    console.log("🏆 === ЗАПУСК ТЕСТОВ СИСТЕМЫ ДОСТИЖЕНИЙ ===");
    console.log("Убедитесь, что сервер запущен на " + this.baseURL);
    console.log("=".repeat(50));

    const achievementTests = new AchievementTests();

    try {
      const success = await achievementTests.runAllTests(this.baseURL);

      if (success) {
        console.log("\n🎉 Все тесты системы достижений прошли успешно!");
        process.exit(0);
      } else {
        console.log("\n❌ Некоторые тесты провалились");
        process.exit(1);
      }
    } catch (error) {
      console.error("\n💥 Критическая ошибка:", error);
      process.exit(1);
    }
  }

  async runQuick() {
    console.log("🏆 === БЫСТРЫЙ ТЕСТ ДОСТИЖЕНИЙ ===");
    console.log("Убедитесь, что сервер запущен на " + this.baseURL);
    console.log("=".repeat(40));

    const achievementTests = new AchievementTests();

    try {
      const success = await achievementTests.runQuickTest(this.baseURL);

      if (success) {
        console.log("\n🎉 Быстрый тест прошёл успешно!");
        process.exit(0);
      } else {
        console.log("\n❌ Быстрый тест провалился");
        process.exit(1);
      }
    } catch (error) {
      console.error("\n💥 Критическая ошибка:", error);
      process.exit(1);
    }
  }
}

// Запуск если файл вызывается напрямую
if (require.main === module) {
  const args = process.argv.slice(2);
  const runner = new AchievementTestRunner();

  if (args.includes("--quick")) {
    runner.runQuick();
  } else {
    runner.run();
  }
}

module.exports = AchievementTestRunner;
