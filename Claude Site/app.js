/* =============================================
   TDeepMusic — app.js (v2)
   ============================================= */

// ── Dados ────────────────────────────────────────
const TRACKS = [
    { name:"Timothy's Lament",  artist:"O Profundo ft. Timothy", album:"Profundezas Vol. 1", dur:"3:47", sec:227, thumb:"🐙", bg:"linear-gradient(135deg,#0c4a6e,#06b6d4)" },
    { name:"Ocean Man Cover",   artist:"O Profundo",             album:"Single",             dur:"2:58", sec:178, thumb:"🌊", bg:"linear-gradient(135deg,#1e3a5f,#0ea5e9)" },
    { name:"Dolphin Song",      artist:"O Profundo e Amigos",    album:"Profundezas Vol. 2", dur:"4:12", sec:252, thumb:"🐬", bg:"linear-gradient(135deg,#312e81,#6366f1)" },
    { name:"Deep Dark Waters",  artist:"Seven Records",          album:"The Seven Soundtrack",dur:"5:03", sec:303, thumb:"🦑", bg:"linear-gradient(135deg,#064e3b,#10b981)" },
    { name:"Vought Anthems",    artist:"Vought Int. Music",      album:"Propaganda",         dur:"3:21", sec:201, thumb:"🪼", bg:"linear-gradient(135deg,#7c2d12,#f97316)" },
];

const PALETTE = ["#06b6d4","#0ea5e9","#7c3aed","#0891b2","#10b981","#f97316","#ec4899","#eab308"];

// ── Playlists (state) ───────────────────────────
let playlists = [
    { id:0, name:"Profundezas",          color:"#06b6d4", emoji:"🌊" },
    { id:1, name:"Oceano Escuro",         color:"#0ea5e9", emoji:"🌌" },
    { id:2, name:"Lamentos de Timothy",  color:"#7c3aed", emoji:"🐙" },
    { id:3, name:"Golfinhos e Fins",     color:"#0891b2", emoji:"🐬" },
];
let nextPlId = 4;

// ── Músicas importadas ──────────────────────────
let importedTracks = [];

// ── Player state ────────────────────────────────
const state = {
    cur:      0,
    playing:  false,
    shuffle:  false,
    repeat:   false,
    liked:    false,
    progress: 0,
    interval: null,
    volume:   80,
};

// ── Refs ─────────────────────────────────────────
const $ = id => document.getElementById(id);

const pThumb   = $("p-thumb");
const pName    = $("p-name");
const pArtist  = $("p-artist");
const pLike    = $("p-like");
const btnPlay  = $("btn-play");
const playIcon = $("play-icon");
const btnPrev  = $("btn-prev");
const btnNext  = $("btn-next");
const btnShuf  = $("btn-shuffle");
const btnRep   = $("btn-repeat");
const pbarFill = $("pbar-fill");
const pbarDot  = $("pbar-dot");
const pbar     = $("pbar");
const ptimeCur = $("ptime-cur");
const ptimeTot = $("ptime-tot");
const discImg  = $("disc-img");
const heroPlay = $("hero-play");
const volSlider= $("vol-slider");
const searchInput  = $("search-input");
const searchResults= $("search-results");
const searchClear  = $("search-clear");
const addPlBtn = $("add-playlist-btn");
const plList   = $("playlist-list");
const modalPl  = $("modal-playlist");
const plNameIn = $("pl-name-input");
const plCreate = $("pl-create-btn");

// ── Utils ────────────────────────────────────────
function fmt(s) {
    const m = Math.floor(s/60), sec = Math.floor(s%60);
    return `${m}:${sec.toString().padStart(2,"0")}`;
}

// ── Player ───────────────────────────────────────
function loadTrack(i) {
    state.cur = i;
    state.progress = 0;
    const t = TRACKS[i];
    pName.textContent   = t.name;
    pArtist.textContent = t.artist;
    pThumb.textContent  = t.thumb;
    pThumb.style.background = t.bg;
    ptimeTot.textContent = t.dur;
    ptimeCur.textContent = "0:00";
    updatePbar(0);
    highlightTrack(i);
}

function updatePbar(s) {
    const t = TRACKS[state.cur];
    const pct = Math.min((s / t.sec) * 100, 100);
    pbarFill.style.width = pct + "%";
    pbarDot.style.left   = pct + "%";
    ptimeCur.textContent = fmt(s);
}

function play() {
    state.playing = true;
    playIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
    if (discImg) discImg.classList.add("spinning");
    clearInterval(state.interval);
    state.interval = setInterval(() => {
        state.progress++;
        const t = TRACKS[state.cur];
        if (state.progress >= t.sec) {
            if (state.repeat) { state.progress = 0; }
            else { nextTrack(); return; }
        }
        updatePbar(state.progress);
    }, 1000);
}

function pause() {
    state.playing = false;
    playIcon.innerHTML = `<path d="M8 5v14l11-7z"/>`;
    if (discImg) discImg.classList.remove("spinning");
    clearInterval(state.interval);
}

function togglePlay() { state.playing ? pause() : play(); }

function nextTrack() {
    let n;
    if (state.shuffle) {
        do { n = Math.floor(Math.random() * TRACKS.length); } while (n === state.cur && TRACKS.length > 1);
    } else {
        n = (state.cur + 1) % TRACKS.length;
    }
    loadTrack(n);
    if (state.playing) play();
}

function prevTrack() {
    if (state.progress > 3) { state.progress = 0; updatePbar(0); return; }
    const p = (state.cur - 1 + TRACKS.length) % TRACKS.length;
    loadTrack(p);
    if (state.playing) play();
}

function highlightTrack(i) {
    document.querySelectorAll(".track").forEach((el, idx) => el.classList.toggle("playing", idx === i));
}

// ── Player events ────────────────────────────────
btnPlay.addEventListener("click", togglePlay);
btnNext.addEventListener("click", nextTrack);
btnPrev.addEventListener("click", prevTrack);
heroPlay?.addEventListener("click", () => { loadTrack(0); play(); });

btnShuf.addEventListener("click", () => {
    state.shuffle = !state.shuffle;
    btnShuf.classList.toggle("active", state.shuffle);
});
btnRep.addEventListener("click", () => {
    state.repeat = !state.repeat;
    btnRep.classList.toggle("active", state.repeat);
});
pLike.addEventListener("click", () => {
    state.liked = !state.liked;
    pLike.classList.toggle("liked", state.liked);
});

pbar.addEventListener("click", e => {
    const rect = pbar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    state.progress = Math.floor(pct * TRACKS[state.cur].sec);
    updatePbar(state.progress);
});

// Cards
document.querySelectorAll(".card").forEach(el => {
    el.addEventListener("click", e => {
        const i = parseInt(el.dataset.track);
        if (!isNaN(i)) { loadTrack(i); play(); }
    });
});
// Card play buttons (stop propagation to avoid double-firing)
document.querySelectorAll(".card-play").forEach(btn => {
    btn.addEventListener("click", e => {
        e.stopPropagation();
        const i = parseInt(btn.closest(".card").dataset.track);
        if (!isNaN(i)) { loadTrack(i); play(); }
    });
});
// Track rows
document.querySelectorAll(".track").forEach(el => {
    el.addEventListener("click", () => {
        const i = parseInt(el.dataset.track);
        if (!isNaN(i)) { loadTrack(i); play(); }
    });
});

// Volume
volSlider.addEventListener("input", e => {
    state.volume = e.target.value;
    const pct = state.volume;
    volSlider.style.background = `linear-gradient(to right, var(--acc) ${pct}%, var(--bg-h) ${pct}%)`;
});
volSlider.dispatchEvent(new Event("input"));

// ── Navegação de páginas ─────────────────────────
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const target = document.getElementById("page-" + pageId);
    if (target) { target.classList.add("active"); target.style.animation = "none"; requestAnimationFrame(() => { target.style.animation = ""; }); }
    document.querySelectorAll(".nav-item").forEach(li => li.classList.toggle("active", li.dataset.page === pageId));
}

document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => showPage(item.dataset.page));
});

// ── Barra de Busca ───────────────────────────────
searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    searchClear.classList.toggle("visible", q.length > 0);
    if (!q) { searchResults.classList.remove("open"); return; }

    const hits = TRACKS.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q)
    );

    if (hits.length === 0) {
        searchResults.innerHTML = `<div class="sr-none">Nenhum resultado para "<strong>${q}</strong>"</div>`;
    } else {
        searchResults.innerHTML = hits.map(t => `
            <div class="sr-item" data-track="${TRACKS.indexOf(t)}">
                <div class="sr-thumb" style="background:${t.bg}">${t.thumb}</div>
                <div class="sr-info">
                    <div class="sr-name">${t.name}</div>
                    <div class="sr-artist">${t.artist}</div>
                </div>
            </div>
        `).join("");

        searchResults.querySelectorAll(".sr-item").forEach(el => {
            el.addEventListener("click", () => {
                const i = parseInt(el.dataset.track);
                loadTrack(i);
                play();
                closeSearch();
                showPage("home");
            });
        });
    }
    searchResults.classList.add("open");
});

searchClear.addEventListener("click", closeSearch);

function closeSearch() {
    searchInput.value = "";
    searchResults.classList.remove("open");
    searchClear.classList.remove("visible");
}

document.addEventListener("click", e => {
    if (!e.target.closest(".search-wrap")) closeSearch();
});

// ── Playlists ────────────────────────────────────
let selectedEmoji = "🎵";
let selectedColor = PALETTE[0];

function renderPlaylists() {
    plList.innerHTML = playlists.map(pl => `
        <li class="playlist-item" data-id="${pl.id}">
            <div class="playlist-dot" style="--c:${pl.color}"></div>
            <span class="pl-name">${pl.emoji} ${pl.name}</span>
            <button class="pl-opts" data-id="${pl.id}">···</button>
        </li>
    `).join("");

    // bind delete on ··· click
    plList.querySelectorAll(".pl-opts").forEach(btn => {
        btn.addEventListener("click", e => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            if (confirm("Remover playlist?")) {
                playlists = playlists.filter(p => p.id !== id);
                renderPlaylists();
            }
        });
    });
}

addPlBtn.addEventListener("click", () => {
    plNameIn.value = "";
    selectedEmoji = "🎵";
    selectedColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    document.querySelectorAll(".emoji-opt").forEach(b => b.classList.toggle("active", b.dataset.emoji === selectedEmoji));
    openModal("modal-playlist");
});

document.querySelectorAll(".emoji-opt").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".emoji-opt").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedEmoji = btn.dataset.emoji;
    });
});

plCreate.addEventListener("click", () => {
    const name = plNameIn.value.trim();
    if (!name) { plNameIn.focus(); plNameIn.style.borderColor = "#f87171"; return; }
    plNameIn.style.borderColor = "";
    playlists.push({ id: nextPlId++, name, emoji: selectedEmoji, color: selectedColor });
    renderPlaylists();
    closeModal("modal-playlist");
});

// ── Modais ───────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

document.querySelectorAll(".modal-close, [data-modal]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.modal || btn.closest(".modal-overlay").id));
});
document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(overlay.id); });
});

// ── Import page ──────────────────────────────────
let currentPlatform = "youtube";

const platformHints = {
    youtube:    { icon:"▶", text:"Cole um link do YouTube (ex: youtube.com/watch?v=...)" },
    soundcloud: { icon:"☁", text:"Cole um link do SoundCloud (ex: soundcloud.com/artist/track)" },
    spotify:    { icon:"♪", text:"Cole um link do Spotify (ex: open.spotify.com/track/...)" },
};

const platformColors = {
    youtube:    "#ff4444",
    soundcloud: "#ff5500",
    spotify:    "#1db954",
};

document.querySelectorAll(".ptab").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".ptab").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentPlatform = btn.dataset.platform;
        const h = platformHints[currentPlatform];
        $("hint-icon").textContent = h.icon;
        $("hint-text").textContent = h.text;
        $("import-url").value = "";
        $("import-preview").style.display = "none";
    });
});

$("import-btn").addEventListener("click", () => {
    const url = $("import-url").value.trim();
    if (!url) { $("import-url").style.borderColor = "#f87171"; return; }
    $("import-url").style.borderColor = "";

    // Simula resposta de scraper (placeholder até rota real)
    const mock = getMockTrack(url, currentPlatform);
    showPreview(mock);
});

$("import-url").addEventListener("input", () => {
    $("import-url").style.borderColor = "";
    $("import-preview").style.display = "none";
});

function getMockTrack(url, platform) {
    const emojis = ["🎵","🎶","🎸","🥁","🎹","🎺","🎻"];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const bgs = ["linear-gradient(135deg,#0c4a6e,#06b6d4)","linear-gradient(135deg,#312e81,#6366f1)","linear-gradient(135deg,#064e3b,#10b981)"];
    return {
        title:    `Faixa Importada (${platform})`,
        artist:   "Artista Desconhecido",
        platform: platform,
        emoji:    emoji,
        bg:       bgs[Math.floor(Math.random() * bgs.length)],
        url:      url,
    };
}

function showPreview(track) {
    $("preview-thumb").textContent  = track.emoji;
    $("preview-thumb").style.background = track.bg;
    $("preview-title").textContent  = track.title;
    $("preview-artist").textContent = track.artist;
    $("preview-platform").textContent = track.platform.charAt(0).toUpperCase() + track.platform.slice(1);
    $("import-preview").style.display = "block";

    $("preview-add").onclick = () => {
        importedTracks.push(track);
        renderImported();
        $("import-preview").style.display = "none";
        $("import-url").value = "";
    };
}

function renderImported() {
    const container = $("imported-tracks");
    const empty     = $("empty-imported");
    if (importedTracks.length === 0) {
        container.innerHTML = "";
        empty.style.display = "block";
        return;
    }
    empty.style.display = "none";
    container.innerHTML = importedTracks.map((t, i) => `
        <div class="imp-track">
            <div class="imp-thumb" style="background:${t.bg}">${t.emoji}</div>
            <div class="imp-info">
                <div class="imp-title">${t.title}</div>
                <div class="imp-artist">${t.artist}</div>
            </div>
            <span class="imp-badge ${t.platform === 'youtube' ? 'yt' : t.platform === 'soundcloud' ? 'sc' : 'sp'}">
                ${t.platform === 'youtube' ? 'YT' : t.platform === 'soundcloud' ? 'SC' : 'SP'}
            </span>
            <button class="imp-del" data-idx="${i}" title="Remover">✕</button>
        </div>
    `).join("");

    container.querySelectorAll(".imp-del").forEach(btn => {
        btn.addEventListener("click", e => {
            e.stopPropagation();
            importedTracks.splice(parseInt(btn.dataset.idx), 1);
            renderImported();
        });
    });
}

// ── Init ─────────────────────────────────────────
loadTrack(0);
renderPlaylists();
renderImported();