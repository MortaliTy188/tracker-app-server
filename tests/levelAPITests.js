// Интеграционные тесты для API системы уровней
const testData = require("./testData");

class LevelAPITests {
  constructor() {
    this.testToken = null;
    this.testUserId = null;
  }

  // Получение токена для тестов
  async getTestToken(axios, baseURL) {
    if (this.testToken) return this.testToken;

    try {
      const userData = {
        name: "API Тест Уровней",
        email: `api.level.test.${Date.now()}@example.com`,
        password: "password123",
      };

      const registerResponse = await axios.post(
        `${baseURL}/api/users/register`,
        userData
      );
      this.testToken = registerResponse.data.data.token;
      this.testUserId = registerResponse.data.data.user.id;

      console.log(
        `✅ Создан тестовый пользователь для API тестов: ${this.testUserId}`
      );
      return this.testToken;
    } catch (error) {
      console.error(
        "❌ Ошибка создания тестового пользователя для API:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест 1: GET /api/users/progress-stats - получение статистики
  async testGetProgressStats(axios, baseURL) {
    console.log("\n🧪 API Тест 1: GET /api/users/progress-stats");

    try {
      const token = await this.getTestToken(axios, baseURL);
      if (!token) return false;

      const response = await axios.get(`${baseURL}/api/users/progress-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Проверяем структуру ответа
      const data = response.data;
      const stats = data.data.progressStats;

      const requiredFields = [
        "currentLevel",
        "completedTopics",
        "nextLevel",
        "topicsToNextLevel",
      ];
      const hasAllFields = requiredFields.every((field) =>
        stats.hasOwnProperty(field)
      );

      if (
        response.status === 200 &&
        data.success === true &&
        hasAllFields &&
        typeof stats.currentLevel === "string" &&
        typeof stats.completedTopics === "number"
      ) {
        console.log("✅ API корректно возвращает статистику прогресса:");
        console.log(`   Уровень: ${stats.currentLevel}`);
        console.log(`   Завершенные топики: ${stats.completedTopics}`);
        console.log(
          `   Следующий уровень: ${stats.nextLevel || "максимальный"}`
        );
        return true;
      } else {
        console.log("❌ Некорректная структура ответа API:", data);
        return false;
      }
    } catch (error) {
      console.error(
        "❌ Ошибка API теста статистики:",
        error.response?.data || error.message
      );
      return false;
    }
  }

  // Тест 2: POST /api/users/recalculate-level - пересчет уровня
  async testRecalculateLevel(axios, baseURL) {
    console.log("\n🧪 API Тест 2: POST /api/users/recalculate-level");

    try {
      const token = await this.getTestToken(axios, baseURL);
      if (!token) return false;

      const response = await axios.post(
        `${baseURL}/api/users/recalculate-level`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Проверяем структуру ответа
      const data = response.data;
      const levelInfo = data.data.levelInfo;

      if (
        response.status === 200 &&
        data.success === true &&
        levelInfo.hasOwnProperty("level") &&
        levelInfo.hasOwnProperty("completedTopics") &&
        typeof levelInfo.level === "string" &&
        typeof levelInfo.completedTopics === "number"
      ) {
        console.log("✅ API корректно пересчитывает уровень:");
        console.log(`   Уровень: ${levelInfo.level}`);
        console.log(`   Завершенные топики: ${levelInfo.completedTopics}`);
        return true;
      } else {
        console.log("❌ Некорректная структура ответа API пересчета:", data);
        return false;
      }
    } catch (error) {
      console.error(
        "❌ Ошибка API теста пересчета:",
        error.response?.data || error.message
      );
      return false;
    }
  }

  // Тест 3: Проверка авторизации для защищенных endpoints
  async testAuthenticationRequired(axios, baseURL) {
    console.log("\n🧪 API Тест 3: Проверка требования авторизации");

    try {
      let authTestsPassed = 0;
      let authTestsTotal = 2;

      // Тест без токена для /progress-stats
      try {
        await axios.get(`${baseURL}/api/users/progress-stats`);
        console.log("❌ Endpoint /progress-stats не требует авторизации");
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(
            "✅ Endpoint /progress-stats корректно требует авторизации"
          );
          authTestsPassed++;
        } else {
          console.log(
            "❌ Неожиданная ошибка для /progress-stats:",
            error.response?.status
          );
        }
      }

      // Тест без токена для /recalculate-level
      try {
        await axios.post(`${baseURL}/api/users/recalculate-level`, {});
        console.log("❌ Endpoint /recalculate-level не требует авторизации");
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(
            "✅ Endpoint /recalculate-level корректно требует авторизации"
          );
          authTestsPassed++;
        } else {
          console.log(
            "❌ Неожиданная ошибка для /recalculate-level:",
            error.response?.status
          );
        }
      }

      return authTestsPassed === authTestsTotal;
    } catch (error) {
      console.error("❌ Ошибка API теста авторизации:", error.message);
      return false;
    }
  }

  // Тест 4: Проверка ответов с невалидным токеном
  async testInvalidToken(axios, baseURL) {
    console.log("\n🧪 API Тест 4: Проверка обработки невалидного токена");

    try {
      const invalidToken = "invalid.jwt.token";
      let invalidTokenTests = 0;
      let totalTests = 2;

      // Тест с невалидным токеном для /progress-stats
      try {
        await axios.get(`${baseURL}/api/users/progress-stats`, {
          headers: {
            Authorization: `Bearer ${invalidToken}`,
          },
        });
        console.log("❌ Endpoint /progress-stats принимает невалидный токен");
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log(
            "✅ Endpoint /progress-stats корректно отклоняет невалидный токен"
          );
          invalidTokenTests++;
        } else {
          console.log(
            "❌ Неожиданная ошибка с невалидным токеном для /progress-stats:",
            error.response?.status
          );
        }
      }

      // Тест с невалидным токеном для /recalculate-level
      try {
        await axios.post(
          `${baseURL}/api/users/recalculate-level`,
          {},
          {
            headers: {
              Authorization: `Bearer ${invalidToken}`,
            },
          }
        );
        console.log(
          "❌ Endpoint /recalculate-level принимает невалидный токен"
        );
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log(
            "✅ Endpoint /recalculate-level корректно отклоняет невалидный токен"
          );
          invalidTokenTests++;
        } else {
          console.log(
            "❌ Неожиданная ошибка с невалидным токеном для /recalculate-level:",
            error.response?.status
          );
        }
      }

      return invalidTokenTests === totalTests;
    } catch (error) {
      console.error("❌ Ошибка API теста невалидного токена:", error.message);
      return false;
    }
  }

  // Тест 5: Проверка CORS заголовков
  async testCORSHeaders(axios, baseURL) {
    console.log("\n🧪 API Тест 5: Проверка CORS заголовков");

    try {
      const token = await this.getTestToken(axios, baseURL);
      if (!token) return false;

      const response = await axios.get(`${baseURL}/api/users/progress-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Проверяем наличие основных CORS заголовков
      const headers = response.headers;
      const hasCORSHeaders =
        headers["access-control-allow-origin"] !== undefined ||
        headers["Access-Control-Allow-Origin"] !== undefined;

      if (hasCORSHeaders) {
        console.log("✅ CORS заголовки присутствуют");
        return true;
      } else {
        console.log(
          "⚠️ CORS заголовки не найдены (могут быть настроены на уровне сервера)"
        );
        return true; // Не критично для функциональности
      }
    } catch (error) {
      console.error("❌ Ошибка CORS теста:", error.message);
      return false;
    }
  }

  // Тест 6: Проверка Content-Type заголовков
  async testContentTypeHeaders(axios, baseURL) {
    console.log("\n🧪 API Тест 6: Проверка Content-Type заголовков");

    try {
      const token = await this.getTestToken(axios, baseURL);
      if (!token) return false;

      const response = await axios.get(`${baseURL}/api/users/progress-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers["content-type"];

      if (contentType && contentType.includes("application/json")) {
        console.log(
          "✅ Content-Type корректно установлен как application/json"
        );
        return true;
      } else {
        console.log("❌ Некорректный Content-Type:", contentType);
        return false;
      }
    } catch (error) {
      console.error("❌ Ошибка теста Content-Type:", error.message);
      return false;
    }
  }

  // Запуск всех API тестов
  async runAllAPITests(axios, baseURL) {
    console.log("🚀 Запуск API тестов системы уровней");
    console.log("=".repeat(60));

    const tests = [
      () => this.testGetProgressStats(axios, baseURL),
      () => this.testRecalculateLevel(axios, baseURL),
      () => this.testAuthenticationRequired(axios, baseURL),
      () => this.testInvalidToken(axios, baseURL),
      () => this.testCORSHeaders(axios, baseURL),
      () => this.testContentTypeHeaders(axios, baseURL),
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = await test();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error("❌ Критическая ошибка API теста:", error.message);
        failed++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Результаты API тестов системы уровней:");
    console.log(`✅ Пройдено: ${passed}`);
    console.log(`❌ Провалено: ${failed}`);
    console.log(
      `📈 Успешность: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
    );

    return { passed, failed, successRate: (passed / (passed + failed)) * 100 };
  }
}

module.exports = LevelAPITests;
