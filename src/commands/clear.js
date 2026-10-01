import { SlashCommandBuilder } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Vacía todas las canciones en espera de la cola'),

  async execute(interaction, queueManager) {
    const queue = queueManager.get(interaction.guildId);

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({
        embeds: [createErrorEmbed('La cola de espera ya está vacía.')],
        ephemeral: true,
      });
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== queue.voiceChannel?.id) {
      return interaction.reply({
        embeds: [createErrorEmbed('Debes estar en el mismo canal de voz que el bot para vaciar la cola.')],
        ephemeral: true,
      });
    }

    const count = queue.songs.length;
    queue.clear();

    return interaction.reply({
      embeds: [createSuccessEmbed(`Se han eliminado **${count} canciones** de la cola de espera. 🧹`)],
    });
  },
};
