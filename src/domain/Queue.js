/**
 * Modos de repetición soportados
 */
export const LoopMode = Object.freeze({
  OFF: 'off',
  SONG: 'song',
  QUEUE: 'queue',
});

/**
 * Entidad de dominio pura para la cola de reproducción
 */
export class Queue {
  constructor() {
    this.songs = [];
    this.currentSong = null;
    this.history = [];
    this.loopMode = LoopMode.OFF;
  }

  /**
   * Añade una canción al final de la cola
   */
  addSong(song) {
    if (!song) return;
    this.songs.push(song);
  }

  /**
   * Añade una lista de canciones (ej. de una playlist)
   */
  addSongs(songs) {
    if (!Array.isArray(songs)) return;
    for (const song of songs) {
      if (song) this.songs.push(song);
    }
  }

  /**
   * Obtiene la siguiente canción a reproducir según el LoopMode
   */
  getNextSong() {
    // Si el modo es repetir canción actual
    if (this.loopMode === LoopMode.SONG && this.currentSong) {
      return this.currentSong;
    }

    // Si el modo es repetir toda la cola y había una canción sonando
    if (this.loopMode === LoopMode.QUEUE && this.currentSong) {
      this.songs.push(this.currentSong);
    } else if (this.currentSong) {
      // Guardar en historial (limitado a 50 canciones para no saturar memoria)
      this.history.push(this.currentSong);
      if (this.history.length > 50) {
        this.history.shift();
      }
    }

    if (this.songs.length === 0) {
      this.currentSong = null;
      return null;
    }

    this.currentSong = this.songs.shift();
    return this.currentSong;
  }

  /**
   * Vuelve a la canción anterior guardada en el historial
   */
  getPreviousSong() {
    if (this.history.length === 0) {
      return null;
    }

    const previousSong = this.history.pop();
    if (this.currentSong) {
      this.songs.unshift(this.currentSong);
    }

    this.currentSong = previousSong;
    return this.currentSong;
  }

  /**
   * Mezcla aleatoriamente las canciones en espera usando el algoritmo Fisher-Yates
   */
  shuffle() {
    for (let i = this.songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.songs[i], this.songs[j]] = [this.songs[j], this.songs[i]];
    }
    return this.songs;
  }

  /**
   * Elimina una canción por su posición (1-based)
   */
  remove(index) {
    if (index < 1 || index > this.songs.length) {
      throw new Error(`Índice fuera de rango. Debe ser entre 1 y ${this.songs.length}.`);
    }
    const [removed] = this.songs.splice(index - 1, 1);
    return removed;
  }

  /**
   * Salta directamente a una canción por su posición (1-based), descartando las intermedias
   */
  skipTo(index) {
    if (index < 1 || index > this.songs.length) {
      throw new Error(`Índice fuera de rango. Debe ser entre 1 y ${this.songs.length}.`);
    }

    if (this.currentSong) {
      this.history.push(this.currentSong);
    }

    // Descartar las anteriores
    const discarded = this.songs.splice(0, index - 1);
    for (const song of discarded) {
      this.history.push(song);
    }

    this.currentSong = this.songs.shift();
    return this.currentSong;
  }

  /**
   * Vacía las canciones en espera
   */
  clear() {
    this.songs = [];
  }

  /**
   * Configura el modo de repetición
   */
  setLoopMode(mode) {
    const validModes = Object.values(LoopMode);
    if (!validModes.includes(mode)) {
      throw new Error(`Modo de repetición inválido. Opciones: ${validModes.join(', ')}`);
    }
    this.loopMode = mode;
    return this.loopMode;
  }

  /**
   * Retorna la cantidad de canciones en espera
   */
  size() {
    return this.songs.length;
  }

  /**
   * Indica si la cola de espera está vacía
   */
  isEmpty() {
    return this.songs.length === 0;
  }
}
