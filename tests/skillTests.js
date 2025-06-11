// Тесты для API навыков
const testData = require("./testData");

class SkillTests {
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
        "❌ Ошибка получения токена для тестов навыков:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения всех навыков
  async testGetAllSkills(axios, baseURL, token) {
    try {
      const response = await axios.get(`${baseURL}/api/skills`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(
        "✅ Все навыки получены:",
        response.data.data.length,
        "навыков"
      );
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения навыков:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест создания нового навыка
  async testCreateSkill(axios, baseURL, token) {
    try {
      const skillData = {
        name: "Тестовый навык",
        description: "Описание тестового навыка для проверки API",
        category_id: 1, // Предполагаем, что категория с ID 1 существует
      };

      const response = await axios.post(`${baseURL}/api/skills`, skillData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Навык создан:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка создания навыка:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения навыка по ID
  async testGetSkillById(axios, baseURL, token, skillId) {
    try {
      const response = await axios.get(`${baseURL}/api/skills/${skillId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Навык получен по ID:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения навыка по ID:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест обновления навыка
  async testUpdateSkill(axios, baseURL, token, skillId) {
    try {
      const updateData = {
        name: "Обновленный навык",
        description: "Обновленное описание навыка",
      };

      const response = await axios.put(
        `${baseURL}/api/skills/${skillId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Навык обновлен:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка обновления навыка:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения статистики навыков
  async testGetSkillStats(axios, baseURL, token) {
    try {
      const response = await axios.get(`${baseURL}/api/skills/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Статистика навыков получена:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения статистики навыков:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения тем навыка
  async testGetSkillTopics(axios, baseURL, token, skillId) {
    try {
      const response = await axios.get(
        `${baseURL}/api/skills/${skillId}/topics`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Темы навыка получены:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения тем навыка:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест удаления навыка
  async testDeleteSkill(axios, baseURL, token, skillId) {
    try {
      const response = await axios.delete(`${baseURL}/api/skills/${skillId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Навык удален:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка удаления навыка:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Запуск всех тестов навыков
  async runAllTests(axios, baseURL) {
    console.log("🎯 Запуск тестов API навыков...");

    // Получаем токен
    const token = await this.getTestToken(axios, baseURL);
    if (!token) {
      throw new Error("Не удалось получить токен для тестов");
    }

    // 1. Получение всех навыков
    console.log("\n1. Тестируем получение всех навыков...");
    await this.testGetAllSkills(axios, baseURL, token);

    // 2. Создание нового навыка
    console.log("\n2. Тестируем создание нового навыка...");
    const newSkill = await this.testCreateSkill(axios, baseURL, token);

    if (newSkill && newSkill.data && newSkill.data.skill) {
      const skillId = newSkill.data.skill.id;

      // 3. Получение навыка по ID
      console.log("\n3. Тестируем получение навыка по ID...");
      await this.testGetSkillById(axios, baseURL, token, skillId);

      // 4. Обновление навыка
      console.log("\n4. Тестируем обновление навыка...");
      await this.testUpdateSkill(axios, baseURL, token, skillId);

      // 5. Получение статистики
      console.log("\n5. Тестируем получение статистики навыков...");
      await this.testGetSkillStats(axios, baseURL, token);

      // 6. Получение тем навыка
      console.log("\n6. Тестируем получение тем навыка...");
      await this.testGetSkillTopics(axios, baseURL, token, skillId);

      // 7. Удаление навыка
      console.log("\n7. Тестируем удаление навыка...");
      await this.testDeleteSkill(axios, baseURL, token, skillId);
    }

    console.log("✅ Все тесты навыков завершены");
  }
}

module.exports = new SkillTests();
