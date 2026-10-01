import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra la lista de comandos disponibles e instrucciones de uso'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('🎧 Comandos del Bot de Música')
      .setDescription(
        '¡Disfruta de tu música favorita desde YouTube directamente en tu canal de voz con cola avanzada y controles interactivos!'
      )
      .addFields(
        {
          name: '🎶 `/play <búsqueda o enlace>`',
          value: 'Reproduce canciones o playlists con autocompletado en vivo.',
        },
        {
          name: '🔁 `/loop [modo]`',
          value: 'Configura o alterna el modo de repetición (`off`, `song`, `queue`).',
        },
        {
          name: '🔀 `/shuffle`',
          value: 'Mezcla aleatoriamente las canciones en la cola.',
        },
        {
          name: '⏮️ `/previous`',
          value: 'Vuelve a reproducir la canción anterior desde el historial.',
        },
        {
          name: '⏭️ `/skip`',
          value: 'Salta a la siguiente canción en la cola.',
        },
        {
          name: '⏩ `/skipto <posición>`',
          value: 'Salta directamente a una posición específica de la cola.',
        },
        {
          name: '🗑️ `/remove <posición>`',
          value: 'Elimina una canción específica de la lista de espera.',
        },
        {
          name: '🧹 `/clear`',
          value: 'Vacía la cola de canciones en espera sin detener la actual.',
        },
        {
          name: '⏸️ `/pause` | ▶️ `/resume`',
          value: 'Pausa o reanuda la reproducción.',
        },
        {
          name: '⏹️ `/stop`',
          value: 'Detiene la música, vacía la cola y desconecta al bot.',
        },
        {
          name: '📜 `/queue [página]`',
          value: 'Visualiza la lista de canciones con botones de paginación interactiva.',
        },
        {
          name: '🎵 `/nowplaying`',
          value: 'Muestra la canción actual, barra de progreso y botones de control.',
        },
        {
          name: '🔊 `/volume <0-100>`',
          value: 'Ajusta el nivel de volumen.',
        }
      )
      .setFooter({
        text: 'Desarrollado con Discord.js v14 & Clean Architecture',
      });

    return interaction.reply({
      embeds: [embed],
    });
  },
};
