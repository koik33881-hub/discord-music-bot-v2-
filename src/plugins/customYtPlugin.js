const { ExtractorPlugin, Song, Playlist, DisTubeError } = require('distube');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path resolution prioritizing standard Linux / Railway installation
function getYtDlpPath() {
  const linuxGlobal = '/usr/local/bin/yt-dlp';
  if (fs.existsSync(linuxGlobal)) return linuxGlobal;

  const isWin = process.platform === 'win32';
  const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp_linux';
  const localBinPath = path.join(__dirname, '..', '..', 'bin', binName);
  if (fs.existsSync(localBinPath)) return localBinPath;

  return isWin ? 'yt-dlp.exe' : 'yt-dlp';
}

/**
 * Execute yt-dlp safely using spawn with argument arrays (prevents command injection)
 * Includes a 30-second timeout guard to avoid hanging processes.
 * @param {string[]} args Array of command arguments
 * @param {number} timeoutMs Execution timeout in milliseconds (default: 30000ms)
 * @returns {Promise<any>} Parsed JSON output
 */
function execYtDlp(args, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const binaryPath = getYtDlpPath();
    const proc = spawn(binaryPath, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let isFinished = false;

    // Timeout guard to prevent infinite hanging
    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        proc.kill('SIGKILL');
        reject(new DisTubeError('TIMEOUT', `yt-dlp process timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    proc.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    proc.on('error', (err) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        reject(new DisTubeError('PROCESS_ERROR', `Failed to spawn yt-dlp: ${err.message}`));
      }
    });

    proc.on('close', (code) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timer);

      if (code === 0) {
        try {
          const jsonStart = stdout.indexOf('{');
          const jsonEnd = stdout.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const parsed = JSON.parse(stdout.slice(jsonStart, jsonEnd + 1));
            resolve(parsed);
          } else {
            resolve(JSON.parse(stdout));
          }
        } catch (e) {
          reject(
            new DisTubeError(
              'PARSE_ERROR',
              `Failed to parse yt-dlp JSON output: ${e.message}\nSTDOUT: ${stdout.slice(0, 300)}`
            )
          );
        }
      } else {
        const errorMsg = (stderr || stdout || '').trim();
        reject(
          new DisTubeError(
            'EXTRACTOR_ERROR',
            `yt-dlp exited with code ${code}: ${errorMsg.slice(0, 300)}`
          )
        );
      }
    });
  });
}

class CustomYouTubePlugin extends ExtractorPlugin {
  validate(url) {
    if (typeof url !== 'string') return false;
    return (
      url.includes('youtube.com/') ||
      url.includes('youtu.be/') ||
      url.includes('music.youtube.com/') ||
      url.startsWith('ytsearch:')
    );
  }

  async resolve(url, options) {
    const rawData = await execYtDlp([
      '--dump-single-json',
      '--flat-playlist',
      '--no-warnings',
      '--no-playlist',
      url,
    ]);

    if (rawData._type === 'playlist' || Array.isArray(rawData.entries)) {
      const songs = (rawData.entries || []).map(
        (entry) =>
          new Song(
            {
              plugin: this,
              source: 'youtube',
              id: entry.id,
              name: entry.title || 'Unknown Track',
              url: entry.url || `https://youtu.be/${entry.id}`,
              duration: entry.duration || 0,
              uploader: { name: entry.uploader || entry.channel || 'Unknown Artist' },
              thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url,
            },
            options
          )
      );

      return new Playlist(
        {
          source: 'youtube',
          id: rawData.id,
          name: rawData.title || 'YouTube Playlist',
          url: rawData.webpage_url || url,
          songs,
        },
        options
      );
    }

    return new Song(
      {
        plugin: this,
        source: 'youtube',
        id: rawData.id,
        name: rawData.title || 'Unknown Track',
        url: rawData.webpage_url || url,
        duration: rawData.duration || 0,
        uploader: { name: rawData.uploader || rawData.channel || 'Unknown Artist' },
        thumbnail: rawData.thumbnail || rawData.thumbnails?.[0]?.url,
      },
      options
    );
  }

  async getStreamURL(song) {
    const url = song.url || `https://youtu.be/${song.id}`;
    const rawData = await execYtDlp([
      '--dump-single-json',
      '--no-warnings',
      '-f',
      'bestaudio/best',
      url,
    ]);

    if (rawData.url) return rawData.url;
    if (Array.isArray(rawData.formats)) {
      const audioFormat = rawData.formats
        .filter((f) => f.acodec !== 'none' && f.url)
        .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
      if (audioFormat) return audioFormat.url;
    }

    throw new DisTubeError('UNPLAYABLE_FORMATS', 'Tidak ada format audio yang dapat diputar.');
  }

  async searchSong(query, options) {
    const searchUrl = query.startsWith('ytsearch:') ? query : `ytsearch1:${query}`;
    const rawData = await execYtDlp([
      '--dump-single-json',
      '--flat-playlist',
      '--no-warnings',
      searchUrl,
    ]);

    const entry = rawData.entries?.[0] || rawData;
    if (!entry || !entry.id) return null;

    return new Song(
      {
        plugin: this,
        source: 'youtube',
        id: entry.id,
        name: entry.title || 'Unknown Track',
        url: entry.url || `https://youtu.be/${entry.id}`,
        duration: entry.duration || 0,
        uploader: { name: entry.uploader || entry.channel || 'Unknown Artist' },
        thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url,
      },
      options
    );
  }
}

module.exports = { CustomYouTubePlugin };
