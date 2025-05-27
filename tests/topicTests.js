// Тесты для API тем
const testData = require("./testData");

class TopicTests {
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
        "❌ Ошибка получения токена для тестов тем:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Создание тестового навыка для тем
  async createTestSkill(axios, baseURL, token) {
    try {
      const skillData = {
        name: "Навык для тестирования тем",
        description: "Временный навык для создания тем в тестах",
        category_id: 1,
      };

      const response = await axios.post(`${baseURL}/api/skills`, skillData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.data.skill.id;
    } catch (error) {
      console.error(
        "❌ Ошибка создания тестового навыка:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения всех тем
  async testGetAllTopics(axios, baseURL, token) {
    try {
      const response = await axios.get(`${baseURL}/api/topics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Все темы получены:", response.data.data.length, "тем");
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения тем:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест создания новой темы
  async testCreateTopic(axios, baseURL, token, skillId) {
    try {
      const topicData = {
        name: "Тестовая тема",
        description: "Описание тестовой темы для проверки API",
        skill_id: skillId,
        status_id: 1, // Предполагаем, что статус с ID 1 существует
      };

      const response = await axios.post(`${baseURL}/api/topics`, topicData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Тема создана:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка создания темы:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения темы по ID
  async testGetTopicById(axios, baseURL, token, topicId) {
    try {
      const response = await axios.get(`${baseURL}/api/topics/${topicId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Тема получена по ID:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения темы по ID:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест обновления темы
  async testUpdateTopic(axios, baseURL, token, topicId) {
    try {
      const updateData = {
        name: "Обновленная тема",
        description: "Обновленное описание темы",
      };

      const response = await axios.put(
        `${baseURL}/api/topics/${topicId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Тема обновлена:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка обновления темы:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест изменения статуса темы
  async testUpdateTopicStatus(axios, baseURL, token, topicId) {
    try {
      const statusData = {
        status_id: 2, // Изменяем на статус "В процессе"
      };

      const response = await axios.put(
        `${baseURL}/api/topics/${topicId}/status`,
        statusData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Статус темы изменен:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка изменения статуса темы:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения статистики тем
  async testGetTopicStats(axios, baseURL, token) {
    try {
      const response = await axios.get(`${baseURL}/api/topics/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Статистика тем получена:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения статистики тем:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения заметок темы
  async testGetTopicNotes(axios, baseURL, token, topicId) {
    try {
      const response = await axios.get(
        `${baseURL}/api/topics/${topicId}/notes`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Заметки темы получены:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения заметок темы:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест удаления темы
  async testDeleteTopic(axios, baseURL, token, topicId) {
    try {
      const response = await axios.delete(`${baseURL}/api/topics/${topicId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Тема удалена:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка удаления темы:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Запуск всех тестов тем
  async runAllTests(axios, baseURL) {
    console.log("📚 Запуск тестов API тем...");

    // Получаем токен
    const token = await this.getTestToken(axios, baseURL);
    if (!token) {
      throw new Error("Не удалось получить токен для тестов");
    }

    // Создаем тестовый навык
    console.log("\nСоздаем тестовый навык для тем...");
    const skillId = await this.createTestSkill(axios, baseURL, token);
    if (!skillId) {
      throw new Error("Не удалось создать тестовый навык");
    }

    // 1. Получение всех тем
    console.log("\n1. Тестируем получение всех тем...");
    await this.testGetAllTopics(axios, baseURL, token);

    // 2. Создание новой темы
    console.log("\n2. Тестируем создание новой темы...");
    const newTopic = await this.testCreateTopic(axios, baseURL, token, skillId);

    if (newTopic && newTopic.data && newTopic.data.topic) {
      const topicId = newTopic.data.topic.id;

      // 3. Получение темы по ID
      console.log("\n3. Тестируем получение темы по ID...");
      await this.testGetTopicById(axios, baseURL, token, topicId);

      // 4. Обновление темы
      console.log("\n4. Тестируем обновление темы...");
      await this.testUpdateTopic(axios, baseURL, token, topicId);

      // 5. Изменение статуса темы
      console.log("\n5. Тестируем изменение статуса темы...");
      await this.testUpdateTopicStatus(axios, baseURL, token, topicId);

      // 6. Получение статистики
      console.log("\n6. Тестируем получение статистики тем...");
      await this.testGetTopicStats(axios, baseURL, token);

      // 7. Получение заметок темы
      console.log("\n7. Тестируем получение заметок темы...");
      await this.testGetTopicNotes(axios, baseURL, token, topicId);

      // 8. Удаление темы
      console.log("\n8. Тестируем удаление темы...");
      await this.testDeleteTopic(axios, baseURL, token, topicId);
    }

    console.log("✅ Все тесты тем завершены");
  }
}

module.exports = new TopicTests();
