// Тесты для системы уровней пользователя
const testData = require("./testData");

class UserLevelTests {
  constructor() {
    this.testToken = null;
    this.testUserId = null;
    this.testSkillId = null;
    this.createdTopics = [];
  }

  // Получение токена для тестов
  async getTestToken(axios, baseURL) {
    if (this.testToken) return this.testToken;

    try {
      // Создаем тестового пользователя
      const userData = {
        name: "Тест Уровней",
        email: `level.test.${Date.now()}@example.com`,
        password: "password123",
      };

      const registerResponse = await axios.post(`${baseURL}/api/users/register`, userData);
      this.testToken = registerResponse.data.data.token;
      this.testUserId = registerResponse.data.data.user.id;
      
      console.log(`✅ Создан тестовый пользователь с ID: ${this.testUserId}`);
      return this.testToken;
    } catch (error) {
      console.error(
        "❌ Ошибка создания тестового пользователя:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Создание тестового навыка
  async createTestSkill(axios, baseURL, token) {
    try {
      const skillData = {
        name: `Навык для тестирования уровней ${Date.now()}`,
        description: "Временный навык для тестирования системы уровней",
        category_id: 1,
      };

      const response = await axios.post(`${baseURL}/api/skills`, skillData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      this.testSkillId = response.data.data.skill.id;
      console.log(`✅ Создан тестовый навык с ID: ${this.testSkillId}`);
      return this.testSkillId;
    } catch (error) {
      console.error(
        "❌ Ошибка создания тестового навыка:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Создание топика
  async createTestTopic(axios, baseURL, token, skillId, name, progress = 0) {
    try {
      const topicData = {
        name: name,
        description: `Тестовый топик для проверки уровней`,
        skill_id: skillId,
        progress: progress,
      };

      const response = await axios.post(`${baseURL}/api/topics`, topicData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const topicId = response.data.data.topic.id;
      this.createdTopics.push(topicId);
      console.log(`✅ Создан топик "${name}" с прогрессом ${progress}%`);
      return topicId;
    } catch (error) {
      console.error(
        "❌ Ошибка создания топика:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Обновление прогресса топика
  async updateTopicProgress(axios, baseURL, token, topicId, progress) {
    try {
      const response = await axios.put(
        `${baseURL}/api/topics/${topicId}/progress`,
        { progress },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка обновления прогресса топика:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Получение статистики прогресса
  async getProgressStats(axios, baseURL, token) {
    try {
      const response = await axios.get(`${baseURL}/api/users/progress-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data.progressStats;
    } catch (error) {
      console.error(
        "❌ Ошибка получения статистики прогресса:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Пересчет уровня
  async recalculateLevel(axios, baseURL, token) {
    try {
      const response = await axios.post(`${baseURL}/api/users/recalculate-level`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data.levelInfo;
    } catch (error) {
      console.error(
        "❌ Ошибка пересчета уровня:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Очистка тестовых данных
  async cleanup(axios, baseURL, token) {
    try {
      // Удаляем созданные топики
      for (const topicId of this.createdTopics) {
        try {
          await axios.delete(`${baseURL}/api/topics/${topicId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (error) {
          console.warn(`⚠️ Не удалось удалить топик ${topicId}`);
        }
      }

      // Удаляем тестовый навык
      if (this.testSkillId) {
        try {
          await axios.delete(`${baseURL}/api/skills/${this.testSkillId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (error) {
          console.warn(`⚠️ Не удалось удалить навык ${this.testSkillId}`);
        }
      }

      console.log("🧹 Тестовые данные очищены");
    } catch (error) {
      console.error("❌ Ошибка очистки тестовых данных:", error.message);
    }
  }

  // Тест 1: Проверка начального уровня пользователя
  async testInitialUserLevel(axios, baseURL) {
    console.log("\n🧪 Тест 1: Проверка начального уровня пользователя");
    
    try {
      const token = await this.getTestToken(axios, baseURL);
      if (!token) return false;

      const stats = await this.getProgressStats(axios, baseURL, token);
      if (!stats) return false;

      if (stats.currentLevel === "Новичок" && stats.completedTopics === 0) {
        console.log("✅ Начальный уровень корректный: Новичок с 0 завершенными топиками");
        return true;
      } else {
        console.log("❌ Некорректный начальный уровень:", stats);
        return false;
      }
    } catch (error) {
      console.error("❌ Ошибка теста начального уровня:", error.message);
      return false;
    }
  }

  // Тест 2: Проверка повышения уровня при завершении топиков
  async testLevelUpProgression(axios, baseURL) {
    console.log("\n🧪 Тест 2: Проверка повышения уровня при завершении топиков");
    
    try {
      const token = await this.getTestToken(axios, baseURL);
      if (!token) return false;

      const skillId = await this.createTestSkill(axios, baseURL, token);
      if (!skillId) return false;

      // Создаем и завершаем 6 топиков для достижения уровня "Средний"
      const topicsToCreate = 6;
      const topicIds = [];

      for (let i = 1; i <= topicsToCreate; i++) {
        const topicId = await this.createTestTopic(
          axios, baseURL, token, skillId, 
          `Топик для уровня ${i}`, 0
        );
        if (topicId) {
          topicIds.push(topicId);
          
          // Завершаем топик
          await this.updateTopicProgress(axios, baseURL, token, topicId, 100);
        }
      }

      // Проверяем уровень
      const stats = await this.getProgressStats(axios, baseURL, token);
      if (!stats) return false;

      if (stats.currentLevel === "Средний" && stats.completedTopics === topicsToCreate) {
        console.log(`✅ Уровень корректно повышен до "Средний" с ${topicsToCreate} завершенными топиками`);
        return true;
      } else {
        console.log("❌ Некорректное повышение уровня:", stats);
        return false;
      }
    } catch (error) {
      console.error("❌ Ошибка теста повышения уровня:", error.message);
      return false;
    }
  }

  // Тест 3: Проверка понижения уровня при изменении прогресса
  async testLevelDowngrade(axios, baseURL) {
    console.log("\n🧪 Тест 3: Проверка понижения уровня при изменении прогресса");
    
    try {
      const token = await this.getTestToken(axios, baseURL);
      if (!token) return false;

      // Находим последний созданный топик и устанавливаем ему прогресс 50%
      if (this.createdTopics.length > 0) {
        const lastTopicId = this.createdTopics[this.createdTopics.length - 1];
        await this.updateTopicProgress(axios, baseURL, token, lastTopicId, 50);

        // Проверяем уровень
        const stats = await this.getProgressStats(axios, baseURL, token);
        if (!stats) return false;

        if (stats.currentLevel === "Новичок" && stats.completedTopics === 5) {
          console.log("✅ Уровень корректно понижен до 'Новичок' с 5 завершенными топиками");
          return true;
        } else {
          console.log("❌ Некорректное понижение уровня:", stats);
          return false;
        }
      } else {
        console.log("❌ Нет созданных топиков для теста");
        return false;
      }
    } catch (error) {
      console.error("❌ Ошибка теста понижения уровня:", error.message);
      return false;
    }
  }

  // Тест 4: Проверка пересчета уровня
  async testLevelRecalculation(axios, baseURL) {
    console.log("\n🧪 Тест 4: Проверка пересчета уровня");
    
    try {
      const token = await this.getTestToken(axios, baseURL);
      if (!token) return false;

      const levelInfo = await this.recalculateLevel(axios, baseURL, token);
      if (!levelInfo) return false;

      const stats = await this.getProgressStats(axios, baseURL, token);
      if (!stats) return false;

      if (levelInfo.level === stats.currentLevel && 
          levelInfo.completedTopics === stats.completedTopics) {
        console.log("✅ Пересчет уровня работает корректно:", levelInfo);
        return true;
      } else {
        console.log("❌ Некорректный пересчет уровня:");
        console.log("  Результат пересчета:", levelInfo);
        console.log("  Статистика:", stats);
        return false;
      }
    } catch (error) {
      console.error("❌ Ошибка теста пересчета уровня:", error.message);
      return false;
    }
  }

  // Тест 5: Проверка границ уровней
  async testLevelBoundaries(axios, baseURL) {
    console.log("\n🧪 Тест 5: Проверка границ уровней");
    
    try {
      const token = await this.getTestToken(axios, baseURL);
      if (!token) return false;

      // Создаем дополнительные топики для достижения уровня "Продвинутый" (20 топиков)
      const currentStats = await this.getProgressStats(axios, baseURL, token);
      const topicsNeeded = 20 - currentStats.completedTopics;

      if (topicsNeeded > 0 && this.testSkillId) {
        for (let i = 1; i <= topicsNeeded; i++) {
          const topicId = await this.createTestTopic(
            axios, baseURL, token, this.testSkillId, 
            `Границы топик ${i}`, 100
          );
        }
      }

      const finalStats = await this.getProgressStats(axios, baseURL, token);
      if (!finalStats) return false;

      if (finalStats.currentLevel === "Продвинутый" && finalStats.completedTopics >= 20) {
        console.log(`✅ Граница уровня "Продвинутый" достигнута корректно: ${finalStats.completedTopics} топиков`);
        return true;
      } else {
        console.log("❌ Некорректное достижение границы уровня:", finalStats);
        return false;
      }
    } catch (error) {
      console.error("❌ Ошибка теста границ уровней:", error.message);
      return false;
    }
  }

  // Запуск всех тестов
  async runAllTests(axios, baseURL) {
    console.log("🚀 Запуск тестов системы уровней пользователя");
    console.log("=" .repeat(60));

    const tests = [
      () => this.testInitialUserLevel(axios, baseURL),
      () => this.testLevelUpProgression(axios, baseURL),
      () => this.testLevelDowngrade(axios, baseURL),
      () => this.testLevelRecalculation(axios, baseURL),
      () => this.testLevelBoundaries(axios, baseURL),
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
        console.error("❌ Критическая ошибка теста:", error.message);
        failed++;
      }
    }

    // Очистка тестовых данных
    if (this.testToken) {
      await this.cleanup(axios, baseURL, this.testToken);
    }

    console.log("\n" + "=" .repeat(60));
    console.log("📊 Результаты тестов системы уровней:");
    console.log(`✅ Пройдено: ${passed}`);
    console.log(`❌ Провалено: ${failed}`);
    console.log(`📈 Успешность: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    return { passed, failed, successRate: (passed / (passed + failed)) * 100 };
  }
}

module.exports = UserLevelTests;
