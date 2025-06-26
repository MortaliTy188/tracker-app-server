const { User } = require("../models");

async function checkUsers() {
  try {
    const users = await User.findAll();
    console.log("Пользователи в БД:");
    users.forEach((u) =>
      console.log(`ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`)
    );

    if (users.length >= 2) {
      console.log("\n✅ Достаточно пользователей для тестирования чата!");
      console.log("💬 Для тестирования чата:");
      console.log("   - Откройте http://localhost:3000/public/chat-demo.html");
      console.log(
        `   - Введите User ID ${users[0].id} и ${users[1].id} для тестирования`
      );
    } else {
      console.log("\n⚠️ Нужно больше пользователей для тестирования чата");
      console.log("   Создайте пользователей через API регистрации");
    }

    process.exit(0);
  } catch (error) {
    console.error("Ошибка:", error);
    process.exit(1);
  }
}

checkUsers();
