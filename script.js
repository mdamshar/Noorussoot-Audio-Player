/* =========================================================
   NOOR AUDIO — script.js
   Audio-first YouTube playlist player.
   ========================================================= */

/* ---------------------------------------------------------
   1. CONFIGURATION
   Paste your own playlist URLs here. Each key becomes a
   category. If you have a YouTube Data API v3 key, paste it
   below to pull real titles/thumbnails; without it, the demo
   library shown below is used instead so the site still works.
   --------------------------------------------------------- */
const CONFIG = {
  // Get a free key at https://console.cloud.google.com/ → APIs & Services
  // → enable "YouTube Data API v3" → Credentials → API key.
  // NEVER ship a key with billing/unlimited scope in a public frontend —
  // restrict it to YouTube Data API + your site's domain (HTTP referrer).
  youtubeApiKey: "AIzaSyC2gHwlIjeCWxRqeBetPPSBQRTIrn9Rh0U",

  playlists: {
    naat:    { label: "Naat",     icon: "mic",    url: "https://youtube.com/playlist?list=PLUNskf1XFHiIFPdPxmB1WSxGukh2jupIe&si=i7dIf8km8PEuL1rs" },
    quran:   { label: "Quran",    icon: "book",   url: "https://youtube.com/playlist?list=PLxpAkjlGauHcIC_-DgXJQyJQI6zZOBQ9K&si=QnMdVGjFwt-siIgz" },
    taqreer: { label: "Taqreer",  icon: "mosque", url: "https://youtube.com/playlist?list=PLw61kmf2KQcNrhYm2TFioyoBxPMtmKf8N&si=15LcMeBcYecPBOoQ" },
    podcast: { label: "Podcast",  icon: "headset",url: "https://youtube.com/playlist?list=PL5KgjwrPtPyuYg2JJ2KPAm1s2VkomUdic&si=OaL6C8Ud4It0xlXc" },
    dars:    { label: "Dars",     icon: "book",   url: "https://youtube.com/playlist?list=PLtveVn25c5ReUUjbGCTTg6oHR7hTjBiSF&si=MfEXZdVfORzYTxuP" },
    dua:     { label: "Dua",      icon: "hands",  url: "https://youtube.com/playlist?list=PLCmyT7p3AQUaLZLkbxpL2aZgQ7Gc3hkIk&si=VEi511MpvMsgFD4I" },
    hamd:    { label: "Hamd",     icon: "kaaba",  url: "https://youtube.com/playlist?list=PLNPRYnbf8Zbp84DjpWi0RKvnLqBjFZcE9&si=7GetKGZ3M9bO8jaR" },
    other:   { label: "Other",    icon: "star",   url: "https://youtube.com/playlist?list=PLjMdlvowxr_0IZ13u1fEZM7XEycYvIFTe&si=xDbmuqcnGXWTD6FN" }
  }
};

/* Demo/fallback library — replace by wiring real playlists above.
   Shows the full UI (search, favorites, queue, mini-player) working
   end to end even with no API key configured yet. */
// const DEMO_LIBRARY = [
//   { id: "demo-1", videoId: "", title: "Ya Nabi Salam Alaika", artist: "Various Reciters", category: "naat", duration: 342 },
//   { id: "demo-2", videoId: "", title: "Mustafa Jaan-e-Rehmat", artist: "Various Reciters", category: "naat", duration: 298 },
//   { id: "demo-3", videoId: "", title: "Surah Ar-Rahman", artist: "Tilawat", category: "quran", duration: 610 },
//   { id: "demo-4", videoId: "", title: "Surah Al-Mulk", artist: "Tilawat", category: "quran", duration: 480 },
//   { id: "demo-5", videoId: "", title: "The Meaning of Sabr", artist: "Weekly Bayan", category: "taqreer", duration: 1520 },
//   { id: "demo-6", videoId: "", title: "Reflections on Ramadan", artist: "Islamic Podcast", category: "podcast", duration: 980 },
//   { id: "demo-7", videoId: "", title: "Seerah — Early Days", artist: "Dars Series", category: "dars", duration: 1340 },
//   { id: "demo-8", videoId: "", title: "Dua for Ease", artist: "Collection", category: "dua", duration: 140 },
//   { id: "demo-9", videoId: "", title: "Subhan Allah", artist: "Hamd Collection", category: "hamd", duration: 260 },
//   { id: "demo-10", videoId: "", title: "Madine Ko Jayen", artist: "Various Reciters", category: "naat", duration: 305 }
// ];

const CATEGORY_META = {
  naat:    { label: "Naat",    icon: iconMic() },
  quran:   { label: "Quran",   icon: iconBook() },
  taqreer: { label: "Taqreer", icon: iconMosque() },
  podcast: { label: "Podcast", icon: iconHeadset() },
  dars:    { label: "Dars",    icon: iconBook() },
  dua:     { label: "Dua",     icon: iconHands() },
  hamd:    { label: "Hamd",    icon: iconKaaba() },
  other:   { label: "Other",   icon: iconStar() }
};

/* ---------------------------------------------------------
   2. STATE
   --------------------------------------------------------- */
const state = {
  library: [],
  filtered: [],
  activeFilter: "all",
  searchTerm: "",
  queue: [],
  currentIndex: -1,
  playing: false,
  shuffle: false,
  repeat: false, // repeat-one
  volume: 80,
  muted: false,
  speed: 1,
  favorites: loadJSON("noor_favorites", []),
  recent: loadJSON("noor_recent", []),
  ytReady: false,
  ytPlayer: null,
  duration: 0,
  usingDemo: true,
  sleepTimerId: null
};

/* ---------------------------------------------------------
   3. STORAGE HELPERS
   --------------------------------------------------------- */
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
}

/* ---------------------------------------------------------
   4. ICONS (inline SVG strings, reused across cards)
   --------------------------------------------------------- */
function iconMic(){return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></svg>`;}
function iconBook(){return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>`;}
function iconMosque(){return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 21h18M4 21v-8h4v8M16 21v-8h4v8M8 13V9a4 4 0 0 1 8 0v4M12 2v3"/></svg>`;}
function iconHeadset(){return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="2" y="13" width="5" height="7" rx="1.5"/><rect x="17" y="13" width="5" height="7" rx="1.5"/></svg>`;}
function iconHands(){return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 13V6a2 2 0 1 1 4 0v6M12 12V4a2 2 0 1 1 4 0v9M16 12.5V7a2 2 0 1 1 4 0v7c0 4-3 7-7 7h-1c-3 0-4-1-6-3l-2.5-3a1.7 1.7 0 0 1 2.5-2.3L8 14"/></svg>`;}
function iconKaaba(){return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 9h16M4 4l6 5M20 4l-6 5"/></svg>`;}
function iconStar(){return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6L12 3Z"/></svg>`;}
function iconPlaySm(){return `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;}

/* ---------------------------------------------------------
   5. DOM REFS
   --------------------------------------------------------- */
const $ = (sel) => document.querySelector(sel);
const els = {
  header: $("#siteHeader"),
  hamburger: $("#hamburgerBtn"),
  mainNav: $("#mainNav"),
  navOverlay: $("#navOverlay"),
  themeToggle: $("#themeToggle"),

  categoryScroller: $("#categoryScroller"),
  filterChips: $("#filterChips"),
  searchInput: $("#searchInput"),
  libraryList: $("#libraryList"),

  playlistSearch: $("#playlistSearch"),
  panelQueue: $("#panelQueue"),
  panelFavorites: $("#panelFavorites"),
  panelRecent: $("#panelRecent"),
  ptabs: document.querySelectorAll(".ptab"),

  favoritesList: $("#favoritesList"),
  favoritesEmpty: $("#favoritesEmpty"),

  statTracks: $("#statTracks"),
  statCategories: $("#statCategories"),
  startListeningBtn: $("#startListeningBtn"),

  playerArtImg: $("#playerArtImg"),
  artFallback: $("#artFallback"),
  equalizer: $("#equalizer"),
  playerCategoryBadge: $("#playerCategoryBadge"),
  playerTitle: $("#playerTitle"),
  playerArtist: $("#playerArtist"),

  currentTime: $("#currentTime"),
  totalTime: $("#totalTime"),
  seekBar: $("#seekBar"),
  seekFill: $("#seekFill"),
  seekHandle: $("#seekHandle"),

  shuffleBtn: $("#shuffleBtn"),
  prevBtn: $("#prevBtn"),
  playBtn: $("#playBtn"),
  playIcon: $("#playIcon"),
  pauseIcon: $("#pauseIcon"),
  nextBtn: $("#nextBtn"),
  repeatBtn: $("#repeatBtn"),

  muteBtn: $("#muteBtn"),
  volIcon: $("#volIcon"),
  muteIcon: $("#muteIcon"),
  volumeSlider: $("#volumeSlider"),
  speedBtn: $("#speedBtn"),
  sleepTimerBtn: $("#sleepTimerBtn"),
  favBtn: $("#favBtn"),
  shareBtn: $("#shareBtn"),

  miniPlayer: $("#miniPlayer"),
  miniProgressFill: $("#miniProgressFill"),
  miniTitle: $("#miniTitle"),
  miniArtist: $("#miniArtist"),
  miniPrev: $("#miniPrev"),
  miniPlay: $("#miniPlay"),
  miniPlayIcon: $("#miniPlayIcon"),
  miniPauseIcon: $("#miniPauseIcon"),
  miniNext: $("#miniNext"),
  miniFav: $("#miniFav"),

  toastStack: $("#toastStack"),
  yearEl: $("#year")
};

/* ---------------------------------------------------------
   6. TOASTS
   --------------------------------------------------------- */
function toast(message, type = "info") {
  const node = document.createElement("div");
  node.className = `toast${type === "error" ? " error" : ""}`;
  node.textContent = message;
  els.toastStack.appendChild(node);
  setTimeout(() => {
    node.classList.add("leaving");
    setTimeout(() => node.remove(), 260);
  }, 3400);
}

/* ---------------------------------------------------------
   7. THEME
   --------------------------------------------------------- */
function initTheme() {
  const saved = localStorage.getItem("noor_theme");
  const theme = saved || "dark";
  document.body.setAttribute("data-theme", theme);
  els.themeToggle.setAttribute("aria-pressed", theme === "light");
  els.themeToggle.setAttribute("aria-label", theme === "light" ? "Switch to dark mode" : "Switch to light mode");
}
els.themeToggle.addEventListener("click", () => {
  const current = document.body.getAttribute("data-theme");
  const next = current === "light" ? "dark" : "light";
  document.body.setAttribute("data-theme", next);
  localStorage.setItem("noor_theme", next);
  els.themeToggle.setAttribute("aria-pressed", next === "light");
  els.themeToggle.setAttribute("aria-label", next === "light" ? "Switch to dark mode" : "Switch to light mode");
});

/* ---------------------------------------------------------
   8. MOBILE NAV
   --------------------------------------------------------- */
function closeNav() {
  els.mainNav.classList.remove("open");
  els.hamburger.classList.remove("open");
  els.hamburger.setAttribute("aria-expanded", "false");
  els.navOverlay.classList.remove("show");
}
els.hamburger.addEventListener("click", () => {
  const open = els.mainNav.classList.toggle("open");
  els.hamburger.classList.toggle("open", open);
  els.hamburger.setAttribute("aria-expanded", String(open));
  els.navOverlay.classList.toggle("show", open);
});
els.navOverlay.addEventListener("click", closeNav);
els.mainNav.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    els.mainNav.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    closeNav();
  });
});

/* ---------------------------------------------------------
   9. PLAYLIST ID EXTRACTION + YOUTUBE DATA API FETCH
   --------------------------------------------------------- */
function extractPlaylistId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.searchParams.get("list");
  } catch (e) {
    return null;
  }
}

async function fetchPlaylistItems(playlistId, categoryKey) {
  const key = CONFIG.youtubeApiKey;
  if (!key) return null; // no key configured — caller falls back to demo data
  const endpoint = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      if (res.status === 403) toast("YouTube API quota reached — showing demo library instead.", "error");
      else toast("Couldn't load a playlist right now — showing demo library instead.", "error");
      return null;
    }
    const data = await res.json();
    return (data.items || [])
      .filter(item => item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId)
      .map(item => ({
        id: `${categoryKey}-${item.snippet.resourceId.videoId}`,
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title || "Untitled",
        artist: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle || "Unknown",
        category: categoryKey,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
        duration: null // filled in lazily once played, via the player API
      }));
  } catch (e) {
    toast("Network error while loading a playlist — showing demo library instead.", "error");
    return null;
  }
}

async function buildLibrary() {
  const configuredEntries = Object.entries(CONFIG.playlists).filter(([, v]) => v.url && extractPlaylistId(v.url));

  if (!CONFIG.youtubeApiKey || configuredEntries.length === 0) {
    state.usingDemo = true;
    state.library = DEMO_LIBRARY.slice();
    return;
  }

  state.usingDemo = false;
  const results = [];
  for (const [key, cfg] of configuredEntries) {
    const playlistId = extractPlaylistId(cfg.url);
    const items = await fetchPlaylistItems(playlistId, key);
    if (items && items.length) results.push(...items);
  }

  if (!results.length) {
    toast("No playlists could be loaded — showing demo library instead.", "error");
    state.usingDemo = true;
    state.library = DEMO_LIBRARY.slice();
    return;
  }
  state.library = results;
}

/* ---------------------------------------------------------
   10. YOUTUBE IFRAME PLAYER (audio-first: iframe kept 1x1/hidden)
   --------------------------------------------------------- */
function onYouTubeIframeAPIReady() {
  state.ytPlayer = new YT.Player("ytPlayer", {
    height: "1",
    width: "1",
    playerVars: { playsinline: 1, controls: 0, disablekb: 1, modestbranding: 1, rel: 0 },
    events: {
      onReady: () => { state.ytReady = true; state.ytPlayer.setVolume(state.volume); },
      onStateChange: onPlayerStateChange,
      onError: onPlayerError
    }
  });
}
// Expose for the YouTube IFrame API global callback contract.
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

function onPlayerStateChange(e) {
  if (e.data === YT.PlayerState.PLAYING) {
    setPlayingUI(true);
    state.duration = state.ytPlayer.getDuration() || state.duration;
    els.totalTime.textContent = formatTime(state.duration);
    startProgressLoop();
  } else if (e.data === YT.PlayerState.PAUSED) {
    setPlayingUI(false);
  } else if (e.data === YT.PlayerState.ENDED) {
    if (state.repeat) {
      state.ytPlayer.seekTo(0);
      state.ytPlayer.playVideo();
    } else {
      playNext(true);
    }
  }
}

function onPlayerError() {
  toast("This audio is currently unavailable.", "error");
  playNext(true);
}

let progressRAF = null;
function startProgressLoop() {
  cancelAnimationFrame(progressRAF);
  function tick() {
    if (state.playing && state.ytPlayer && state.ytPlayer.getCurrentTime) {
      const cur = state.ytPlayer.getCurrentTime() || 0;
      const dur = state.duration || state.ytPlayer.getDuration() || 0;
      updateSeekUI(cur, dur);
    }
    progressRAF = requestAnimationFrame(tick);
  }
  tick();
}

function updateSeekUI(cur, dur) {
  const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
  els.seekFill.style.width = pct + "%";
  els.seekHandle.style.left = pct + "%";
  els.seekBar.setAttribute("aria-valuenow", Math.round(pct));
  els.currentTime.textContent = formatTime(cur);
  els.miniProgressFill.style.width = pct + "%";
}

function formatTime(sec) {
  if (!sec || isNaN(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ---------------------------------------------------------
   11. PLAYBACK CONTROL
   --------------------------------------------------------- */
function setPlayingUI(isPlaying) {
  state.playing = isPlaying;
  els.playIcon.hidden = isPlaying;
  els.pauseIcon.hidden = !isPlaying;
  els.miniPlayIcon.hidden = isPlaying;
  els.miniPauseIcon.hidden = !isPlaying;
  els.playBtn.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
  els.equalizer.classList.toggle("playing", isPlaying);
}

function currentTrack() {
  return state.queue[state.currentIndex] || null;
}

function playTrackAt(index) {
  if (index < 0 || index >= state.queue.length) return;
  state.currentIndex = index;
  const track = state.queue[index];
  renderPlayerMeta(track);
  addToRecent(track);
  highlightActiveTrack(track.id);
  renderQueuePanel();

  if (state.usingDemo || !track.videoId) {
    // No real videoId configured — demonstrate full UI/state without playback.
    state.duration = track.duration || 180;
    els.totalTime.textContent = formatTime(state.duration);
    updateSeekUI(0, state.duration);
    setPlayingUI(true);
    simulateDemoPlayback();
    toast(`Now playing (demo): ${track.title} — add a real playlist URL + API key to hear audio.`);
    return;
  }

  if (!state.ytReady) {
    toast("Player is still loading — try again in a moment.", "error");
    return;
  }
  stopDemoPlayback();
  state.ytPlayer.loadVideoById(track.videoId);
  state.ytPlayer.setPlaybackRate(state.speed);
  state.ytPlayer.setVolume(state.muted ? 0 : state.volume);
}

// Demo-mode ticking so the seek bar/equalizer still feel alive without a real stream.
let demoInterval = null;
function simulateDemoPlayback() {
  stopDemoPlayback();
  let cur = 0;
  demoInterval = setInterval(() => {
    if (!state.playing) return;
    cur += 1 * state.speed;
    if (cur >= state.duration) {
      if (state.repeat) { cur = 0; } else { playNext(true); return; }
    }
    updateSeekUI(cur, state.duration);
  }, 1000);
}
function stopDemoPlayback() {
  if (demoInterval) { clearInterval(demoInterval); demoInterval = null; }
}

function togglePlay() {
  const track = currentTrack();
  if (!track) {
    if (state.queue.length) playTrackAt(0);
    else toast("Choose a track from the library first.");
    return;
  }
  if (state.usingDemo || !track.videoId) {
    setPlayingUI(!state.playing);
    if (state.playing) simulateDemoPlayback(); else stopDemoPlayback();
    return;
  }
  if (!state.ytReady) return;
  if (state.playing) state.ytPlayer.pauseVideo();
  else state.ytPlayer.playVideo();
}

function playNext(auto) {
  if (!state.queue.length) return;
  let next;
  if (state.shuffle) {
    next = Math.floor(Math.random() * state.queue.length);
  } else {
    next = state.currentIndex + 1;
    if (next >= state.queue.length) {
      if (!auto) next = 0; else { setPlayingUI(false); return; } // stop at end during autoplay
    }
  }
  playTrackAt(next);
}
function playPrev() {
  if (!state.queue.length) return;
  let prev = state.currentIndex - 1;
  if (prev < 0) prev = state.queue.length - 1;
  playTrackAt(prev);
}

els.playBtn.addEventListener("click", togglePlay);
els.miniPlay.addEventListener("click", togglePlay);
els.nextBtn.addEventListener("click", () => playNext(false));
els.miniNext.addEventListener("click", () => playNext(false));
els.prevBtn.addEventListener("click", playPrev);
els.miniPrev.addEventListener("click", playPrev);

els.shuffleBtn.addEventListener("click", () => {
  state.shuffle = !state.shuffle;
  els.shuffleBtn.setAttribute("aria-pressed", String(state.shuffle));
  toast(state.shuffle ? "Shuffle on" : "Shuffle off");
});
els.repeatBtn.addEventListener("click", () => {
  state.repeat = !state.repeat;
  els.repeatBtn.setAttribute("aria-pressed", String(state.repeat));
  toast(state.repeat ? "Repeat this track" : "Repeat off");
});

/* Seek bar interaction */
function seekToPct(pct) {
  const dur = state.duration;
  if (!dur) return;
  const target = (pct / 100) * dur;
  if (state.usingDemo || !currentTrack()?.videoId) {
    updateSeekUI(target, dur);
  } else if (state.ytReady) {
    state.ytPlayer.seekTo(target, true);
  }
}
function seekFromEvent(clientX) {
  const rect = els.seekBar.getBoundingClientRect();
  const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
  seekToPct(pct);
}
els.seekBar.addEventListener("click", (e) => seekFromEvent(e.clientX));
els.seekBar.addEventListener("keydown", (e) => {
  const dur = state.duration || 0;
  const cur = dur * (parseFloat(els.seekBar.getAttribute("aria-valuenow")) / 100 || 0);
  if (e.key === "ArrowRight") seekToPct(Math.min(100, ((cur + 5) / dur) * 100 || 0));
  if (e.key === "ArrowLeft") seekToPct(Math.max(0, ((cur - 5) / dur) * 100 || 0));
});
let seekDragging = false;
els.seekHandle.addEventListener("pointerdown", () => { seekDragging = true; });
window.addEventListener("pointermove", (e) => { if (seekDragging) seekFromEvent(e.clientX); });
window.addEventListener("pointerup", () => { seekDragging = false; });

/* Volume */
els.volumeSlider.addEventListener("input", (e) => {
  state.volume = Number(e.target.value);
  state.muted = state.volume === 0;
  if (state.ytReady && state.ytPlayer.setVolume) state.ytPlayer.setVolume(state.volume);
  updateVolumeUI();
});
els.muteBtn.addEventListener("click", () => {
  state.muted = !state.muted;
  if (state.ytReady && state.ytPlayer.setVolume) state.ytPlayer.setVolume(state.muted ? 0 : state.volume);
  updateVolumeUI();
});
function updateVolumeUI() {
  els.volIcon.hidden = state.muted;
  els.muteIcon.hidden = !state.muted;
  els.volumeSlider.value = state.muted ? 0 : state.volume;
}

/* Speed */
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
els.speedBtn.addEventListener("click", () => {
  const idx = SPEEDS.indexOf(state.speed);
  state.speed = SPEEDS[(idx + 1) % SPEEDS.length];
  els.speedBtn.textContent = state.speed.toFixed(2).replace(/\.?0+$/, "") + "x";
  if (state.ytReady && state.ytPlayer.setPlaybackRate) state.ytPlayer.setPlaybackRate(state.speed);
});

/* Sleep timer */
els.sleepTimerBtn.addEventListener("click", () => {
  if (state.sleepTimerId) {
    clearTimeout(state.sleepTimerId);
    state.sleepTimerId = null;
    els.sleepTimerBtn.setAttribute("aria-pressed", "false");
    toast("Sleep timer cancelled.");
    return;
  }
  const minutes = 30;
  state.sleepTimerId = setTimeout(() => {
    if (state.playing) togglePlay();
    state.sleepTimerId = null;
    els.sleepTimerBtn.setAttribute("aria-pressed", "false");
    toast("Sleep timer ended — playback paused.");
  }, minutes * 60 * 1000);
  els.sleepTimerBtn.setAttribute("aria-pressed", "true");
  toast(`Sleep timer set for ${minutes} minutes.`);
});

/* Share + favorite */
els.shareBtn.addEventListener("click", () => shareCurrent());
async function shareCurrent() {
  const track = currentTrack();
  if (!track) { toast("Nothing is playing yet."); return; }
  const url = track.videoId ? `https://www.youtube.com/watch?v=${track.videoId}` : window.location.href;
  const text = `${track.title} — ${track.artist}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: track.title, text, url });
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast("Copied to clipboard.");
    }
  } catch (e) { /* user cancelled share — no action needed */ }
}

els.favBtn.addEventListener("click", () => toggleFavoriteCurrent());
els.miniFav.addEventListener("click", () => toggleFavoriteCurrent());
function toggleFavoriteCurrent() {
  const track = currentTrack();
  if (!track) { toast("Nothing is playing yet."); return; }
  toggleFavorite(track);
}

/* ---------------------------------------------------------
   12. FAVORITES / RECENT
   --------------------------------------------------------- */
function isFavorite(id) { return state.favorites.some(t => t.id === id); }

function toggleFavorite(track) {
  if (isFavorite(track.id)) {
    state.favorites = state.favorites.filter(t => t.id !== track.id);
    toast("Removed from favorites.");
  } else {
    state.favorites = [track, ...state.favorites].slice(0, 200);
    toast("Added to favorites.");
  }
  saveJSON("noor_favorites", state.favorites);
  refreshFavoriteButtons();
  renderFavoritesSection();
  renderFavoritesPanel();
  renderLibraryList();
}

function refreshFavoriteButtons() {
  const track = currentTrack();
  const active = track ? isFavorite(track.id) : false;
  [els.favBtn, els.miniFav].forEach(btn => btn.setAttribute("aria-pressed", String(active)));
}

function addToRecent(track) {
  state.recent = [track, ...state.recent.filter(t => t.id !== track.id)].slice(0, 10);
  saveJSON("noor_recent", state.recent);
  renderRecentPanel();
}

/* ---------------------------------------------------------
   13. RENDERING — categories, filters, library, panels
   --------------------------------------------------------- */
function renderCategories() {
  const counts = countByCategory(state.library);
  els.categoryScroller.innerHTML = Object.entries(CATEGORY_META).map(([key, meta]) => `
    <button class="category-card glass" data-category="${key}" type="button">
      <span class="category-icon">${meta.icon}</span>
      <h3>${meta.label}</h3>
      <span>${counts[key] || 0} Audios</span>
    </button>
  `).join("");

  els.categoryScroller.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      setFilter(card.dataset.category);
      document.getElementById("library").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function countByCategory(list) {
  return list.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {});
}

function renderFilterChips() {
  const cats = Object.keys(CATEGORY_META);
  els.filterChips.innerHTML = `<button class="chip active" data-filter="all" role="tab" aria-selected="true">All</button>` +
    cats.map(c => `<button class="chip" data-filter="${c}" role="tab" aria-selected="false">${CATEGORY_META[c].label}</button>`).join("");

  els.filterChips.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => setFilter(chip.dataset.filter));
  });
}

function setFilter(filter) {
  state.activeFilter = filter;
  els.filterChips.querySelectorAll(".chip").forEach(chip => {
    const active = chip.dataset.filter === filter;
    chip.classList.toggle("active", active);
    chip.setAttribute("aria-selected", String(active));
  });
  renderLibraryList();
}

function applyLibraryFilters() {
  const term = state.searchTerm.trim().toLowerCase();
  return state.library.filter(t => {
    const matchesCategory = state.activeFilter === "all" || t.category === state.activeFilter;
    const matchesSearch = !term || t.title.toLowerCase().includes(term) || t.artist.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });
}

function renderLibraryList() {
  const list = applyLibraryFilters();
  state.filtered = list;
  state.queue = list; // queue mirrors the currently visible, filtered list

  if (!list.length) {
    els.libraryList.innerHTML = `<p class="empty-state">No audio matches your search. Try a different keyword.</p>`;
    renderQueuePanel();
    return;
  }

  els.libraryList.innerHTML = list.map(trackRowHTML).join("");
  wireTrackRows(els.libraryList);
  renderQueuePanel();
}

function trackRowHTML(track) {
  const fav = isFavorite(track.id);
  const active = currentTrack() && currentTrack().id === track.id;
  return `
    <div class="track-item${active ? " active" : ""}" data-id="${track.id}" role="button" tabindex="0" aria-label="Play ${escapeHtml(track.title)}">
      <div class="track-thumb">
        ${track.thumbnail ? `<img src="${track.thumbnail}" alt="" loading="lazy">` : iconMic()}
        <span class="track-play-overlay">${iconPlaySm()}</span>
      </div>
      <div class="track-info">
        <div class="track-title">${escapeHtml(track.title)}</div>
        <div class="track-sub">${CATEGORY_META[track.category]?.label || "Audio"} &middot; ${track.duration ? formatTime(track.duration) : "--:--"}</div>
      </div>
      <button class="icon-btn ghost fav-toggle" data-fav-id="${track.id}" aria-label="${fav ? "Remove from favorites" : "Add to favorites"}" aria-pressed="${fav}" type="button">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="${fav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z"/></svg>
      </button>
    </div>`;
}

function wireTrackRows(container) {
  container.querySelectorAll(".track-item").forEach(row => {
    const play = () => {
      const id = row.dataset.id;
      const idx = state.queue.findIndex(t => t.id === id);
      if (idx > -1) playTrackAt(idx);
    };
    row.addEventListener("click", (e) => {
      if (e.target.closest(".fav-toggle")) return;
      play();
    });
    row.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(); } });
  });
  container.querySelectorAll(".fav-toggle").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const track = state.library.find(t => t.id === btn.dataset.favId);
      if (track) toggleFavorite(track);
    });
  });
}

function highlightActiveTrack(id) {
  document.querySelectorAll(".track-item").forEach(row => row.classList.toggle("active", row.dataset.id === id));
  document.querySelectorAll(".queue-item").forEach(row => row.classList.toggle("current", row.dataset.id === id));
}

function renderPlayerMeta(track) {
  els.playerCategoryBadge.textContent = CATEGORY_META[track.category]?.label || "Audio";
  els.playerTitle.textContent = track.title;
  els.playerArtist.textContent = track.artist;
  els.miniTitle.textContent = track.title;
  els.miniArtist.textContent = track.artist;

  if (track.thumbnail) {
    els.playerArtImg.src = track.thumbnail;
    els.playerArtImg.alt = track.title;
    els.playerArtImg.hidden = false;
    els.artFallback.hidden = true;
  } else {
    els.playerArtImg.hidden = true;
    els.artFallback.hidden = false;
  }

  els.miniPlayer.hidden = false;
  requestAnimationFrame(() => els.miniPlayer.classList.remove("hide"));
  refreshFavoriteButtons();
}

function renderQueuePanel() {
  const term = els.playlistSearch.value.trim().toLowerCase();
  const list = state.queue.filter(t => !term || t.title.toLowerCase().includes(term));
  if (!list.length) {
    els.panelQueue.innerHTML = `<p class="empty-state">Queue is empty. Play something from the library.</p>`;
    return;
  }
  els.panelQueue.innerHTML = list.map((t, i) => queueRowHTML(t, i + 1)).join("");
  wireQueueRows(els.panelQueue);
}

function queueRowHTML(track, num) {
  const active = currentTrack() && currentTrack().id === track.id;
  return `<div class="queue-item${active ? " current" : ""}" data-id="${track.id}">
      <span class="queue-num">${String(num).padStart(2, "0")}</span>
      <span class="queue-title">${escapeHtml(track.title)}</span>
    </div>`;
}
function wireQueueRows(container) {
  container.querySelectorAll(".queue-item").forEach(row => {
    row.addEventListener("click", () => {
      const idx = state.queue.findIndex(t => t.id === row.dataset.id);
      if (idx > -1) playTrackAt(idx);
    });
  });
}

function renderFavoritesPanel() {
  if (!state.favorites.length) {
    els.panelFavorites.innerHTML = `<p class="empty-state">No favorites yet.</p>`;
    return;
  }
  els.panelFavorites.innerHTML = state.favorites.map((t, i) => queueRowHTML(t, i + 1)).join("");
  els.panelFavorites.querySelectorAll(".queue-item").forEach(row => {
    row.addEventListener("click", () => {
      const track = state.favorites.find(t => t.id === row.dataset.id);
      playFromArbitraryTrack(track);
    });
  });
}
function renderRecentPanel() {
  if (!state.recent.length) {
    els.panelRecent.innerHTML = `<p class="empty-state">Nothing played yet.</p>`;
    return;
  }
  els.panelRecent.innerHTML = state.recent.map((t, i) => queueRowHTML(t, i + 1)).join("");
  els.panelRecent.querySelectorAll(".queue-item").forEach(row => {
    row.addEventListener("click", () => {
      const track = state.recent.find(t => t.id === row.dataset.id);
      playFromArbitraryTrack(track);
    });
  });
}

function playFromArbitraryTrack(track) {
  if (!track) return;
  let idx = state.queue.findIndex(t => t.id === track.id);
  if (idx === -1) { state.queue = [track, ...state.queue]; idx = 0; }
  playTrackAt(idx);
}

function renderFavoritesSection() {
  if (!state.favorites.length) {
    els.favoritesList.innerHTML = "";
    els.favoritesEmpty.hidden = false;
    return;
  }
  els.favoritesEmpty.hidden = true;
  els.favoritesList.innerHTML = state.favorites.map(trackRowHTML).join("");
  wireTrackRows(els.favoritesList);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* Playlist tabs */
els.ptabs.forEach(tab => {
  tab.addEventListener("click", () => {
    els.ptabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".ptab-panel").forEach(p => p.classList.remove("active"));
    document.getElementById("panel" + capitalize(tab.dataset.panel)).classList.add("active");
  });
});
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

els.playlistSearch.addEventListener("input", renderQueuePanel);
els.searchInput.addEventListener("input", (e) => {
  state.searchTerm = e.target.value;
  renderLibraryList();
});

/* ---------------------------------------------------------
   14. MINI PLAYER SCROLL BEHAVIOUR
   --------------------------------------------------------- */
function initMiniPlayerScroll() {
  const playerSection = document.getElementById("player");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!currentTrack()) return;
      els.miniPlayer.classList.toggle("hide", entry.isIntersecting);
    });
  }, { threshold: 0.15 });
  observer.observe(playerSection);
}

/* Clicking mini player scrolls back to the full player */
document.querySelector(".mini-inner .mini-meta").addEventListener("click", () => {
  document.getElementById("player").scrollIntoView({ behavior: "smooth" });
});

/* ---------------------------------------------------------
   15. INIT
   --------------------------------------------------------- */
els.startListeningBtn.addEventListener("click", () => {
  document.getElementById("player").scrollIntoView({ behavior: "smooth" });
  if (!currentTrack() && state.library.length) {
    // Build an initial queue from the full library so "Start Listening" plays something.
    state.queue = state.library;
    playTrackAt(0);
  }
});

async function init() {
  initTheme();
  els.yearEl.textContent = new Date().getFullYear();
  updateVolumeUI();

  // Loading skeletons while the library builds.
  els.libraryList.innerHTML = `<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`;

  await buildLibrary();

  els.statTracks.textContent = state.library.length;
  els.statCategories.textContent = Object.keys(CATEGORY_META).length;

  renderCategories();
  renderFilterChips();
  renderLibraryList();
  renderFavoritesSection();
  renderFavoritesPanel();
  renderRecentPanel();
  initMiniPlayerScroll();

  if (state.usingDemo) {
    toast("Showing a demo library — add playlist URLs and an API key in script.js to go live.");
  }
}

document.addEventListener("DOMContentLoaded", init);
// If the YouTube iframe API script loads after this file, the callback above still fires it.
