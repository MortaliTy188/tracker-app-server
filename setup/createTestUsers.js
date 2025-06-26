const { User } = require("../models");
const bcrypt = require("bcrypt");

/**
 * Создание тестовых пользователей для демонстрации чата
 */
async function createTestUsers() {
  try {
    console.log("Создание тестовых пользователей для чата...");

    // Проверяем, есть ли уже тестовые пользователи
    const existingUser1 = await User.findByPk(1);
    const existingUser2 = await User.findByPk(2);

    if (existingUser1 && existingUser2) {
      console.log("✅ Тестовые пользователи уже существуют:");
      console.log(`   User 1: ${existingUser1.name} (${existingUser1.email})`);
      console.log(`   User 2: ${existingUser2.name} (${existingUser2.email})`);
      return;
    }

    const hashedPassword = await bcrypt.hash("demo123", 10);

    // Создаем первого тестового пользователя
    if (!existingUser1) {
      await User.create({
        name: "Алексей Демо",
        email: "alex@demo.com",
        password: hashedPassword,
        level: "базовый",
        avatar: null,
        isPrivate: false,
        registrationDate: new Date(),
      });
      console.log("✅ Создан пользователь 1: Алексей Демо (alex@demo.com)");
    }

    // Создаем второго тестового пользователя
    if (!existingUser2) {
      await User.create({
        name: "Мария Тест",
        email: "maria@demo.com",
        password: hashedPassword,
        level: "продвинутый",
        avatar: null,
        isPrivate: false,
        registrationDate: new Date(),
      });
      console.log("✅ Создан пользователь 2: Мария Тест (maria@demo.com)");
    }

    console.log("\n🔑 Данные для входа:");
    console.log("   Email: alex@demo.com / maria@demo.com");
    console.log("   Пароль: demo123");
    console.log("\n💬 Для тестирования чата:");
    console.log("   - Откройте http://localhost:3000/public/chat-demo.html");
    console.log("   - Введите User ID 1 и 2 для тестирования");
  } catch (error) {
    console.error("❌ Ошибка при создании тестовых пользователей:", error);
    throw error;
  }
}

// Запускаем создание пользователей, если файл запущен напрямую
if (require.main === module) {
  createTestUsers()
    .then(() => {
      console.log("🎉 Тестовые пользователи готовы!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Не удалось создать тестовых пользователей:", error);
      process.exit(1);
    });
}

module.exports = createTestUsers;
