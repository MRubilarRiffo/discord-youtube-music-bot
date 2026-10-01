import youtubedl from 'youtube-dl-exec';
import ytSearch from 'yt-search';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

/**
 * Normaliza y formatea la información de una canción
 */
export function formatSongInfo(entry, requestedBy) {
  const durationSec = entry.duration?.seconds || entry.durationSec || entry.duration || 0;
  const thumbnail =
    entry.thumbnail ||
    entry.image ||
    (entry.thumbnails && entry.thumbnails.length > 0
      ? entry.thumbnails[entry.thumbnails.length - 1].url
      : null);

  return {
    title: entry.title || 'Canción de YouTube',
    url: entry.webpage_url || entry.url || `https://www.youtube.com/watch?v=${entry.id || entry.videoId}`,
    durationSec: Math.floor(durationSec),
    thumbnail: thumbnail,
    channel: entry.uploader || entry.channel || entry.author?.name || 'YouTube',
    requestedBy: requestedBy,
  };
}

/**
 * Detecta si una cadena es una URL
 */
export function isUrl(text) {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detecta si una URL es una lista de reproducción
 */
export function isPlaylistUrl(url) {
  return url.includes('list=') || url.includes('/playlist');
}

/**
 * Retorna sugerencias rápidas de búsqueda para el Autocomplete de Discord (Slash Commands)
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array<{ name: string, value: string }>>}
 */
export async function getYouTubeSuggestions(query, limit = 5) {
  const trimmed = (query || '').trim();
  if (trimmed.length < 2) return [];

  // Si ya es una URL válida, no tiene sentido sugerir autocompletado
  if (isUrl(trimmed)) {
    return [
      {
        name: trimmed.length > 90 ? trimmed.substring(0, 87) + '...' : trimmed,
        value: trimmed,
      },
    ];
  }

  try {
    const results = await ytSearch({ query: trimmed });
    if (!results || !results.videos || results.videos.length === 0) {
      return [];
    }

    return results.videos.slice(0, limit).map((video) => {
      const durationStr = video.duration?.timestamp ? ` (${video.duration.timestamp})` : '';
      const rawTitle = `${video.title}${durationStr}`;
      const name = rawTitle.length > 100 ? rawTitle.substring(0, 97) + '...' : rawTitle;
      const value = video.url.length > 100 ? video.url.substring(0, 100) : video.url;
      return { name, value };
    });
  } catch {
    return [];
  }
}

/**
 * Busca o resuelve una consulta o enlace de YouTube
 * @returns {Promise<{ type: 'video'|'playlist', songs: Array, playlistInfo?: object }>}
 */
export async function searchYouTube(query, requestedBy) {
  const trimmed = query.trim();

  // Caso 1: Es una URL de Playlist
  if (isUrl(trimmed) && isPlaylistUrl(trimmed)) {
    const data = await youtubedl(trimmed, {
      dumpSingleJson: true,
      flatPlaylist: true,
      noWarnings: true,
      noCheckCertificates: true,
    });

    if (!data.entries || data.entries.length === 0) {
      throw new Error('No se encontraron canciones en esta lista de reproducción.');
    }

    const songs = data.entries.map((entry) => formatSongInfo(entry, requestedBy));
    const totalDurationSec = songs.reduce((acc, s) => acc + (s.durationSec || 0), 0);

    return {
      type: 'playlist',
      songs,
      playlistInfo: {
        title: data.title || 'Playlist de YouTube',
        url: data.webpage_url || trimmed,
        thumbnail: data.thumbnail || (songs[0] ? songs[0].thumbnail : null),
        videoCount: songs.length,
        durationSec: totalDurationSec,
        requestedBy,
      },
    };
  }

  // Caso 2: Es una URL de Video directo
  if (isUrl(trimmed)) {
    const data = await youtubedl(trimmed, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
    });

    const song = formatSongInfo(data, requestedBy);
    return {
      type: 'video',
      songs: [song],
    };
  }

  // Caso 3: Es una búsqueda por texto (palabras clave)
  // Usamos primero yt-search para una respuesta ultrarrápida (sub-300ms)
  try {
    const searchResult = await ytSearch(trimmed);
    if (searchResult && searchResult.videos && searchResult.videos.length > 0) {
      const topVideo = searchResult.videos[0];
      const song = formatSongInfo(topVideo, requestedBy);
      return {
        type: 'video',
        songs: [song],
      };
    }
  } catch (err) {
    console.warn('[YouTube Search] yt-search falló, usando yt-dlp fallback:', err.message);
  }

  // Fallback con youtube-dl-exec si yt-search no arrojó resultados
  const searchResult = await youtubedl(`ytsearch1:${trimmed}`, {
    dumpSingleJson: true,
    noWarnings: true,
    noCheckCertificates: true,
  });

  const entry =
    searchResult.entries && searchResult.entries.length > 0
      ? searchResult.entries[0]
      : searchResult;

  if (!entry || (!entry.title && !entry.id)) {
    throw new Error('No se encontraron resultados en YouTube para tu búsqueda.');
  }

  const song = formatSongInfo(entry, requestedBy);

  return {
    type: 'video',
    songs: [song],
  };
}

/**
 * Obtiene la URL directa del stream de audio de YouTube
 */
export async function getAudioStreamUrl(url) {
  const streamUrl = await youtubedl(url, {
    getUrl: true,
    format: 'bestaudio/best',
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
  });

  if (!streamUrl || typeof streamUrl !== 'string') {
    throw new Error('No se pudo extraer la URL del stream de audio.');
  }

  return streamUrl.trim();
}

/**
 * Crea un proceso de FFmpeg con parámetros de reconexión continua
 * para evitar que YouTube corte el stream por throttling o cierre de socket
 */
export async function createAudioStream(url) {
  const streamUrl = await getAudioStreamUrl(url);

  const ffmpegProcess = spawn(
    ffmpegPath,
    [
      '-reconnect',
      '1',
      '-reconnect_streamed',
      '1',
      '-reconnect_delay_max',
      '5',
      '-i',
      streamUrl,
      '-analyzeduration',
      '0',
      '-loglevel',
      '0',
      '-f',
      's16le',
      '-ar',
      '48000',
      '-ac',
      '2',
      'pipe:1',
    ],
    {
      stdio: ['ignore', 'pipe', 'ignore'],
    }
  );

  return {
    stream: ffmpegProcess.stdout,
    process: ffmpegProcess,
  };
}
