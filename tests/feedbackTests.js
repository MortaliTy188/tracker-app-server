// Тесты для API обратной связи
const axios = require("axios");

class FeedbackTests {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.testResults = [];
    this.feedbackId = null;
  }

  // Выполнение всех тестов
  async runAllTests() {
    console.log("🧪 Запуск тестов для Feedback API...");

    const tests = [
      this.testCreateFeedback,
      this.testCreateFeedbackValidation,
      this.testGetAllFeedback,
      this.testGetFeedbackById,
      this.testGetFeedbackByEmail,
      this.testGetFeedbackStats,
      this.testUpdateFeedback,
      this.testDeleteFeedback,
      this.testGetNonExistentFeedback,
      this.testSearchFeedback,
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        console.error(`❌ Ошибка в тесте ${test.name}:`, error.message);
        this.testResults.push({
          name: test.name,
          status: "failed",
          error: error.message,
        });
      }
    }

    return this.getResults();
  }

  // Тест создания обратной связи
  async testCreateFeedback() {
    console.log("  📝 Тест создания обратной связи...");

    const feedbackData = {
      user_name: "Иван Тестовый",
      user_email: "ivan.test@example.com",
      email_theme: "Предложение по улучшению",
      message:
        "Хотелось бы добавить темную тему в приложение. Это очень актуально для работы в вечернее время.",
    };

    try {
      const response = await axios.post(
        `${this.baseURL}/api/feedback`,
        feedbackData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 201 && response.data.success) {
        this.feedbackId = response.data.data.feedback.id;
        console.log("    ✅ Обратная связь успешно создана");
        this.testResults.push({
          name: "testCreateFeedback",
          status: "passed",
        });
      } else {
        throw new Error(`Неожиданный ответ: ${response.status}`);
      }
    } catch (error) {
      console.log("    ❌ Ошибка создания обратной связи");
      this.testResults.push({
        name: "testCreateFeedback",
        status: "failed",
        error: error.message,
      });
      throw error;
    }
  }

  // Тест валидации при создании обратной связи
  async testCreateFeedbackValidation() {
    console.log("  🔍 Тест валидации данных обратной связи...");

    const invalidData = [
      // Пустые данные
      {},
      // Отсутствует имя пользователя
      {
        user_email: "test@example.com",
        email_theme: "Тема",
        message: "Сообщение",
      },
      // Неправильный email
      {
        user_name: "Тест",
        user_email: "invalid-email",
        email_theme: "Тема",
        message: "Сообщение",
      },
      // Отсутствует тема
      {
        user_name: "Тест",
        user_email: "test@example.com",
        message: "Сообщение",
      },
    ];

    let passedValidations = 0;

    for (const data of invalidData) {
      try {
        const response = await axios.post(
          `${this.baseURL}/api/feedback`,
          data,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.status === 400) {
          passedValidations++;
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          passedValidations++;
        }
      }
    }

    if (passedValidations === invalidData.length) {
      console.log("    ✅ Валидация работает корректно");
      this.testResults.push({
        name: "testCreateFeedbackValidation",
        status: "passed",
      });
    } else {
      console.log("    ❌ Валидация работает некорректно");
      this.testResults.push({
        name: "testCreateFeedbackValidation",
        status: "failed",
        error: "Не все невалидные данные были отклонены",
      });
    }
  }

  // Тест получения всех обратных связей
  async testGetAllFeedback() {
    console.log("  📋 Тест получения всех обратных связей...");

    try {
      const response = await axios.get(`${this.baseURL}/api/feedback`);

      if (
        response.status === 200 &&
        response.data.success &&
        Array.isArray(response.data.data.feedback)
      ) {
        console.log(
          `    ✅ Получено ${response.data.data.feedback.length} обратных связей`
        );
        this.testResults.push({
          name: "testGetAllFeedback",
          status: "passed",
        });
      } else {
        throw new Error(`Неожиданный ответ: ${response.status}`);
      }
    } catch (error) {
      console.log("    ❌ Ошибка получения обратных связей");
      this.testResults.push({
        name: "testGetAllFeedback",
        status: "failed",
        error: error.message,
      });
      throw error;
    }
  }

  // Тест получения обратной связи по ID
  async testGetFeedbackById() {
    console.log("  🔍 Тест получения обратной связи по ID...");

    if (!this.feedbackId) {
      console.log("    ⚠️ ID обратной связи не найден, пропускаем тест");
      return;
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/api/feedback/${this.feedbackId}`
      );

      if (
        response.status === 200 &&
        response.data.success &&
        response.data.data.feedback
      ) {
        console.log("    ✅ Обратная связь получена по ID");
        this.testResults.push({
          name: "testGetFeedbackById",
          status: "passed",
        });
      } else {
        throw new Error(`Неожиданный ответ: ${response.status}`);
      }
    } catch (error) {
      console.log("    ❌ Ошибка получения обратной связи по ID");
      this.testResults.push({
        name: "testGetFeedbackById",
        status: "failed",
        error: error.message,
      });
      throw error;
    }
  }

  // Тест получения обратной связи по email
  async testGetFeedbackByEmail() {
    console.log("  📧 Тест получения обратной связи по email...");

    const testEmail = "ivan.test@example.com";

    try {
      const response = await axios.get(
        `${this.baseURL}/api/feedback/email/${testEmail}`
      );

      if (
        response.status === 200 &&
        response.data.success &&
        Array.isArray(response.data.data.feedback)
      ) {
        console.log("    ✅ Обратные связи получены по email");
        this.testResults.push({
          name: "testGetFeedbackByEmail",
          status: "passed",
        });
      } else {
        throw new Error(`Неожиданный ответ: ${response.status}`);
      }
    } catch (error) {
      console.log("    ❌ Ошибка получения обратных связей по email");
      this.testResults.push({
        name: "testGetFeedbackByEmail",
        status: "failed",
        error: error.message,
      });
      throw error;
    }
  }

  // Тест получения статистики обратной связи
  async testGetFeedbackStats() {
    console.log("  📊 Тест получения статистики обратной связи...");

    try {
      const response = await axios.get(`${this.baseURL}/api/feedback/stats`);

      if (
        response.status === 200 &&
        response.data.success &&
        response.data.data.totalFeedback !== undefined
      ) {
        console.log("    ✅ Статистика обратной связи получена");
        this.testResults.push({
          name: "testGetFeedbackStats",
          status: "passed",
        });
      } else {
        throw new Error(`Неожиданный ответ: ${response.status}`);
      }
    } catch (error) {
      console.log("    ❌ Ошибка получения статистики");
      this.testResults.push({
        name: "testGetFeedbackStats",
        status: "failed",
        error: error.message,
      });
      throw error;
    }
  }

  // Тест обновления обратной связи
  async testUpdateFeedback() {
    console.log("  ✏️ Тест обновления обратной связи...");

    if (!this.feedbackId) {
      console.log("    ⚠️ ID обратной связи не найден, пропускаем тест");
      return;
    }

    const updateData = {
      email_theme: "Обновленная тема сообщения",
      message: "Обновленное сообщение с дополнительными деталями.",
    };

    try {
      const response = await axios.put(
        `${this.baseURL}/api/feedback/${this.feedbackId}`,
        updateData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200 && response.data.success) {
        console.log("    ✅ Обратная связь успешно обновлена");
        this.testResults.push({
          name: "testUpdateFeedback",
          status: "passed",
        });
      } else {
        throw new Error(`Неожиданный ответ: ${response.status}`);
      }
    } catch (error) {
      console.log("    ❌ Ошибка обновления обратной связи");
      this.testResults.push({
        name: "testUpdateFeedback",
        status: "failed",
        error: error.message,
      });
      throw error;
    }
  }

  // Тест поиска обратной связи
  async testSearchFeedback() {
    console.log("  🔍 Тест поиска обратной связи...");

    try {
      const response = await axios.get(
        `${this.baseURL}/api/feedback?search=тема&page=1&limit=5`
      );

      if (
        response.status === 200 &&
        response.data.success &&
        response.data.pagination
      ) {
        console.log("    ✅ Поиск обратной связи работает");
        this.testResults.push({
          name: "testSearchFeedback",
          status: "passed",
        });
      } else {
        throw new Error(`Неожиданный ответ: ${response.status}`);
      }
    } catch (error) {
      console.log("    ❌ Ошибка поиска обратной связи");
      this.testResults.push({
        name: "testSearchFeedback",
        status: "failed",
        error: error.message,
      });
      throw error;
    }
  }

  // Тест получения несуществующей обратной связи
  async testGetNonExistentFeedback() {
    console.log("  🚫 Тест получения несуществующей обратной связи...");

    try {
      const response = await axios.get(`${this.baseURL}/api/feedback/99999`);

      // Ожидаем 404 ошибку
      if (response.status === 404) {
        console.log(
          "    ✅ Корректно обработана попытка получить несуществующую обратную связь"
        );
        this.testResults.push({
          name: "testGetNonExistentFeedback",
          status: "passed",
        });
      } else {
        throw new Error(`Ожидался 404, получен: ${response.status}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(
          "    ✅ Корректно обработана попытка получить несуществующую обратную связь"
        );
        this.testResults.push({
          name: "testGetNonExistentFeedback",
          status: "passed",
        });
      } else {
        console.log(
          "    ❌ Неправильная обработка несуществующей обратной связи"
        );
        this.testResults.push({
          name: "testGetNonExistentFeedback",
          status: "failed",
          error: error.message,
        });
        throw error;
      }
    }
  }

  // Тест удаления обратной связи (выполняем последним)
  async testDeleteFeedback() {
    console.log("  🗑️ Тест удаления обратной связи...");

    if (!this.feedbackId) {
      console.log("    ⚠️ ID обратной связи не найден, пропускаем тест");
      return;
    }

    try {
      const response = await axios.delete(
        `${this.baseURL}/api/feedback/${this.feedbackId}`
      );

      if (response.status === 200 && response.data.success) {
        console.log("    ✅ Обратная связь успешно удалена");
        this.testResults.push({
          name: "testDeleteFeedback",
          status: "passed",
        });
      } else {
        throw new Error(`Неожиданный ответ: ${response.status}`);
      }
    } catch (error) {
      console.log("    ❌ Ошибка удаления обратной связи");
      this.testResults.push({
        name: "testDeleteFeedback",
        status: "failed",
        error: error.message,
      });
      throw error;
    }
  }

  // Получение результатов тестов
  getResults() {
    const passed = this.testResults.filter((r) => r.status === "passed").length;
    const failed = this.testResults.filter((r) => r.status === "failed").length;
    const total = this.testResults.length;

    return {
      passed,
      failed,
      total,
      details: this.testResults,
    };
  }
}

module.exports = FeedbackTests;
