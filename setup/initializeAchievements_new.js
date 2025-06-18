const { Achievement } = require("../models");

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
        icon: "💫",
        type: "topics_completed",
        condition_value: 50,
        points: 200,
        rarity: "epic",
      },
      {
        name: "Столетний рубеж",
        description: "Завершите 100 топиков",
        icon: "👑",
        type: "topics_completed",
        condition_value: 100,
        points: 500,
        rarity: "legendary",
      },
      {
        name: "Бесконечность и дальше",
        description: "Завершите 500 топиков",
        icon: "🌟",
        type: "topics_completed",
        condition_value: 500,
        points: 1000,
        rarity: "legendary",
      },

      // Достижения за создание заметок
      {
        name: "Первая запись",
        description: "Создайте свою первую заметку",
        icon: "📝",
        type: "notes_written",
        condition_value: 1,
        points: 5,
        rarity: "common",
      },
      {
        name: "Автор-новичок",
        description: "Создайте 10 заметок",
        icon: "✍️",
        type: "notes_written",
        condition_value: 10,
        points: 25,
        rarity: "common",
      },
      {
        name: "Опытный писатель",
        description: "Создайте 50 заметок",
        icon: "📚",
        type: "notes_written",
        condition_value: 50,
        points: 75,
        rarity: "rare",
      },
      {
        name: "Мастер пера",
        description: "Создайте 100 заметок",
        icon: "🖋️",
        type: "notes_written",
        condition_value: 100,
        points: 150,
        rarity: "epic",
      },
      {
        name: "Литературный гений",
        description: "Создайте 250 заметок",
        icon: "📖",
        type: "notes_written",
        condition_value: 250,
        points: 300,
        rarity: "legendary",
      },

      // Достижения за создание навыков
      {
        name: "Новые горизонты",
        description: "Создайте свой первый навык",
        icon: "🎨",
        type: "skills_created",
        condition_value: 1,
        points: 15,
        rarity: "common",
      },
      {
        name: "Многогранность",
        description: "Создайте 5 навыков",
        icon: "🎭",
        type: "skills_created",
        condition_value: 5,
        points: 50,
        rarity: "rare",
      },
      {
        name: "Универсал",
        description: "Создайте 15 навыков",
        icon: "🌈",
        type: "skills_created",
        condition_value: 15,
        points: 100,
        rarity: "epic",
      },
      {
        name: "Мастер всех ремёсел",
        description: "Создайте 30 навыков",
        icon: "🎪",
        type: "skills_created",
        condition_value: 30,
        points: 250,
        rarity: "legendary",
      },

      // Достижения за стрики (последовательную активность)
      {
        name: "Постоянство",
        description: "7 дней подряд активности",
        icon: "🔥",
        type: "streak_days",
        condition_value: 7,
        points: 50,
        rarity: "rare",
      },
      {
        name: "Двухнедельный марафон",
        description: "14 дней подряд активности",
        icon: "⚡",
        type: "streak_days",
        condition_value: 14,
        points: 100,
        rarity: "epic",
      },
      {
        name: "Месячная преданность",
        description: "30 дней подряд активности",
        icon: "💪",
        type: "streak_days",
        condition_value: 30,
        points: 200,
        rarity: "legendary",
      },

      // Достижения за общие очки опыта
      {
        name: "Студент",
        description: "Наберите 100 очков опыта",
        icon: "🎓",
        type: "special",
        condition_value: 100,
        points: 20,
        rarity: "common",
      },
      {
        name: "Бакалавр",
        description: "Наберите 500 очков опыта",
        icon: "🏅",
        type: "special",
        condition_value: 500,
        points: 50,
        rarity: "rare",
      },
      {
        name: "Магистр",
        description: "Наберите 1000 очков опыта",
        icon: "🏆",
        type: "special",
        condition_value: 1000,
        points: 100,
        rarity: "epic",
      },
      {
        name: "Доктор наук",
        description: "Наберите 2500 очков опыта",
        icon: "👨‍🎓",
        type: "special",
        condition_value: 2500,
        points: 250,
        rarity: "legendary",
      },

      // Достижения за уровни
      {
        name: "Первый уровень",
        description: "Достигните 5 уровня",
        icon: "🌱",
        type: "level_reached",
        condition_value: 5,
        points: 25,
        rarity: "common",
      },
      {
        name: "Двузначный уровень",
        description: "Достигните 10 уровня",
        icon: "🌿",
        type: "level_reached",
        condition_value: 10,
        points: 50,
        rarity: "rare",
      },
      {
        name: "Высота цели",
        description: "Достигните 25 уровня",
        icon: "🌳",
        type: "level_reached",
        condition_value: 25,
        points: 125,
        rarity: "epic",
      },
      {
        name: "Вершина мастерства",
        description: "Достигните 50 уровня",
        icon: "🏔️",
        type: "level_reached",
        condition_value: 50,
        points: 300,
        rarity: "legendary",
      },

      // Особые достижения
      {
        name: "Ранняя пташка",
        description: "Войдите в систему до 6:00 утра",
        icon: "🐦",
        type: "special",
        condition_value: 1,
        points: 30,
        rarity: "rare",
      },
      {
        name: "Полуночник",
        description: "Войдите в систему после 23:00",
        icon: "🦉",
        type: "special",
        condition_value: 1,
        points: 30,
        rarity: "rare",
      },
      {
        name: "Выходной энтузиаст",
        description: "Войдите в систему в выходные",
        icon: "🎉",
        type: "special",
        condition_value: 1,
        points: 25,
        rarity: "rare",
      },
      {
        name: "Первопроходец",
        description: "Один из первых 100 пользователей",
        icon: "🚀",
        type: "special",
        condition_value: 100,
        points: 100,
        rarity: "epic",
      },
      {
        name: "Индивидуальность",
        description: "Загрузите свой аватар",
        icon: "🖼️",
        type: "special",
        condition_value: 1,
        points: 10,
        rarity: "common",
      },
      {
        name: "Представительность",
        description: "Заполните профиль полностью",
        icon: "📋",
        type: "special",
        condition_value: 1,
        points: 25,
        rarity: "common",
      },
    ];

    // Создаем достижения если их еще нет
    for (const achievementData of achievements) {
      const [achievement, created] = await Achievement.findOrCreate({
        where: { name: achievementData.name },
        defaults: achievementData,
      });

      if (created) {
        console.log(`✅ Создано достижение: ${achievement.name}`);
      } else {
        console.log(`⏭️  Достижение уже существует: ${achievement.name}`);
      }
    }

    console.log("🎉 Инициализация достижений завершена!");
    console.log(`📊 Всего достижений в системе: ${achievements.length}`);

    // Показываем статистику по редкости
    const rarityStats = achievements.reduce((acc, achievement) => {
      acc[achievement.rarity] = (acc[achievement.rarity] || 0) + 1;
      return acc;
    }, {});

    console.log("\n📈 Статистика по редкости:");
    Object.entries(rarityStats).forEach(([rarity, count]) => {
      const emoji = {
        common: "⚪",
        rare: "🔵",
        epic: "🟣",
        legendary: "🟡",
      }[rarity];
      console.log(`   ${emoji} ${rarity}: ${count} достижений`);
    });

    return true;
  } catch (error) {
    console.error("❌ Ошибка при инициализации достижений:", error);
    return false;
  }
}

// Запускаем инициализацию если файл вызывается напрямую
if (require.main === module) {
  initializeAchievements()
    .then((success) => {
      if (success) {
        console.log("✅ Скрипт выполнен успешно");
        process.exit(0);
      } else {
        console.log("❌ Скрипт завершился с ошибкой");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("❌ Критическая ошибка:", error);
      process.exit(1);
    });
}

module.exports = initializeAchievements;
