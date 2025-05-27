// Тесты для API категорий навыков
const testData = require("./testData");

class CategoryTests {
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
        "❌ Ошибка получения токена для тестов категорий:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения всех категорий
  async testGetAllCategories(axios, baseURL, token) {
    try {
      const response = await axios.get(`${baseURL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(
        "✅ Все категории получены:",
        response.data.data.length,
        "категорий"
      );
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения категорий:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест создания новой категории
  async testCreateCategory(axios, baseURL, token) {
    try {
      const categoryData = {
        name: "Тестовая категория",
        description: "Описание тестовой категории для проверки API",
      };

      const response = await axios.post(
        `${baseURL}/api/categories`,
        categoryData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Категория создана:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка создания категории:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения категории по ID
  async testGetCategoryById(axios, baseURL, token, categoryId) {
    try {
      const response = await axios.get(
        `${baseURL}/api/categories/${categoryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Категория получена по ID:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения категории по ID:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест обновления категории
  async testUpdateCategory(axios, baseURL, token, categoryId) {
    try {
      const updateData = {
        name: "Обновленная категория",
        description: "Обновленное описание категории",
      };

      const response = await axios.put(
        `${baseURL}/api/categories/${categoryId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Категория обновлена:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка обновления категории:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения статистики категорий
  async testGetCategoryStats(axios, baseURL, token) {
    try {
      const response = await axios.get(`${baseURL}/api/categories/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Статистика категорий получена:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения статистики категорий:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест получения навыков категории
  async testGetCategorySkills(axios, baseURL, token, categoryId) {
    try {
      const response = await axios.get(
        `${baseURL}/api/categories/${categoryId}/skills`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Навыки категории получены:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения навыков категории:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Тест удаления категории
  async testDeleteCategory(axios, baseURL, token, categoryId) {
    try {
      const response = await axios.delete(
        `${baseURL}/api/categories/${categoryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Категория удалена:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка удаления категории:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Запуск всех тестов категорий
  async runAllTests(axios, baseURL) {
    console.log("📁 Запуск тестов API категорий...");

    // Получаем токен
    const token = await this.getTestToken(axios, baseURL);
    if (!token) {
      throw new Error("Не удалось получить токен для тестов");
    }

    // 1. Получение всех категорий
    console.log("\n1. Тестируем получение всех категорий...");
    await this.testGetAllCategories(axios, baseURL, token);

    // 2. Создание новой категории
    console.log("\n2. Тестируем создание новой категории...");
    const newCategory = await this.testCreateCategory(axios, baseURL, token);

    if (newCategory && newCategory.data && newCategory.data.category) {
      const categoryId = newCategory.data.category.id;

      // 3. Получение категории по ID
      console.log("\n3. Тестируем получение категории по ID...");
      await this.testGetCategoryById(axios, baseURL, token, categoryId);

      // 4. Обновление категории
      console.log("\n4. Тестируем обновление категории...");
      await this.testUpdateCategory(axios, baseURL, token, categoryId);

      // 5. Получение статистики
      console.log("\n5. Тестируем получение статистики категорий...");
      await this.testGetCategoryStats(axios, baseURL, token);

      // 6. Получение навыков категории
      console.log("\n6. Тестируем получение навыков категории...");
      await this.testGetCategorySkills(axios, baseURL, token, categoryId);

      // 7. Удаление категории
      console.log("\n7. Тестируем удаление категории...");
      await this.testDeleteCategory(axios, baseURL, token, categoryId);
    }

    console.log("✅ Все тесты категорий завершены");
  }
}

module.exports = new CategoryTests();
