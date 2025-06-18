const fs = require("fs");
const path = require("path");
const { User } = require("../models");

class AvatarCleaner {
  constructor() {
    this.avatarsDir = path.join(__dirname, "../uploads/avatars");
  }

  /**
   * Получает список всех файлов аватаров в папке
   */
  getAllAvatarFiles() {
    try {
      if (!fs.existsSync(this.avatarsDir)) {
        console.log("Папка аватаров не существует");
        return [];
      }

      return fs
        .readdirSync(this.avatarsDir)
        .filter((file) => file.match(/\.(jpg|jpeg|png|gif|webp)$/i));
    } catch (error) {
      console.error("Ошибка чтения папки аватаров:", error);
      return [];
    }
  }

  /**
   * Получает список всех аватаров, используемых пользователями
   */
  async getUsedAvatars() {
    try {
      const users = await User.findAll({
        where: {
          avatar: {
            [require("sequelize").Op.not]: null,
          },
        },
        attributes: ["avatar"],
      });

      return users
        .map((user) => {
          if (user.avatar) {
            return path.basename(user.avatar);
          }
          return null;
        })
        .filter(Boolean);
    } catch (error) {
      console.error("Ошибка получения используемых аватаров:", error);
      return [];
    }
  }

  /**
   * Находит неиспользуемые файлы аватаров
   */
  async findUnusedAvatars() {
    const allFiles = this.getAllAvatarFiles();
    const usedAvatars = await this.getUsedAvatars();

    return allFiles.filter((file) => !usedAvatars.includes(file));
  }

  /**
   * Удаляет неиспользуемые файлы аватаров
   */
  async cleanupUnusedAvatars(dryRun = true) {
    const unusedFiles = await this.findUnusedAvatars();
    const results = {
      totalFiles: this.getAllAvatarFiles().length,
      usedFiles: (await this.getUsedAvatars()).length,
      unusedFiles: unusedFiles.length,
      deletedFiles: [],
      errors: [],
    };

    if (unusedFiles.length === 0) {
      console.log("Неиспользуемые аватары не найдены");
      return results;
    }

    console.log(`Найдено ${unusedFiles.length} неиспользуемых файлов аватаров`);

    if (dryRun) {
      console.log("Режим проверки (dry run). Файлы не будут удалены.");
      console.log("Неиспользуемые файлы:", unusedFiles);
      return results;
    }

    for (const file of unusedFiles) {
      try {
        const filePath = path.join(this.avatarsDir, file);
        fs.unlinkSync(filePath);
        results.deletedFiles.push(file);
        console.log(`Удален неиспользуемый аватар: ${file}`);
      } catch (error) {
        console.error(`Ошибка удаления файла ${file}:`, error);
        results.errors.push({ file, error: error.message });
      }
    }

    return results;
  }

  /**
   * Получает статистику использования аватаров
   */
  async getAvatarStats() {
    const allFiles = this.getAllAvatarFiles();
    const usedAvatars = await this.getUsedAvatars();
    const unusedFiles = await this.findUnusedAvatars();

    // Подсчет размера файлов
    let totalSize = 0;
    let unusedSize = 0;

    allFiles.forEach((file) => {
      try {
        const filePath = path.join(this.avatarsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        if (unusedFiles.includes(file)) {
          unusedSize += stats.size;
        }
      } catch (error) {
        console.error(`Ошибка получения размера файла ${file}:`, error);
      }
    });

    return {
      totalFiles: allFiles.length,
      usedFiles: usedAvatars.length,
      unusedFiles: unusedFiles.length,
      totalSize: this.formatBytes(totalSize),
      unusedSize: this.formatBytes(unusedSize),
      unusedFilesList: unusedFiles,
    };
  }

  /**
   * Форматирует размер в байтах в читаемый вид
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

module.exports = AvatarCleaner;
