/**
 * Скрипт для очистки неиспользуемых файлов аватаров
 *
 * Использование:
 * node setup/cleanupAvatars.js --dry-run  # Просмотр без удаления
 * node setup/cleanupAvatars.js --clean    # Реальная очистка
 * node setup/cleanupAvatars.js --stats    # Статистика
 */

const AvatarCleaner = require("../utils/avatarCleaner");

async function main() {
  const args = process.argv.slice(2);
  const cleaner = new AvatarCleaner();

  console.log("🧹 Утилита очистки аватаров");
  console.log("=====================================");

  try {
    if (args.includes("--stats")) {
      console.log("📊 Получение статистики...");
      const stats = await cleaner.getAvatarStats();

      console.log(`\n📈 Статистика аватаров:`);
      console.log(`   Всего файлов: ${stats.totalFiles}`);
      console.log(`   Используемых: ${stats.usedFiles}`);
      console.log(`   Неиспользуемых: ${stats.unusedFiles}`);
      console.log(`   Общий размер: ${stats.totalSize}`);
      console.log(`   Размер неиспользуемых: ${stats.unusedSize}`);

      if (stats.unusedFiles > 0) {
        console.log(`\n🗑️ Неиспользуемые файлы:`);
        stats.unusedFilesList.forEach((file) => console.log(`   - ${file}`));
      }
    } else if (args.includes("--clean")) {
      console.log("🧽 Выполнение очистки...");
      const results = await cleaner.cleanupUnusedAvatars(false);

      console.log(`\n✅ Очистка завершена:`);
      console.log(`   Всего файлов: ${results.totalFiles}`);
      console.log(`   Используемых: ${results.usedFiles}`);
      console.log(`   Удалено: ${results.deletedFiles.length}`);

      if (results.errors.length > 0) {
        console.log(`   Ошибок: ${results.errors.length}`);
        results.errors.forEach((err) =>
          console.log(`   ❌ ${err.file}: ${err.error}`)
        );
      }
    } else {
      // По умолчанию - dry run
      console.log("👀 Проверка (без удаления файлов)...");
      const results = await cleaner.cleanupUnusedAvatars(true);

      console.log(`\n🔍 Результаты проверки:`);
      console.log(`   Всего файлов: ${results.totalFiles}`);
      console.log(`   Используемых: ${results.usedFiles}`);
      console.log(`   Неиспользуемых: ${results.unusedFiles}`);

      if (results.unusedFiles > 0) {
        console.log(
          `\n💡 Для реальной очистки используйте: node setup/cleanupAvatars.js --clean`
        );
      }
    }
  } catch (error) {
    console.error("❌ Ошибка выполнения:", error);
    process.exit(1);
  }
}

// Показать справку
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
🧹 Утилита очистки аватаров

Команды:
  node setup/cleanupAvatars.js               # Проверка без удаления
  node setup/cleanupAvatars.js --dry-run     # То же самое
  node setup/cleanupAvatars.js --clean       # Реальная очистка
  node setup/cleanupAvatars.js --stats       # Подробная статистика
  node setup/cleanupAvatars.js --help        # Эта справка

Примеры:
  # Посмотреть что будет удалено
  node setup/cleanupAvatars.js
  
  # Получить статистику
  node setup/cleanupAvatars.js --stats
  
  # Выполнить очистку
  node setup/cleanupAvatars.js --clean
`);
  process.exit(0);
}

main();
