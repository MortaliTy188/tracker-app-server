class UserValidation {
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateAvatarFile(file) {
    const errors = [];
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!file) {
      errors.push("Файл изображения обязателен");
      return { isValid: false, errors };
    }

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push("Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF");
    }

    if (file.size > maxSize) {
      errors.push("Размер файла не должен превышать 5MB");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static isValidPassword(password) {
    return password && password.length >= 6;
  }

  static isValidName(name) {
    return name && name.trim().length >= 2 && name.trim().length <= 50;
  }

  static validateRegistrationData(data) {
    const errors = [];

    if (!data.name || !this.isValidName(data.name)) {
      errors.push("Имя должно содержать от 2 до 50 символов");
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push("Введите корректный email адрес");
    }

    if (!data.password || !this.isValidPassword(data.password)) {
      errors.push("Пароль должен содержать минимум 6 символов");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateLoginData(data) {
    const errors = [];

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push("Введите корректный email адрес");
    }

    if (!data.password) {
      errors.push("Пароль обязателен");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateProfileUpdateData(data) {
    const errors = [];

    if (data.name !== undefined && !this.isValidName(data.name)) {
      errors.push("Имя должно содержать от 2 до 50 символов");
    }

    if (data.email !== undefined && !this.isValidEmail(data.email)) {
      errors.push("Введите корректный email адрес");
    }

    if (!data.name && !data.email) {
      errors.push("Необходимо указать имя или email для обновления");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validatePasswordChange(data) {
    const errors = [];

    if (!data.currentPassword) {
      errors.push("Текущий пароль обязателен");
    }

    if (!data.newPassword || !this.isValidPassword(data.newPassword)) {
      errors.push("Новый пароль должен содержать минимум 6 символов");
    }

    if (data.currentPassword === data.newPassword) {
      errors.push("Новый пароль должен отличаться от текущего");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static sanitizeName(name) {
    return name ? name.trim().replace(/\s+/g, " ") : "";
  }

  static normalizeEmail(email) {
    return email ? email.toLowerCase().trim() : "";
  }
}

module.exports = UserValidation;
