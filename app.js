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

/* ---------- Kosketus orbiin: puhu tai peruuta puhe ---------- */

let toggleMic = null; // asetetaan alempana jos selain tukee puheentunnistusta

function standbyActivate() {
  if (heroOrb.dataset.state === "speaking") {
    speechSynthesis.cancel();
    setOrb("idle");
    return;
  }
  if (toggleMic) {
    toggleMic();
  } else {
    const q = window.prompt("Kysy jotain Jarvisilta:");
    if (q && q.trim()) ask(q.trim());
  }
}

standby.addEventListener("click", (e) => {
  if (e.target.closest(".standby__voice")) return; // äänipainike hoitaa itse
  standbyActivate();
});

standby.addEventListener("keydown", (e) => {
  if (e.target.closest(".standby__voice")) return;
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); standbyActivate(); }
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

function speak(text) {
  if (!voiceOn || !("speechSynthesis" in window)) {
    setOrb("idle");
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "fi-FI";
  u.onstart = () => setOrb("speaking");
  u.onend   = () => setOrb("idle");
  u.onerror = () => setOrb("idle");
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

  rec.onerror = () => { /* hiljainen epäonnistuminen, painike palautuu ennalleen */ };

  rec.onend = () => {
    listening = false;
    micBtn.dataset.on = "false";
    setOrb("idle");
    if (input.value.trim()) ask(input.value);
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

