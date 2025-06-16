// Тесты для функционала аватарок
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

class AvatarTests {
  constructor() {
    this.testResults = [];
  }

  // Создание тестового изображения
  async createTestImage() {
    try {
      // Создаем простое изображение 100x100 пикселей с помощью Sharp
      const imageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer();

      return imageBuffer;
    } catch (error) {
      console.error("Ошибка создания тестового изображения:", error);
      // Fallback на простой PNG
      return Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x37, 0x6e, 0xf9, 0x24, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0x00, 0x00, 0x00, 0x02,
        0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
        0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);
    }
  }

  // Создание большого файла для тестирования лимитов
  createLargeFile() {
    // Создаем буфер размером больше 5MB
    return Buffer.alloc(6 * 1024 * 1024, 0);
  }

  // Тест загрузки аватарки
  async testUploadAvatar(axios, baseURL, token) {
    try {
      console.log("\n📤 Тест загрузки аватарки...");

      const FormData = require("form-data");
      const form = new FormData();

      const imageBuffer = await this.createTestImage();
      form.append("avatar", imageBuffer, {
        filename: "test-avatar.png",
        contentType: "image/png",
      });

      const response = await axios.post(`${baseURL}/api/users/avatar`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...form.getHeaders(),
        },
      });

      console.log("✅ Аватарка успешно загружена:", response.data);

      // Проверяем структуру ответа
      if (
        response.data.success &&
        response.data.data.avatar &&
        response.data.data.user.avatar
      ) {
        console.log("✅ Структура ответа корректна");
        this.testResults.push({ test: "uploadAvatar", status: "passed" });
        return response.data.data.avatar;
      } else {
        console.error("❌ Некорректная структура ответа");
        this.testResults.push({ test: "uploadAvatar", status: "failed" });
        return null;
      }
    } catch (error) {
      console.error(
        "❌ Ошибка загрузки аватарки:",
        error.response?.data || error.message
      );
      this.testResults.push({ test: "uploadAvatar", status: "failed" });
      return null;
    }
  }

  // Тест загрузки слишком большого файла
  async testUploadLargeFile(axios, baseURL, token) {
    try {
      console.log("\n📤 Тест загрузки большого файла...");

      const FormData = require("form-data");
      const form = new FormData();

      const largeBuffer = this.createLargeFile();
      form.append("avatar", largeBuffer, {
        filename: "large-avatar.png",
        contentType: "image/png",
      });

      await axios.post(`${baseURL}/api/users/avatar`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...form.getHeaders(),
        },
      });

      console.error("❌ Большой файл не должен был загрузиться");
      this.testResults.push({ test: "uploadLargeFile", status: "failed" });
      return false;
    } catch (error) {
      // Проверяем различные возможные ошибки размера файла
      const isFileSizeError =
        (error.response?.status === 400 &&
          (error.response?.data?.message?.includes("размер") ||
            error.response?.data?.message?.includes("большой") ||
            error.response?.data?.message?.includes("5MB"))) ||
        error.code === "LIMIT_FILE_SIZE" ||
        error.message?.includes("File too large");

      if (isFileSizeError) {
        console.log(
          "✅ Большой файл корректно отклонен:",
          error.response?.data?.message || error.message
        );
        this.testResults.push({ test: "uploadLargeFile", status: "passed" });
        return true;
      } else {
        console.error(
          "❌ Неожиданная ошибка:",
          error.response?.data || error.message
        );
        this.testResults.push({ test: "uploadLargeFile", status: "failed" });
        return false;
      }
    }
  }

  // Тест загрузки неправильного типа файла
  async testUploadWrongFileType(axios, baseURL, token) {
    try {
      console.log("\n📤 Тест загрузки неправильного типа файла...");

      const FormData = require("form-data");
      const form = new FormData();

      const textBuffer = Buffer.from("This is not an image", "utf8");
      form.append("avatar", textBuffer, {
        filename: "test.txt",
        contentType: "text/plain",
      });

      await axios.post(`${baseURL}/api/users/avatar`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...form.getHeaders(),
        },
      });

      console.error("❌ Текстовый файл не должен был загрузиться");
      this.testResults.push({ test: "uploadWrongFileType", status: "failed" });
      return false;
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("тип файла")
      ) {
        console.log(
          "✅ Неправильный тип файла корректно отклонен:",
          error.response.data.message
        );
        this.testResults.push({
          test: "uploadWrongFileType",
          status: "passed",
        });
        return true;
      } else {
        console.error(
          "❌ Неожиданная ошибка:",
          error.response?.data || error.message
        );
        this.testResults.push({
          test: "uploadWrongFileType",
          status: "failed",
        });
        return false;
      }
    }
  }

  // Тест получения профиля с аватаркой
  async testGetProfileWithAvatar(axios, baseURL, token) {
    try {
      console.log("\n👤 Тест получения профиля с аватаркой...");

      const response = await axios.get(`${baseURL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Профиль получен:", response.data);

      if (
        response.data.success &&
        response.data.data.user &&
        response.data.data.user.avatar
      ) {
        console.log("✅ Аватарка присутствует в профиле");
        this.testResults.push({
          test: "getProfileWithAvatar",
          status: "passed",
        });
        return true;
      } else {
        console.error("❌ Аватарка отсутствует в профиле");
        this.testResults.push({
          test: "getProfileWithAvatar",
          status: "failed",
        });
        return false;
      }
    } catch (error) {
      console.error(
        "❌ Ошибка получения профиля:",
        error.response?.data || error.message
      );
      this.testResults.push({ test: "getProfileWithAvatar", status: "failed" });
      return false;
    }
  }

  // Тест удаления аватарки
  async testDeleteAvatar(axios, baseURL, token) {
    try {
      console.log("\n🗑️ Тест удаления аватарки...");

      const response = await axios.delete(`${baseURL}/api/users/avatar`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Аватарка удалена:", response.data);

      if (response.data.success && response.data.data.user.avatar === null) {
        console.log("✅ Аватарка корректно удалена");
        this.testResults.push({ test: "deleteAvatar", status: "passed" });
        return true;
      } else {
        console.error("❌ Аватарка не была удалена");
        this.testResults.push({ test: "deleteAvatar", status: "failed" });
        return false;
      }
    } catch (error) {
      console.error(
        "❌ Ошибка удаления аватарки:",
        error.response?.data || error.message
      );
      this.testResults.push({ test: "deleteAvatar", status: "failed" });
      return false;
    }
  }

  // Тест удаления несуществующей аватарки
  async testDeleteNonExistentAvatar(axios, baseURL, token) {
    try {
      console.log("\n🗑️ Тест удаления несуществующей аватарки...");

      await axios.delete(`${baseURL}/api/users/avatar`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.error(
        "❌ Удаление несуществующей аватарки должно было вернуть ошибку"
      );
      this.testResults.push({
        test: "deleteNonExistentAvatar",
        status: "failed",
      });
      return false;
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("нет аватарки")
      ) {
        console.log(
          "✅ Корректная ошибка при удалении несуществующей аватарки:",
          error.response.data.message
        );
        this.testResults.push({
          test: "deleteNonExistentAvatar",
          status: "passed",
        });
        return true;
      } else {
        console.error(
          "❌ Неожиданная ошибка:",
          error.response?.data || error.message
        );
        this.testResults.push({
          test: "deleteNonExistentAvatar",
          status: "failed",
        });
        return false;
      }
    }
  }

  // Тест загрузки без авторизации
  async testUploadWithoutAuth(axios, baseURL) {
    try {
      console.log("\n🔒 Тест загрузки без авторизации...");
      const FormData = require("form-data");
      const form = new FormData();

      const imageBuffer = await this.createTestImage();
      form.append("avatar", imageBuffer, {
        filename: "test-avatar.png",
        contentType: "image/png",
      });

      await axios.post(`${baseURL}/api/users/avatar`, form, {
        headers: form.getHeaders(),
      });

      console.error("❌ Загрузка без авторизации должна была быть отклонена");
      this.testResults.push({ test: "uploadWithoutAuth", status: "failed" });
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ Загрузка без авторизации корректно отклонена");
        this.testResults.push({ test: "uploadWithoutAuth", status: "passed" });
        return true;
      } else {
        console.error(
          "❌ Неожиданная ошибка:",
          error.response?.data || error.message
        );
        this.testResults.push({ test: "uploadWithoutAuth", status: "failed" });
        return false;
      }
    }
  }

  // Проверка физического файла
  async testPhysicalFileExists(avatarUrl) {
    try {
      console.log("\n📁 Проверка физического файла...");

      if (!avatarUrl) {
        console.error("❌ URL аватарки не предоставлен");
        this.testResults.push({ test: "physicalFileExists", status: "failed" });
        return false;
      }

      // Извлекаем путь к файлу из URL
      const filename = path.basename(avatarUrl);
      const uploadsDir = path.join(__dirname, "../uploads/avatars");
      const filePath = path.join(uploadsDir, filename);

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(
          `✅ Файл существует: ${filename}, размер: ${stats.size} байт`
        );
        this.testResults.push({ test: "physicalFileExists", status: "passed" });
        return true;
      } else {
        console.error(`❌ Файл не найден: ${filePath}`);
        this.testResults.push({ test: "physicalFileExists", status: "failed" });
        return false;
      }
    } catch (error) {
      console.error("❌ Ошибка проверки файла:", error.message);
      this.testResults.push({ test: "physicalFileExists", status: "failed" });
      return false;
    }
  }
  // Регистрация пользователя для тестов
  async registerTestUser(axios, baseURL) {
    try {
      const userData = {
        name: "Тест Аватарок",
        email: `avatar_test_${Date.now()}@example.com`,
        password: "TestPassword123",
      };

      const response = await axios.post(
        `${baseURL}/api/users/register`,
        userData
      );

      if (response.data.success && response.data.data.token) {
        return response.data.data.token;
      } else {
        throw new Error("Не удалось получить токен при регистрации");
      }
    } catch (error) {
      console.error(
        "❌ Ошибка регистрации тестового пользователя:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Запуск всех тестов
  async runAllTests(axios, baseURL, providedToken = null) {
    console.log("🚀 Запуск тестов аватарок...");
    this.testResults = [];

    try {
      // Получаем собственный токен для тестов
      let token = providedToken;
      if (!token) {
        console.log("🔑 Регистрация тестового пользователя для аватарок...");
        token = await this.registerTestUser(axios, baseURL);
        console.log("✅ Токен получен для тестов аватарок");
      }
      // Тест загрузки без авторизации
      await this.testUploadWithoutAuth(axios, baseURL);

      // Тест удаления несуществующей аватарки
      await this.testDeleteNonExistentAvatar(axios, baseURL, token);

      // Тест загрузки неправильного типа файла
      await this.testUploadWrongFileType(axios, baseURL, token);

      // Тест загрузки большого файла
      await this.testUploadLargeFile(axios, baseURL, token);

      // Тест успешной загрузки аватарки
      const avatarUrl = await this.testUploadAvatar(axios, baseURL, token);

      // Проверка физического файла
      if (avatarUrl) {
        await this.testPhysicalFileExists(avatarUrl);
      }

      // Тест получения профиля с аватаркой
      await this.testGetProfileWithAvatar(axios, baseURL, token);

      // Тест удаления аватарки
      await this.testDeleteAvatar(axios, baseURL, token);

      // Итоги тестирования
      const passed = this.testResults.filter(
        (r) => r.status === "passed"
      ).length;
      const failed = this.testResults.filter(
        (r) => r.status === "failed"
      ).length;
      const total = this.testResults.length;

      console.log(`\n📊 Результаты тестирования аватарок:`);
      console.log(`✅ Прошло: ${passed}/${total}`);
      console.log(`❌ Провалено: ${failed}/${total}`);
      console.log(`📈 Успешность: ${Math.round((passed / total) * 100)}%`);

      if (failed > 0) {
        console.log("\n❌ Проваленные тесты:");
        this.testResults
          .filter((r) => r.status === "failed")
          .forEach((r) => console.log(`   - ${r.test}`));
      }

      return { passed, failed, total, success: failed === 0 };
    } catch (error) {
      console.error("❌ Критическая ошибка при тестировании:", error);
      return { passed: 0, failed: 1, total: 1, success: false };
    }
  }
}

module.exports = new AvatarTests();
