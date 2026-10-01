import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  ActivityType,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { config, validateConfig } from './config.js';
import { QueueManager } from './music/QueueManager.js';
import { createErrorEmbed } from './utils/embed.js';
import { handleButtonInteraction, handleVoiceStateUpdate } from './interactionHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validar variables de entorno requeridas
validateConfig();

// Inicializar cliente de Discord con los intents necesarios
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

client.commands = new Collection();
const queueManager = new QueueManager();

// Cargar todos los comandos desde el directorio src/commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const commandModule = await import(pathToFileURL(filePath).href);
  const command = commandModule.default;
  if (command && 'data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[ADVERTENCIA] El archivo ${file} no exporta un comando válido.`);
  }
}

// Evento: Bot listo
client.once(Events.ClientReady, (readyClient) => {
  console.log(`🤖 ¡Bot iniciado con éxito como ${readyClient.user.tag}!`);
  console.log(`📡 Conectado a ${readyClient.guilds.cache.size} servidor(es).`);

  readyClient.user.setPresence({
    activities: [
      {
        name: '/play | Música de YouTube 🎵',
        type: ActivityType.Listening,
      },
    ],
    status: 'online',
  });
});

// Evento: Manejo de interacciones (Comandos Slash, Autocomplete y Botones)
client.on(Events.InteractionCreate, async (interaction) => {
  // 1. Manejo de Autocomplete (Sugerencias dinámicas de búsqueda en /play)
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (command && typeof command.autocomplete === 'function') {
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(`Error en autocomplete de ${interaction.commandName}:`, error);
      }
    }
    return;
  }

  // 2. Manejo de Comandos Slash (/)
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`No se encontró el comando ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction, queueManager);
    } catch (error) {
      console.error(`Error ejecutando el comando ${interaction.commandName}:`, error);
      const errorEmbed = createErrorEmbed('Ocurrió un error inesperado al ejecutar el comando.');

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  // 3. Manejo de Botones interactivos (reproductor y paginación)
  if (interaction.isButton()) {
    try {
      await handleButtonInteraction(interaction, queueManager);
    } catch (error) {
      console.error('Error procesando interacción de botón:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            embeds: [createErrorEmbed('Hubo un error al procesar esta acción.')],
            ephemeral: true,
          })
          .catch(() => {});
      }
    }
  }
});

// Evento: Desconectar con margen de gracia si el canal de voz queda vacío
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  handleVoiceStateUpdate(oldState, newState, queueManager);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection en:', promise, 'razón:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Iniciar sesión con Discord
if (config.token && config.token !== 'tu_token_aqui') {
  client.login(config.token).catch((err) => {
    console.error('Error al iniciar sesión en Discord:', err.message);
  });
} else {
  console.log('💡 Recuerda configurar tu DISCORD_TOKEN en el archivo .env y ejecutar: npm run deploy');
}
