const axios = require("axios");

class ActivityTests {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
    };
  }
  recordResult(testName, success, details = "") {
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
  async runAllTests(baseURL, token) {
    try {
      console.log("🚀 Запуск тестирования системы активности...\n");

      // 1. Тест получения моей активности
      await this.testGetMyActivity(baseURL, token);

      // 2. Тест получения статистики активности
      await this.testGetActivityStats(baseURL, token);

      // 3. Тест создания записи активности через действие
      await this.testActivityLogging(baseURL, token);

      // 4. Тест фильтрации активности
      await this.testActivityFiltering(baseURL, token);

      // 5. Тест пагинации активности
      await this.testActivityPagination(baseURL, token);

      const success = this.testResults.failed === 0;
      console.log(`\n📊 Результаты тестирования активности:`);
      console.log(`Всего тестов: ${this.testResults.total}`);
      console.log(`Прошло: ${this.testResults.passed}`);
      console.log(`Провалено: ${this.testResults.failed}`);
      console.log(`Статус: ${success ? "✅" : "❌"}`);

      return success;
    } catch (error) {
      console.error(
        "❌ Критическая ошибка в тестах активности:",
        error.message
      );
      return false;
    }
  }
  async testGetMyActivity(baseURL, token) {
    try {
      const response = await axios.get(`${baseURL}/api/activity/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 && response.data.success) {
        // Проверим структуру ответа
        const data = response.data.data;
        if (
          data &&
          typeof data.totalCount === "number" &&
          Array.isArray(data.logs)
        ) {
          this.recordResult("Получение моей активности", true);
          return response.data;
        } else {
          this.recordResult(
            "Получение моей активности",
            false,
            "Неправильная структура ответа"
          );
          return null;
        }
      } else {
        this.recordResult(
          "Получение моей активности",
          false,
          "Неверный статус ответа"
        );
        return null;
      }
    } catch (error) {
      this.recordResult(
        "Получение моей активности",
        false,
        error.response?.data?.message || error.message
      );
      return null;
    }
  }
  async testGetActivityStats(baseURL, token) {
    try {
      const response = await axios.get(`${baseURL}/api/activity/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 && response.data.success) {
        // Проверим структуру статистики
        const data = response.data.data;
        if (Array.isArray(data) || (data && typeof data === "object")) {
          this.recordResult("Получение статистики активности", true);
          return response.data;
        } else {
          this.recordResult(
            "Получение статистики активности",
            false,
            "Неправильная структура статистики"
          );
          return null;
        }
      } else {
        this.recordResult(
          "Получение статистики активности",
          false,
          "Неверный статус ответа"
        );
        return null;
      }
    } catch (error) {
      this.recordResult(
        "Получение статистики активности",
        false,
        error.response?.data?.message || error.message
      );
      return null;
    }
  }
  async testActivityLogging(baseURL, token) {
    try {
      // Получаем изначальное количество записей активности
      const initialResponse = await axios.get(`${baseURL}/api/activity/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const initialCount = initialResponse.data.success
        ? initialResponse.data.data.totalCount
        : 0;

      // Создаем тестовый навык, что должно создать запись в логе активности
      const skillResponse = await axios.post(
        `${baseURL}/api/skills`,
        {
          name: "Тестовый навык для активности",
          description: "Навык для тестирования логирования активности",
          category_id: 1, // Предполагаем, что категория с ID 1 существует
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (skillResponse.status !== 201) {
        this.recordResult(
          "Создание записи для тестирования логирования",
          false,
          "Не удалось создать навык"
        );
        return false;
      }

      // Ждем немного для обработки
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Проверяем, что активность была зарегистрирована
      const activityResponse = await axios.get(`${baseURL}/api/activity/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (activityResponse.data.success) {
        const newCount = activityResponse.data.data.totalCount;

        if (newCount > initialCount) {
          this.recordResult("Автоматическое создание записи", true);

          // Очищаем тестовый навык
          const skillId = skillResponse.data.data.skill.id;
          await axios.delete(`${baseURL}/api/skills/${skillId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          return true;
        } else {
          this.recordResult(
            "Автоматическое создание записи",
            false,
            "Запись активности не создана"
          );
          return false;
        }
      } else {
        this.recordResult(
          "Автоматическое создание записи",
          false,
          "Ошибка при получении активности"
        );
        return false;
      }
    } catch (error) {
      this.recordResult(
        "Автоматическое создание записи",
        false,
        error.response?.data?.message || error.message
      );
      return false;
    }
  }
  async testActivityFiltering(baseURL, token) {
    try {
      // Тестируем фильтрацию с ограничением по количеству
      const response = await axios.get(`${baseURL}/api/activity/my?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 && response.data.success) {
        const data = response.data.data;

        // Проверяем, что структура ответа корректна
        if (data && Array.isArray(data.logs) && data.logs.length <= 5) {
          this.recordResult("Фильтрация активности по количеству", true);
          return true;
        } else {
          this.recordResult(
            "Фильтрация активности по количеству",
            false,
            "Неправильное количество записей или структура"
          );
          return false;
        }
      } else {
        this.recordResult(
          "Фильтрация активности по количеству",
          false,
          "Неверный статус ответа"
        );
        return false;
      }
    } catch (error) {
      this.recordResult(
        "Фильтрация активности по количеству",
        false,
        error.response?.data?.message || error.message
      );
      return false;
    }
  }
  async testActivityPagination(baseURL, token) {
    try {
      const response = await axios.get(
        `${baseURL}/api/activity/my?page=1&limit=2`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200 && response.data.success) {
        const data = response.data.data;

        // Проверяем наличие полей пагинации
        if (
          typeof data.totalCount === "number" &&
          typeof data.currentPage === "number" &&
          typeof data.totalPages === "number" &&
          Array.isArray(data.logs) &&
          data.logs.length <= 2
        ) {
          this.recordResult("Пагинация активности", true);
          return true;
        } else {
          this.recordResult(
            "Пагинация активности",
            false,
            "Отсутствуют поля пагинации или неправильная структура"
          );
          return false;
        }
      } else {
        this.recordResult(
          "Пагинация активности",
          false,
          "Неверный статус ответа"
        );
        return false;
      }
    } catch (error) {
      this.recordResult(
        "Пагинация активности",
        false,
        error.response?.data?.message || error.message
      );
      return false;
    }
  }
}

module.exports = new ActivityTests();
