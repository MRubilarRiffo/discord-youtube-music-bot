import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const COLORS = {
  PRIMARY: 0xFF0000,   // Rojo YouTube
  SUCCESS: 0x57F287,   // Verde Discord
  WARNING: 0xFEE75C,   // Amarillo
  ERROR: 0xED4245,     // Rojo Error
  INFO: 0x5865F2,      // Blurple Discord
};

/**
 * Formatea segundos o milisegundos a formato HH:MM:SS o MM:SS
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const sec = Math.floor(seconds);
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
}

/**
 * Genera una barra visual de progreso de la canción
 */
export function createProgressBar(currentSec, totalSec, length = 15) {
  if (!totalSec || totalSec <= 0) return '🔘' + '▬'.repeat(length - 1);
  const progress = Math.min(Math.max(currentSec / totalSec, 0), 1);
  const progressIndex = Math.round(length * progress);
  let bar = '';
  for (let i = 0; i <= length; i++) {
    if (i === progressIndex) {
      bar += '🔘';
    } else {
      bar += '▬';
    }
  }
  return bar;
}

/**
 * Embed para la canción que está sonando actualmente
 */
export function createNowPlayingEmbed(
  song,
  { isPaused = false, volume = 1, currentSec = 0, loopMode = 'off' } = {}
) {
  const duration = song.durationSec || 0;
  const bar = createProgressBar(currentSec, duration);
  const formattedCurrent = formatDuration(currentSec);
  const formattedTotal = formatDuration(duration);

  const loopLabels = {
    off: 'Desactivado',
    song: '🔂 Canción',
    queue: '🔁 Cola',
  };

  const title = song.title || 'Canción de YouTube';
  const displayTitle = title.length > 250 ? title.substring(0, 247) + '...' : title;

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setAuthor({ name: isPaused ? '⏸️ Reproducción Pausada' : '▶️ Reproduciendo Ahora' })
    .setTitle(displayTitle)
    .setURL(song.url)
    .addFields(
      {
        name: 'Progreso',
        value: `${bar}\n\`${formattedCurrent} / ${formattedTotal}\``,
        inline: false,
      },
      {
        name: 'Canal',
        value: (song.channel || 'Desconocido').substring(0, 250),
        inline: true,
      },
      {
        name: 'Volumen',
        value: `🔊 ${Math.round(volume * 100)}%`,
        inline: true,
      },
      {
        name: 'Bucle',
        value: loopLabels[loopMode] || 'Desactivado',
        inline: true,
      },
      {
        name: 'Solicitado por',
        value: song.requestedBy ? `<@${song.requestedBy.id}>` : 'Usuario',
        inline: true,
      }
    );

  if (song.thumbnail) {
    embed.setThumbnail(song.thumbnail);
  }

  return embed;
}

/**
 * Botones de control para la canción actual
 */
export function createPlayerControls(isPaused = false, loopMode = 'off') {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(isPaused ? 'music_resume' : 'music_pause')
      .setLabel(isPaused ? 'Reanudar' : 'Pausar')
      .setEmoji(isPaused ? '▶️' : '⏸️')
      .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music_skip')
      .setLabel('Saltar')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('music_stop')
      .setLabel('Detener')
      .setEmoji('⏹️')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('music_queue')
      .setLabel('Ver Cola')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Secondary)
  );

  const loopStyles = {
    off: ButtonStyle.Secondary,
    song: ButtonStyle.Primary,
    queue: ButtonStyle.Success,
  };

  const loopLabels = {
    off: 'Bucle: Off',
    song: 'Bucle: Canción',
    queue: 'Bucle: Cola',
  };

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('music_previous')
      .setLabel('Anterior')
      .setEmoji('⏮️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music_shuffle')
      .setLabel('Mezclar')
      .setEmoji('🔀')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music_loop')
      .setLabel(loopLabels[loopMode] || 'Bucle: Off')
      .setEmoji('🔁')
      .setStyle(loopStyles[loopMode] || ButtonStyle.Secondary)
  );

  return [row1, row2];
}

/**
 * Botones de paginación para la cola de reproducción
 */
export function createQueuePaginationButtons(currentPage, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('queue_page_first')
      .setEmoji('⏮️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage <= 1),
    new ButtonBuilder()
      .setCustomId('queue_page_prev')
      .setLabel('Anterior')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage <= 1),
    new ButtonBuilder()
      .setCustomId('queue_page_indicator')
      .setLabel(`${currentPage} / ${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('queue_page_next')
      .setLabel('Siguiente')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage >= totalPages),
    new ButtonBuilder()
      .setCustomId('queue_page_last')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= totalPages)
  );
}

/**
 * Embed de confirmación al añadir una canción a la cola
 */
export function createSongAddedEmbed(song, position) {
  const title = song.title || 'Canción de YouTube';
  const displayTitle = title.length > 250 ? title.substring(0, 247) + '...' : title;

  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setAuthor({ name: '🎵 Añadido a la cola' })
    .setTitle(displayTitle)
    .setURL(song.url)
    .addFields(
      { name: 'Duración', value: formatDuration(song.durationSec), inline: true },
      { name: 'Posición en cola', value: `#${position}`, inline: true },
      { name: 'Solicitado por', value: song.requestedBy ? `<@${song.requestedBy.id}>` : 'Usuario', inline: true }
    );

  if (song.thumbnail) {
    embed.setThumbnail(song.thumbnail);
  }

  return embed;
}

/**
 * Embed para playlist añadida
 */
export function createPlaylistAddedEmbed(playlistTitle, count, durationSec, requestedBy) {
  const title = playlistTitle || 'Playlist de YouTube';
  const displayTitle = title.length > 250 ? title.substring(0, 247) + '...' : title;

  return new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setAuthor({ name: '📑 Lista de reproducción añadida' })
    .setTitle(displayTitle)
    .setDescription(`Se han añadido **${count} canciones** a la cola.`)
    .addFields(
      { name: 'Duración Total Estimada', value: formatDuration(durationSec), inline: true },
      { name: 'Solicitado por', value: requestedBy ? `<@${requestedBy.id}>` : 'Usuario', inline: true }
    );
}

/**
 * Embed para ver la lista de canciones en cola
 */
export function createQueueEmbed(currentSong, songs, page = 1, itemsPerPage = 10, loopMode = 'off') {
  const totalPages = Math.max(1, Math.ceil(songs.length / itemsPerPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const loopLabels = {
    off: 'Desactivado',
    song: '🔂 Canción',
    queue: '🔁 Cola',
  };

  const embed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle('📜 Cola de Reproducción');

  if (currentSong) {
    const rawTitle = currentSong.title || 'Canción de YouTube';
    const displayTitle = rawTitle.length > 70 ? rawTitle.substring(0, 67) + '...' : rawTitle;
    embed.setDescription(
      `**Sonando Ahora:**\n▶️ [${displayTitle}](${currentSong.url}) | \`${formatDuration(currentSong.durationSec)}\` - Solicitado por: ${currentSong.requestedBy ? `<@${currentSong.requestedBy.id}>` : 'Usuario'}\n*Modo bucle: ${loopLabels[loopMode] || 'Desactivado'}*\n\n**Próximas Canciones:**`
    );
  } else {
    embed.setDescription('No hay ninguna canción reproduciéndose actualmente.');
  }

  if (songs.length === 0) {
    embed.addFields({ name: 'Cola vacía', value: 'No hay más canciones en espera. Usa `/play` para añadir más.' });
  } else {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentSongs = songs.slice(startIndex, startIndex + itemsPerPage);

    let songListString = currentSongs
      .map((song, i) => {
        const rawTitle = song.title || 'Canción de YouTube';
        const cleanTitle = rawTitle.length > 45 ? rawTitle.substring(0, 42) + '...' : rawTitle;
        return `\`${startIndex + i + 1}.\` [${cleanTitle}](${song.url}) - \`${formatDuration(song.durationSec)}\``;
      })
      .join('\n');

    // Discord limita el valor de un campo a 1024 caracteres
    if (songListString.length > 1020) {
      songListString = songListString.substring(0, 1017) + '...';
    }

    embed.addFields({ name: `En espera (${songs.length} canciones)`, value: songListString });
  }

  embed.setFooter({ text: `Página ${currentPage} de ${totalPages} • Total en cola: ${songs.length}` });
  return embed;
}

/**
 * Embeds simples para mensajes informativos, éxitos y errores
 */
export function createSuccessEmbed(message) {
  return new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setDescription(`✅ ${message}`);
}

export function createErrorEmbed(message) {
  return new EmbedBuilder()
    .setColor(COLORS.ERROR)
    .setDescription(`❌ ${message}`);
}

export function createInfoEmbed(message) {
  return new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setDescription(`ℹ️ ${message}`);
}
