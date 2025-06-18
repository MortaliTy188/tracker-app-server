const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../uploads");
const avatarsDir = path.join(uploadsDir, "avatars");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new Error("Недопустимый тип файла. Загружайте только изображения."),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

const processAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const userId = req.user.id;
    const filename = `avatar-${userId}-${Date.now()}.webp`;
    const filepath = path.join(avatarsDir, filename);

    await sharp(req.file.buffer)
      .resize(300, 300, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toFile(filepath);

    req.processedFile = {
      filename: filename,
      path: filepath,
      url: `/uploads/avatars/${filename}`,
    };

    next();
  } catch (error) {
    console.error("Ошибка обработки изображения:", error);
    next(new Error("Ошибка обработки изображения"));
  }
};

const deleteOldAvatar = (avatarPath) => {
  if (avatarPath) {
    const filename = path.basename(avatarPath);
    const fullPath = path.join(avatarsDir, filename);

    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        console.log(`Удалена старая аватарка: ${filename}`);
        return { success: true, deletedFile: filename };
      } catch (error) {
        console.error(`Ошибка удаления файла ${filename}:`, error);
        return { success: false, error: error.message };
      }
    } else {
      console.log(`Файл аватарки не найден: ${filename}`);
      return { success: false, error: "Файл не найден" };
    }
  }
  return { success: false, error: "Путь к аватарке не указан" };
};

module.exports = {
  uploadAvatar: upload.single("avatar"),
  processAvatar,
  deleteOldAvatar,
  avatarsDir,
};
