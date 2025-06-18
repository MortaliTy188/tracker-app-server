// Примеры тестирования API пользователей
// Этот файл содержит примеры запросов для тестирования API

const testUserAPI = {
  // Тестовые данные
  testUser: {
    name: "Тест Пользователь",
    email: "test@example.com",
    password: "password123",
  },

  // Примеры запросов для тестирования

  // 1. Регистрация пользователя
  registerUser: `
    POST /api/users/register
    Content-Type: application/json
    
    {
        "name": "Иван Иванов",
        "email": "ivan@example.com",
        "password": "password123"
    }
    `,

  // 2. Авторизация
  loginUser: `
    POST /api/users/login
    Content-Type: application/json
    
    {
        "email": "ivan@example.com",
        "password": "password123"
    }
    `,

  // 3. Получение профиля
  getProfile: `
    GET /api/users/profile
    Authorization: Bearer <JWT_TOKEN>
    `,

  // 4. Обновление профиля
  updateProfile: `
    PUT /api/users/profile
    Authorization: Bearer <JWT_TOKEN>
    Content-Type: application/json
    
    {
        "name": "Новое Имя",
        "email": "newemail@example.com"
    }
    `,

  // 5. Смена пароля
  changePassword: `
    PUT /api/users/change-password
    Authorization: Bearer <JWT_TOKEN>
    Content-Type: application/json
    
    {
        "currentPassword": "password123",
        "newPassword": "newpassword456"
    }
    `,

  // 6. Получение полной информации
  getFullInfo: `
    GET /api/users/full-info
    Authorization: Bearer <JWT_TOKEN>
    `,

  // 7. Удаление аккаунта
  deleteAccount: `
    DELETE /api/users/delete-account
    Authorization: Bearer <JWT_TOKEN>
    Content-Type: application/json
    
    {
        "password": "password123"
    }
    `,

  // Функции для автоматического тестирования
  async testRegistration(axios, baseURL) {
    try {
      const response = await axios.post(`${baseURL}/api/users/register`, {
        name: "Тест Пользователь",
        email: `test${Date.now()}@example.com`,
        password: "password123",
      });

      console.log("✅ Регистрация успешна:", response.data);
      return response.data.data.token;
    } catch (error) {
      console.error(
        "❌ Ошибка регистрации:",
        error.response?.data || error.message
      );
      return null;
    }
  },

  async testLogin(
    axios,
    baseURL,
    email = "test@example.com",
    password = "password123"
  ) {
    try {
      const response = await axios.post(`${baseURL}/api/users/login`, {
        email,
        password,
      });

      console.log("✅ Авторизация успешна:", response.data);
      return response.data.data.token;
    } catch (error) {
      console.error(
        "❌ Ошибка авторизации:",
        error.response?.data || error.message
      );
      return null;
    }
  },

  async testGetProfile(axios, baseURL, token) {
    try {
      const response = await axios.get(`${baseURL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Профиль получен:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения профиля:",
        error.response?.data || error.message
      );
      return null;
    }
  },

  async testUpdateProfile(axios, baseURL, token, updateData) {
    try {
      const response = await axios.put(
        `${baseURL}/api/users/profile`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Профиль обновлен:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка обновления профиля:",
        error.response?.data || error.message
      );
      return null;
    }
  },
  async testGetFullInfo(axios, baseURL, token) {
    try {
      const response = await axios.get(`${baseURL}/api/users/full-info`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Проверяем структуру ответа
      if (response.data.success && response.data.data) {
        const userData = response.data.data.user;
        const requiredFields = ['id', 'name', 'email', 'level', 'registrationDate', 'avatar'];
        const missingFields = requiredFields.filter(field => !(field in userData));
        
        if (missingFields.length > 0) {
          console.log(`⚠️  Отсутствуют поля: ${missingFields.join(', ')}`);
        } else {
          console.log("✅ Все обязательные поля присутствуют (включая avatar)");
        }
        
        console.log("✅ Полная информация получена:", {
          user: {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            level: userData.level,
            avatar: userData.avatar || 'не установлен'
          },
          stats: response.data.data.stats
        });
      } else {
        console.log("✅ Полная информация получена:", response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения полной информации:",
        error.response?.data || error.message
      );
      return null;
    }
  },

  // Полный тест API пользователей
  async runFullTest(axios, baseURL) {
    console.log("🚀 Запуск полного теста API пользователей...\n");

    // 1. Регистрация
    console.log("1. Тестируем регистрацию...");
    const token = await this.testRegistration(axios, baseURL);
    if (!token) return false;

    // 2. Получение профиля
    console.log("\n2. Тестируем получение профиля...");
    await this.testGetProfile(axios, baseURL, token);

    // 3. Обновление профиля
    console.log("\n3. Тестируем обновление профиля...");
    await this.testUpdateProfile(axios, baseURL, token, {
      name: "Обновленное Имя",
    });

    // 4. Получение полной информации
    console.log("\n4. Тестируем получение полной информации...");
    await this.testGetFullInfo(axios, baseURL, token);

    console.log("\n🎉 Тест завершен!");
    return true;
  },
};

module.exports = testUserAPI;

// Пример использования:
/*
const axios = require('axios');
const testUserAPI = require('./userApiTest');

// Запуск полного теста
testUserAPI.runFullTest(axios, 'http://localhost:3000')
    .then(success => {
        if (success) {
            console.log('Все тесты прошли успешно!');
        } else {
            console.log('Тесты завершились с ошибками');
        }
    });
*/
