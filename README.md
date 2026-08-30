# 🎵 Discord Music Bot (Jockie Music & MatchBox Style)

Bot musik Discord modern dan canggih dengan fitur pemutaran multi-sumber (YouTube, Spotify, SoundCloud, Deezer, Apple Music), pemutar playlist via link, sistem **Custom Saved Playlist**, dan **Player Controller Embed Interaktif** persis seperti bot MatchBox & Jockie Music.

---

## ✨ Fitur Utama

- 🎧 **Multi-Source Audio**: Putar musik dari YouTube, Spotify (Lagu, Album, Playlist), SoundCloud, Deezer, Apple Music, atau direct link audio.
- 🎛️ **MatchBox Interactive UI Controller**:
  - Embed **Now Playing / Now Paused** dengan cover album, judul link, durasi, requester, dan penyanyi.
  - **4 Baris Tombol Interaktif**:
    - Baris 1: `QUEUE`, `BACK`, `PAUSE / RESUME`, `SKIP`
    - Baris 2: `AUTOPLAY` (rekomendasi lagu serupa otomatis)
    - Baris 3: `LOOP` (Off / Song / Queue), `REWIND` (-10s), `STOP`, `FORWARD` (+10s)
    - Baris 4: `REPLAY` (Ulang dari awal 00:00)
- 📑 **Sistem Custom Saved Playlist**:
  - Simpan antrean yang sedang diputar menjadi playlist server (`/playlist save <nama>`).
  - Putar kapan saja seluruh lagu di playlist (`/playlist play <nama>`).
  - Tambah, lihat, dan hapus playlist server.
- 📜 **Queue Pagination**: Melihat antrean lagu dengan navigasi tombol halaman sebelumnya & selanjutnya.
- ⚡ **Built-in FFmpeg**: Menggunakan binary audio ffmpeg terintegrasi, siap pakai di Windows tanpa ribet setup environment path.

---

## 🚀 Panduan Setup & Menjalankan Bot

### 1. Buat Aplikasi di Discord Developer Portal
1. Buka [Discord Developer Portal](https://discord.com/developers/applications).
2. Klik **New Application** dan beri nama bot Anda (misalnya `MyMusicBot`).
3. Masuk ke tab **Bot** (di menu kiri):
   - Klik **Reset Token** untuk mendapatkan **Bot Token**. Salin token ini.
   - Gulir ke bawah ke bagian **Privileged Gateway Intents**:
     - ✅ Centang **PRESENCE INTENT**
     - ✅ Centang **SERVER MEMBERS INTENT**
     - ✅ Centang **MESSAGE CONTENT INTENT**
   - Klik **Save Changes**.
4. Masuk ke tab **OAuth2 -> URL Generator**:
   - Di bagian **SCOPES**, centang:
     - ✅ `bot`
     - ✅ `applications.commands`
   - Di bagian **BOT PERMISSIONS**, centang:
     - ✅ `Administrator` (atau permission: *Send Messages, Embed Links, Attach Files, Connect, Speak, Use Voice Activity*).
   - Salin link di bagian bawah dan buka di browser untuk mengundang bot ke server Discord Anda.

---

### 2. Konfigurasi File `.env`
Buka file `.env` di folder bot, lalu masukkan token dan client ID bot Anda:

```env
DISCORD_TOKEN=masukkan_token_bot_anda_disini
CLIENT_ID=masukkan_client_id_aplikasi_anda

# (Opsional) Masukkan ID Server Discord Anda agar Slash Command langsung muncul seketika saat testing:
GUILD_ID=
```

---

### 3. Menjalankan Bot
Buka terminal / PowerShell di folder ini (`d:\BOT DISCORD V5`), lalu jalankan:

```bash
npm start
```
Atau untuk mode auto-reload saat mengedit file:
```bash
npm run dev
```

---

## 📜 Daftar Slash Commands (/)

### 🎵 Musik
| Command | Deskripsi |
| :--- | :--- |
| `/play <query / link>` | Memutar musik dari judul atau link (Spotify/YT/SoundCloud/Apple Music/Deezer) |
| `/pause` | Menjeda musik yang sedang berjalan |
| `/resume` | Melanjutkan musik yang dijeda |
| `/skip` | Melewati lagu ke lagu berikutnya |
| `/previous` | Memutar kembali lagu sebelumnya di riwayat |
| `/stop` | Menghentikan musik dan membersihkan antrean |
| `/queue` | Melihat daftar antrean dengan pagination tombol |
| `/nowplaying` | Menampilkan UI controller player lagu yang sedang aktif |
| `/volume <1-100>` | Mengatur tingkat volume suara |
| `/loop <mode>` | Mengatur mode perulangan (Off / Song / Queue) |
| `/autoplay` | Menyalakan / mematikan mode putar otomatis lagu serupa |
| `/seek <detik>` | Lompat ke detik tertentu pada lagu |
| `/shuffle` | Mengacak urutan antrean lagu |

### 📑 Custom Playlist
| Command | Deskripsi |
| :--- | :--- |
| `/playlist play <nama>` | Memutar seluruh lagu dalam playlist tersimpan |
| `/playlist save <nama>` | Menyimpan antrean aktif menjadi playlist baru |
| `/playlist add <nama> <lagu>` | Menambahkan lagu/link baru ke playlist tersimpan |
| `/playlist list` | Melihat daftar seluruh playlist tersimpan di server |
| `/playlist view <nama>` | Melihat daftar lagu di dalam playlist tersimpan |
| `/playlist delete <nama>` | Menghapus playlist tersimpan |

### ℹ️ General
| Command | Deskripsi |
| :--- | :--- |
| `/help` | Menampilkan panduan lengkap perintah dan tombol UI |
| `/ping` | Menampilkan latensi bot dan koneksi WebSocket |
