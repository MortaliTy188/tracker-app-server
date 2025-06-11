// Тестовые данные для загрузки в базу данных
const { User, SkillCategory, TopicStatus, Feedback } = require("../models");
const bcrypt = require("bcryptjs");

class TestData {
  // Создание тестовых данных
  async createTestData() {
    try {
      // 1. Создание статусов тем по умолчанию
      await this.createDefaultStatuses();

      // 2. Создание категорий навыков
      await this.createDefaultCategories();

      // 3. Создание тестовых пользователей
      await this.createTestUsers();

      // 4. Создание тестовых обратных связей
      await this.createTestFeedback();

      console.log("✅ Все тестовые данные созданы");
    } catch (error) {
      console.error("❌ Ошибка создания тестовых данных:", error);
      throw error;
    }
  }

  // Создание статусов по умолчанию
  async createDefaultStatuses() {
    const statuses = [
      { name: "Не начато", color: "#9CA3AF" },
      { name: "В процессе", color: "#3B82F6" },
      { name: "На паузе", color: "#F59E0B" },
      { name: "Завершено", color: "#10B981" },
      { name: "Требует повторения", color: "#EF4444" },
    ];

    for (const statusData of statuses) {
      const [status, created] = await TopicStatus.findOrCreate({
        where: { name: statusData.name },
        defaults: statusData,
      });

      if (created) {
        console.log(`   Создан статус: ${statusData.name}`);
      }
    }
  }

  // Создание категорий по умолчанию
  async createDefaultCategories() {
    const categories = [
      {
        name: "Программирование",
        description: "Навыки разработки программного обеспечения",
      },
      {
        name: "Дизайн",
        description: "Навыки графического и UX/UI дизайна",
      },
      {
        name: "Маркетинг",
        description: "Навыки продвижения и маркетинга",
      },
      {
        name: "Менеджмент",
        description: "Навыки управления проектами и командами",
      },
      {
        name: "Языки",
        description: "Изучение иностранных языков",
      },
    ];

    for (const categoryData of categories) {
      const [category, created] = await SkillCategory.findOrCreate({
        where: { name: categoryData.name },
        defaults: categoryData,
      });

      if (created) {
        console.log(`   Создана категория: ${categoryData.name}`);
      }
    }
  }

  // Создание тестовых пользователей
  async createTestUsers() {
    const users = [
      {
        name: "Админ Тестов",
        email: "admin@test.com",
        password: "admin123",
      },
      {
        name: "Тестовый Пользователь",
        email: "user@test.com",
        password: "user123",
      },
    ];

    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
        },
      });

      if (created) {
        console.log(`   Создан пользователь: ${userData.email}`);
      }
    }
  }

  // Получение данных для тестов
  getTestUserData() {
    return {
      admin: {
        name: "Админ Тестов",
        email: "admin@test.com",
        password: "admin123",
      },
      user: {
        name: "Тестовый Пользователь",
        email: "user@test.com",
        password: "user123",
      },
      newUser: {
        name: "Новый Пользователь",
        email: `new${Date.now()}@test.com`,
        password: "newuser123",
      },
    };
  }

  getTestCategoryData() {
    return {
      programming: {
        name: "Программирование",
        description: "Навыки разработки программного обеспечения",
      },
      design: {
        name: "Дизайн",
        description: "Навыки графического и UX/UI дизайна",
      },
    };
  }

  getTestSkillData() {
    return {
      nodejs: {
        name: "Node.js разработка",
        description: "Изучение серверной разработки на Node.js",
        category_id: 1,
      },
      react: {
        name: "React разработка",
        description: "Изучение библиотеки React для фронтенда",
        category_id: 1,
      },
      figma: {
        name: "Figma дизайн",
        description: "Создание макетов в Figma",
        category_id: 2,
      },
    };
  }

  getTestTopicData() {
    return {
      express: {
        name: "Express.js основы",
        description: "Изучение фреймворка Express для создания API",
        skill_id: 1,
        status_id: 2,
      },
      middleware: {
        name: "Middleware в Express",
        description: "Изучение концепции middleware",
        skill_id: 1,
        status_id: 1,
      },
      hooks: {
        title: "React Hooks",
        description: "Изучение хуков в React",
        skill_id: 2,
        status_id: 3,
      },
    };
  }

  getTestNoteData() {
    return {
      express: {
        content:
          "Express - это минималистичный веб-фреймворк для Node.js. Основные возможности: роутинг, middleware, шаблонизация.",
        topic_id: 1,
      },
      middleware: {
        content:
          "Middleware - это функции, которые выполняются в процессе обработки запроса между его получением и отправкой ответа.",
        topic_id: 2,
      },
      hooks: {
        content:
          "Хуки позволяют использовать состояние и другие возможности React без написания классов.",
        topic_id: 3,
      },
    };
  }

  // Создание тестовых обратных связей
  async createTestFeedback() {
    const feedbackData = [
      {
        user_name: "Мария Петрова",
        user_email: "maria.petrova@example.com",
        email_theme: "Предложение по улучшению",
        message:
          "Хотелось бы добавить возможность экспорта данных в Excel формат. Это бы очень помогло в работе.",
      },
      {
        user_name: "Александр Сидоров",
        user_email: "alex.sidorov@example.com",
        email_theme: "Ошибка в интерфейсе",
        message:
          "Обнаружил ошибку при сохранении заметок. Иногда текст не сохраняется полностью.",
      },
      {
        user_name: "Елена Кузнецова",
        user_email: "elena.kuznetsova@example.com",
        email_theme: "Благодарность",
        message:
          "Отличное приложение! Очень помогает в отслеживании прогресса обучения. Спасибо за ваш труд!",
      },
      {
        user_name: "Дмитрий Васильев",
        user_email: "dmitry.vasiliev@example.com",
        email_theme: "Запрос функции",
        message:
          "Можно ли добавить мобильную версию приложения? Было бы удобно работать с телефона.",
      },
      {
        user_name: "Анна Михайлова",
        user_email: "anna.mikhailova@example.com",
        email_theme: "Техническая поддержка",
        message:
          "Не могу войти в аккаунт. Пароль правильный, но система выдает ошибку авторизации.",
      },
    ];

    for (const feedback of feedbackData) {
      const [created, isNew] = await Feedback.findOrCreate({
        where: {
          user_email: feedback.user_email,
          email_theme: feedback.email_theme,
        },
        defaults: feedback,
      });

      if (isNew) {
        console.log(
          `   Создана обратная связь: ${feedback.email_theme} от ${feedback.user_name}`
        );
      }
    }
  }
}

module.exports = new TestData();
