import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  StreamType,
  entersState,
} from '@discordjs/voice';
import { createAudioStream } from '../utils/youtube.js';
import {
  createNowPlayingEmbed,
  createPlayerControls,
  createErrorEmbed,
  createInfoEmbed,
} from '../utils/embed.js';
import { config } from '../config.js';
import { Queue, LoopMode } from '../domain/Queue.js';

export class GuildQueue {
  constructor(guildId, manager, options = {}) {
    this.guildId = guildId;
    this.manager = manager;
    this.queue = options.queue || new Queue();
    this.getAudioStream = options.getAudioStream || createAudioStream;
    this.voiceChannel = null;
    this.textChannel = null;
    this.connection = null;
    this.player = options.player || createAudioPlayer();
    this.resource = null;
    this.currentProcess = null;
    this.volume = config.defaultVolume || 0.8;
    this.isPaused = false;
    this.playbackStartTime = 0;
    this.pausedTimeOffset = 0;
    this.pauseStartTimestamp = 0;
    this.idleTimer = null;
    this.graceTimer = null;
    this.lastControlMessage = null;

    if (!options.skipListeners && typeof this.player.on === 'function') {
      this.setupPlayerListeners();
    }
  }

  get songs() {
    return this.queue.songs;
  }

  get currentSong() {
    return this.queue.currentSong;
  }

  get loopMode() {
    return this.queue.loopMode;
  }

  /**
   * Configura los escuchadores de eventos del reproductor de audio
   */
  setupPlayerListeners() {
    this.player.on(AudioPlayerStatus.Playing, () => {
      this.isPaused = false;
      this.clearIdleTimer();
      this.sendNowPlayingMessage();
    });

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.resource = null;
      if (this.currentProcess) {
        try {
          this.currentProcess.kill();
        } catch {}
        this.currentProcess = null;
      }
      this.playNext();
    });

    this.player.on('error', (error) => {
      console.error(`[GuildQueue ${this.guildId}] Error en AudioPlayer:`, error.message);
      if (this.textChannel) {
        this.textChannel
          .send({ embeds: [createErrorEmbed(`Error reproduciendo la canción: ${error.message}`)] })
          .catch(() => {});
      }
      this.playNext();
    });
  }

  /**
   * Conecta al bot al canal de voz indicado
   */
  connect(voiceChannel, textChannel) {
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel || this.textChannel;

    if (
      this.connection &&
      this.connection.state.status !== VoiceConnectionStatus.Destroyed &&
      this.connection.state.status !== VoiceConnectionStatus.Disconnected
    ) {
      return this.connection;
    }

    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false,
    });

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.destroy();
      }
    });

    this.connection.on(VoiceConnectionStatus.Destroyed, () => {
      this.destroy();
    });

    this.connection.subscribe(this.player);
    return this.connection;
  }

  /**
   * Añade una canción a la cola
   */
  addSong(song) {
    this.queue.addSong(song);
    if (!this.queue.currentSong && this.player.state.status === AudioPlayerStatus.Idle) {
      this.playNext();
    }
  }

  /**
   * Añade múltiples canciones a la cola (por ejemplo, de una playlist)
   */
  addSongs(newSongs) {
    this.queue.addSongs(newSongs);
    if (!this.queue.currentSong && this.player.state.status === AudioPlayerStatus.Idle) {
      this.playNext();
    }
  }

  /**
   * Reproduce la siguiente canción en la cola según el modo de bucle
   */
  async playNext() {
    const nextSong = this.queue.getNextSong();
    if (!nextSong) {
      this.resetIdleTimer();
      return;
    }

    await this.playStream(nextSong);
  }

  /**
   * Reproduce un stream de audio persistente dado un objeto de canción
   */
  async playStream(song) {
    this.playbackStartTime = Date.now();
    this.pausedTimeOffset = 0;
    this.pauseStartTimestamp = 0;

    // Matar proceso anterior si existía
    if (this.currentProcess) {
      try {
        this.currentProcess.kill();
      } catch {}
      this.currentProcess = null;
    }

    try {
      const streamResult = await this.getAudioStream(song.url);

      let audioStream;
      let inputType = StreamType.Raw;

      if (streamResult && typeof streamResult === 'object' && streamResult.stream) {
        audioStream = streamResult.stream;
        this.currentProcess = streamResult.process;
        inputType = StreamType.Raw;
      } else {
        audioStream = streamResult;
        inputType = StreamType.Arbitrary;
      }

      this.resource = createAudioResource(audioStream, {
        inputType: inputType,
        inlineVolume: true,
      });

      if (this.resource.volume) {
        this.resource.volume.setVolume(this.volume);
      }

      this.player.play(this.resource);
    } catch (error) {
      console.error(`[GuildQueue] Error obteniendo stream para "${song.title}":`, error);
      if (this.textChannel) {
        this.textChannel
          .send({
            embeds: [createErrorEmbed(`No se pudo reproducir **${song.title}**: ${error.message}`)],
          })
          .catch(() => {});
      }
      this.playNext();
    }
  }

  /**
   * Envía o actualiza el mensaje de Now Playing con controles
   */
  async sendNowPlayingMessage() {
    if (!this.textChannel || !this.currentSong) return;

    const embed = createNowPlayingEmbed(this.currentSong, {
      isPaused: this.isPaused,
      volume: this.volume,
      currentSec: this.getCurrentPlaybackSec(),
      loopMode: this.loopMode,
    });
    const components = createPlayerControls(this.isPaused, this.loopMode);

    try {
      if (this.lastControlMessage) {
        // Deshabilitar botones del mensaje anterior
        await this.lastControlMessage.edit({ components: [] }).catch(() => {});
      }
      this.lastControlMessage = await this.textChannel.send({ embeds: [embed], components });
    } catch (err) {
      console.error('Error enviando mensaje Now Playing:', err.message);
    }
  }

  /**
   * Actualiza el embed y botones del mensaje activo
   */
  async updateControlMessage() {
    if (!this.lastControlMessage || !this.currentSong) return;

    try {
      const embed = createNowPlayingEmbed(this.currentSong, {
        isPaused: this.isPaused,
        volume: this.volume,
        currentSec: this.getCurrentPlaybackSec(),
        loopMode: this.loopMode,
      });
      const components = createPlayerControls(this.isPaused, this.loopMode);

      await this.lastControlMessage.edit({ embeds: [embed], components });
    } catch {
      // Mensaje borrado o inaccesible
    }
  }

  /**
   * Pausa la reproducción
   */
  pause() {
    if (this.player.state.status === AudioPlayerStatus.Playing) {
      this.player.pause();
      this.isPaused = true;
      this.pauseStartTimestamp = Date.now();
      this.updateControlMessage();
      return true;
    }
    return false;
  }

  /**
   * Reanuda la reproducción
   */
  resume() {
    if (this.player.state.status === AudioPlayerStatus.Paused) {
      this.player.unpause();
      this.isPaused = false;
      if (this.pauseStartTimestamp > 0) {
        this.pausedTimeOffset += Date.now() - this.pauseStartTimestamp;
        this.pauseStartTimestamp = 0;
      }
      this.updateControlMessage();
      return true;
    }
    return false;
  }

  /**
   * Salta a la siguiente canción
   */
  skip() {
    if (this.currentSong || this.songs.length > 0) {
      this.player.stop(); // Dispara el evento Idle que llama a playNext()
      return true;
    }
    return false;
  }

  /**
   * Vuelve a la canción anterior
   */
  previous() {
    const prev = this.queue.getPreviousSong();
    if (prev) {
      this.playStream(prev);
      return prev;
    }
    return null;
  }

  /**
   * Mezcla la cola de canciones en espera
   */
  shuffle() {
    const res = this.queue.shuffle();
    this.updateControlMessage();
    return res;
  }

  /**
   * Salta a una posición específica de la cola
   */
  skipTo(index) {
    const target = this.queue.skipTo(index);
    if (target) {
      this.playStream(target);
    }
    return target;
  }

  /**
   * Elimina una canción por su posición
   */
  remove(index) {
    return this.queue.remove(index);
  }

  /**
   * Limpia las canciones en espera
   */
  clear() {
    this.queue.clear();
    this.updateControlMessage();
  }

  /**
   * Configura el modo de repetición (off, song, queue)
   */
  setLoopMode(mode) {
    const res = this.queue.setLoopMode(mode);
    this.updateControlMessage();
    return res;
  }

  /**
   * Alterna cíclicamente el modo de bucle: off -> song -> queue -> off
   */
  toggleLoop() {
    const modes = [LoopMode.OFF, LoopMode.SONG, LoopMode.QUEUE];
    const currentIndex = modes.indexOf(this.loopMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    return this.setLoopMode(nextMode);
  }

  /**
   * Detiene la música, vacía la cola y sale del canal
   */
  stop() {
    this.clear();
    this.queue.currentSong = null;
    this.player.stop(true);
    this.destroy();
  }

  /**
   * Ajusta el volumen (0 a 100)
   */
  setVolume(percent) {
    const vol = Math.max(0, Math.min(percent, 100)) / 100;
    this.volume = vol;
    if (this.resource && this.resource.volume) {
      this.resource.volume.setVolume(vol);
    }
    this.updateControlMessage();
    return vol;
  }

  /**
   * Retorna los segundos transcurridos de la canción actual
   */
  getCurrentPlaybackSec() {
    if (!this.playbackStartTime) return 0;
    let elapsedMs = 0;
    if (this.isPaused && this.pauseStartTimestamp > 0) {
      elapsedMs = this.pauseStartTimestamp - this.playbackStartTime - this.pausedTimeOffset;
    } else {
      elapsedMs = Date.now() - this.playbackStartTime - this.pausedTimeOffset;
    }
    return Math.max(0, Math.floor(elapsedMs / 1000));
  }

  /**
   * Gestiona cambios de presencia en el canal de voz (Grace Period de 60 segundos)
   */
  handleVoiceStateChange(nonBotMemberCount) {
    if (nonBotMemberCount === 0) {
      if (!this.graceTimer) {
        this.graceTimer = setTimeout(() => {
          if (this.textChannel) {
            this.textChannel
              .send({
                embeds: [
                  createInfoEmbed(
                    'Desconectado del canal de voz: el canal estuvo vacío durante 60 segundos.'
                  ),
                ],
              })
              .catch(() => {});
          }
          this.destroy();
        }, 60000);
      }
    } else {
      this.clearGraceTimer();
    }
  }

  clearGraceTimer() {
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
  }

  /**
   * Inicia el temporizador de desconexión por inactividad
   */
  resetIdleTimer() {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      if (this.songs.length === 0 && !this.currentSong) {
        if (this.textChannel) {
          this.textChannel
            .send({
              embeds: [createInfoEmbed('Desconectado del canal de voz por inactividad.')],
            })
            .catch(() => {});
        }
        this.destroy();
      }
    }, config.idleTimeoutMs || 300000);
  }

  clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * Limpia recursos y destruye la conexión de voz
   */
  destroy() {
    this.clearIdleTimer();
    this.clearGraceTimer();
    this.clear();
    this.queue.currentSong = null;

    if (this.currentProcess) {
      try {
        this.currentProcess.kill();
      } catch {}
      this.currentProcess = null;
    }

    if (this.lastControlMessage) {
      this.lastControlMessage.edit({ components: [] }).catch(() => {});
      this.lastControlMessage = null;
    }

    try {
      this.player.stop(true);
    } catch {}

    if (this.connection) {
      try {
        if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
          this.connection.destroy();
        }
      } catch {}
      this.connection = null;
    }

    this.manager.delete(this.guildId);
  }
}
