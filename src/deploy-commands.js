import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { config, validateConfig } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function deployCommands() {
  if (!validateConfig()) {
    console.error('No se pueden registrar los comandos: revisa tu archivo .env.');
    return;
  }

  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(pathToFileURL(filePath).href)).default;
    if (command && 'data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.warn(`[ADVERTENCIA] El comando en ${file} no tiene "data" o "execute".`);
    }
  }

  const rest = new REST().setToken(config.token);

  try {
    console.log(`Iniciando registro de ${commands.length} comandos Slash (/) ...`);

    if (config.guildId) {
      console.log(`Registrando comandos para el servidor (Guild ID): ${config.guildId}`);
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log('✅ ¡Comandos Slash registrados exitosamente en el servidor de pruebas!');
    } else {
      console.log('Registrando comandos Slash de forma global (todos los servidores)...');
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      console.log('✅ ¡Comandos Slash registrados globalmente con éxito!');
    }
  } catch (error) {
    console.error('Error registrando los comandos Slash:', error);
  }
}

// Ejecutar directamente si se llama desde la línea de comandos (npm run deploy)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  deployCommands();
}
