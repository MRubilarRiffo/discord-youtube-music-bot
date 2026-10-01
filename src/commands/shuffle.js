import { SlashCommandBuilder } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mezcla aleatoriamente las canciones en la cola de espera'),

  async execute(interaction, queueManager) {
    const queue = queueManager.get(interaction.guildId);

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({
        embeds: [createErrorEmbed('No hay suficientes canciones en la cola para mezclar.')],
        ephemeral: true,
      });
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== queue.voiceChannel?.id) {
      return interaction.reply({
        embeds: [createErrorEmbed('Debes estar en el mismo canal de voz que el bot para mezclar la cola.')],
        ephemeral: true,
      });
    }

    queue.shuffle();

    return interaction.reply({
      embeds: [createSuccessEmbed(`¡Se han mezclado **${queue.songs.length} canciones** de la cola! 🔀`)],
    });
  },
};
