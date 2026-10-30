/* ==========================================================================
   GM Industrial Solutions · script.js
   Sin librerías externas: motor de scroll, canvas 3D, plano isométrico,
   catálogo interactivo y formulario hacia WhatsApp.
   ========================================================================== */
'use strict';

/* ---------- CONFIGURACIÓN: el número de WhatsApp vive SOLO aquí ----------
   Formato: 52 + 10 dígitos, sin signos ni espacios. Si queda vacío, los botones
   y el envío del formulario se ocultan con elegancia. */
const WHATSAPP_NUMERO = '526563751852';
const NOMBRE_NEGOCIO = 'GM Industrial Solutions';

/* ---------- Utilidades ---------- */
const raiz = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => 1 - Math.pow(1 - t, 3);
const NS = 'http://www.w3.org/2000/svg';
const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const puntero = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const ancho900 = window.matchMedia('(min-width: 900px)');
const numeroValido = /^\d{10,15}$/.test(WHATSAPP_NUMERO);
const urlWa = (texto) => `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;

function seguro(nombre, fn) {
  try { fn(); } catch (e) { console.warn('[GM] módulo ' + nombre + ':', e); }
}
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

/* ---------- Bus de scroll (un solo listener, un solo rAF) ---------- */
const lectores = [];
let vh = window.innerHeight;
let programado = false;
function alScroll(fn) { lectores.push(fn); }
function correr() {
  programado = false;
  vh = window.innerHeight;
  const y = window.scrollY || window.pageYOffset || 0;
  for (const f of lectores) {
    try { f(y, vh); } catch (e) { console.warn('[GM] scroll:', e); }
  }
}
function pedir() {
  if (!programado) { programado = true; requestAnimationFrame(correr); }
}
window.addEventListener('scroll', pedir, { passive: true });
window.addEventListener('resize', pedir);

/* ---------- Lista de cotización compartida (catálogo, formulario, píldora) ---------- */
const lista = new Set();
const oyentesLista = [];
function emitirLista() {
  const arr = Array.from(lista);
  oyentesLista.forEach((f) => { try { f(arr); } catch (e) { console.warn('[GM] lista:', e); } });
}

/* ==========================================================================
   1. WhatsApp: enlaces generados desde la constante única
   ========================================================================== */
function whatsapp() {
  $$('[data-wa]').forEach((a) => {
    if (!numeroValido) { a.hidden = true; return; }
    const msg = a.getAttribute('data-wa') || `Hola, quiero información de ${NOMBRE_NEGOCIO}.`;
    a.href = urlWa(msg);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });
  if (!numeroValido) {
    const b = $('#form-enviar'); if (b) b.hidden = true;
    const n = $('#form-nota');
    if (n) n.textContent = 'Por ahora el envío por WhatsApp no está disponible. Escríbenos a ventas@gmindustrials.com o llámanos.';
    const e = $('#cat-enviar'); if (e) e.hidden = true;
  }
}

/* ==========================================================================
   2. Cargador (spinner) — sale solo en menos de 2.5 s; el CSS tiene respaldo
   ========================================================================== */
function cargador() {
  const c = $('#cargador');
  if (!c) { raiz.classList.add('listo'); return; }
  const pct = $('#cargador-pct');
  const est = $('#cargador-estado');
  const estados = ['Preparando catálogo', 'Calibrando maquinados', 'Conectando proveedores', 'Listo para surtir'];
  const dur = reducido ? 500 : 1500;
  const t0 = performance.now();
  let hecho = false;
  function salir() {
    if (hecho) return;
    hecho = true;
    if (pct) pct.textContent = '100%';
    c.classList.add('salir');
    raiz.classList.add('listo');
    setTimeout(() => { c.classList.add('fuera'); c.setAttribute('aria-hidden', 'true'); }, 650);
  }
  function paso(t) {
    if (hecho) return;
    const k = clamp((t - t0) / dur);
    if (pct) pct.textContent = Math.round(ease(k) * 100) + '%';
    if (est) est.textContent = estados[Math.min(estados.length - 1, Math.floor(k * estados.length))];
    if (k < 1) requestAnimationFrame(paso); else salir();
  }
  requestAnimationFrame(paso);
  setTimeout(salir, 1900); // seguro: nunca pasa de ~2.5 s con la animación de salida
}

/* ==========================================================================
   3. Cabecera, menú móvil, progreso y sección activa
   ========================================================================== */
function cabecera() {
  const cab = $('#cabecera');
  const btn = $('.cab__menu');
  const menu = $('#menu-movil');
  const barra = $('#progreso-barra');
  alScroll((y) => {
    if (cab) cab.classList.toggle('solida', y > 20);
    if (barra) {
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      barra.style.transform = `scaleX(${clamp(y / max).toFixed(4)})`;
    }
  });
  if (btn && menu) {
    const cerrar = () => {
      btn.classList.remove('abierto');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Abrir menú');
      menu.classList.remove('abierto');
      document.body.classList.remove('sin-scroll');
    };
    btn.addEventListener('click', () => {
      if (btn.classList.contains('abierto')) { cerrar(); return; }
      btn.classList.add('abierto');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Cerrar menú');
      menu.classList.add('abierto');
      document.body.classList.add('sin-scroll');
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) cerrar(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
    const anchoNav = window.matchMedia('(min-width: 1240px)');
    window.addEventListener('resize', () => { if (anchoNav.matches) cerrar(); });
  }
  const enlaces = $$('.cab__nav a');
  if ('IntersectionObserver' in window && enlaces.length) {
    const mapa = new Map(enlaces.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        enlaces.forEach((a) => a.classList.remove('activo'));
        const a = mapa.get(e.target.id);
        if (a) a.classList.add('activo');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    mapa.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }
}

/* ==========================================================================
   4. Revelado al hacer scroll (títulos por palabra, bloques, escalonado)
   ========================================================================== */
function partirPalabras(el) {
  let i = 0;
  const frag = document.createDocumentFragment();
  const recorrer = (nodo, destino) => {
    nodo.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { destino.appendChild(document.createTextNode(' ')); return; }
          const o = document.createElement('span');
          o.className = 'pal';
          const s = document.createElement('span');
          s.textContent = tok;
          s.style.setProperty('--i', String(i++));
          o.appendChild(s);
          destino.appendChild(o);
        });
      } else if (n.nodeType === 1) {
        const c = n.cloneNode(false);
        destino.appendChild(c);
        recorrer(n, c);
      }
    });
  };
  recorrer(el, frag);
  el.textContent = '';
  el.appendChild(frag);
}

function revelar() {
  $$('[data-titulo]').forEach(partirPalabras);
  $$('[data-escalonar]').forEach((p) => {
    $$(':scope > .rv', p).forEach((c, i) => c.style.setProperty('--d', (i * 0.09).toFixed(2) + 's'));
  });
  const els = $$('.rv');
  if (reducido || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach((e) => io.observe(e));
}

function manifiesto() {
  const p = $('[data-palabras]');
  if (!p) return;
  const palabras = p.textContent.trim().split(/\s+/);
  p.textContent = '';
  const spans = palabras.map((w) => {
    const s = document.createElement('span');
    s.className = 'w';
    s.textContent = w + ' ';
    p.appendChild(s);
    return s;
  });
  if (reducido) { spans.forEach((s) => s.classList.add('on')); return; }
  let fijo = false;
  alScroll((y, h) => {
    if (fijo) return;
    const r = p.getBoundingClientRect();
    const prog = clamp((h * 0.88 - r.top) / (r.height + h * 0.3));
    const n = Math.round(prog * spans.length);
    spans.forEach((s, i) => s.classList.toggle('on', i < n));
    if (prog >= 1) { fijo = true; spans.forEach((s) => s.classList.add('on')); }
  });
}

function contadores() {
  const els = $$('[data-cuenta]');
  if (!els.length || reducido || !('IntersectionObserver' in window)) return;
  els.forEach((el) => { el.textContent = '0'; });
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const el = e.target;
      const meta = Number(el.dataset.cuenta) || 0;
      const t0 = performance.now();
      const paso = (t) => {
        const k = clamp((t - t0) / 1400);
        el.textContent = String(Math.round(meta * ease(k)));
        if (k < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
  }, { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
}

/* ==========================================================================
   5. Marquesinas, palabras rotatorias y datos del hero
   ========================================================================== */
function marquesinas() {
  $$('[data-marq]').forEach((m) => {
    const pista = $('.marq__pista', m);
    const ul = pista && $('ul', pista);
    if (!ul) return;
    const clon = ul.cloneNode(true);
    clon.setAttribute('aria-hidden', 'true');
    pista.appendChild(clon);
    m.classList.add('viva');
  });
}

function ciclo(items, ms) {
  if (items.length < 2 || reducido) return;
  let i = 0;
  setInterval(() => {
    if (document.hidden) return;
    const previo = items[i];
    previo.classList.remove('on');
    previo.classList.add('sale');
    setTimeout(() => previo.classList.remove('sale'), 800);
    i = (i + 1) % items.length;
    items[i].classList.add('on');
  }, ms);
}
function rotadores() {
  const r = $('[data-rota]');
  if (r) ciclo($$('b', r), 2600);
  ciclo($$('.hero__datos .dato'), 3200);
  const caps = $$('.maq__pasos li');
  if (!caps.length) return;
}

/* ==========================================================================
   6. Hero: engranes 3D en canvas, partículas, flujos y ondas
   ========================================================================== */
function heroCanvas() {
  const cv = $('#lienzo-hero');
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const hero = cv.closest('.hero');
  const TAU = Math.PI * 2;
  let W = 0, H = 0, dpr = 1, visible = true, raf = 0, ultimo = performance.now(), giro = 0, movil = false;
  const raton = { x: 0, y: 0, sx: 0, sy: 0, px: -999, py: -999 };
  const v = { cx: 0, cy: 0, esc: 200, f: 2400, rx: 0.95, ry: -0.55 };
  let partes = [], flujos = [], ondas = [], proxOnda = 0;

  const circ = (r, n = 40) => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * TAU) * r, Math.sin((i / n) * TAU) * r]);
  function engrane(n, ri, ro, g) {
    const paso = TAU / n;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = i * paso;
      [[ri, -0.3], [ro, -0.15], [ro, 0.15], [ri, 0.3]].forEach(([r, k]) => pts.push([Math.cos(a + paso * k) * r, Math.sin(a + paso * k) * r]));
    }
    const radios = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.2;
      radios.push([[Math.cos(a) * ri * 0.3, Math.sin(a) * ri * 0.3], [Math.cos(a) * ri * 0.72, Math.sin(a) * ri * 0.72]]);
    }
    return { n, paso, pts, g, radios, anillos: [circ(ri * 0.3, 28), circ(ri * 0.72, 44), circ(ri * 0.12, 20)] };
  }
  const NA = 18, NB = 11;
  const GA = engrane(NA, 0.86, 1, 0.28);
  const GB = engrane(NB, 0.86 * (NB / NA), NB / NA, 0.28);
  const DIST = 0.93 + 0.93 * (NB / NA);

  function proy(x, y, z, ox, oy, s) {
    const cs = Math.cos(s), sn = Math.sin(s);
    const X = x * cs - y * sn + ox, Y = x * sn + y * cs + oy;
    const c1 = Math.cos(v.rx), s1 = Math.sin(v.rx);
    const Y1 = Y * c1 - z * s1, Z1 = Y * s1 + z * c1;
    const c2 = Math.cos(v.ry), s2 = Math.sin(v.ry);
    const X2 = X * c2 + Z1 * s2, Z2 = -X * s2 + Z1 * c2;
    const k = v.f / (v.f + Z2 * v.esc);
    return [v.cx + X2 * v.esc * k, v.cy + Y1 * v.esc * k];
  }
  function poli(p, cerrar) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    if (cerrar) ctx.closePath();
  }
  function dibujarEngrane(e, s, ox, oy, alfa) {
    const h = e.g / 2;
    const fr = e.pts.map((p) => proy(p[0], p[1], h, ox, oy, s));
    const bk = e.pts.map((p) => proy(p[0], p[1], -h, ox, oy, s));
    poli(fr, true); ctx.fillStyle = `rgba(47,123,255,${0.08 * alfa})`; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = `rgba(90,215,255,${0.2 * alfa})`; ctx.beginPath();
    for (let i = 0; i < fr.length; i++) { ctx.moveTo(fr[i][0], fr[i][1]); ctx.lineTo(bk[i][0], bk[i][1]); }
    ctx.stroke();
    poli(bk, true); ctx.strokeStyle = `rgba(90,215,255,${0.32 * alfa})`; ctx.stroke();
    poli(fr, true); ctx.lineWidth = 8; ctx.strokeStyle = `rgba(47,123,255,${0.12 * alfa})`; ctx.stroke();
    ctx.lineWidth = 1.7; ctx.strokeStyle = `rgba(170,210,255,${0.95 * alfa})`; ctx.stroke();
    ctx.lineWidth = 1.1; ctx.strokeStyle = `rgba(125,180,255,${0.55 * alfa})`;
    e.anillos.forEach((c) => { poli(c.map((p) => proy(p[0], p[1], h, ox, oy, s)), true); ctx.stroke(); });
    ctx.beginPath();
    e.radios.forEach((r) => {
      const a = proy(r[0][0], r[0][1], h, ox, oy, s), b = proy(r[1][0], r[1][1], h, ox, oy, s);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    });
    ctx.stroke();
    ctx.fillStyle = `rgba(210,235,255,${0.9 * alfa})`;
    for (let i = 1; i < fr.length; i += 4) ctx.fillRect(fr[i][0] - 1.2, fr[i][1] - 1.2, 2.4, 2.4);
  }

  function sembrar() {
    const n = Math.round(clamp((W * H) / 17000, 26, movil ? 46 : 90));
    partes = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25, vy: -0.08 - Math.random() * 0.25,
      r: 0.6 + Math.random() * 1.6, a: 0.25 + Math.random() * 0.55,
    }));
    const nf = movil ? 3 : 5;
    flujos = Array.from({ length: nf }, (_, i) => ({
      p0: [-20, H * (0.14 + i * (0.72 / nf))],
      p1: [W * 0.3, H * (0.5 + (i - nf / 2) * 0.16)],
      t: Math.random(), vel: 0.00005 + Math.random() * 0.00005,
    }));
  }
  function medir() {
    const r = hero.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    movil = W < 1024;
    dpr = Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    v.cx = movil ? W * 0.6 : W * 0.71;
    v.cy = movil ? (W < 760 ? 168 : 215) : H * 0.5;
    v.esc = movil ? Math.min(W * 0.25, W < 760 ? 100 : 150) : Math.min(Math.min(W, H) * 0.3, 300);
    sembrar();
    if (reducido) dibujar(performance.now(), 0);
  }

  function fondo(dt, ts) {
    // partículas y constelación
    const lim = movil ? 84 : 112;
    for (const p of partes) {
      p.x += p.vx * dt * 0.06; p.y += p.vy * dt * 0.06;
      const dx = p.x - raton.px, dy = p.y - raton.py, d2 = dx * dx + dy * dy;
      if (d2 < 14400 && d2 > 1) { const d = Math.sqrt(d2), f = (120 - d) / 120; p.x += (dx / d) * f * 1.6; p.y += (dy / d) * f * 1.6; }
      if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
      if (p.x < -6) p.x = W + 6; else if (p.x > W + 6) p.x = -6;
    }
    ctx.lineWidth = 0.7;
    for (let i = 0; i < partes.length; i++) {
      const a = partes[i];
      for (let j = i + 1; j < partes.length; j++) {
        const b = partes[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
        if (d < lim * lim) {
          ctx.strokeStyle = `rgba(110,170,255,${(1 - Math.sqrt(d) / lim) * 0.2})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      ctx.fillStyle = `rgba(190,220,255,${a.a})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.fill();
    }
    // flujos hidráulicos hacia el engrane
    ctx.lineWidth = 1;
    for (const f of flujos) {
      f.t = (f.t + f.vel * dt) % 1;
      ctx.strokeStyle = 'rgba(90,150,255,0.10)';
      ctx.beginPath(); ctx.moveTo(f.p0[0], f.p0[1]); ctx.quadraticCurveTo(f.p1[0], f.p1[1], v.cx, v.cy); ctx.stroke();
      for (let k = 0; k < 9; k++) {
        const t = f.t - k * 0.011;
        if (t < 0) continue;
        const u = 1 - t;
        const x = u * u * f.p0[0] + 2 * u * t * f.p1[0] + t * t * v.cx;
        const y = u * u * f.p0[1] + 2 * u * t * f.p1[1] + t * t * v.cy;
        ctx.fillStyle = `rgba(120,210,255,${(1 - k / 9) * 0.9})`;
        ctx.beginPath(); ctx.arc(x, y, 2.6 - k * 0.2, 0, TAU); ctx.fill();
      }
    }
    // ondas de escaneo
    if (ts > proxOnda) { ondas.push(ts); proxOnda = ts + 2600; }
    ondas = ondas.filter((t0) => ts - t0 < 4200);
    for (const t0 of ondas) {
      const k = (ts - t0) / 4200, r = v.esc * (1 + k * 1.7);
      ctx.strokeStyle = `rgba(90,170,255,${(1 - k) * 0.32})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(v.cx, v.cy, r * Math.abs(Math.cos(v.ry)) + 4, r * Math.abs(Math.cos(v.rx)) + 4, 0, 0, TAU);
      ctx.stroke();
    }
  }

  function dibujar(ts, dt) {
    raton.sx += (raton.x - raton.sx) * 0.06;
    raton.sy += (raton.y - raton.sy) * 0.06;
    const t = ts / 1000;
    v.rx = 0.95 + raton.sy * 0.18 + Math.sin(t * 0.4) * 0.05;
    v.ry = -0.55 + raton.sx * 0.3 + Math.cos(t * 0.33) * 0.06;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    fondo(dt, ts);
    const fi = movil ? 2.1 : 0.95;
    const sA = fi + giro;
    const sB = fi + Math.PI - 0.5 * GB.paso - giro * (NA / NB);
    dibujarEngrane(GB, sB, Math.cos(fi) * DIST, Math.sin(fi) * DIST, 0.85);
    dibujarEngrane(GA, sA, 0, 0, 1);
    ctx.globalCompositeOperation = 'source-over';
  }
  function frame(ts) {
    raf = 0;
    const dt = Math.min(48, ts - ultimo);
    ultimo = ts;
    giro += dt * 0.00032;
    dibujar(ts, dt);
    if (visible && !document.hidden && !reducido) raf = requestAnimationFrame(frame);
  }
  function arrancar() {
    if (reducido || raf) return;
    ultimo = performance.now();
    raf = requestAnimationFrame(frame);
  }

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    raton.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    raton.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    raton.px = e.clientX - r.left; raton.py = e.clientY - r.top;
  });
  hero.addEventListener('pointerleave', () => { raton.x = 0; raton.y = 0; raton.px = -999; raton.py = -999; });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) arrancar(); });
  if ('ResizeObserver' in window) new ResizeObserver(medir).observe(hero); else window.addEventListener('resize', medir);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) arrancar(); }).observe(hero);
  }
  medir();
  if (reducido) dibujar(performance.now(), 0); else arrancar();
}

/* ==========================================================================
   7. Escena: el marco se abre a pantalla completa con el scroll
   ========================================================================== */
function escena() {
  const marco = $('#escena-marco');
  if (!marco) return;
  const svg = $('.escena__svg', marco);
  const caps = $$('.escena__cap', marco);
  if (reducido) { marco.style.setProperty('--w', '100'); marco.style.setProperty('--rd', '0px'); return; }
  let ult = -1;
  alScroll((y, h) => {
    const r = marco.getBoundingClientRect();
    const c = r.top + r.height / 2;
    const e = ease(clamp((h * 1.05 - c) / (h * 0.62)));
    marco.style.setProperty('--w', lerp(80, 100, e).toFixed(2));
    marco.style.setProperty('--rd', lerp(34, 0, e).toFixed(1) + 'px');
    if (svg) svg.style.transform = `scale(${lerp(1.16, 1, e).toFixed(3)})`;
    const u = clamp((h * 0.5 - c) / (h * 0.9) + 0.5);
    const i = Math.min(caps.length - 1, Math.floor(u * caps.length));
    if (i !== ult) { caps.forEach((cp, k) => cp.classList.toggle('on', k === i)); ult = i; }
  });
}

/* ==========================================================================
   8. Tarjetas apiladas (solo escritorio): la anterior se hunde al llegar la siguiente
   ========================================================================== */
function pila() {
  const cont = $('[data-pila]');
  if (!cont || reducido) return;
  const cards = $$('.tarjeta', cont);
  alScroll(() => {
    cards.forEach((c, i) => {
      const sig = cards[i + 1];
      if (!sig || !ancho900.matches) { c.style.transform = ''; c.style.filter = ''; return; }
      const rc = c.getBoundingClientRect(), rs = sig.getBoundingClientRect();
      const p = clamp((rc.bottom - rs.top) / Math.max(1, rc.height));
      c.style.transform = `scale(${(1 - p * 0.05).toFixed(4)})`;
      c.style.filter = p > 0.01 ? `brightness(${(1 - p * 0.22).toFixed(3)})` : '';
    });
  });
}

/* ==========================================================================
   9. Catálogo interactivo + lista de cotización
   ========================================================================== */
function catalogo() {
  const ul = $('#prods');
  if (!ul) return;
  const items = $$('li', ul);
  const inp = $('#buscar');
  const filtros = $$('.filtro');
  const estado = $('#cat-estado');
  const vacio = $('#cat-vacio');
  const qEl = $('#cat-q');
  const nEl = $('#cat-n');
  const mas = $('#cat-mas');
  let cat = 'todo', q = '', expandido = false;
  const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const textos = items.map((li) => norm(li.textContent));
  filtros.forEach((f) => {
    const k = f.dataset.f;
    const n = k === 'todo' ? items.length : items.filter((li) => li.dataset.c === k).length;
    const s = $('small', f); if (s) s.textContent = String(n);
  });
  function aplicar() {
    const palabras = norm(q).split(/\s+/).filter(Boolean);
    let n = 0;
    items.forEach((li, i) => {
      const ok = (cat === 'todo' || li.dataset.c === cat) && palabras.every((p) => textos[i].includes(p));
      li.hidden = !ok;
      if (ok) n++;
    });
    estado.textContent = n === items.length ? `Mostrando los ${n} productos de la muestra` : `Mostrando ${n} de ${items.length} productos`;
    const colapsar = cat === 'todo' && !palabras.length && !expandido;
    ul.classList.toggle('colapsado', colapsar);
    if (mas) { mas.hidden = !colapsar; const t = $('span', mas); if (t) t.textContent = `Mostrar los ${items.length} productos`; }
    vacio.hidden = n > 0;
    if (n === 0) {
      const busca = q.trim() || 'este producto';
      qEl.textContent = busca;
      const a = $('#cat-vacio-wa');
      if (a) {
        const msg = `Hola, busco «${busca}» y no lo vi en su catálogo en línea. ¿Me ayudan a encontrarlo?`;
        a.setAttribute('data-wa', msg);
        if (numeroValido) a.href = urlWa(msg);
      }
    }
  }
  if (mas) mas.addEventListener('click', () => { expandido = true; aplicar(); });
  if (inp) inp.addEventListener('input', () => { q = inp.value; aplicar(); });
  filtros.forEach((f) => f.addEventListener('click', () => {
    cat = f.dataset.f;
    filtros.forEach((x) => { const on = x === f; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    aplicar();
  }));
  ul.addEventListener('click', (e) => {
    const b = e.target.closest('.prod');
    if (!b) return;
    const t = b.textContent.trim();
    if (lista.has(t)) lista.delete(t); else lista.add(t);
    emitirLista();
  });
  oyentesLista.push((arr) => {
    $$('.prod', ul).forEach((b) => {
      const on = lista.has(b.textContent.trim());
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('on', on);
    });
    if (nEl) nEl.textContent = String(arr.length);
  });
  aplicar();
}

function interfazLista() {
  const ulForm = $('#form-lista ul');
  const vacia = $('#form-lista .forma__vacia');
  const pill = $('#pill-lista');
  const pn = $('#pill-n');
  const contacto = $('#contacto');
  let enContacto = false;
  const pintar = (arr) => {
    if (ulForm) {
      ulForm.textContent = '';
      arr.forEach((t) => {
        const li = document.createElement('li');
        const s = document.createElement('span'); s.textContent = t;
        const b = document.createElement('button');
        b.type = 'button'; b.setAttribute('aria-label', 'Quitar de mi lista: ' + t); b.textContent = '×';
        b.addEventListener('click', () => { lista.delete(t); emitirLista(); });
        li.append(s, b);
        ulForm.appendChild(li);
      });
    }
    if (vacia) vacia.hidden = arr.length > 0;
    if (pn) pn.textContent = String(arr.length);
    if (pill) pill.hidden = arr.length === 0 || enContacto || !numeroValido;
  };
  oyentesLista.push(pintar);
  if (contacto && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { enContacto = e.isIntersecting; pintar(Array.from(lista)); }, { threshold: 0.15 }).observe(contacto);
  }
}

/* ==========================================================================
   10. Especificaciones: pestañas, manómetro, ECT, stretch film y coroplast
   ========================================================================== */
function especificaciones() {
  const tabs = $$('.tab');
  if (!tabs.length) return;
  const paneles = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  function activar(i, foco) {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      paneles[k].hidden = !on;
      paneles[k].classList.remove('vivo');
    });
    requestAnimationFrame(() => requestAnimationFrame(() => paneles[i].classList.add('vivo')));
    if (foco) tabs[i].focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activar(i));
    t.addEventListener('keydown', (e) => {
      let n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); activar(n, true); }
    });
  });
  const primero = paneles[0];
  if ('IntersectionObserver' in window && !reducido) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { primero.classList.add('vivo'); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(primero);
  } else primero.classList.add('vivo');

  /* Manómetro */
  const arco = $('#mano-arco'), aguja = $('#mano-aguja'), val = $('#mano-val'), mpa = $('#mano-mpa'), desc = $('#mano-desc'), ticks = $('#mano-ticks');
  if (arco && aguja && ticks) {
    for (let i = 0; i <= 10; i++) {
      const ang = Math.PI - (i / 10) * Math.PI;
      const r1 = i % 5 === 0 ? 98 : 106, r2 = 114;
      ticks.appendChild(svgEl('line', {
        x1: (150 + Math.cos(ang) * r1).toFixed(1), y1: (160 - Math.sin(ang) * r1).toFixed(1),
        x2: (150 + Math.cos(ang) * r2).toFixed(1), y2: (160 - Math.sin(ang) * r2).toFixed(1),
      }));
    }
    let actual = 3000, anim = 0;
    const fmt = (n) => Math.round(n).toLocaleString('en-US');
    const ir = (btn) => {
      const psi = Number(btn.dataset.psi);
      $$('.pres').forEach((b) => b.classList.toggle('on', b === btn));
      aguja.style.transform = `rotate(${(-90 + (psi / 10000) * 180).toFixed(1)}deg)`;
      arco.style.strokeDashoffset = String((1 - psi / 10000).toFixed(4));
      mpa.textContent = btn.dataset.mpa || '';
      desc.textContent = btn.dataset.d || '';
      const desde = actual, t0 = performance.now();
      cancelAnimationFrame(anim);
      const paso = (t) => {
        const k = clamp((t - t0) / 800);
        val.textContent = fmt(lerp(desde, psi, ease(k)));
        if (k < 1) anim = requestAnimationFrame(paso);
      };
      anim = requestAnimationFrame(paso);
      actual = psi;
    };
    $$('.pres').forEach((b) => b.addEventListener('click', () => ir(b)));
    const inicial = $('.pres.on');
    if (inicial) {
      aguja.style.transform = 'rotate(-90deg)';
      arco.style.strokeDashoffset = '1';
      const fin = () => { aguja.style.transform = `rotate(${(-90 + 0.3 * 180).toFixed(1)}deg)`; arco.style.strokeDashoffset = String(1 - 0.3); };
      if ('IntersectionObserver' in window && !reducido) {
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { fin(); io.disconnect(); } }, { threshold: 0.4 });
        io.observe($('.mano__reloj') || arco);
      } else fin();
    }
  }

  /* ECT por flauta */
  $$('.flauta').forEach((b) => b.addEventListener('click', () => {
    $$('.flauta').forEach((x) => x.classList.toggle('on', x === b));
    const f = b.dataset.fl;
    $$('.ect li').forEach((li) => li.classList.toggle('apagado', !(f === 'todas' || li.dataset.fl.split(' ').includes(f))));
  }));

  /* Stretch film por ancho */
  $$('.ancho').forEach((b) => b.addEventListener('click', () => {
    $$('.ancho').forEach((x) => x.classList.toggle('on', x === b));
    const w = b.dataset.w;
    $$('.tabla tbody tr').forEach((tr) => tr.classList.toggle('apagado', !(w === 'todos' || tr.dataset.w === w)));
  }));

  /* Coroplast: corte transversal */
  const lamina = $('#coro-lamina');
  if (lamina) {
    const pintar = (mm) => {
      lamina.textContent = '';
      const alto = 20 + mm * 14, y0 = 110 - alto / 2, x0 = 30, ancho = 260;
      lamina.appendChild(svgEl('rect', { x: x0, y: y0, width: ancho, height: 7, class: 'coro-piel' }));
      lamina.appendChild(svgEl('rect', { x: x0, y: y0 + alto - 7, width: ancho, height: 7, class: 'coro-piel' }));
      for (let x = x0; x <= x0 + ancho - 4; x += 16) lamina.appendChild(svgEl('rect', { x, y: y0 + 7, width: 3.5, height: alto - 14, class: 'coro-nervio' }));
      lamina.appendChild(svgEl('path', { d: `M${x0 + ancho + 18} ${y0}V${y0 + alto}M${x0 + ancho + 12} ${y0}H${x0 + ancho + 24}M${x0 + ancho + 12} ${y0 + alto}H${x0 + ancho + 24}`, class: 'coro-cota' }));
    };
    pintar(4);
    $$('.grosor').forEach((b) => b.addEventListener('click', () => {
      $$('.grosor').forEach((x) => x.classList.toggle('on', x === b));
      pintar(Number(b.dataset.mm));
      $('#coro-mm').textContent = b.dataset.mm + ' mm';
      $('#coro-cal').textContent = b.dataset.cal + ' cal aprox.';
      $('#coro-uso').textContent = b.dataset.uso;
    }));
  }
}

/* ==========================================================================
   11. Plano isométrico que se dibuja con el scroll (maquinados)
   ========================================================================== */
function plano() {
  const svg = $('#plano');
  const pista = $('#maq-pista');
  if (!svg || !pista) return;
  const S = 2.6, K = 0.866;
  const P = (x, y, z) => [(x - y) * K * S, (x + y) * 0.5 * S - z * S];
  const f1 = (n) => n.toFixed(1);
  const cajas = [];
  const add = (g, x, y, z, w, d, h) => cajas.push({ g, x, y, z, w, d, h });
  [[3, 3], [89, 3], [3, 41], [89, 41]].forEach(([x, y]) => add('perfil', x, y, 0, 4, 4, 60));
  add('repisa', 3, 3, 12, 90, 42, 2);
  add('tablero', 0, 0, 60, 96, 48, 4);
  add('acrilico', 6, 26, 64, 16, 16, 10);
  add('acrilico', 25, 26, 64, 16, 16, 10);
  add('acrilico', 44, 26, 64, 16, 16, 10);
  add('monitor', 58, 12, 64, 30, 3, 22);
  add('perfil', 6, 4, 64, 3, 3, 52);
  add('perfil', 87, 4, 64, 3, 3, 52);
  add('repisa', 4, 3, 100, 92, 14, 2);

  const gCaras = $('#plano-caras'), gFan = $('#plano-fantasma'), gTr = $('#plano-trazos'), gCotas = $('#plano-cotas');
  const trazos = [];
  const pts = (arr) => arr.map((p) => f1(p[0]) + ',' + f1(p[1])).join(' ');
  cajas.forEach((c, i) => {
    const { x, y, z, w, d, h } = c;
    const t1 = P(x, y, z + h), t2 = P(x + w, y, z + h), t3 = P(x + w, y + d, z + h), t4 = P(x, y + d, z + h);
    const b2 = P(x + w, y, z), b3 = P(x + w, y + d, z), b4 = P(x, y + d, z);
    gCaras.appendChild(svgEl('polygon', { points: pts([t1, t2, t3, t4]), class: 'cara cara--top cara--' + c.g }));
    gCaras.appendChild(svgEl('polygon', { points: pts([t2, t3, b3, b2]), class: 'cara cara--der cara--' + c.g }));
    gCaras.appendChild(svgEl('polygon', { points: pts([t4, t3, b3, b4]), class: 'cara cara--izq cara--' + c.g }));
    const d1 = `M${f1(t1[0])} ${f1(t1[1])}L${f1(t2[0])} ${f1(t2[1])}L${f1(t3[0])} ${f1(t3[1])}L${f1(t4[0])} ${f1(t4[1])}Z`
      + `M${f1(t2[0])} ${f1(t2[1])}L${f1(b2[0])} ${f1(b2[1])}M${f1(t3[0])} ${f1(t3[1])}L${f1(b3[0])} ${f1(b3[1])}M${f1(t4[0])} ${f1(t4[1])}L${f1(b4[0])} ${f1(b4[1])}`
      + `M${f1(b2[0])} ${f1(b2[1])}L${f1(b3[0])} ${f1(b3[1])}L${f1(b4[0])} ${f1(b4[1])}`;
    gFan.appendChild(svgEl('path', { d: d1, class: 'fantasma' }));
    const p = svgEl('path', { d: d1, class: 'trazo trazo--' + c.g, pathLength: '1' });
    p.style.strokeDasharray = '1 1';
    p.style.strokeDashoffset = '1';
    gTr.appendChild(p);
    const s = (i / cajas.length) * 0.72;
    trazos.push({ el: p, s, e: Math.min(1, s + 0.26) });
  });

  /* Cotas y números */
  const linea = (a, b, cls) => gCotas.appendChild(svgEl('path', { d: `M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}`, class: cls || 'cota' }));
  const texto = (x, y, t, cls) => { const el = svgEl('text', { x: f1(x), y: f1(y), class: cls || 'cota-t', 'text-anchor': 'middle' }); el.textContent = t; gCotas.appendChild(el); };
  const a1 = P(0, 58, 0), a2 = P(96, 58, 0);
  linea(a1, a2); linea([a1[0] - 4, a1[1] - 6], [a1[0] + 4, a1[1] + 6]); linea([a2[0] - 4, a2[1] - 6], [a2[0] + 4, a2[1] + 6]);
  texto((a1[0] + a2[0]) / 2 - 4, (a1[1] + a2[1]) / 2 + 18, '48 in');
  const h1 = P(108, 48, 0), h2 = P(108, 48, 64);
  linea(h1, h2); linea([h1[0] - 6, h1[1]], [h1[0] + 6, h1[1]]); linea([h2[0] - 6, h2[1]], [h2[0] + 6, h2[1]]);
  texto(h1[0] + 24, (h1[1] + h2[1]) / 2, '32 in');
  [['1', P(91, 43, 26)], ['2', P(36, 36, 78)], ['3', P(50, 10, 106)]].forEach(([n, p]) => {
    gCotas.appendChild(svgEl('circle', { cx: f1(p[0]), cy: f1(p[1]), r: 9, class: 'num-c' }));
    texto(p[0], p[1] + 3.6, n, 'num-t');
  });

  const pasos = $$('#maq-pasos li');
  let ultimo = -1;
  function pintar(p) {
    trazos.forEach((t) => { t.el.style.strokeDashoffset = String((1 - clamp((p - t.s) / (t.e - t.s))).toFixed(3)); });
    svg.classList.toggle('con-cotas', p > 0.86);
    svg.classList.toggle('relleno', p > 0.93);
    const i = Math.min(pasos.length - 1, Math.floor(p * pasos.length * 0.999));
    if (i !== ultimo) { pasos.forEach((li, k) => li.classList.toggle('on', k <= i)); ultimo = i; }
  }
  if (reducido) { pintar(1); return; }
  let auto = false;
  const anclado = window.matchMedia('(min-width: 900px) and (min-height: 700px)');
  alScroll((y, h) => {
    if (!anclado.matches) return;
    const r = pista.getBoundingClientRect();
    pintar(clamp(-r.top / Math.max(1, r.height - h)));
  });
  /* En pantallas chicas no hay anclaje: el plano se dibuja solo al entrar a la vista */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || anclado.matches || auto) return;
      auto = true;
      const t0 = performance.now();
      const paso = (t) => { const k = clamp((t - t0) / 4200); pintar(k); if (k < 1) requestAnimationFrame(paso); };
      requestAnimationFrame(paso);
    }, { threshold: 0.35 }).observe(svg);
  }
  pintar(0);
}

/* ==========================================================================
   12. Cómo trabajamos: línea de avance
   ========================================================================== */
function metodo() {
  const ol = $('#pasos');
  if (!ol) return;
  const pasos = $$('.paso', ol);
  if (reducido) { ol.style.setProperty('--p', '1'); pasos.forEach((p) => p.classList.add('on')); return; }
  alScroll((y, h) => {
    const r = ol.getBoundingClientRect();
    const p = clamp((h * 0.72 - r.top) / Math.max(1, r.height));
    ol.style.setProperty('--p', p.toFixed(3));
    pasos.forEach((el, i) => el.classList.toggle('on', p >= (i + 0.35) / pasos.length));
  });
}

/* ==========================================================================
   13. Formulario → WhatsApp
   ========================================================================== */
function formulario() {
  const f = $('#form-wa');
  if (!f) return;
  const err = $('#form-error');
  const tipo = $('#f-tipo');
  const nota = $('#form-nota');
  const error = (msg, campo) => {
    err.textContent = msg; err.hidden = false;
    if (campo) campo.focus();
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-tipo]');
    if (a && tipo) { tipo.value = a.getAttribute('data-tipo'); }
  });
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    err.hidden = true;
    const d = new FormData(f);
    const val = (k) => String(d.get(k) || '').trim();
    const nombre = val('nombre'), empresa = val('empresa'), tel = val('telefono'), tp = val('tipo'), msj = val('mensaje');
    const items = Array.from(lista);
    if (!nombre) { error('Dinos tu nombre para saber con quién hablamos.', $('#f-nombre')); return; }
    if (!msj && !items.length && !tp) { error('Cuéntanos qué necesitas: elige una línea, marca productos del catálogo o escribe un mensaje.', $('#f-msj')); return; }
    if (!numeroValido) { error('El envío por WhatsApp no está disponible por ahora. Escríbenos a ventas@gmindustrials.com.'); return; }
    const partes = [`Hola, soy ${nombre}${empresa ? ' de ' + empresa : ''}. Vengo de la página de ${NOMBRE_NEGOCIO}.`];
    if (tp) partes.push(`Me interesa: ${tp}.`);
    if (items.length) partes.push('Mi lista de cotización:\n' + items.map((t) => '• ' + t).join('\n'));
    if (msj) partes.push('Detalles: ' + msj);
    if (tel) partes.push('Mi teléfono: ' + tel);
    partes.push('Quedo al pendiente de su cotización. ¡Gracias!');
    const url = urlWa(partes.join('\n\n'));
    const w = window.open(url, '_blank');
    if (w) { try { w.opener = null; } catch (err2) { /* sin permiso: no importa */ } } else { window.location.href = url; }
    if (nota) nota.textContent = 'Listo: abrimos WhatsApp con tu mensaje. Solo falta que presiones enviar.';
  });
}

/* ==========================================================================
   14. Interacción fina: inclinación 3D, foco de luz y botones magnéticos
   ========================================================================== */
function interaccion() {
  if (!puntero || reducido) return;
  $$('.foco, .tarjeta').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
    });
  });
  $$('.tarjeta__visual, .maq__plano').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
  $$('.btn--grande, .cab__cta').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      b.style.transform = `translate(${(x * 0.12).toFixed(1)}px, ${(y * 0.2).toFixed(1)}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

/* ==========================================================================
   15. Botón flotante de WhatsApp
   ========================================================================== */
function flotante() {
  const wa = $('#whatsapp-flotante');
  if (!wa || wa.hidden) return;
  setTimeout(() => {
    wa.classList.add('habla');
    setTimeout(() => wa.classList.remove('habla'), 6500);
  }, 7000);
}

/* ---------- Arranque ---------- */
function iniciar() {
  seguro('whatsapp', whatsapp);
  seguro('cargador', cargador);
  seguro('cabecera', cabecera);
  seguro('revelar', revelar);
  seguro('manifiesto', manifiesto);
  seguro('contadores', contadores);
  seguro('marquesinas', marquesinas);
  seguro('rotadores', rotadores);
  seguro('hero', heroCanvas);
  seguro('escena', escena);
  seguro('pila', pila);
  seguro('catalogo', catalogo);
  seguro('lista', interfazLista);
  seguro('especificaciones', especificaciones);
  seguro('plano', plano);
  seguro('metodo', metodo);
  seguro('formulario', formulario);
  seguro('interaccion', interaccion);
  seguro('flotante', flotante);
  emitirLista();
  pedir();
}
iniciar();
