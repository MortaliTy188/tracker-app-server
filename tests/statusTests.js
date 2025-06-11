// Тесты для API статусов тем
const testData = require("./testData");

class StatusTests {
  constructor() {
    this.testToken = null;
  }

  // Получение токена для тестов
  async getTestToken(axios, baseURL) {
    if (this.testToken) return this.testToken;

    try {
      const userData = testData.getTestUserData().admin;
      const response = await axios.post(`${baseURL}/api/users/login`, {
        email: userData.email,
        password: userData.password,
      });

      this.testToken = response.data.data.token;
      return this.testToken;
    } catch (error) {
      console.error(
        "❌ Ошибка получения токена для тестов статусов:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест создания статусов по умолчанию
  async testCreateDefaultStatuses(axios, baseURL) {
    try {
      const response = await axios.post(
        `${baseURL}/api/statuses/default`,
        {},
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("✅ Статусы по умолчанию созданы:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка создания статусов по умолчанию:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения всех статусов
  async testGetAllStatuses(axios, baseURL, token) {
    try {
      const response = await axios.get(`${baseURL}/api/statuses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(
        "✅ Все статусы получены:",
        response.data.data.length,
        "статусов"
      );
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения статусов:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест создания нового статуса
  async testCreateStatus(axios, baseURL, token) {
    try {
      const statusData = {
        name: "Тестовый статус",
        color: "#FF5733",
      };

      const response = await axios.post(`${baseURL}/api/statuses`, statusData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Статус создан:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка создания статуса:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения статуса по ID
  async testGetStatusById(axios, baseURL, token, statusId) {
    try {
      const response = await axios.get(`${baseURL}/api/statuses/${statusId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Статус получен по ID:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения статуса по ID:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест обновления статуса
  async testUpdateStatus(axios, baseURL, token, statusId) {
    try {
      const updateData = {
        name: "Обновленный статус",
        color: "#33FF57",
      };

      const response = await axios.put(
        `${baseURL}/api/statuses/${statusId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Статус обновлен:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка обновления статуса:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения статистики статусов
  async testGetStatusStats(axios, baseURL, token) {
    try {
      const response = await axios.get(`${baseURL}/api/statuses/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Статистика статусов получена:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения статистики статусов:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест удаления статуса
  async testDeleteStatus(axios, baseURL, token, statusId) {
    try {
      const response = await axios.delete(
        `${baseURL}/api/statuses/${statusId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Статус удален:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка удаления статуса:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Запуск всех тестов статусов
  async runAllTests(axios, baseURL) {
    console.log("🏷️  Запуск тестов API статусов...");

    // Получаем токен
    const token = await this.getTestToken(axios, baseURL);
    if (!token) {
      throw new Error("Не удалось получить токен для тестов");
    }

    // 1. Создание статусов по умолчанию
    console.log("\n1. Тестируем создание статусов по умолчанию...");
    await this.testCreateDefaultStatuses(axios, baseURL);

    // 2. Получение всех статусов
    console.log("\n2. Тестируем получение всех статусов...");
    const allStatuses = await this.testGetAllStatuses(axios, baseURL, token);

    // 3. Создание нового статуса
    console.log("\n3. Тестируем создание нового статуса...");
    const newStatus = await this.testCreateStatus(axios, baseURL, token);

    if (newStatus && newStatus.data && newStatus.data.status) {
      const statusId = newStatus.data.status.id;

      // 4. Получение статуса по ID
      console.log("\n4. Тестируем получение статуса по ID...");
      await this.testGetStatusById(axios, baseURL, token, statusId);

      // 5. Обновление статуса
      console.log("\n5. Тестируем обновление статуса...");
      await this.testUpdateStatus(axios, baseURL, token, statusId);

      // 6. Получение статистики
      console.log("\n6. Тестируем получение статистики статусов...");
      await this.testGetStatusStats(axios, baseURL, token);

      // 7. Удаление статуса
      console.log("\n7. Тестируем удаление статуса...");
      await this.testDeleteStatus(axios, baseURL, token, statusId);
    }

    console.log("✅ Все тесты статусов завершены");
  }
}

module.exports = new StatusTests();
