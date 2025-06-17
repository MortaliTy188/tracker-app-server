const { Achievement } = require("./models");

/**
 * Скрипт для создания базового набора достижений
 */
async function initializeAchievements() {
  try {
    console.log("🏆 Инициализация системы достижений...");

    const achievements = [
      // Достижения за завершенные топики
      {
        name: "Первые шаги",
        description: "Завершите свой первый топик",
        icon: "🎯",
        type: "topics_completed",
        condition_value: 1,
        points: 10,
        rarity: "common",
      },
      {
        name: "Набираем обороты",
        description: "Завершите 5 топиков",
        icon: "🚀",
        type: "topics_completed",
        condition_value: 5,
        points: 25,
        rarity: "common",
      },
      {
        name: "Двузначный рубеж",
        description: "Завершите 10 топиков",
        icon: "🔥",
        type: "topics_completed",
        condition_value: 10,
        points: 50,
        rarity: "rare",
      },
      {
        name: "Четверть сотни",
        description: "Завершите 25 топиков",
        icon: "⭐",
        type: "topics_completed",
        condition_value: 25,
        points: 100,
        rarity: "rare",
      },
      {
        name: "Полувековой юбилей",
        description: "Завершите 50 топиков",
        icon: "🎖️",
        type: "topics_completed",
        condition_value: 50,
        points: 200,
        rarity: "epic",
      },
      {
        name: "Сотня!",
        description: "Завершите 100 топиков",
        icon: "👑",
        type: "topics_completed",
        condition_value: 100,
        points: 500,
        rarity: "legendary",
      },

      // Достижения за созданные навыки
      {
        name: "Мой первый навык",
        description: "Создайте свой первый навык",
        icon: "🌱",
        type: "skills_created",
        condition_value: 1,
        points: 5,
        rarity: "common",
      },
      {
        name: "Коллекционер навыков",
        description: "Создайте 5 навыков",
        icon: "📚",
        type: "skills_created",
        condition_value: 5,
        points: 30,
        rarity: "rare",
      },
      {
        name: "Мастер многих дел",
        description: "Создайте 10 навыков",
        icon: "🎭",
        type: "skills_created",
        condition_value: 10,
        points: 75,
        rarity: "epic",
      },

      // Достижения за заметки
      {
        name: "Первая заметка",
        description: "Напишите свою первую заметку",
        icon: "📝",
        type: "notes_written",
        condition_value: 1,
        points: 5,
        rarity: "common",
      },
      {
        name: "Активный писатель",
        description: "Напишите 10 заметок",
        icon: "✍️",
        type: "notes_written",
        condition_value: 10,
        points: 40,
        rarity: "rare",
      },
      {
        name: "Хроникёр знаний",
        description: "Напишите 25 заметок",
        icon: "📖",
        type: "notes_written",
        condition_value: 25,
        points: 80,
        rarity: "epic",
      },

      // Достижения за уровни
      {
        name: "Уровень: Базовый",
        description: "Достигните базового уровня",
        icon: "🥉",
        type: "level_reached",
        condition_value: 2, // базовый = 2
        points: 50,
        rarity: "common",
      },
      {
        name: "Уровень: Продвинутый",
        description: "Достигните продвинутого уровня",
        icon: "🥈",
        type: "level_reached",
        condition_value: 3, // продвинутый = 3
        points: 100,
        rarity: "rare",
      },
      {
        name: "Уровень: Эксперт",
        description: "Достигните уровня эксперта",
        icon: "🥇",
        type: "level_reached",
        condition_value: 4, // эксперт = 4
        points: 250,
        rarity: "legendary",
      },

      // Достижения за категории
      {
        name: "Первая категория",
        description: "Освойте свою первую категорию навыков",
        icon: "📁",
        type: "categories_mastered",
        condition_value: 1,
        points: 30,
        rarity: "common",
      },
      {
        name: "Универсал",
        description: "Освойте 3 различные категории навыков",
        icon: "🌟",
        type: "categories_mastered",
        condition_value: 3,
        points: 100,
        rarity: "epic",
      },

      // Первые действия
      {
        name: "Добро пожаловать!",
        description: "Создайте свой первый навык",
        icon: "👋",
        type: "first_action",
        condition_value: 1,
        condition_data: { action_type: "first_skill" },
        points: 5,
        rarity: "common",
      },
      {
        name: "Начинаем изучение",
        description: "Создайте свой первый топик",
        icon: "🎬",
        type: "first_action",
        condition_value: 1,
        condition_data: { action_type: "first_topic" },
        points: 5,
        rarity: "common",
      },
      {
        name: "Первые записи",
        description: "Напишите свою первую заметку",
        icon: "📄",
        type: "first_action",
        condition_value: 1,
        condition_data: { action_type: "first_note" },
        points: 5,
        rarity: "common",
      },
      {
        name: "Первый успех",
        description: "Завершите свой первый топик",
        icon: "🎉",
        type: "first_action",
        condition_value: 1,
        condition_data: { action_type: "first_completed_topic" },
        points: 15,
        rarity: "common",
      },

      // Специальные достижения
      {
        name: "Перфекционист",
        description: "Завершите 5 топиков подряд со 100% прогрессом",
        icon: "💎",
        type: "special",
        condition_value: 5,
        condition_data: { special_type: "perfect_streak" },
        points: 150,
        rarity: "epic",
      },
      {
        name: "Спринтер",
        description: "Завершите 3 топика за один день",
        icon: "⚡",
        type: "special",
        condition_value: 3,
        condition_data: { special_type: "daily_sprint" },
        points: 100,
        rarity: "rare",
      },

      // Дополнительные достижения за активность
      {
        name: "Исследователь",
        description: "Создайте навыки в 5 различных категориях",
        icon: "🔍",
        type: "categories_mastered",
        condition_value: 5,
        points: 200,
        rarity: "epic",
      },
      {
        name: "Продуктивный день",
        description: "Завершите 5 топиков за один день",
        icon: "🌅",
        type: "special",
        condition_value: 5,
        condition_data: { special_type: "daily_productivity" },
        points: 150,
        rarity: "rare",
      },
      {
        name: "Неделя целей",
        description:
          "Завершите хотя бы один топик каждый день в течение недели",
        icon: "📅",
        type: "special",
        condition_value: 7,
        condition_data: { special_type: "weekly_consistency" },
        points: 300,
        rarity: "epic",
      },
      {
        name: "Марафонец знаний",
        description: "Завершите 200 топиков",
        icon: "🏃‍♂️",
        type: "topics_completed",
        condition_value: 200,
        points: 1000,
        rarity: "legendary",
      },
      {
        name: "Мастер заметок",
        description: "Напишите 50 заметок",
        icon: "📚",
        type: "notes_written",
        condition_value: 50,
        points: 200,
        rarity: "epic",
      },
      {
        name: "Коллекционер достижений",
        description: "Получите 10 различных достижений",
        icon: "🏅",
        type: "special",
        condition_value: 10,
        condition_data: { special_type: "achievement_collector" },
        points: 250,
        rarity: "epic",
      },
      {
        name: "Утренняя активность",
        description: "Завершите топик до 9:00 утра",
        icon: "🌞",
        type: "special",
        condition_value: 1,
        condition_data: { special_type: "early_bird" },
        points: 50,
        rarity: "rare",
      },
      {
        name: "Ночная сова",
        description: "Завершите топик после 23:00",
        icon: "🦉",
        type: "special",
        condition_value: 1,
        condition_data: { special_type: "night_owl" },
        points: 50,
        rarity: "rare",
      },
      {
        name: "Быстрый старт",
        description: "Завершите первый топик в течение часа после регистрации",
        icon: "🚀",
        type: "special",
        condition_value: 1,
        condition_data: { special_type: "quick_start" },
        points: 100,
        rarity: "rare",
      },
      {
        name: "Возвращение",
        description: "Вернитесь в приложение после 30-дневного перерыва",
        icon: "🔄",
        type: "special",
        condition_value: 1,
        condition_data: { special_type: "comeback" },
        points: 75,
        rarity: "rare",
      },
    ];

    // Создаем достижения
    for (const achievementData of achievements) {
      const [achievement, created] = await Achievement.findOrCreate({
        where: { name: achievementData.name },
        defaults: achievementData,
      });

      if (created) {
        console.log(`✅ Создано достижение: ${achievement.name}`);
      } else {
        console.log(`ℹ️  Достижение уже существует: ${achievement.name}`);
      }
    }

    console.log(
      `🎉 Инициализация завершена! Создано ${achievements.length} достижений.`
    );
  } catch (error) {
    console.error("❌ Ошибка при инициализации достижений:", error);
  }
}

// Запускаем скрипт только если он вызван напрямую
if (require.main === module) {
  initializeAchievements()
    .then(() => {
      console.log("Скрипт инициализации достижений завершен");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Критическая ошибка:", error);
      process.exit(1);
    });
}

module.exports = {
  initializeAchievements,
};
