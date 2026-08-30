const { ExtractorPlugin, Song, Playlist, DisTubeError } = require('distube');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const YTDLP_PATH = 'yt-dlp';
const COOKIES_PATH = path.join(__dirname, '..', '..', 'cookies.txt');
const HAS_COOKIES = fs.existsSync(COOKIES_PATH);

if (HAS_COOKIES) {
  console.log('[CustomYouTubePlugin] Cookies file found, will use for requests.');
} else {
  console.log('[CustomYouTubePlugin] WARNING: No cookies.txt found. YouTube may block requests from this server IP.');
}

function execYtDlp(args, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const fullArgs = HAS_COOKIES ? ['--cookies', COOKIES_PATH, ...args] : args;

    const proc = spawn(YTDLP_PATH, fullArgs, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let isFinished = false;

    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        proc.kill('SIGKILL');
        reject(new DisTubeError('TIMEOUT', `yt-dlp timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    proc.stdout.on('data', (chunk) => { stdout += chunk; });
    proc.stderr.on('data', (chunk) => { stderr += chunk; });

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

      // SELALU log stderr penuh ke console supaya kelihatan alasan asli
      if (stderr) console.error('[yt-dlp stderr]', stderr.slice(0, 2000));

      if (code === 0) {
        try {
          const jsonStart = stdout.indexOf('{');
          const jsonEnd = stdout.lastIndexOf('}');
          const parsed = jsonStart !== -1 && jsonEnd !== -1
            ? JSON.parse(stdout.slice(jsonStart, jsonEnd + 1))
            : JSON.parse(stdout);
          resolve(parsed);
        } catch (e) {
          reject(new DisTubeError('PARSE_ERROR', `JSON parse failed: ${e.message}`));
        }
      } else {
        const errorMsg = (stderr || stdout || 'Unknown error').trim();
        // Deteksi khusus error bot-blocking supaya jelas di log
        if (errorMsg.includes('Sign in to confirm') || errorMsg.includes('not a bot')) {
          reject(new DisTubeError('BOT_DETECTED', `YouTube memblokir server ini sebagai bot. Perlu cookies YouTube. Detail: ${errorMsg.slice(0, 300)}`));
        } else {
          reject(new DisTubeError('EXTRACTOR_ERROR', `yt-dlp exit code ${code}: ${errorMsg.slice(0, 500)}`));
        }
      }
    });
  });
}

class CustomYouTubePlugin extends ExtractorPlugin {
  validate(url) {
    if (typeof url !== 'string') return false;
    return url.includes('youtube.com/') || url.includes('youtu.be/') || url.includes('music.youtube.com/') || url.startsWith('ytsearch:');
  }

  async resolve(url, options) {
    const rawData = await execYtDlp(['--dump-single-json', '--flat-playlist', '--no-warnings', '--no-playlist', url]);

    if (rawData._type === 'playlist' || Array.isArray(rawData.entries)) {
      const songs = (rawData.entries || []).map((entry) => new Song({
        plugin: this, source: 'youtube', id: entry.id,
        name: entry.title || 'Unknown Track',
        url: entry.url || `https://youtu.be/${entry.id}`,
        duration: entry.duration || 0,
        uploader: { name: entry.uploader || entry.channel || 'Unknown Artist' },
        thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url,
      }, options));
      return new Playlist({
        source: 'youtube', id: rawData.id,
        name: rawData.title || 'YouTube Playlist',
        url: rawData.webpage_url || url, songs,
      }, options);
    }

    return new Song({
      plugin: this, source: 'youtube', id: rawData.id,
      name: rawData.title || 'Unknown Track',
      url: rawData.webpage_url || url,
      duration: rawData.duration || 0,
      uploader: { name: rawData.uploader || rawData.channel || 'Unknown Artist' },
      thumbnail: rawData.thumbnail || rawData.thumbnails?.[0]?.url,
    }, options);
  }

  async getStreamURL(song) {
    const url = song.url || `https://youtu.be/${song.id}`;
    const rawData = await execYtDlp(['--dump-single-json', '--no-warnings', '-f', 'bestaudio/best', url]);

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
    const rawData = await execYtDlp(['--dump-single-json', '--flat-playlist', '--no-warnings', searchUrl]);
    const entry = rawData.entries?.[0] || rawData;
    if (!entry || !entry.id) return null;

    return new Song({
      plugin: this, source: 'youtube', id: entry.id,
      name: entry.title || 'Unknown Track',
      url: entry.url || `https://youtu.be/${entry.id}`,
      duration: entry.duration || 0,
      uploader: { name: entry.uploader || entry.channel || 'Unknown Artist' },
      thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url,
    }, options);
  }
}

module.exports = { CustomYouTubePlugin };
