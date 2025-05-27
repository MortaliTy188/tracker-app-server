const axios = require("axios");
const testData = require("./testData");

class NoteTests {
  constructor() {
    this.testToken = null;
    this.createdNoteId = null;
    this.topicId = null;
  }

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
        "❌ Ошибка получения токена для тестов заметок:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async runAllTests(axios, baseURL) {
    console.log("📝 Запуск тестов API заметок...");

    // Получаем токен
    const token = await this.getTestToken(axios, baseURL);
    if (!token) {
      throw new Error("Не удалось получить токен для тестов");
    }

    this.axiosInstance = axios.create({
      baseURL: baseURL,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    await this.setupTestTopic();

    const tests = [
      { name: "1. Создание заметки", method: this.testCreateNote },
      { name: "2. Получение всех заметок", method: this.testGetAllNotes },
      { name: "3. Получение заметки по ID", method: this.testGetNoteById },
      { name: "4. Обновление заметки", method: this.testUpdateNote },
      { name: "5. Поиск заметок", method: this.testSearchNotes },
      { name: "6. Последние заметки", method: this.testRecentNotes },
      { name: "7. Статистика заметок", method: this.testNotesStats },
      { name: "8. Удаление заметки", method: this.testDeleteNote },
    ];

    for (const test of tests) {
      try {
        console.log(`\n${test.name}...`);
        await test.method.call(this);
        console.log(`✅ ${test.name.substring(3)}: Успешно`);
      } catch (error) {
        console.error(
          `❌ ${test.name.substring(3)}: Ошибка - ${error.message}`
        );
        throw error;
      }
    }

    console.log("✅ Все тесты заметок завершены");
  }

  async setupTestTopic() {
    try {
      // Получаем существующие темы
      const topicsResponse = await this.axiosInstance.get("/api/topics");
      if (topicsResponse.data.data.topics.length > 0) {
        this.topicId = topicsResponse.data.data.topics[0].id;
        return;
      }

      // Если тем нет, создаем одну
      const skillsResponse = await this.axiosInstance.get("/api/skills");
      let skillId;

      if (skillsResponse.data.data.skills.length > 0) {
        skillId = skillsResponse.data.data.skills[0].id;
      } else {
        // Создаем навык если его нет
        const skillData = {
          name: "Тестовый навык для заметок",
          description: "Навык для тестирования заметок",
          category_id: 1, // Use first category
        };
        const skillResponse = await this.axiosInstance.post(
          "/api/skills",
          skillData
        );
        skillId = skillResponse.data.data.skill.id;
      }

      // Создаем тему
      const topicData = {
        name: "Тестовая тема для заметок",
        description: "Тема для тестирования заметок",
        skill_id: skillId,
        status_id: 1, // Используем первый статус "Не начато"
      };
      const topicResponse = await this.axiosInstance.post(
        "/api/topics",
        topicData
      );
      this.topicId = topicResponse.data.data.topic.id;
    } catch (error) {
      throw new Error(`Не удалось настроить тестовую тему: ${error.message}`);
    }
  }

  async testCreateNote() {
    const noteData = {
      title: "Тестовая заметка",
      content: "Это содержание тестовой заметки для проверки API",
      topic_id: this.topicId,
    };

    const response = await this.axiosInstance.post("/api/notes", noteData);

    if (response.status !== 201) {
      throw new Error(`Ожидался статус 201, получен ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error("Поле success должно быть true");
    }

    if (!response.data.data || !response.data.data.note) {
      throw new Error("Ответ должен содержать данные заметки");
    }

    const note = response.data.data.note;
    if (note.title !== noteData.title || note.content !== noteData.content) {
      throw new Error("Данные заметки не соответствуют отправленным");
    }

    this.createdNoteId = note.id;
  }

  async testGetAllNotes() {
    const response = await this.axiosInstance.get("/api/notes");

    if (response.status !== 200) {
      throw new Error(`Ожидался статус 200, получен ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error("Поле success должно быть true");
    }

    if (!Array.isArray(response.data.data.notes)) {
      throw new Error("Ответ должен содержать массив заметок");
    }

    // Проверяем, что наша созданная заметка есть в списке
    const foundNote = response.data.data.notes.find(
      (note) => note.id === this.createdNoteId
    );
    if (!foundNote) {
      throw new Error("Созданная заметка не найдена в списке");
    }
  }

  async testGetNoteById() {
    if (!this.createdNoteId) {
      throw new Error("Сначала должна быть создана заметка");
    }

    const response = await this.axiosInstance.get(
      `/api/notes/${this.createdNoteId}`
    );

    if (response.status !== 200) {
      throw new Error(`Ожидался статус 200, получен ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error("Поле success должно быть true");
    }

    if (!response.data.data || !response.data.data.note) {
      throw new Error("Ответ должен содержать данные заметки");
    }

    const note = response.data.data.note;
    if (note.id !== this.createdNoteId) {
      throw new Error("ID заметки не совпадает с запрошенным");
    }
  }

  async testUpdateNote() {
    if (!this.createdNoteId) {
      throw new Error("Сначала должна быть создана заметка");
    }

    const updateData = {
      title: "Обновленная тестовая заметка",
      content: "Обновленное содержание заметки",
    };

    const response = await this.axiosInstance.put(
      `/api/notes/${this.createdNoteId}`,
      updateData
    );

    if (response.status !== 200) {
      throw new Error(`Ожидался статус 200, получен ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error("Поле success должно быть true");
    }

    // Проверяем, что данные действительно обновились
    const getResponse = await this.axiosInstance.get(
      `/api/notes/${this.createdNoteId}`
    );
    const updatedNote = getResponse.data.data.note;

    if (
      updatedNote.title !== updateData.title ||
      updatedNote.content !== updateData.content
    ) {
      throw new Error("Данные заметки не были обновлены");
    }
  }

  async testSearchNotes() {
    const response = await this.axiosInstance.get(
      "/api/notes/search?query=Обновленная"
    );

    if (response.status !== 200) {
      throw new Error(`Ожидался статус 200, получен ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error("Поле success должно быть true");
    }

    if (!Array.isArray(response.data.data.notes)) {
      throw new Error("Ответ должен содержать массив найденных заметок");
    }

    // Проверяем, что поиск нашел нашу обновленную заметку
    const foundNote = response.data.data.notes.find(
      (note) => note.id === this.createdNoteId
    );
    if (!foundNote) {
      throw new Error("Поиск не нашел обновленную заметку");
    }
  }

  async testRecentNotes() {
    const response = await this.axiosInstance.get("/api/notes/recent?limit=5");

    if (response.status !== 200) {
      throw new Error(`Ожидался статус 200, получен ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error("Поле success должно быть true");
    }

    if (!Array.isArray(response.data.data.notes)) {
      throw new Error("Ответ должен содержать массив последних заметок");
    }

    // Проверяем, что результат ограничен лимитом
    if (response.data.data.notes.length > 5) {
      throw new Error("Количество заметок превышает установленный лимит");
    }
  }

  async testNotesStats() {
    const response = await this.axiosInstance.get("/api/notes/stats");

    if (response.status !== 200) {
      throw new Error(`Ожидался статус 200, получен ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error("Поле success должно быть true");
    }

    if (!response.data.data) {
      throw new Error("Ответ должен содержать статистику");
    }

    // Проверяем наличие основных полей статистики
    const stats = response.data.data.stats;
    if (typeof stats.totalNotes !== "number") {
      throw new Error("Статистика должна содержать общее количество заметок");
    }
  }

  async testDeleteNote() {
    if (!this.createdNoteId) {
      throw new Error("Сначала должна быть создана заметка");
    }

    const response = await this.axiosInstance.delete(
      `/api/notes/${this.createdNoteId}`
    );

    if (response.status !== 200) {
      throw new Error(`Ожидался статус 200, получен ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error("Поле success должно быть true");
    }

    // Проверяем, что заметка действительно удалена
    try {
      await this.axiosInstance.get(`/api/notes/${this.createdNoteId}`);
      throw new Error("Заметка не была удалена");
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Это ожидаемое поведение - заметка должна быть удалена
        return;
      }
      throw error;
    }
  }
}

module.exports = new NoteTests();
