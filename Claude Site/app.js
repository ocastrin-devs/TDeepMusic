/* =============================================
   TDeepMusic — app.js (v4)
   ============================================= */
import { fetchTrack } from "./scrapers.js";

// ── Dados locais ─────────────────────────────────
const TRACKS = [
    { name:"Timothy's Lament",  artist:"O Profundo ft. Timothy", album:"Profundezas Vol. 1", dur:"3:47", sec:227, thumb:"🐙", bg:"linear-gradient(135deg,#0c4a6e,#06b6d4)" },
    { name:"Ocean Man Cover",   artist:"O Profundo",             album:"Single",             dur:"2:58", sec:178, thumb:"🌊", bg:"linear-gradient(135deg,#1e3a5f,#0ea5e9)" },
    { name:"Dolphin Song",      artist:"O Profundo e Amigos",    album:"Profundezas Vol. 2", dur:"4:12", sec:252, thumb:"🐬", bg:"linear-gradient(135deg,#312e81,#6366f1)" },
    { name:"Deep Dark Waters",  artist:"Seven Records",          album:"The Seven Soundtrack",dur:"5:03", sec:303, thumb:"🦑", bg:"linear-gradient(135deg,#064e3b,#10b981)" },
    { name:"Vought Anthems",    artist:"Vought Int. Music",      album:"Propaganda",         dur:"3:21", sec:201, thumb:"🪼", bg:"linear-gradient(135deg,#7c2d12,#f97316)" },
];

const PALETTE = ["#06b6d4","#0ea5e9","#7c3aed","#0891b2","#10b981","#f97316","#ec4899","#eab308"];

// ── State ────────────────────────────────────────
let playlists = [
    { id:0, name:"Profundezas",         color:"#06b6d4", emoji:"🌊" },
    { id:1, name:"Oceano Escuro",        color:"#0ea5e9", emoji:"🌌" },
    { id:2, name:"Lamentos de Timothy", color:"#7c3aed", emoji:"🐙" },
    { id:3, name:"Golfinhos e Fins",    color:"#0891b2", emoji:"🐬" },
];
let nextPlId = 4;
let importedTracks = [];

const player = {
    cur:      0,
    playing:  false,
    shuffle:  false,
    repeat:   false,
    liked:    false,
    progress: 0,
    interval: null,
    // faixa importada ativa (null = nenhuma)
    importedActive: null,
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
const searchInput   = $("search-input");
const searchResults = $("search-results");
const searchClear   = $("search-clear");
const addPlBtn = $("add-playlist-btn");
const plList   = $("playlist-list");
const modalPl  = $("modal-playlist");
const plNameIn = $("pl-name-input");
const plCreate = $("pl-create-btn");

// ── Iframes de playback ───────────────────────────
const ytIframe = $("yt-player");
const scIframe = $("sc-player");
const ytWrap   = $("yt-iframe-wrap");

// ── Áudio (fallback para dlUrl direto) ───────────
const audio = new Audio();
audio.volume = 0.8;

// ── Utils ────────────────────────────────────────
const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Extrai ID do YouTube da URL ──────────────────
function extractYoutubeId(url) {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

// ── Para todo playback externo ───────────────────
function stopExternalPlayback() {
    // Para YouTube (seta src vazio)
    if (ytIframe) {
        ytIframe.src = "";
        ytIframe.style.display = "none";
    }
    if (ytWrap) ytWrap.style.width = "0";

    // Para SoundCloud
    if (scIframe) scIframe.src = "";

    // Para Audio direto
    audio.pause();
    audio.src = "";

    player.importedActive = null;
}

// ══════════════════════════════════════════════════
//   PLAYER (faixas locais — simulado)
// ══════════════════════════════════════════════════
function loadTrack(i) {
    stopExternalPlayback();
    player.cur = i;
    player.progress = 0;
    const t = TRACKS[i];
    pName.textContent    = t.name;
    pArtist.textContent  = t.artist;
    pThumb.textContent   = t.thumb;
    pThumb.style.background = t.bg;
    pThumb.style.backgroundImage = "";
    ptimeTot.textContent = t.dur;
    ptimeCur.textContent = "0:00";
    updatePbar(0);
    highlightTrack(i);
}

function loadImportedTrack(track) {
    pName.textContent   = track.title;
    pArtist.textContent = track.artist;
    pThumb.textContent  = "";
    pThumb.style.background = "var(--bg-e)";
    if (track.thumb) {
        pThumb.style.backgroundImage = `url(${track.thumb})`;
        pThumb.style.backgroundSize  = "cover";
        pThumb.style.backgroundPosition = "center";
    } else {
        pThumb.textContent = track.emoji;
    }
    ptimeTot.textContent = "--:--";
    ptimeCur.textContent = "0:00";
    player.progress = 0;
    updatePbar(0);
    highlightTrack(-1);
    player.importedActive = track;
}

function updatePbar(s) {
    const t = TRACKS[player.cur];
    const total = t?.sec || 1;
    const pct = Math.min((s / total) * 100, 100);
    pbarFill.style.width = pct + "%";
    pbarDot.style.left   = pct + "%";
    ptimeCur.textContent = fmt(s);
}

function setPlayingUI(playing) {
    player.playing = playing;
    playIcon.innerHTML = playing
        ? `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`
        : `<path d="M8 5v14l11-7z"/>`;
    if (discImg) discImg.classList.toggle("spinning", playing);
}

function play() {
    setPlayingUI(true);
    clearInterval(player.interval);
    // Se há faixa importada ativa, não avança o timer local
    if (player.importedActive) return;
    player.interval = setInterval(() => {
        player.progress++;
        const t = TRACKS[player.cur];
        if (!t) return;
        if (player.progress >= t.sec) {
            if (player.repeat) { player.progress = 0; }
            else { nextTrack(); return; }
        }
        updatePbar(player.progress);
    }, 1000);
}

function pause() {
    setPlayingUI(false);
    clearInterval(player.interval);
    // Pausa playback externo se houver
    if (player.importedActive) {
        const track = player.importedActive;
        if (track.platform === "youtube" && ytIframe) {
            // postMessage para pausar o player do YT
            ytIframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
        if (track.platform === "soundcloud" && scIframe) {
            scIframe.contentWindow?.postMessage(JSON.stringify({ method: "pause" }), '*');
        }
        audio.pause();
    }
}

function togglePlay() {
    if (player.playing) {
        pause();
    } else {
        if (player.importedActive) {
            // Retoma playback externo
            const track = player.importedActive;
            if (track.platform === "youtube" && ytIframe) {
                ytIframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            }
            if (track.platform === "soundcloud" && scIframe) {
                scIframe.contentWindow?.postMessage(JSON.stringify({ method: "play" }), '*');
            }
            if (track.platform === "spotify") {
                audio.play().catch(() => {});
            }
            setPlayingUI(true);
        } else {
            play();
        }
    }
}

function nextTrack() {
    let n;
    if (player.shuffle) {
        do { n = Math.floor(Math.random() * TRACKS.length); } while (n === player.cur && TRACKS.length > 1);
    } else {
        n = (player.cur + 1) % TRACKS.length;
    }
    loadTrack(n);
    if (player.playing) play();
}

function prevTrack() {
    if (player.importedActive) {
        stopExternalPlayback();
        setPlayingUI(false);
        return;
    }
    if (player.progress > 3) { player.progress = 0; updatePbar(0); return; }
    const p = (player.cur - 1 + TRACKS.length) % TRACKS.length;
    loadTrack(p);
    if (player.playing) play();
}

function highlightTrack(i) {
    document.querySelectorAll(".track").forEach((el, idx) => el.classList.toggle("playing", idx === i));
}

// ── Playback de faixas importadas ────────────────
function playImported(track) {
    stopExternalPlayback();
    loadImportedTrack(track);

    if (track.platform === "youtube") {
        const videoId = extractYoutubeId(track.originalUrl);
        if (videoId && ytIframe) {
            // enablejsapi=1 permite controle via postMessage
            ytIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
            ytIframe.style.display = "block";
            // Mostra o mini player no canto
            if (ytWrap) ytWrap.style.width = "320px";
            setPlayingUI(true);
        } else {
            showToast("Não foi possível extrair o ID do vídeo.");
        }

    } else if (track.platform === "soundcloud") {
        if (scIframe) {
            // Widget do SoundCloud com autoplay
            const scUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(track.originalUrl)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false`;
            scIframe.src = scUrl;
            setPlayingUI(true);
        }

    } else if (track.platform === "spotify") {
        // Spotify não permite autoplay via iframe sem login
        // Tenta dlUrl se disponível, senão abre no Spotify
        if (track.dlUrl) {
            audio.src = track.dlUrl;
            audio.play()
                .then(() => setPlayingUI(true))
                .catch(() => {
                    showToast("Spotify não permite autoplay. Abrindo no Spotify...");
                    window.open(track.originalUrl, "_blank");
                });
        } else {
            showToast("Spotify requer login para tocar. Abrindo no Spotify...");
            window.open(track.originalUrl, "_blank");
            loadImportedTrack(track);
        }
    }
}

// ── Player events ────────────────────────────────
btnPlay.addEventListener("click", togglePlay);
btnNext.addEventListener("click", nextTrack);
btnPrev.addEventListener("click", prevTrack);
heroPlay?.addEventListener("click", () => { loadTrack(0); play(); });

btnShuf.addEventListener("click", () => {
    player.shuffle = !player.shuffle;
    btnShuf.classList.toggle("active", player.shuffle);
});
btnRep.addEventListener("click", () => {
    player.repeat = !player.repeat;
    btnRep.classList.toggle("active", player.repeat);
});
pLike.addEventListener("click", () => {
    player.liked = !player.liked;
    pLike.classList.toggle("liked", player.liked);
});

pbar.addEventListener("click", e => {
    const rect = pbar.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    player.progress = Math.floor(pct * (TRACKS[player.cur]?.sec || 100));
    updatePbar(player.progress);
});

// Cards e tracks
document.querySelectorAll(".card").forEach(el => {
    el.addEventListener("click", () => {
        const i = parseInt(el.dataset.track);
        if (!isNaN(i)) { loadTrack(i); play(); }
    });
});
document.querySelectorAll(".card-play").forEach(btn => {
    btn.addEventListener("click", e => {
        e.stopPropagation();
        const i = parseInt(btn.closest(".card").dataset.track);
        if (!isNaN(i)) { loadTrack(i); play(); }
    });
});
document.querySelectorAll(".track").forEach(el => {
    el.addEventListener("click", () => {
        const i = parseInt(el.dataset.track);
        if (!isNaN(i)) { loadTrack(i); play(); }
    });
});

// Volume
volSlider.addEventListener("input", e => {
    const pct = e.target.value;
    audio.volume = pct / 100;
    volSlider.style.background = `linear-gradient(to right, var(--acc) ${pct}%, var(--bg-h) ${pct}%)`;
});
volSlider.dispatchEvent(new Event("input"));

// ══════════════════════════════════════════════════
//   NAVEGAÇÃO
// ══════════════════════════════════════════════════
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const target = $("page-" + pageId);
    if (target) {
        target.classList.add("active");
        target.style.animation = "none";
        requestAnimationFrame(() => { target.style.animation = ""; });
    }
    document.querySelectorAll(".nav-item").forEach(li => li.classList.toggle("active", li.dataset.page === pageId));
}

document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => showPage(item.dataset.page));
});

// ══════════════════════════════════════════════════
//   BUSCA
// ══════════════════════════════════════════════════
searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    searchClear.classList.toggle("visible", q.length > 0);
    if (!q) { searchResults.classList.remove("open"); return; }

    const hits = TRACKS.filter(t =>
        t.name.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );

    if (!hits.length) {
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
                loadTrack(parseInt(el.dataset.track));
                play();
                closeSearch();
                showPage("home");
            });
        });
    }
    searchResults.classList.add("open");
});

searchClear.addEventListener("click", closeSearch);
document.addEventListener("click", e => { if (!e.target.closest(".search-wrap")) closeSearch(); });

function closeSearch() {
    searchInput.value = "";
    searchResults.classList.remove("open");
    searchClear.classList.remove("visible");
}

// ══════════════════════════════════════════════════
//   PLAYLISTS
// ══════════════════════════════════════════════════
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
    plList.querySelectorAll(".pl-opts").forEach(btn => {
        btn.addEventListener("click", e => {
            e.stopPropagation();
            if (confirm("Remover playlist?")) {
                playlists = playlists.filter(p => p.id !== parseInt(btn.dataset.id));
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

// ══════════════════════════════════════════════════
//   MODAIS
// ══════════════════════════════════════════════════
function openModal(id)  { $(id).classList.add("open"); }
function closeModal(id) { $(id).classList.remove("open"); }

document.querySelectorAll(".modal-close, [data-modal]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.modal || btn.closest(".modal-overlay").id));
});
document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(overlay.id); });
});

// ── Toast ─────────────────────────────────────────
function showToast(msg, duration = 3000) {
    const toast = $("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), duration);
}

// ══════════════════════════════════════════════════
//   IMPORT PAGE — scrapers reais
// ══════════════════════════════════════════════════
const platformHints = {
    youtube:    { icon:"▶", text:"Cole um link do YouTube (ex: youtube.com/watch?v=...)" },
    soundcloud: { icon:"☁", text:"Cole um link do SoundCloud (ex: soundcloud.com/artist/track)" },
    spotify:    { icon:"♫", text:"Cole um link do Spotify (ex: open.spotify.com/track/...)" },
};

let currentPlatform = "youtube";
let currentPreview  = null;

// Tabs de plataforma
document.querySelectorAll(".ptab").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".ptab").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentPlatform = btn.dataset.platform;
        const h = platformHints[currentPlatform];
        $("hint-icon").textContent = h.icon;
        $("hint-text").textContent = h.text;
        $("import-url").value = "";
        hidePreview();
        hideError();
    });
});

// Colar da área de transferência
$("import-paste")?.addEventListener("click", async () => {
    try {
        const text = await navigator.clipboard.readText();
        $("import-url").value = text;
    } catch {
        // sem permissão — ignora silenciosamente
    }
});

// Botão importar
$("import-btn").addEventListener("click", doImport);
$("import-url").addEventListener("keydown", e => { if (e.key === "Enter") doImport(); });

async function doImport() {
    const url = $("import-url").value.trim();
    if (!url) {
        $("import-url").style.borderColor = "#f87171";
        return;
    }
    $("import-url").style.borderColor = "";

    hidePreview();
    hideError();
    showLoading("Conectando ao serviço...");
    $("import-btn").disabled = true;

    try {
        const statuses = [
            "Buscando informações da faixa...",
            "Analisando metadados...",
            "Carregando capa e título...",
            "Quase lá...",
        ];
        let si = 0;
        const statusInterval = setInterval(() => {
            si = (si + 1) % statuses.length;
            const el = $("loading-text");
            if (el) el.textContent = statuses[si];
        }, 2500);

        const result = await fetchTrack(url);
        clearInterval(statusInterval);

        currentPreview = result;
        hideLoading();
        showPreview(result);

    } catch (err) {
        hideLoading();
        showError(err.message || "Erro ao buscar a faixa. Verifique o link e tente novamente.");
    } finally {
        $("import-btn").disabled = false;
    }
}

function showLoading(text) {
    const el = $("import-loading");
    const txt = $("loading-text");
    if (txt) txt.textContent = text;
    if (el) el.style.display = "flex";
}
function hideLoading() {
    const el = $("import-loading");
    if (el) el.style.display = "none";
}
function showError(msg) {
    const el = $("import-error");
    const txt = $("error-text");
    if (txt) txt.textContent = msg;
    if (el) el.style.display = "flex";
}
function hideError() {
    const el = $("import-error");
    if (el) el.style.display = "none";
}
function hidePreview() {
    const el = $("import-preview");
    if (el) el.style.display = "none";
}

function showPreview(track) {
    const cover    = $("ipb-cover");
    const fallback = $("ipb-cover-fallback");
    const badge    = $("ipb-badge");
    const title    = $("ipb-title");
    const artist   = $("ipb-artist");
    const quality  = $("ipb-quality");
    const dlLink   = $("ipb-dl-link");

    // Capa
    if (track.thumb) {
        cover.src = track.thumb;
        cover.style.display = "block";
        fallback.style.display = "none";
    } else {
        cover.style.display = "none";
        fallback.style.display = "flex";
        fallback.textContent = track.emoji;
    }

    // Badge de plataforma
    const badgeMap = { youtube:"yt", soundcloud:"sc", spotify:"sp" };
    const badgeTxt = { youtube:"YT", soundcloud:"SC", spotify:"SP" };
    badge.className = `ipb-badge ${badgeMap[track.platform] || ""}`;
    badge.textContent = badgeTxt[track.platform] || track.platform.toUpperCase();

    title.textContent  = track.title;
    artist.textContent = track.artist;

    // Qualidade / disponibilidade
    if (track.platform === "youtube") {
        quality.textContent = "reprodução via YouTube";
        dlLink.style.display = "none";
    } else if (track.platform === "soundcloud") {
        quality.textContent = "reprodução via SoundCloud";
        dlLink.style.display = "none";
    } else if (track.dlUrl) {
        dlLink.href = track.dlUrl;
        dlLink.style.display = "inline-flex";
        quality.textContent = "download disponível";
    } else {
        dlLink.style.display = "none";
        quality.textContent = "abre no Spotify";
    }

    $("import-preview").style.display = "flex";

    // Botão de play da preview
    $("ipb-play-preview").onclick = () => {
        playImported(track);
    };
}

// Adicionar à biblioteca
$("preview-add")?.addEventListener("click", () => {
    if (!currentPreview) return;
    importedTracks.unshift({ ...currentPreview });
    renderImported();
    hidePreview();
    $("import-url").value = "";
    currentPreview = null;
});

function renderImported() {
    const container = $("imported-tracks");
    const empty     = $("empty-imported");
    const count     = $("imported-count");

    count.textContent = importedTracks.length === 1
        ? "1 faixa"
        : `${importedTracks.length} faixas`;

    if (!importedTracks.length) {
        container.innerHTML = "";
        if (empty) empty.style.display = "flex";
        return;
    }
    if (empty) empty.style.display = "none";

    const badgeMap = { youtube:"yt", soundcloud:"sc", spotify:"sp" };
    const badgeTxt = { youtube:"YT", soundcloud:"SC", spotify:"SP" };

    container.innerHTML = importedTracks.map((t, i) => `
        <div class="imp-track" data-idx="${i}">
            <div class="imp-thumb-wrap">
                ${t.thumb
                    ? `<img src="${t.thumb}" alt="capa" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                    : ""}
                <div class="imp-thumb-emoji" style="${t.thumb ? "display:none" : ""}">${t.emoji}</div>
            </div>
            <div class="imp-info">
                <div class="imp-title">${t.title}</div>
                <div class="imp-artist">${t.artist}</div>
            </div>
            <span class="imp-badge ${badgeMap[t.platform] || ""}">${badgeTxt[t.platform] || "?"}</span>
            <button class="imp-del" data-idx="${i}" title="Remover">✕</button>
        </div>
    `).join("");

    // Clicar na faixa → tocar
    container.querySelectorAll(".imp-track").forEach(el => {
        el.addEventListener("click", e => {
            if (e.target.classList.contains("imp-del")) return;
            const i = parseInt(el.dataset.idx);
            playImported(importedTracks[i]);
        });
    });

    // Deletar
    container.querySelectorAll(".imp-del").forEach(btn => {
        btn.addEventListener("click", e => {
            e.stopPropagation();
            importedTracks.splice(parseInt(btn.dataset.idx), 1);
            renderImported();
        });
    });
}

// ══════════════════════════════════════════════════
//   INIT
// ══════════════════════════════════════════════════
loadTrack(0);
renderPlaylists();
renderImported();