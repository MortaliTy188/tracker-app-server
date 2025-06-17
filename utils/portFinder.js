const net = require("net");

/**
 * Утилита для поиска свободного порта
 */
class PortFinder {
  /**
   * Проверяет, свободен ли указанный порт
   * @param {number} port - Порт для проверки
   * @returns {Promise<boolean>} - true если порт свободен, false если занят
   */
  static checkPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.listen(port, () => {
        server.once("close", () => {
          resolve(true);
        });
        server.close();
      });

      server.on("error", () => {
        resolve(false);
      });
    });
  }

  /**
   * Находит первый свободный порт, начиная с указанного
   * @param {number} startPort - Начальный порт для поиска (по умолчанию 3000)
   * @param {number} maxAttempts - Максимальное количество попыток (по умолчанию 100)
   * @returns {Promise<number>} - Свободный порт
   */
  static async findAvailablePort(startPort = 3000, maxAttempts = 100) {
    for (let port = startPort; port < startPort + maxAttempts; port++) {
      const isAvailable = await this.checkPortAvailable(port);
      if (isAvailable) {
        return port;
      }
    }

    throw new Error(
      `Не удалось найти свободный порт в диапазоне ${startPort}-${
        startPort + maxAttempts - 1
      }`
    );
  }

  /**
   * Получает порт с автоматическим поиском свободного
   * @param {number} preferredPort - Предпочтительный порт
   * @returns {Promise<number>} - Свободный порт
   */
  static async getAvailablePort(preferredPort) {
    console.log(`🔍 Проверка доступности порта ${preferredPort}...`);

    const isPreferredAvailable = await this.checkPortAvailable(preferredPort);

    if (isPreferredAvailable) {
      console.log(`✅ Порт ${preferredPort} свободен`);
      return preferredPort;
    }

    console.log(`⚠️  Порт ${preferredPort} занят, ищем альтернативный...`);
    const availablePort = await this.findAvailablePort(preferredPort + 1);
    console.log(`✅ Найден свободный порт: ${availablePort}`);

    return availablePort;
  }
}

module.exports = PortFinder;
