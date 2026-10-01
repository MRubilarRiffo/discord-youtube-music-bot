import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Detiene la música, vacía la cola y desconecta al bot del canal de voz'),

  async execute(interaction, queueManager) {
    const queue = queueManager.get(interaction.guildId);

    if (!queue) {
      return interaction.reply({
        embeds: [createErrorEmbed('El bot no está reproduciendo música ni conectado a un canal de voz.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== queue.voiceChannel?.id) {
      return interaction.reply({
        embeds: [createErrorEmbed('Debes estar en el mismo canal de voz que el bot para detener la música.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    queue.stop();

    return interaction.reply({
      embeds: [createSuccessEmbed('Música detenida y cola limpiada. ¡Hasta la próxima! ⏹️')],
    });
  },
};
