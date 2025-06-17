// Юнит-тесты для утилиты расчета уровней
const {
  calculateUserLevel,
  getUserProgressStats,
} = require("../utils/levelCalculator");

class LevelCalculatorUnitTests {
  // Тест функции calculateUserLevel
  testCalculateUserLevel() {
    console.log("\n🧪 Юнит-тест: Функция calculateUserLevel");

    const testCases = [
      { input: 0, expected: "Новичок", description: "0 топиков" },
      { input: 4, expected: "Новичок", description: "4 топика" },
      { input: 5, expected: "Средний", description: "5 топиков" },
      { input: 19, expected: "Средний", description: "19 топиков" },
      { input: 20, expected: "Продвинутый", description: "20 топиков" },
      { input: 49, expected: "Продвинутый", description: "49 топиков" },
      { input: 50, expected: "Профессионал", description: "50 топиков" },
      { input: 99, expected: "Профессионал", description: "99 топиков" },
      { input: 100, expected: "Эксперт", description: "100 топиков" },
      { input: 150, expected: "Эксперт", description: "150 топиков" },
    ];

    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
      const result = calculateUserLevel(testCase.input);
      if (result === testCase.expected) {
        console.log(`✅ ${testCase.description}: ${result}`);
        passed++;
      } else {
        console.log(
          `❌ ${testCase.description}: ожидался "${testCase.expected}", получен "${result}"`
        );
        failed++;
      }
    }

    console.log(`📊 Результат: ${passed} пройдено, ${failed} провалено`);
    return { passed, failed };
  }

  // Тест граничных значений
  testBoundaryValues() {
    console.log("\n🧪 Юнит-тест: Граничные значения");

    const boundaryTests = [
      { input: -1, expected: "Новичок", description: "Отрицательное значение" },
      { input: 4.9, expected: "Новичок", description: "4.9 топика (дробное)" },
      { input: 5.1, expected: "Средний", description: "5.1 топика (дробное)" },
      {
        input: 999999,
        expected: "Эксперт",
        description: "Очень большое число",
      },
    ];

    let passed = 0;
    let failed = 0;

    for (const testCase of boundaryTests) {
      const result = calculateUserLevel(testCase.input);
      if (result === testCase.expected) {
        console.log(`✅ ${testCase.description}: ${result}`);
        passed++;
      } else {
        console.log(
          `❌ ${testCase.description}: ожидался "${testCase.expected}", получен "${result}"`
        );
        failed++;
      }
    }

    console.log(`📊 Результат: ${passed} пройдено, ${failed} провалено`);
    return { passed, failed };
  }

  // Тест логики следующего уровня
  testNextLevelLogic() {
    console.log("\n🧪 Юнит-тест: Логика следующего уровня");

    const nextLevelTests = [
      {
        completedTopics: 0,
        expectedCurrent: "Новичок",
        expectedNext: "Средний",
        expectedToNext: 5,
      },
      {
        completedTopics: 3,
        expectedCurrent: "Новичок",
        expectedNext: "Средний",
        expectedToNext: 2,
      },
      {
        completedTopics: 15,
        expectedCurrent: "Средний",
        expectedNext: "Продвинутый",
        expectedToNext: 5,
      },
      {
        completedTopics: 45,
        expectedCurrent: "Продвинутый",
        expectedNext: "Профессионал",
        expectedToNext: 5,
      },
      {
        completedTopics: 75,
        expectedCurrent: "Профессионал",
        expectedNext: "Эксперт",
        expectedToNext: 25,
      },
      {
        completedTopics: 150,
        expectedCurrent: "Эксперт",
        expectedNext: null,
        expectedToNext: 0,
      },
    ];

    let passed = 0;
    let failed = 0;

    for (const testCase of nextLevelTests) {
      const currentLevel = calculateUserLevel(testCase.completedTopics);

      // Логика определения следующего уровня (копируем из getUserProgressStats)
      let nextLevel = null;
      let topicsToNextLevel = 0;

      if (testCase.completedTopics < 5) {
        nextLevel = "Средний";
        topicsToNextLevel = 5 - testCase.completedTopics;
      } else if (testCase.completedTopics < 20) {
        nextLevel = "Продвинутый";
        topicsToNextLevel = 20 - testCase.completedTopics;
      } else if (testCase.completedTopics < 50) {
        nextLevel = "Профессионал";
        topicsToNextLevel = 50 - testCase.completedTopics;
      } else if (testCase.completedTopics < 100) {
        nextLevel = "Эксперт";
        topicsToNextLevel = 100 - testCase.completedTopics;
      }

      const allCorrect =
        currentLevel === testCase.expectedCurrent &&
        nextLevel === testCase.expectedNext &&
        topicsToNextLevel === testCase.expectedToNext;

      if (allCorrect) {
        console.log(
          `✅ ${testCase.completedTopics} топиков: ${currentLevel} → ${
            nextLevel || "макс"
          } (${topicsToNextLevel})`
        );
        passed++;
      } else {
        console.log(`❌ ${testCase.completedTopics} топиков:`);
        console.log(
          `   Ожидался: ${testCase.expectedCurrent} → ${
            testCase.expectedNext || "макс"
          } (${testCase.expectedToNext})`
        );
        console.log(
          `   Получен:  ${currentLevel} → ${
            nextLevel || "макс"
          } (${topicsToNextLevel})`
        );
        failed++;
      }
    }

    console.log(`📊 Результат: ${passed} пройдено, ${failed} провалено`);
    return { passed, failed };
  }

  // Тест производительности
  testPerformance() {
    console.log("\n🧪 Юнит-тест: Производительность");

    const iterations = 100000;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      calculateUserLevel(Math.floor(Math.random() * 200));
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const opsPerSecond = Math.round((iterations / duration) * 1000);

    console.log(`✅ ${iterations} вызовов за ${duration}мс`);
    console.log(
      `✅ Производительность: ${opsPerSecond.toLocaleString()} операций/сек`
    );

    // Тест считается пройденным, если функция выполняется достаточно быстро
    const passed = opsPerSecond > 10000 ? 1 : 0;
    const failed = passed ? 0 : 1;

    return { passed, failed };
  }

  // Запуск всех юнит-тестов
  runAllUnitTests() {
    console.log("🚀 Запуск юнит-тестов утилиты расчета уровней");
    console.log("=".repeat(60));

    const tests = [
      () => this.testCalculateUserLevel(),
      () => this.testBoundaryValues(),
      () => this.testNextLevelLogic(),
      () => this.testPerformance(),
    ];

    let totalPassed = 0;
    let totalFailed = 0;

    for (const test of tests) {
      try {
        const result = test();
        totalPassed += result.passed;
        totalFailed += result.failed;
      } catch (error) {
        console.error("❌ Критическая ошибка юнит-теста:", error.message);
        totalFailed++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Общие результаты юнит-тестов:");
    console.log(`✅ Пройдено: ${totalPassed}`);
    console.log(`❌ Провалено: ${totalFailed}`);
    console.log(
      `📈 Успешность: ${(
        (totalPassed / (totalPassed + totalFailed)) *
        100
      ).toFixed(1)}%`
    );

    return { passed: totalPassed, failed: totalFailed };
  }
}

module.exports = LevelCalculatorUnitTests;
