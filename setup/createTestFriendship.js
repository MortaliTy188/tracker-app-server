const { Friendship } = require("../models");

async function createTestFriendship() {
  try {
    console.log("Создание тестовой дружбы между пользователями 1 и 2...");

    // Проверяем, есть ли уже дружба
    const existingFriendship = await Friendship.findOne({
      where: {
        requester_id: 1,
        addressee_id: 2,
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        console.log("✅ Дружба между пользователями 1 и 2 уже существует!");
      } else {
        // Принимаем запрос, если он в статусе pending
        await existingFriendship.update({
          status: "accepted",
          updated_at: new Date(),
        });
        console.log("✅ Запрос на дружбу принят!");
      }
    } else {
      // Создаем и сразу принимаем дружбу
      await Friendship.create({
        requester_id: 1,
        addressee_id: 2,
        status: "accepted",
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log("✅ Дружба между пользователями 1 и 2 создана!");
    }

    console.log("\n💬 Теперь можно тестировать чат:");
    console.log("   1. Откройте http://localhost:3000/public/chat-demo.html");
    console.log("   2. Введите User ID: 1");
    console.log("   3. Введите User ID собеседника: 2");
    console.log("   4. Нажмите 'Подключиться'");
    console.log(
      "   5. Откройте вторую вкладку с теми же User ID наоборот для полного тестирования"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка при создании дружбы:", error);
    process.exit(1);
  }
}

createTestFriendship();
