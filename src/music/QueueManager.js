import { GuildQueue } from './GuildQueue.js';

export class QueueManager {
  constructor() {
    this.queues = new Map();
  }

  /**
   * Obtiene la cola existente de un servidor o crea una nueva
   */
  getOrCreate(guildId, options = {}) {
    if (!this.queues.has(guildId)) {
      const queue = new GuildQueue(guildId, this, options);
      this.queues.set(guildId, queue);
    }
    return this.queues.get(guildId);
  }

  /**
   * Obtiene la cola de un servidor si existe
   */
  get(guildId) {
    return this.queues.get(guildId) || null;
  }

  /**
   * Verifica si existe una cola para el servidor
   */
  has(guildId) {
    return this.queues.has(guildId);
  }

  /**
   * Elimina la cola de un servidor
   */
  delete(guildId) {
    return this.queues.delete(guildId);
  }
}
