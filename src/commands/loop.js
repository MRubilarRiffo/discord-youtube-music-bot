import { SlashCommandBuilder } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embed.js';
import { LoopMode } from '../domain/Queue.js';

export default {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Configura o alterna el modo de repetición de la música')
    .addStringOption((option) =>
      option
        .setName('modo')
        .setDescription('Modo de repetición')
        .setRequired(false)
        .addChoices(
          { name: 'Desactivado (off)', value: LoopMode.OFF },
          { name: 'Repetir Canción (song)', value: LoopMode.SONG },
          { name: 'Repetir Toda la Cola (queue)', value: LoopMode.QUEUE }
        )
    ),

  async execute(interaction, queueManager) {
    const queue = queueManager.get(interaction.guildId);

    if (!queue || !queue.currentSong) {
      return interaction.reply({
        embeds: [createErrorEmbed('No hay ninguna canción reproduciéndose actualmente.')],
        ephemeral: true,
      });
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== queue.voiceChannel?.id) {
      return interaction.reply({
        embeds: [createErrorEmbed('Debes estar en el mismo canal de voz que el bot para cambiar el modo de bucle.')],
        ephemeral: true,
      });
    }

    const mode = interaction.options.getString('modo');
    let newMode;

    if (mode) {
      newMode = queue.setLoopMode(mode);
    } else {
      newMode = queue.toggleLoop();
    }

    const modeMessages = {
      [LoopMode.OFF]: 'Bucle desactivado ➡️',
      [LoopMode.SONG]: 'Repitiendo la canción actual 🔂',
      [LoopMode.QUEUE]: 'Repitiendo toda la cola de reproducción 🔁',
    };

    return interaction.reply({
      embeds: [createSuccessEmbed(modeMessages[newMode] || `Modo bucle: ${newMode}`)],
    });
  },
};
