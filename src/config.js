import dotenv from 'dotenv';
dotenv.config();

export const config = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || null,
  defaultVolume: 0.8,
  // Tiempo de espera en milisegundos antes de desconectarse por inactividad (5 minutos)
  idleTimeoutMs: 5 * 60 * 1000,
};

export function validateConfig() {
  const missing = [];
  if (!config.token || config.token === 'tu_token_aqui') {
    missing.push('DISCORD_TOKEN');
  }
  if (!config.clientId || config.clientId === 'tu_client_id_aqui') {
    missing.push('CLIENT_ID');
  }

  if (missing.length > 0) {
    console.warn(`[ADVERTENCIA] Faltan configurar las siguientes variables en el archivo .env: ${missing.join(', ')}`);
    console.warn('Por favor, crea o edita el archivo .env a partir de .env.example con tus credenciales.');
    return false;
  }
  return true;
}
