import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { searchYouTube, getYouTubeSuggestions } from '../utils/youtube.js';
import {
  createErrorEmbed,
  createSongAddedEmbed,
  createPlaylistAddedEmbed,
} from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción o playlist de YouTube en tu canal de voz')
    .addStringOption((option) =>
      option
        .setName('busqueda')
        .setDescription('Nombre de la canción, artista o enlace de YouTube')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const suggestions = await getYouTubeSuggestions(focusedValue, 5);
    await interaction.respond(suggestions).catch(() => {});
  },

  async execute(interaction, queueManager) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        embeds: [createErrorEmbed('¡Debes estar en un canal de voz para usar este comando!')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.reply({
        embeds: [
          createErrorEmbed(
            '¡No tengo permisos suficientes para unirme y hablar en tu canal de voz!'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const query = interaction.options.getString('busqueda');
    await interaction.deferReply();

    try {
      const result = await searchYouTube(query, interaction.user);
      const queue = queueManager.getOrCreate(interaction.guildId);

      queue.connect(voiceChannel, interaction.channel);

      if (result.type === 'playlist') {
        queue.addSongs(result.songs);
        return interaction.editReply({
          embeds: [
            createPlaylistAddedEmbed(
              result.playlistInfo.title,
              result.playlistInfo.videoCount,
              result.playlistInfo.durationSec,
              interaction.user
            ),
          ],
        });
      } else {
        const song = result.songs[0];
        const isCurrentlyPlaying = queue.currentSong !== null;
        queue.addSong(song);

        if (isCurrentlyPlaying) {
          const position = queue.songs.length;
          return interaction.editReply({
            embeds: [createSongAddedEmbed(song, position)],
          });
        } else {
          return interaction.editReply({
            embeds: [createSongAddedEmbed(song, 1)],
          });
        }
      }
    } catch (error) {
      console.error('Error en comando play:', error);
      return interaction.editReply({
        embeds: [
          createErrorEmbed(
            `Ocurrió un error al buscar o reproducir: ${error.message || 'Error desconocido'}`
          ),
        ],
      });
    }
  },
};
