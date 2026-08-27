/* Jarvis — käyttöliittymän logiikka.
   HUOM: täällä ei ole eikä saa olla yhtään API-avainta.
   Kaikki avaimet asuvat backendissä (/api/chat). */

const API = "/api/chat";

const log       = document.getElementById("log");
const composer  = document.getElementById("composer");
const input     = document.getElementById("input");
const send      = document.getElementById("send");
const link      = document.getElementById("link");
const orb       = document.getElementById("orb");
const orbState  = document.getElementById("orbState");
const voiceBtn  = document.getElementById("voiceToggle");
const micBtn    = document.getElementById("mic");

/* Koko keskustelu pidetään muistissa ja lähetetään joka kerta,
   koska mallilla ei ole omaa muistia pyyntöjen välillä. */
let history = [];
let busy = false;

/* ---------- Apureita ---------- */

function clock() {
  return new Date().toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });
}

function toBottom() {
  log.scrollTop = log.scrollHeight;
}

function addTurn(who, text, kind) {
  const el = document.createElement("div");
  el.className = "turn turn--" + (kind || who);

  const meta = document.createElement("div");
  meta.className = "turn__meta";
  meta.innerHTML = "<span>" + who + "</span><span>" + clock() + "</span>";

  const body = document.createElement("p");
  body.className = "turn__body";
  body.textContent = text;

  el.append(meta, body);
  log.append(el);
  toBottom();
  return body;
}

function addWait() {
  const el = document.createElement("div");
  el.className = "turn turn--bot";
  el.id = "wait";
  el.innerHTML = '<div class="turn__meta"><span>Jarvis</span></div>' +
                 '<div class="wait"><span></span><span></span><span></span></div>';
  log.append(el);
  toBottom();
}

function dropWait() {
  const w = document.getElementById("wait");
  if (w) w.remove();
}

function setLink(state, text) {
  link.dataset.state = state;
  link.querySelector(".link__text").textContent = text;
}

/* ---------- Orbi: kertoo mitä Jarvis parhaillaan tekee ---------- */

const ORB_LABEL = {
  idle:      "valmiina",
  thinking:  "ajattelee",
  speaking:  "puhuu",
  listening: "kuuntelee",
  down:      "ei yhteyttä"
};

const HERO_LABEL = {
  idle:      "VALMIINA",
  thinking:  "AJATTELEE",
  speaking:  "PUHUU",
  listening: "KUUNTELEE",
  down:      "EI YHTEYTTÄ"
};

const heroOrb  = document.getElementById("heroOrb");
const standby  = document.getElementById("standby");
const heroLbl  = document.getElementById("heroLabel");

function setOrb(state) {
  orb.dataset.state = state;
  orbState.textContent = ORB_LABEL[state] || state;

  heroOrb.dataset.state = state;
  standby.dataset.state = state;
  standby.dataset.active = String(state === "speaking" || state === "listening");
  heroLbl.textContent = HERO_LABEL[state] || state;
}

/* Piirtaa kellomerkkeja muistuttavat viivat renkaan ymparille.
   Joka kuudes merkki on pidempi, jotta kehalle syntyy rytmi. */
function drawTicks(svg) {
  const groups = svg.querySelectorAll("[data-ticks]");
  const cx = svg.viewBox.baseVal.width / 2;
  const cy = svg.viewBox.baseVal.height / 2;
  const ns = "http://www.w3.org/2000/svg";

  groups.forEach((g) => {
    const r = Number(g.dataset.r);
    const count = Number(g.dataset.count);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const long = i % 6 === 0;
      const len = long ? r * 0.10 : r * 0.055;
      const x1 = cx + Math.cos(angle) * r;
      const y1 = cy + Math.sin(angle) * r;
      const x2 = cx + Math.cos(angle) * (r - len);
      const y2 = cy + Math.sin(angle) * (r - len);

      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1", x1.toFixed(2));
      line.setAttribute("y1", y1.toFixed(2));
      line.setAttribute("x2", x2.toFixed(2));
      line.setAttribute("y2", y2.toFixed(2));
      line.setAttribute("stroke-width", long ? "2" : "1.1");
      g.appendChild(line);
    }
  });
}

document.querySelectorAll("svg").forEach((svg) => {
  if (svg.querySelector("[data-ticks]")) drawTicks(svg);
});

/* ---------- Polypisteet aloitusnaytossa ---------- */
/* Hitaasti kiertavia hiukkasia orbin ympartilla. Piirretaan canvasille,
   koska satoja DOM-elementteja ei kannata animoida. */
(function dustField() {
  const cv = document.getElementById("dust");
  const ctx = cv.getContext("2d");
  let w, h, cx, cy, motes = [], raf;

  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function seed() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.clientWidth;
    h = cv.clientHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2;
    cy = h / 2;

    const span = Math.min(w, h);
    const count = Math.round(span / 4);
    motes = [];
    for (let i = 0; i < count; i++) {
      motes.push({
        a: Math.random() * Math.PI * 2,
        r: span * (0.20 + Math.random() * 0.42),
        s: (0.00006 + Math.random() * 0.00022) * (Math.random() < 0.35 ? -1 : 1),
        d: 0.4 + Math.random() * 1.1,
        o: 0.12 + Math.random() * 0.55
      });
    }
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.a += m.s * 16;
      const x = cx + Math.cos(m.a) * m.r;
      const y = cy + Math.sin(m.a) * m.r * 0.92;
      ctx.beginPath();
      ctx.arc(x, y, m.d, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200,240,255," + m.o + ")";
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(raf);
    seed();
    if (calm) { frame(); cancelAnimationFrame(raf); return; }
    frame();
  }

  window.addEventListener("resize", start);
  start();

  // Kun aloitusnakyma on piilossa, animaatio ei kuluta akkua.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (document.body.classList.contains("is-standby")) frame();
  });
})();

/* ---------- Äänianalyysi: ydin reagoi oikeaan ääneen ---------- */

let audioCtx = null, analyser = null, freqData = null;

function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.75;
    freqData = new Uint8Array(analyser.frequencyBinCount);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

/* Hiukkaskenttä: pieniä viivoja jotka muodostavat rikkonaisia kaaria
   keskuksen ympärille. Piirretään canvasille, koska satojen hiukkasten
   pitää reagoida äänen voimakkuuteen kymmeniä kertoja sekunnissa. */
(function particleField() {
  const cv = document.getElementById("heroOrb");
  if (!cv) return;
  const ctx = cv.getContext("2d");

  let w, h, cx, cy, R, raf, t = 0;
  let clusters = [];
  let rays = [];

  const CLUSTERS = 18;
  const RAYS = 9;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function build() {
    clusters = [];
    for (let i = 0; i < CLUSTERS; i++) {
      const count = Math.round(rand(10, 46));
      const bits = [];
      for (let j = 0; j < count; j++) {
        bits.push({
          da:   rand(0, 1),                 // sijainti kaaren sisällä
          dr:   rand(-0.055, 0.055),        // säteen hajonta
          len:  rand(0.012, 0.05),          // viivan pituus
          wid:  rand(0.8, 2.3),
          tilt: rand(-0.7, 0.7),            // pieni kallistus, ettei ole liian siisti
          bri:  rand(0.25, 1)
        });
      }
      clusters.push({
        r:     rand(0.26, 0.98),
        a0:    rand(0, Math.PI * 2),
        span:  rand(0.18, 1.05),
        spin:  rand(-0.10, 0.10),
        bob:   rand(0.4, 1.6),
        phase: rand(0, Math.PI * 2),
        bits
      });
    }

    rays = [];
    for (let i = 0; i < RAYS; i++) {
      rays.push({
        a:    rand(0, Math.PI * 2),
        len:  rand(0.30, 0.72),
        wid:  rand(0.6, 1.8),
        spin: rand(-0.04, 0.04)
      });
    }
  }

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.clientWidth;
    h = cv.clientHeight;
    cv.width  = w * dpr;
    cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2;
    cy = h / 2;
    R  = Math.min(w, h) / 2;
  }

  function read() {
    const state = cv.dataset.state;
    if (analyser && state === "speaking") {
      analyser.getByteFrequencyData(freqData);
      let sum = 0;
      for (let i = 0; i < freqData.length; i++) sum += freqData[i];
      return { amp: (sum / freqData.length) / 255, bins: freqData };
    }
    let amp;
    if (state === "speaking") {
      amp = 0.38 + Math.sin(t * 5.6) * 0.24 + Math.sin(t * 9.3) * 0.09;
    } else if (state === "listening") {
      amp = 0.26 + Math.sin(t * 3.2) * 0.14;
    } else if (state === "thinking") {
      amp = 0.20 + Math.sin(t * 2.2) * 0.10;
    } else if (state === "down") {
      amp = 0.02;
    } else {
      amp = 0.13 + Math.sin(t * 0.9) * 0.06;
    }
    return { amp, bins: null };
  }

  function frame() {
    t += 0.016;
    ctx.clearRect(0, 0, w, h);

    const { amp, bins } = read();
    const state = cv.dataset.state;
    const warm = state === "listening";
    const tint = warm ? "255,205,140" : "150,238,255";
    const hot  = warm ? "255,240,220" : "235,253,255";

    const push = 1 + amp * 0.22;   // kenttä hengittää ulospäin äänen mukana
    const glow = 0.35 + amp * 0.65;

    // --- Hiukkaskaaret ---
    ctx.lineCap = "round";
    for (let ci = 0; ci < clusters.length; ci++) {
      const c = clusters[ci];
      const spin = c.a0 + t * c.spin;
      const bob  = Math.sin(t * c.bob + c.phase) * 0.012;

      for (let bi = 0; bi < c.bits.length; bi++) {
        const b = c.bits[bi];
        const a = spin + b.da * c.span;

        let v = 0;
        if (bins) v = bins[(ci * 7 + bi) % bins.length] / 255;

        const rr = (c.r + b.dr + bob + v * 0.05) * R * push;
        const x  = cx + Math.cos(a) * rr;
        const y  = cy + Math.sin(a) * rr;

        // viiva kulkee kaaren suuntaisesti, pienellä kallistuksella
        const dir = a + Math.PI / 2 + b.tilt;
        const L   = b.len * R * (1 + v * 0.9);
        const al  = Math.min(1, b.bri * (0.45 + glow * 0.8 + v * 0.5));

        ctx.strokeStyle = "rgba(" + tint + "," + al + ")";
        ctx.lineWidth = b.wid;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(dir) * L / 2, y - Math.sin(dir) * L / 2);
        ctx.lineTo(x + Math.cos(dir) * L / 2, y + Math.sin(dir) * L / 2);
        ctx.stroke();
      }
    }

    // --- Keskuksen säteet ---
    for (const ry of rays) {
      const a = ry.a + t * ry.spin;
      const L = ry.len * R * (0.55 + amp * 1.1);
      const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * L, cy + Math.sin(a) * L);
      g.addColorStop(0, "rgba(" + hot + "," + (0.75 * glow + 0.25) + ")");
      g.addColorStop(1, "rgba(" + tint + ",0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = ry.wid;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L);
      ctx.stroke();
    }

    // --- Sydän: hehkuva ydin joka sykkii ---
    const coreR = R * (0.045 + amp * 0.07);
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 6);
    cg.addColorStop(0,    "rgba(" + hot + ",1)");
    cg.addColorStop(0.18, "rgba(" + hot + ",.85)");
    cg.addColorStop(0.45, "rgba(" + tint + "," + (0.35 * glow) + ")");
    cg.addColorStop(1,    "rgba(" + tint + ",0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 6, 0, Math.PI * 2);
    ctx.fill();

    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("resize", () => { size(); });
  build();
  size();
  frame();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else { cancelAnimationFrame(raf); frame(); }
  });
})();

/* ---------- Kosketus orbiin ja kysymyslomake ---------- */

const standbyInput = document.getElementById("standbyInput");
const standbyAsk    = document.getElementById("standbyAsk");

let toggleMic = null; // asetetaan alempana jos selain aidosti tukee puheentunnistusta
let handsFree = false;

function standbyActivate() {
  ensureAudio(); // iOS vaatii kosketuksen ennen kuin ääni saa soida
  if (heroOrb.dataset.state === "speaking") {
    speechSynthesis.cancel();
    handsFree = false;
    setOrb("idle");
    return;
  }
  if (heroOrb.dataset.state === "listening") {
    handsFree = false;
    if (toggleMic) toggleMic();
    return;
  }
  if (toggleMic) {
    handsFree = true;
    toggleMic();
  } else {
    standbyInput.focus(); // iPhonella: näppäimistön oma sanelu hoitaa loput
  }
}

standby.addEventListener("click", (e) => {
  if (e.target.closest(".standby__voice") || e.target.closest(".standby__ask")) return;
  standbyActivate();
});

standby.addEventListener("keydown", (e) => {
  if (e.target.closest(".standby__voice") || e.target.closest(".standby__ask")) return;
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); standbyActivate(); }
});

standbyAsk.addEventListener("submit", (e) => {
  e.preventDefault();
  ensureAudio();
  const text = standbyInput.value.trim();
  if (!text) return;
  standbyInput.value = "";
  standbyInput.blur();
  ask(text);
});

function lock(on) {
  busy = on;
  send.disabled = on;
  input.disabled = on;
}

/* ---------- Viestin lähetys ---------- */

async function ask(text) {
  if (busy || !text.trim()) return;

  addTurn("Sinä", text, "me");
  history.push({ role: "user", content: text });

  input.value = "";
  grow();
  lock(true);
  addWait();
  setOrb("thinking");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history })
    });

    if (!res.ok) {
      let detail = "";
      try {
        const errBody = await res.json();
        detail = errBody.detail || errBody.error || "";
      } catch {
        // vastaus ei ollut JSONia — jatketaan ilman lisätietoa
      }
      throw new Error("HTTP " + res.status + (detail ? " — " + detail : ""));
    }

    const data = await res.json();
    const reply = data.reply || "(tyhjä vastaus)";

    dropWait();
    addTurn("Jarvis", reply, "bot");
    history.push({ role: "assistant", content: reply });
    setLink("live", "kytketty");
    speak(reply); // asettaa orbin itse: puhuu -> valmiina

  } catch (err) {
    dropWait();
    history.pop(); // ei jätetä vastaamatonta viestiä historiaan
    setLink("down", "ei kytketty");
    setOrb("idle");

    const body = addTurn("Ei yhteyttä", "", "error");
    body.innerHTML =
      "Backend ei vastaa osoitteessa <code>" + API + "</code>. " +
      "Näin on tarkoituskin, jos vaihe 2 on vielä tekemättä — käyttöliittymä toimii, " +
      "mutta vastausten antajaa ei vielä ole.<br><br>" +
      "Tekninen syy: <code>" + err.message + "</code>";
    toBottom();

  } finally {
    lock(false);
    input.focus();
  }
}

/* ---------- Kentän käyttäytyminen ---------- */

function grow() {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 148) + "px";
}

input.addEventListener("input", grow);

input.addEventListener("keydown", (e) => {
  // Enter lähettää, Shift+Enter tekee rivinvaihdon.
  // Puhelimissa Enter tekee aina rivinvaihdon.
  const phone = window.matchMedia("(max-width: 560px)").matches;
  if (e.key === "Enter" && !e.shiftKey && !phone) {
    e.preventDefault();
    ask(input.value);
  }
});

composer.addEventListener("submit", (e) => {
  e.preventDefault();
  ask(input.value);
});

/* ---------- Ääni: vastausten lukeminen ääneen ---------- */

let voiceOn = localStorage.getItem("jarvis-voice") === "true";

function paintVoiceBtn() {
  voiceBtn.dataset.on = String(voiceOn);
  voiceBtn.setAttribute("aria-pressed", String(voiceOn));
}
paintVoiceBtn();

voiceBtn.addEventListener("click", () => {
  voiceOn = !voiceOn;
  localStorage.setItem("jarvis-voice", String(voiceOn));
  paintVoiceBtn();
  if (!voiceOn) speechSynthesis.cancel();
});

/* Valitsee parhaan käytettävissä olevan suomenkielisen äänen.
   Äänet latautuvat asynkronisesti, joten kuunnellaan myös muutosta. */
let jarvisVoice = null;

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  const finnish = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("fi"));
  if (finnish.length === 0) { jarvisVoice = null; return; }
  // Moni järjestelmä tarjoaa vain yhden suomenkielisen äänen — jos niitä on
  // useampi, suositaan sellaista jonka nimi ei viittaa selvästi naisääneen.
  const preferred = finnish.find((v) => !/female|nainen|satu/i.test(v.name));
  jarvisVoice = preferred || finnish[0];
}

pickVoice();
if ("onvoiceschanged" in speechSynthesis) {
  speechSynthesis.onvoiceschanged = pickVoice;
}

async function speak(text) {
  if (!voiceOn) {
    setOrb("idle");
    if (handsFree && toggleMic) setTimeout(toggleMic, 300);
    return;
  }

  setOrb("speaking");

  try {
    const res = await fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    // Kytketään analysaattoriin, jotta ydin reagoi oikeaan puheeseen.
    ensureAudio();
    if (audioCtx && analyser) {
      try {
        const src = audioCtx.createMediaElementSource(audio);
        src.connect(analyser);
        analyser.connect(audioCtx.destination);
      } catch {
        // jos kytkentä ei onnistu, ääni soi silti normaalisti
      }
    }

    audio.onended = () => {
      URL.revokeObjectURL(url);
      setOrb("idle");
      if (handsFree && toggleMic) setTimeout(toggleMic, 300);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      setOrb("idle");
      if (handsFree && toggleMic) setTimeout(toggleMic, 300);
    };

    await audio.play();

  } catch (err) {
    // ElevenLabs ei vastannut (esim. kuukausikiintiö loppui) — palataan
    // puhelimen omaan ääneen, ettei Jarvis mykisty kokonaan.
    speakFallback(text);
  }
}

function speakFallback(text) {
  if (!("speechSynthesis" in window)) {
    setOrb("idle");
    if (handsFree && toggleMic) setTimeout(toggleMic, 300);
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "fi-FI";
  if (jarvisVoice) u.voice = jarvisVoice;
  u.pitch = 1.0;
  u.rate  = 0.97;
  u.onstart = () => setOrb("speaking");
  u.onend   = () => {
    setOrb("idle");
    if (handsFree && toggleMic) setTimeout(toggleMic, 300);
  };
  u.onerror = () => {
    setOrb("idle");
    if (handsFree && toggleMic) setTimeout(toggleMic, 300);
  };
  speechSynthesis.speak(u);
}

/* ---------- Ääni: puheella kysyminen ---------- */
/* Toimii Chromessa/Edgessä ja Androidilla. iPhonen Safarissa selaimen
   puheentunnistus on rajallinen, joten painike piilotetaan silloin. */

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (Recognition) {
  const rec = new Recognition();
  rec.lang = "fi-FI";
  rec.interimResults = false;
  let listening = false;

  micBtn.hidden = false;

  toggleMic = () => {
    if (listening) { rec.stop(); return; }
    speechSynthesis.cancel();
    rec.start();
  };

  micBtn.addEventListener("click", toggleMic);

  rec.onstart = () => {
    listening = true;
    micBtn.dataset.on = "true";
    setOrb("listening");
  };

  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    input.value = text;
    grow();
  };

  rec.onerror = () => {
    handsFree = false;
    setOrb("idle");
    standbyInput.focus(); // puheentunnistus ei toiminut tällä laitteella — näppäimistön sanelu toimii
  };

  rec.onend = () => {
    listening = false;
    micBtn.dataset.on = "false";
    if (input.value.trim()) {
      ask(input.value); // vastaus tulee -> speak() jatkaa kierron tarvittaessa
    } else {
      setOrb("idle");
      if (handsFree) setTimeout(toggleMic, 300); // ei sanottu mitään, kuunnellaan uudelleen
    }
  };
}

/* ---------- Onko backend pystyssä? ---------- */

(async function check() {
  try {
    const res = await fetch(API, { method: "GET" });
    setLink(res.ok ? "live" : "down", res.ok ? "kytketty" : "ei kytketty");
    if (!res.ok) setOrb("down");
  } catch {
    setLink("down", "ei kytketty");
    setOrb("down");
  }
})();

/* ---------- Asennettava sovellus ---------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

