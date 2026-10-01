import { MessageFlags } from 'discord.js';
import {
  createQueueEmbed,
  createQueuePaginationButtons,
  createSuccessEmbed,
  createErrorEmbed,
} from './utils/embed.js';
import { LoopMode } from './domain/Queue.js';

/**
 * Maneja todas las interacciones de botones del reproductor y la cola
 */
export async function handleButtonInteraction(interaction, queueManager) {
  const queue = queueManager.get(interaction.guildId);

  // 1. Botones de paginación de la cola (no requieren que el usuario esté en el canal de voz obligatoriamente)
  if (interaction.customId.startsWith('queue_page_')) {
    if (!queue || (!queue.currentSong && queue.songs.length === 0)) {
      return interaction.reply({
        embeds: [createErrorEmbed('La cola de reproducción ya no está disponible.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil(queue.songs.length / itemsPerPage));

    // Extraer la página actual del footer del embed original
    let currentPage = 1;
    const footerText = interaction.message?.embeds?.[0]?.footer?.text || '';
    const match = footerText.match(/Página (\d+) de (\d+)/);
    if (match) {
      currentPage = parseInt(match[1], 10);
    }

    let targetPage = currentPage;
    switch (interaction.customId) {
      case 'queue_page_first':
        targetPage = 1;
        break;
      case 'queue_page_prev':
        targetPage = Math.max(1, currentPage - 1);
        break;
      case 'queue_page_next':
        targetPage = Math.min(totalPages, currentPage + 1);
        break;
      case 'queue_page_last':
        targetPage = totalPages;
        break;
      default:
        break;
    }

    const updatedEmbed = createQueueEmbed(
      queue.currentSong,
      queue.songs,
      targetPage,
      itemsPerPage,
      queue.loopMode
    );
    const updatedButtons = [createQueuePaginationButtons(targetPage, totalPages)];

    return interaction.update({
      embeds: [updatedEmbed],
      components: updatedButtons,
    });
  }

  // 2. Botones de control del reproductor
  if (!queue || !queue.currentSong) {
    return interaction.reply({
      embeds: [createErrorEmbed('No hay ninguna canción reproduciéndose actualmente.')],
      flags: MessageFlags.Ephemeral,
    });
  }

  if (
    !interaction.member.voice.channel ||
    interaction.member.voice.channel.id !== queue.voiceChannel?.id
  ) {
    return interaction.reply({
      embeds: [
        createErrorEmbed(
          'Debes estar en el mismo canal de voz que el bot para usar estos controles.'
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  const { customId } = interaction;

  switch (customId) {
    case 'music_pause': {
      const paused = queue.pause();
      if (paused) {
        await interaction.reply({
          embeds: [createSuccessEmbed('Reproducción pausada ⏸️')],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          embeds: [createErrorEmbed('La música ya estaba pausada o no se pudo pausar.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      break;
    }

    case 'music_resume': {
      const resumed = queue.resume();
      if (resumed) {
        await interaction.reply({
          embeds: [createSuccessEmbed('Reproducción reanudada ▶️')],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          embeds: [createErrorEmbed('La música no estaba pausada o no se pudo reanudar.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      break;
    }

    case 'music_skip': {
      const songTitle = queue.currentSong.title;
      queue.skip();
      await interaction.reply({
        embeds: [createSuccessEmbed(`Saltada: **${songTitle}** ⏭️`)],
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case 'music_previous': {
      const prev = queue.previous();
      if (prev) {
        await interaction.reply({
          embeds: [createSuccessEmbed(`Volviendo a reproducir: **${prev.title}** ⏮️`)],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          embeds: [createErrorEmbed('No hay canciones anteriores en el historial.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      break;
    }

    case 'music_shuffle': {
      if (queue.songs.length === 0) {
        return interaction.reply({
          embeds: [createErrorEmbed('No hay canciones en la cola de espera para mezclar.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      queue.shuffle();
      await interaction.reply({
        embeds: [createSuccessEmbed(`¡Se han mezclado **${queue.songs.length} canciones**! 🔀`)],
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case 'music_loop': {
      const newMode = queue.toggleLoop();
      const modeMessages = {
        [LoopMode.OFF]: 'Bucle desactivado ➡️',
        [LoopMode.SONG]: 'Repitiendo la canción actual 🔂',
        [LoopMode.QUEUE]: 'Repitiendo toda la cola 🔁',
      };
      await interaction.reply({
        embeds: [createSuccessEmbed(modeMessages[newMode])],
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case 'music_stop': {
      queue.stop();
      await interaction.reply({
        embeds: [createSuccessEmbed('Música detenida y cola limpiada ⏹️')],
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case 'music_queue': {
      const itemsPerPage = 10;
      const totalPages = Math.max(1, Math.ceil(queue.songs.length / itemsPerPage));
      const queueEmbed = createQueueEmbed(
        queue.currentSong,
        queue.songs,
        1,
        itemsPerPage,
        queue.loopMode
      );
      const components =
        totalPages > 1 ? [createQueuePaginationButtons(1, totalPages)] : [];

      await interaction.reply({
        embeds: [queueEmbed],
        components,
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    default:
      break;
  }
}

/**
 * Maneja eventos de VoiceStateUpdate aplicando un margen de gracia de 60 segundos
 */
export function handleVoiceStateUpdate(oldState, newState, queueManager) {
  const queue = queueManager.get(oldState.guild.id);
  if (!queue || !queue.voiceChannel) return;

  // Si el cambio ocurrió en el canal donde está conectado el bot
  if (
    oldState.channelId === queue.voiceChannel.id ||
    newState.channelId === queue.voiceChannel.id
  ) {
    const memberCount = queue.voiceChannel.members.filter((m) => !m.user?.bot).size;
    queue.handleVoiceStateChange(memberCount);
  }
}
