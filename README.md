# 🎵 Bot de Discord para Música de YouTube (JavaScript)

Un bot de Discord moderno, potente y de alto rendimiento para reproducir música y listas de reproducción (playlists) directamente desde YouTube en tus canales de voz, construido con **Node.js**, **Discord.js v14**, **@discordjs/voice**, **yt-search**, **youtube-dl-exec** y diseñado bajo principios de **Clean Architecture & TDD**.

---

## ✨ Características

- 🔎 **Búsqueda Instantánea & Autocompletado**: Búsqueda por palabras clave en milisegundos (< 300ms) mediante `yt-search` y autocompletado en vivo de Discord mientras el usuario escribe en `/play`.
- ⚡ **Comandos Slash (`/`)**: Integración completa con la interfaz nativa moderna de Discord.
- 🎛️ **Controles Interactivos de Reproducción**: Dos filas de botones interactivos (`Pausa`, `Reanudar`, `Saltar`, `Detener`, `Ver Cola`, `Anterior`, `Mezclar`, `Bucle`).
- 🔁 **Sistema Completo de Bucle / Loop**: Modos `off` (desactivado), `song` (repite la canción actual) y `queue` (repite toda la cola).
- 🔀 **Mezcla Aleatoria (`/shuffle`)**: Algoritmo Fisher-Yates para barajar las pistas en espera.
- 📜 **Paginación Interactiva en Cola**: Navega por páginas de la cola de reproducción con botones de Anterior/Siguiente/Primera/Última.
- ⏩ **Gestión Total de Cola**: Comandos `/skipto`, `/remove`, `/clear` y `/previous`.
- 📊 **Barra de Progreso en Tiempo Real**: Visualiza la duración y el avance de la canción actual.
- 🔊 **Control de Volumen Dinámico**: Ajusta el nivel de audio dinámicamente con `/volume`.
- ⏳ **Margen de Gracia (Grace Period)**: Temporizador inteligente de 60 segundos si el bot se queda solo en el canal antes de desconectar.
- 🧪 **Suite de Pruebas TDD & E2E**: Más de 35 pruebas automatizadas usando el test runner nativo de Node.js.

---

## 📋 Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `/play <búsqueda o url>` | Busca y reproduce canciones con autocompletado en vivo o añade playlists. |
| `/loop [modo]` | Alterna o configura el modo de repetición (`off`, `song`, `queue`). |
| `/shuffle` | Mezcla aleatoriamente las canciones en espera. |
| `/skipto <posición>` | Salta directamente a una canción específica en la cola. |
| `/remove <posición>` | Elimina una canción específica de la lista de espera. |
| `/clear` | Vacía las canciones en espera sin detener la actual. |
| `/previous` | Vuelve a reproducir la canción anterior desde el historial. |
| `/pause` | Pausa la canción que se está reproduciendo. |
| `/resume` | Reanuda la reproducción pausada. |
| `/skip` | Salta inmediatamente a la siguiente canción en la cola. |
| `/stop` | Detiene la música, vacía la cola y desconecta al bot del canal de voz. |
| `/queue [página]` | Muestra la lista de canciones con controles de paginación interactivos. |
| `/nowplaying` | Muestra la canción actual con barra de progreso, estado de bucle y botones. |
| `/volume <0-100>` | Ajusta el volumen de la música (por ejemplo: `/volume 50`). |
| `/help` | Muestra la lista de comandos e instrucciones. |

---

## 🚀 Guía de Instalación y Configuración Paso a Paso

### 1. Requisitos Previos
- Tener instalado [Node.js](https://nodejs.org/) (versión 18.x, 20.x, 22.x o superior).

---

### 2. Configurar el Bot en Discord Developer Portal

1. Entra a [Discord Developer Portal](https://discord.com/developers/applications) e inicia sesión.
2. Crea una nueva aplicación y ve a la pestaña **Bot**:
   - Genera tu **Token del Bot** y cópialo.
3. En la pestaña **General Information**, copia el **Application ID** (`CLIENT_ID`).
4. En **OAuth2 -> URL Generator**, marca scopes `bot` y `applications.commands`, y permisos:
   - `Send Messages`, `Embed Links`, `Read Message History`, `Connect`, `Speak`, `Use Voice Activity`.
5. Abre el enlace generado e invita el bot a tu servidor.

---

### 3. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` y completa tus credenciales:

```env
DISCORD_TOKEN=tu_token_aqui
CLIENT_ID=tu_application_id_aqui

# (Opcional) Si quieres probar comandos instantáneamente en un servidor de pruebas:
# GUILD_ID=123456789012345678
```

---

### 4. Instalar Dependencias

```bash
npm install
```

---

### 5. Registrar Comandos Slash

```bash
npm run deploy
```

---

### 6. Iniciar el Bot

Modo producción:
```bash
npm start
```

Modo desarrollo (reinicio automático ante cambios):
```bash
npm run dev
```

---

### 7. Ejecutar Pruebas Automatizadas (TDD)

El proyecto incluye tests unitarios, de dominio, adaptadores e interacciones simuladas:

```bash
npm test
```

---

## 🛠️ Arquitectura del Proyecto

```
bot-youtube/
├── .env.example              # Ejemplo de variables de entorno
├── .gitignore                # Archivos ignorados por Git
├── package.json              # Configuración y dependencias
├── README.md                 # Documentación del proyecto
├── src/
│   ├── index.js              # Punto de entrada y eventos de Discord
│   ├── config.js             # Carga y validación de variables de entorno
│   ├── deploy-commands.js    # Script de despliegue de Slash Commands
│   ├── interactionHandler.js # Controlador desacoplado de botones y eventos de voz
│   ├── domain/               # Núcleo de dominio puro (independiente de frameworks)
│   │   └── Queue.js          # Entidad de cola, modos de bucle, historial y shuffle
│   ├── commands/             # Comandos Slash individuales
│   │   ├── play.js
│   │   ├── loop.js
│   │   ├── shuffle.js
│   │   ├── skipto.js
│   │   ├── remove.js
│   │   ├── clear.js
│   │   ├── previous.js
│   │   ├── pause.js
│   │   ├── resume.js
│   │   ├── skip.js
│   │   ├── stop.js
│   │   ├── queue.js
│   │   ├── nowplaying.js
│   │   ├── volume.js
│   │   └── help.js
│   ├── music/                # Orquestación de voz y estado
│   │   ├── GuildQueue.js
│   │   └── QueueManager.js
│   └── utils/                # Utilidades
│       ├── embed.js
│       └── youtube.js
└── tests/                    # Suite de pruebas automatizadas
    ├── domain/
    │   └── Queue.test.js
    ├── music/
    │   └── GuildQueue.test.js
    ├── commands/
    │   ├── commands.test.js
    │   └── deploy.test.js
    ├── utils/
    │   ├── embed.test.js
    │   └── youtube.test.js
    ├── interactions.test.js
    └── helpers/
        └── discordMock.js
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
