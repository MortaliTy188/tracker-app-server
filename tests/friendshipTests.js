/**
 * Комплексный тест системы друзей
 * Проверяет все аспекты работы с друзьями, включая:
 * - Отправку, принятие, отклонение запросов
 * - Получение списков друзей и запросов
 * - Статус дружбы в API пользователей
 * - Исключение текущего пользователя из списка
 * - Приватность профилей
 */

const http = require("http");

const BASE_URL = "http://localhost:3001/api";

// Утилита для HTTP запросов
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = http.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: jsonData,
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: data,
          });
        }
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Создание тестового пользователя
async function createTestUser(name, email, password, isPrivate = false) {
  console.log(`📝 Создаем пользователя: ${name}`);

  const registerResponse = await makeRequest(`${BASE_URL}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (registerResponse.status === 409) {
    console.log(`⚠️ Пользователь ${name} уже существует`);
  } else if (registerResponse.ok) {
    console.log(`✅ Пользователь ${name} создан`);
  } else {
    throw new Error(
      `Ошибка создания пользователя ${name}: ${JSON.stringify(
        registerResponse.data
      )}`
    );
  }

  // Авторизация
  const loginResponse = await makeRequest(`${BASE_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!loginResponse.ok) {
    throw new Error(
      `Ошибка авторизации ${name}: ${JSON.stringify(loginResponse.data)}`
    );
  }

  const userData = loginResponse.data.data;
  console.log(`🔐 ${name} авторизован (ID: ${userData.user.id})`);

  // Установка приватности если нужно
  if (isPrivate) {
    const profileResponse = await makeRequest(`${BASE_URL}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userData.token}`,
      },
      body: JSON.stringify({ isPrivate: true }),
    });

    if (profileResponse.ok) {
      console.log(`🔒 ${name} установил приватный профиль`);
    }
  }

  return {
    id: userData.user.id,
    name: userData.user.name,
    email: userData.user.email,
    token: userData.token,
    isPrivate,
  };
}

// Основной тест
async function runFriendshipTests() {
  console.log("🧪 КОМПЛЕКСНЫЙ ТЕСТ СИСТЕМЫ ДРУЗЕЙ");
  console.log("=====================================\n");

  try {
    // 1. Создание тестовых пользователей
    console.log("1️⃣ СОЗДАНИЕ ТЕСТОВЫХ ПОЛЬЗОВАТЕЛЕЙ");
    console.log("-----------------------------------");

    const user1 = await createTestUser(
      "Алиса Тестер",
      "alice.test@example.com",
      "password123"
    );
    const user2 = await createTestUser(
      "Боб Тестер",
      "bob.test@example.com",
      "password123"
    );
    const user3 = await createTestUser(
      "Приватный Пользователь",
      "private.test@example.com",
      "password123",
      true
    );

    console.log("\n");

    // 2. Проверка списка пользователей
    console.log("2️⃣ ПРОВЕРКА СПИСКА ПОЛЬЗОВАТЕЛЕЙ");
    console.log("--------------------------------");

    // Получение списка без авторизации
    const publicListResponse = await makeRequest(`${BASE_URL}/users/all`);
    if (publicListResponse.ok) {
      const publicUsers = publicListResponse.data.data.users;
      console.log(`✅ Публичный список: ${publicUsers.length} пользователей`);

      const user1InPublic = publicUsers.find((u) => u.id === user1.id);
      if (user1InPublic) {
        console.log(`✅ ${user1.name} виден в публичном списке`);
      }
    }

    // Получение списка с авторизацией
    const authListResponse = await makeRequest(`${BASE_URL}/users/all`, {
      headers: { Authorization: `Bearer ${user1.token}` },
    });

    if (authListResponse.ok) {
      const authUsers = authListResponse.data.data.users;
      console.log(
        `✅ Авторизованный список: ${authUsers.length} пользователей`
      );

      const user1InAuth = authUsers.find((u) => u.id === user1.id);
      if (user1InAuth) {
        console.log(`❌ ОШИБКА: ${user1.name} видит себя в списке!`);
      } else {
        console.log(`✅ ${user1.name} НЕ видит себя в списке (правильно)`);
      }

      const user2InAuth = authUsers.find((u) => u.id === user2.id);
      if (user2InAuth) {
        console.log(
          `✅ ${user1.name} видит ${user2.name} со статусом: ${user2InAuth.friendship.status}`
        );
      }
    }

    console.log("\n"); // 3. Отправка запроса на дружбу
    console.log("3️⃣ ОТПРАВКА ЗАПРОСА НА ДРУЖБУ");
    console.log("-----------------------------");

    const sendRequestResponse = await makeRequest(
      `${BASE_URL}/friendship/request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user1.token}`,
        },
        body: JSON.stringify({ addresseeId: user2.id }),
      }
    );

    if (sendRequestResponse.ok) {
      console.log(`✅ ${user1.name} отправил запрос ${user2.name}`);
    } else if (sendRequestResponse.status === 400) {
      console.log(`⚠️ Запрос уже отправлен или дружба уже существует`);
    } else {
      console.log(
        `❌ Ошибка отправки запроса: ${JSON.stringify(
          sendRequestResponse.data
        )}`
      );
    }

    console.log("\n");

    // 4. Проверка статусов после отправки запроса
    console.log("4️⃣ ПРОВЕРКА СТАТУСОВ ПОСЛЕ ОТПРАВКИ ЗАПРОСА");
    console.log("--------------------------------------------");

    // Проверяем статус у отправителя
    const user1ListView = await makeRequest(`${BASE_URL}/users/all`, {
      headers: { Authorization: `Bearer ${user1.token}` },
    });

    if (user1ListView.ok) {
      const user2ForUser1 = user1ListView.data.data.users.find(
        (u) => u.id === user2.id
      );
      if (user2ForUser1) {
        console.log(
          `✅ ${user1.name} видит ${user2.name} со статусом: ${user2ForUser1.friendship.status}`
        );
      }
    }

    // Проверяем статус у получателя
    const user2ListView = await makeRequest(`${BASE_URL}/users/all`, {
      headers: { Authorization: `Bearer ${user2.token}` },
    });

    if (user2ListView.ok) {
      const user1ForUser2 = user2ListView.data.data.users.find(
        (u) => u.id === user1.id
      );
      if (user1ForUser2) {
        console.log(
          `✅ ${user2.name} видит ${user1.name} со статусом: ${user1ForUser2.friendship.status}`
        );
      }
    }

    console.log("\n"); // 5. Получение списков запросов
    console.log("5️⃣ ПОЛУЧЕНИЕ СПИСКОВ ЗАПРОСОВ");
    console.log("------------------------------");

    // Исходящие запросы
    const sentRequestsResponse = await makeRequest(
      `${BASE_URL}/friendship/requests/sent`,
      {
        headers: { Authorization: `Bearer ${user1.token}` },
      }
    );

    if (sentRequestsResponse.ok) {
      const sentRequests = sentRequestsResponse.data.data.sentRequests || [];
      console.log(`✅ ${user1.name} отправил запросов: ${sentRequests.length}`);
      if (sentRequests.length > 0) {
        sentRequests.forEach((req) => {
          console.log(`   → ${req.addressee.name} (ID: ${req.addressee.id})`);
        });
      }
    }

    // Входящие запросы
    const pendingRequestsResponse = await makeRequest(
      `${BASE_URL}/friendship/requests/pending`,
      {
        headers: { Authorization: `Bearer ${user2.token}` },
      }
    );

    if (pendingRequestsResponse.ok) {
      const pendingRequests =
        pendingRequestsResponse.data.data.pendingRequests || [];
      console.log(
        `✅ ${user2.name} получил запросов: ${pendingRequests.length}`
      );
      if (pendingRequests.length > 0) {
        pendingRequests.forEach((req) => {
          console.log(`   ← ${req.requester.name} (ID: ${req.requester.id})`);
        });
      }
    }

    console.log("\n"); // 6. Принятие запроса на дружбу
    console.log("6️⃣ ПРИНЯТИЕ ЗАПРОСА НА ДРУЖБУ");
    console.log("-----------------------------");

    // Получаем ID дружбы для принятия
    if (
      pendingRequestsResponse.ok &&
      pendingRequestsResponse.data.data.pendingRequests &&
      pendingRequestsResponse.data.data.pendingRequests.length > 0
    ) {
      const friendshipId =
        pendingRequestsResponse.data.data.pendingRequests[0].friendshipId;

      const acceptResponse = await makeRequest(
        `${BASE_URL}/friendship/${friendshipId}/accept`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user2.token}`,
          },
        }
      );

      if (acceptResponse.ok) {
        console.log(`✅ ${user2.name} принял дружбу с ${user1.name}`);
      } else {
        console.log(
          `❌ Ошибка принятия дружбы: ${JSON.stringify(acceptResponse.data)}`
        );
      }
    }

    console.log("\n");

    // 7. Проверка списка друзей
    console.log("7️⃣ ПРОВЕРКА СПИСКА ДРУЗЕЙ");
    console.log("-------------------------");
    // Друзья user1
    const user1FriendsResponse = await makeRequest(
      `${BASE_URL}/friendship/friends`,
      {
        headers: { Authorization: `Bearer ${user1.token}` },
      }
    );

    if (user1FriendsResponse.ok) {
      const user1Friends = user1FriendsResponse.data.data.friends || [];
      console.log(`✅ Друзья ${user1.name}: ${user1Friends.length}`);
      user1Friends.forEach((friend) => {
        console.log(`   👥 ${friend.name} (ID: ${friend.id})`);
      });
    }

    // Друзья user2
    const user2FriendsResponse = await makeRequest(
      `${BASE_URL}/friendship/friends`,
      {
        headers: { Authorization: `Bearer ${user2.token}` },
      }
    );

    if (user2FriendsResponse.ok) {
      const user2Friends = user2FriendsResponse.data.data.friends || [];
      console.log(`✅ Друзья ${user2.name}: ${user2Friends.length}`);
      user2Friends.forEach((friend) => {
        console.log(`   👥 ${friend.name} (ID: ${friend.id})`);
      });
    }

    console.log("\n");

    // 8. Проверка приватности
    console.log("8️⃣ ПРОВЕРКА ПРИВАТНОСТИ ПРОФИЛЕЙ");
    console.log("--------------------------------");

    const privateUserView = await makeRequest(`${BASE_URL}/users/all`, {
      headers: { Authorization: `Bearer ${user1.token}` },
    });

    if (privateUserView.ok) {
      const privateUser = privateUserView.data.data.users.find(
        (u) => u.id === user3.id
      );
      if (privateUser && privateUser.isPrivate) {
        console.log(`✅ ${user3.name} показан как приватный пользователь`);
        if (privateUser.stats.message) {
          console.log(`✅ Статистика скрыта: "${privateUser.stats.message}"`);
        }
      }
    }

    console.log("\n");

    // 9. Тест поиска
    console.log("9️⃣ ТЕСТ ПОИСКА ПОЛЬЗОВАТЕЛЕЙ");
    console.log("----------------------------");

    // Поиск по имени другого пользователя
    const searchOtherResponse = await makeRequest(
      `${BASE_URL}/users/all?search=${encodeURIComponent("Боб")}`,
      {
        headers: { Authorization: `Bearer ${user1.token}` },
      }
    );

    if (searchOtherResponse.ok) {
      const searchResults = searchOtherResponse.data.data.users;
      console.log(
        `✅ Поиск "Боб": найдено ${searchResults.length} пользователей`
      );
      searchResults.forEach((user) => {
        console.log(`   🔍 ${user.name} (ID: ${user.id})`);
      });
    }

    // Поиск по своему имени
    const searchSelfResponse = await makeRequest(
      `${BASE_URL}/users/all?search=${encodeURIComponent("Алиса")}`,
      {
        headers: { Authorization: `Bearer ${user1.token}` },
      }
    );

    if (searchSelfResponse.ok) {
      const searchResults = searchSelfResponse.data.data.users;
      console.log(
        `✅ Поиск "Алиса": найдено ${searchResults.length} пользователей`
      );

      const selfInSearch = searchResults.find((u) => u.id === user1.id);
      if (selfInSearch) {
        console.log(`❌ ОШИБКА: ${user1.name} нашла себя в поиске!`);
      } else {
        console.log(`✅ ${user1.name} НЕ нашла себя в поиске (правильно)`);
      }
    }

    console.log("\n");
    console.log("🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО!");
    console.log("==================================");
  } catch (error) {
    console.error("\n❌ КРИТИЧЕСКАЯ ОШИБКА ТЕСТА:", error.message);
    console.error("==================================");
  }
}

// Запуск тестов
if (require.main === module) {
  runFriendshipTests();
}

module.exports = { runFriendshipTests };
