// Sincronía: bioritmo diario y compatibilidad.

const CYCLES = [
  { id: 'fisico', name: 'Físico', P: 23, color: '#ff5d73', icon: '💪', desc: 'Energía, fuerza, resistencia y coordinación.' },
  { id: 'emocional', name: 'Emocional', P: 28, color: '#3dd6c4', icon: '💗', desc: 'Estado de ánimo, sensibilidad y creatividad.' },
  { id: 'intelectual', name: 'Intelectual', P: 33, color: '#ffc94a', icon: '🧠', desc: 'Concentración, memoria, lógica y comunicación.' },
];

const READINGS = {
  fisico: {
    alto: 'Tu cuerpo está a tope: ideal para entrenar, hacer deporte o tareas exigentes.',
    medio: 'Buena energía física. Mantén un ritmo constante y aprovecha para moverte.',
    bajo: 'Tu energía física está recargando. Prefiere actividad suave y descanso.',
    muybajo: 'Día de recuperación: duerme bien, hidrátate y evita sobreesfuerzos.',
    critico: 'Día de transición física: ve con calma, más riesgo de torpezas o lesiones.',
  },
  emocional: {
    alto: 'Ánimo luminoso: buen día para socializar, crear y expresar lo que sientes.',
    medio: 'Emociones estables y positivas. Buen momento para conectar con otros.',
    bajo: 'Puedes estar más sensible. Date espacio y rodéate de gente tranquila.',
    muybajo: 'Ánimo bajo: no te exijas de más y evita discusiones importantes.',
    critico: 'Día emocionalmente inestable: respira antes de reaccionar.',
  },
  intelectual: {
    alto: 'Mente brillante: perfecto para estudiar, resolver problemas o negociar.',
    medio: 'Buena claridad mental para el trabajo del día a día.',
    bajo: 'Concentración más baja: repasa en lugar de aprender cosas nuevas.',
    muybajo: 'Mente en pausa: evita decisiones complicadas o firmar algo importante.',
    critico: 'Día de transición mental: revisa dos veces lo que hagas.',
  },
};

const COMPAT_TEXT = {
  fisico: ['Sus energías físicas van al revés: cuando uno quiere moverse, el otro quiere descansar.', 'Coinciden a ratos en energía física; planeen actividades con flexibilidad.', 'Tienen energía al mismo tiempo: disfrutan las mismas actividades y planes activos.'],
  emocional: ['Sus ánimos suelen ir opuestos: oportunidad para que uno sostenga al otro.', 'Se entienden emocionalmente la mitad del tiempo; la comunicación es clave.', 'Sus estados de ánimo suben y bajan juntos: se entienden casi sin hablar.'],
  intelectual: ['Piensan de forma muy distinta: pueden complementarse… o chocar en debates.', 'Coinciden en ideas a menudo, con diferencias que enriquecen.', 'Están en la misma onda mental: conversaciones fluidas y decisiones fáciles.'],
};

const DAY = 86400000;
const $ = s => document.querySelector(s);
const fmtLong = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const fmtShort = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtYear = new Intl.DateTimeFormat('es', { year: 'numeric', timeZone: 'UTC' });

const parseDate = s => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return Number.isFinite(y) ? Date.UTC(y, m - 1, d) : null; };
const iso = t => new Date(t).toISOString().slice(0, 10);
const todayUTC = () => { const n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()); };
const lived = (birth, date) => Math.round((date - birth) / DAY);
const bio = (P, t) => Math.sin((2 * Math.PI * t) / P);
const isCritical = (P, t) => bio(P, t - 0.5) * bio(P, t + 0.5) <= 0;
const pct = v => Math.round(v * 100);
const signed = v => (v > 0 ? '+' : '') + pct(v) + '%';
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const esc = s => String(s).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));

function level(P, t) {
  if (isCritical(P, t)) return 'critico';
  const v = bio(P, t);
  return v > 0.5 ? 'alto' : v > 0 ? 'medio' : v > -0.5 ? 'bajo' : 'muybajo';
}

function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key)) || null;
    localStorage.setItem(key, JSON.stringify(val));
  } catch { return null; }
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------- Estado ----------
const saved = store('sincronia') || {};
const state = {
  me: { name: saved.me?.name || '', birth: saved.me?.birth || '' },
  partner: { name: saved.partner?.name || '', birth: saved.partner?.birth || '' },
  date: todayUTC(),
  cycle: 'emocional',
};
const persist = () => store('sincronia', { me: state.me, partner: state.partner });

// ---------- Dibujo ----------
function ring(value01, color, size = 120, stroke = 11, inner = '') {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, value01)));
  return `<svg viewBox="0 0 ${size} ${size}" class="ring">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})" class="ring-arc" style="--c:${c.toFixed(2)}"/>
    ${inner}
  </svg>`;
}

const W = 720, H = 240, PAD = 22;
const yOf = v => H / 2 - v * (H / 2 - PAD);

function wavePath(P, t0, start, days) {
  let d = '';
  for (let i = 0; i <= days * 4; i++) {
    const x = (i / 4 / days) * W;
    d += (i ? 'L' : 'M') + x.toFixed(1) + ',' + yOf(bio(P, t0 + i / 4)).toFixed(1);
  }
  return d;
}

// Gráfica genérica con tooltip. series: [{P, t0, color, dash, label}]; onPick(dayIndex)
function drawChart(el, { start, days, series, marker, shade, onPick, tip }) {
  let grid = '';
  for (let i = 0; i <= days; i++) {
    const x = (i / days) * W;
    const dow = new Date(start + i * DAY).getUTCDay();
    if (dow === 1) grid += `<line x1="${x}" y1="${PAD - 8}" x2="${x}" y2="${H - PAD + 8}" class="g-week"/>`;
  }
  let shadeSvg = '';
  if (shade) {
    for (let i = 0; i < days * 4; i++) {
      const t = i / 4;
      if (shade(t)) shadeSvg += `<rect x="${((t / days) * W).toFixed(1)}" y="0" width="${(W / days / 4 + 0.6).toFixed(1)}" height="${H}" fill="${shade.color}" opacity=".13"/>`;
    }
  }
  const lines = series.map(s => `<path d="${wavePath(s.P, s.t0, start, days)}" fill="none" stroke="${s.color}" stroke-width="${s.width || 3}" stroke-linecap="round" class="wave${s.dash ? ' wave-dash' : ''}"/>`).join('');
  const mx = marker != null ? (marker / days) * W : null;
  const labels = [0, Math.round(days / 2), days].map(i => {
    const x = (i / days) * W;
    return `<text x="${Math.min(W - 4, Math.max(4, x))}" y="${H - 4}" text-anchor="${i === 0 ? 'start' : i === days ? 'end' : 'middle'}" class="g-label">${fmtShort.format(start + i * DAY)}</text>`;
  }).join('');

  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="chart-svg">
    ${shadeSvg}
    <line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" class="g-zero"/>
    ${grid}
    ${mx != null ? `<rect x="${mx - 1.5}" y="0" width="3" height="${H}" class="g-today"/>` : ''}
    ${lines}
    <line class="g-hover" x1="0" x2="0" y1="0" y2="${H}" opacity="0"/>
  </svg><div class="chart-labels">${labels}</div>`;
  el.querySelector('.chart-labels').innerHTML = [0, Math.round(days / 2), days].map(i => `<span>${fmtShort.format(start + i * DAY)}</span>`).join('');

  const svg = el.querySelector('svg'), hover = el.querySelector('.g-hover'), tt = $('#tooltip');
  const idxAt = e => {
    const r = svg.getBoundingClientRect();
    return Math.max(0, Math.min(days, Math.round(((e.clientX - r.left) / r.width) * days)));
  };
  svg.onpointermove = e => {
    const i = idxAt(e), x = (i / days) * W;
    hover.setAttribute('x1', x); hover.setAttribute('x2', x); hover.setAttribute('opacity', 1);
    tt.innerHTML = tip(i);
    tt.classList.add('show');
    const tw = tt.offsetWidth;
    tt.style.left = Math.min(innerWidth - tw - 8, Math.max(8, e.clientX - tw / 2)) + 'px';
    tt.style.top = (e.clientY + scrollY - tt.offsetHeight - 16) + 'px';
  };
  svg.onpointerleave = () => { hover.setAttribute('opacity', 0); tt.classList.remove('show'); };
  if (onPick) svg.onclick = e => onPick(idxAt(e));
}

// ---------- Mi día ----------
function renderDay() {
  const birth = parseDate(state.me.birth);
  const valid = birth && birth <= todayUTC() + 365 * DAY * 10;
  $('#dayEmpty').hidden = !!valid;
  $('#dayContent').hidden = !valid;
  if (!valid) return;

  const t = lived(birth, state.date);
  const isToday = state.date === todayUTC();
  $('#dateTitle').textContent = cap(fmtLong.format(state.date));
  $('#dateSub').textContent = (isToday ? 'Hoy · ' : '') + `${fmtYear.format(state.date)} · llevas ${t.toLocaleString('es')} días de vida` + (state.me.name ? `, ${state.me.name}` : '');
  $('#todayBtn').classList.toggle('on', isToday);
  $('#pickDate').value = iso(state.date);

  if (t < 0) {
    $('#gauges').innerHTML = `<div class="card muted">Esa fecha es anterior a tu nacimiento 🙂</div>`;
  }

  // Energía general
  const vals = CYCLES.map(c => bio(c.P, t));
  const energy = vals.reduce((s, v) => s + (v + 1) / 2, 0) / 3;
  const ep = Math.round(energy * 100);
  $('#energyRing').innerHTML = ring(energy, 'url(#gEnergy)', 132, 12,
    `<defs><linearGradient id="gEnergy" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ff5d73"/><stop offset=".5" stop-color="#3dd6c4"/><stop offset="1" stop-color="#ffc94a"/></linearGradient></defs>
     <text x="66" y="70" text-anchor="middle" class="ring-num">${ep}</text><text x="66" y="90" text-anchor="middle" class="ring-sub">de 100</text>`);
  const crit = CYCLES.filter(c => isCritical(c.P, t));
  $('#energyLabel').textContent = crit.length ? 'Día crítico ⚡' : ep >= 75 ? 'Día brillante ✨' : ep >= 55 ? 'Buen día 🌤️' : ep >= 40 ? 'Día tranquilo 🌙' : 'Día de recarga 🔋';
  $('#energyHint').textContent = crit.length
    ? `Tu ciclo ${crit.map(c => c.name.toLowerCase()).join(' y ')} cruza el cero hoy. Ve con calma.`
    : `El ciclo más alto es el ${CYCLES[vals.indexOf(Math.max(...vals))].name.toLowerCase()}; el más bajo, el ${CYCLES[vals.indexOf(Math.min(...vals))].name.toLowerCase()}.`;

  // Medidores
  $('#gauges').innerHTML = CYCLES.map(c => {
    const v = bio(c.P, t), up = bio(c.P, t + 1) > v, lv = level(c.P, t);
    const phaseDay = ((t % c.P) + c.P) % c.P;
    return `<article class="gauge card" style="--c:${c.color}">
      <div class="gauge-top">
        ${ring((v + 1) / 2, c.color, 96, 9, `<text x="48" y="54" text-anchor="middle" class="ring-num sm">${signed(v)}</text>`)}
        <div>
          <h4>${c.icon} ${c.name}</h4>
          <p class="trend ${up ? 'up' : 'down'}">${up ? '▲ subiendo' : '▼ bajando'}</p>
          <p class="muted small">Día ${phaseDay + 1} de ${c.P}</p>
          ${lv === 'critico' ? '<span class="badge">⚡ Crítico</span>' : ''}
        </div>
      </div>
      <p class="reading">${READINGS[c.id][lv]}</p>
    </article>`;
  }).join('');

  // Gráfica del mes
  const days = 30, start = state.date - 15 * DAY;
  $('#legend').innerHTML = CYCLES.map(c => `<span><i style="background:${c.color}"></i>${c.name}</span>`).join('');
  drawChart($('#chart'), {
    start, days, marker: 15,
    series: CYCLES.map(c => ({ P: c.P, t0: t - 15, color: c.color })),
    onPick: i => { state.date = start + i * DAY; renderDay(); },
    tip: i => {
      const tt = t - 15 + i;
      return `<b>${cap(fmtShort.format(start + i * DAY))}</b>` + CYCLES.map(c => `<div><i style="background:${c.color}"></i>${c.name} <b>${signed(bio(c.P, tt))}</b>${isCritical(c.P, tt) ? ' ⚡' : ''}</div>`).join('');
    },
  });

  // Días críticos próximos
  const crits = [];
  for (let d = 0; d < 45 && crits.length < 5; d++) {
    for (const c of CYCLES) if (isCritical(c.P, t + d)) crits.push({ d, c });
  }
  $('#criticalList').innerHTML = crits.slice(0, 5).map(({ d, c }) =>
    `<li><i style="background:${c.color}"></i><span>${cap(fmtShort.format(state.date + d * DAY))}</span><b>${c.name}</b><em>${d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`}</em></li>`).join('');

  // Mejor día de la semana
  let best = 0, bestScore = -Infinity;
  for (let d = 0; d < 7; d++) {
    const s = CYCLES.reduce((sum, c) => sum + bio(c.P, t + d) - (isCritical(c.P, t + d) ? 0.6 : 0), 0);
    if (s > bestScore) { bestScore = s; best = d; }
  }
  const bt = t + best;
  $('#bestWeek').innerHTML = `<div class="best">
      <div class="best-date"><span>${fmtShort.format(state.date + best * DAY).split(' ')[0]}</span><b>${new Date(state.date + best * DAY).getUTCDate()}</b></div>
      <div>
        <p><b>${best === 0 ? 'Hoy mismo' : best === 1 ? 'Mañana' : cap(fmtLong.format(state.date + best * DAY))}</b></p>
        <div class="mini-bars">${CYCLES.map(c => `<span style="--c:${c.color};--v:${(bio(c.P, bt) + 1) / 2}" title="${c.name} ${signed(bio(c.P, bt))}"></span>`).join('')}</div>
        <p class="muted small">Tus tres ciclos estarán en su mejor combinación de la semana.</p>
      </div>
    </div>`;
}

// ---------- Compatibilidad ----------
function compatLabel(p) {
  return p >= 85 ? ['Sincronía total', 'Sus ritmos laten casi al mismo compás. Una conexión poco común.']
    : p >= 70 ? ['Gran conexión', 'Sus ciclos coinciden la mayor parte del tiempo. Fluyen juntos con facilidad.']
    : p >= 55 ? ['Buena química', 'Hay armonía en lo importante y diferencias que le dan chispa.']
    : p >= 40 ? ['Complementarios', 'Uno suele estar arriba cuando el otro está abajo: pueden equilibrarse.']
    : p >= 25 ? ['Ritmos distintos', 'Van a velocidades diferentes. Con paciencia, aprenden mucho uno del otro.']
    : ['Polos opuestos', 'Sus ciclos van al revés. Dicen que los opuestos se atraen…'];
}

function renderCompat() {
  const bA = parseDate(state.me.birth), bB = parseDate(state.partner.birth);
  const nameA = state.me.name || 'Persona 1', nameB = state.partner.name || 'Persona 2';
  $('#avatarA').textContent = (state.me.name || '?').charAt(0).toUpperCase();
  $('#avatarB').textContent = (state.partner.name || '?').charAt(0).toUpperCase();
  const valid = bA && bB;
  $('#compatEmpty').hidden = !!valid;
  $('#compatContent').hidden = !valid;
  if (!valid) return;

  const delta = Math.abs(lived(bA, bB));
  const per = CYCLES.map(c => ({ c, p: Math.round(((1 + Math.cos((2 * Math.PI * delta) / c.P)) / 2) * 100) }));
  const total = Math.round(per.reduce((s, x) => s + x.p, 0) / per.length);
  const [label, text] = compatLabel(total);

  $('#scoreRing').innerHTML = ring(total / 100, 'url(#gScore)', 160, 14,
    `<defs><linearGradient id="gScore" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ff7ab6"/><stop offset="1" stop-color="#8b7bff"/></linearGradient></defs>
     <text x="80" y="88" text-anchor="middle" class="ring-num lg">${total}%</text>`);
  $('#scoreLabel').textContent = label;
  $('#scoreText').textContent = `${text} Nacieron con ${delta.toLocaleString('es')} día${delta === 1 ? '' : 's'} de diferencia.`;

  // Sintonía de hoy: qué tan cerca están hoy sus valores en cada ciclo (cambia a diario)
  const now = todayUTC(), nA = lived(bA, now), nB = lived(bB, now);
  const daily = CYCLES.map(cy => 1 - Math.abs(bio(cy.P, nA) - bio(cy.P, nB)) / 2);
  const todayP = Math.round((daily.reduce((s, v) => s + v, 0) / daily.length) * 100);
  $('#todayNum').textContent = todayP + '%';
  $('#todayBar').style.setProperty('--w', todayP + '%');
  $('#todayLabel').textContent = todayP >= 80 ? 'Hoy están en la misma onda' : todayP >= 55 ? 'Hoy se entienden bien' : todayP >= 35 ? 'Hoy van a ritmos distintos' : 'Hoy están en polos opuestos';
  $('#todayText').textContent = `A diferencia de la de por vida, esta cambia cada día. Hoy: ${CYCLES.map((cy, i) => `${cy.name.toLowerCase()} ${Math.round(daily[i] * 100)}%`).join(', ')}.`;

  // Desglose matemático con los números reales
  $('#mathSteps').innerHTML = `
    <ol>
      <li>Días entre nacimientos: <code>Δ = |${state.partner.birth} − ${state.me.birth}| = ${delta.toLocaleString('es')} días</code></li>
      <li>Para cada ciclo de periodo <i>P</i>: <code>(1 + cos(2π · Δ / P)) / 2</code>. Como el coseno se repite cada <i>P</i> días, solo importa el resto de <code>Δ ÷ P</code>.
        <ul>${per.map(({ c, p }) => `<li style="--c:${c.color}"><b>${c.name}</b>: ${delta.toLocaleString('es')} mod ${c.P} = <b>${delta % c.P}</b> → <code>(1 + cos(2π · ${delta % c.P} / ${c.P})) / 2</code> = <b>${p}%</b></li>`).join('')}</ul>
      </li>
      <li>Compatibilidad de por vida = promedio de los tres: <code>(${per.map(x => x.p).join(' + ')}) / 3</code> = <b>${total}%</b></li>
    </ol>
    <p class="muted small">Resto 0 = las ondas van exactamente juntas (100%). Resto igual a la mitad del periodo = van al revés (0%). Las dos personas vuelven a estar 100% sincronizadas en los tres ciclos cada 23 × 28 × 33 = 21.252 días (unos 58 años).</p>`;

  $('#bars').innerHTML = per.map(({ c, p }) => `<article class="card bar" style="--c:${c.color}">
      <div class="bar-head"><h4>${c.icon} ${c.name}</h4><b>${p}%</b></div>
      <div class="bar-track"><span style="--w:${p}%"></span></div>
      <p class="muted small">${COMPAT_TEXT[c.id][p >= 70 ? 2 : p >= 40 ? 1 : 0]}</p>
    </article>`).join('');

  // Gráfica de pareja
  $('#cycleSeg').innerHTML = CYCLES.map(c => `<button class="seg-btn ${state.cycle === c.id ? 'on' : ''}" data-cycle="${c.id}" style="--c:${c.color}">${c.name}</button>`).join('');
  $('#lgA').textContent = nameA;
  $('#lgB').textContent = nameB;
  const c = CYCLES.find(x => x.id === state.cycle);
  document.querySelector('.sw-solid').style.borderColor = c.color;
  const today = todayUTC(), tA = lived(bA, today), tB = lived(bB, today), days = 30;
  const shade = tt => bio(c.P, tA + tt) > 0 && bio(c.P, tB + tt) > 0;
  shade.color = c.color;
  drawChart($('#coupleChart'), {
    start: today, days, marker: 0, shade,
    series: [{ P: c.P, t0: tA, color: c.color }, { P: c.P, t0: tB, color: '#e9e6ff', dash: true, width: 2.5 }],
    tip: i => `<b>${cap(fmtShort.format(today + i * DAY))}</b><div>${esc(nameA)} <b>${signed(bio(c.P, tA + i))}</b></div><div>${esc(nameB)} <b>${signed(bio(c.P, tB + i))}</b></div>`,
  });

  // Mejores días juntos
  const scores = [];
  for (let d = 0; d < 30; d++) {
    let s = 0;
    for (const cy of CYCLES) s += bio(cy.P, tA + d) + bio(cy.P, tB + d) - (isCritical(cy.P, tA + d) || isCritical(cy.P, tB + d) ? 0.5 : 0);
    scores.push({ d, s });
  }
  const picks = [];
  for (const x of [...scores].sort((a, b) => b.s - a.s)) {
    if (picks.every(p => Math.abs(p.d - x.d) > 2)) picks.push(x);
    if (picks.length === 3) break;
  }
  picks.sort((a, b) => a.d - b.d);
  $('#bestDays').innerHTML = picks.map(({ d, s }, i) => {
    const date = today + d * DAY, q = Math.round(((s / 6 + 1) / 2) * 100);
    return `<div class="bd" style="--d:${i}">
      <div class="best-date"><span>${fmtShort.format(date).split(' ')[0]}</span><b>${new Date(date).getUTCDate()}</b></div>
      <div><b>${d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : `En ${d} días`}</b><p class="muted small">Energía combinada ${q}%</p></div>
    </div>`;
  }).join('');

  renderCompat.summary = `💞 ${nameA} y ${nameB}: ${total}% de compatibilidad bioritmica de por vida (${label}). Físico ${per[0].p}% · Emocional ${per[1].p}% · Intelectual ${per[2].p}%.`;
}

// ---------- Eventos ----------
function bindInput(sel, obj, key, after) {
  const el = $(sel);
  el.value = obj[key];
  el.addEventListener('input', () => { obj[key] = el.value.trim(); persist(); after(); });
}
const renderAll = () => { renderDay(); renderCompat(); };
bindInput('#myName', state.me, 'name', renderAll);
bindInput('#myBirth', state.me, 'birth', renderAll);
bindInput('#nameA', state.me, 'name', renderAll);
bindInput('#birthA', state.me, 'birth', renderAll);
bindInput('#nameB', state.partner, 'name', renderCompat);
bindInput('#birthB', state.partner, 'birth', renderCompat);
// La persona 1 de compatibilidad eres tú: mantener ambos campos iguales
['#myName', '#myBirth', '#nameA', '#birthA'].forEach(sel => $(sel).addEventListener('input', () => {
  $('#myName').value = $('#nameA').value = state.me.name;
  $('#myBirth').value = $('#birthA').value = state.me.birth;
}));
$('#myName').value = $('#nameA').value = state.me.name;

$('#prevDay').onclick = () => { state.date -= DAY; renderDay(); };
$('#nextDay').onclick = () => { state.date += DAY; renderDay(); };
$('#todayBtn').onclick = () => { state.date = todayUTC(); renderDay(); };
$('#pickDate').addEventListener('change', e => { const d = parseDate(e.target.value); if (d) { state.date = d; renderDay(); } });
$('#cycleSeg').addEventListener('click', e => { const b = e.target.closest('[data-cycle]'); if (b) { state.cycle = b.dataset.cycle; renderCompat(); } });
$('#shareBtn').onclick = async () => {
  const text = renderCompat.summary + ' Calcula el tuyo: ' + location.href.split('#')[0];
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); toast('Resultado copiado 📋'); }
  } catch { /* cancelado */ }
};

// Pestañas
function setTab(name) {
  document.querySelectorAll('.tab').forEach(b => { const on = b.dataset.tab === name; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  document.querySelectorAll('.panel').forEach(p => { const on = p.id === 'panel-' + name; p.hidden = !on; p.classList.toggle('on', on); });
  const b = document.querySelector(`.tab[data-tab="${name}"]`);
  $('#tabInk').style.cssText = `left:${b.offsetLeft}px;width:${b.offsetWidth}px`;
  if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
}
document.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) setTab(b.dataset.tab); });
addEventListener('resize', () => setTab(document.querySelector('.tab.on').dataset.tab));

// Teclado: flechas para cambiar de día
addEventListener('keydown', e => {
  if (e.target.matches('input') || $('#panel-dia').hidden || document.body.classList.contains('intro-open')) return;
  if (e.key === 'ArrowLeft') $('#prevDay').click();
  if (e.key === 'ArrowRight') $('#nextDay').click();
});

$('#cyclesInfo').innerHTML = CYCLES.map(c => `<li style="--c:${c.color}"><b>${c.icon} ${c.name} · ${c.P} días</b><span>${c.desc}</span></li>`).join('');

// ---------- Instalación (PWA) ----------
let installEvt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $('#installBtn').hidden = false; });
$('#installBtn').onclick = async () => {
  if (!installEvt) return;
  installEvt.prompt();
  const { outcome } = await installEvt.userChoice;
  if (outcome === 'accepted') toast('¡Sincronía instalada! 🎉');
  installEvt = null;
  $('#installBtn').hidden = true;
};
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// ---------- Introducción ----------
const intro = { i: 0, n: document.querySelectorAll('.slide').length };
function goSlide(i) {
  intro.i = Math.max(0, Math.min(intro.n - 1, i));
  $('#introTrack').style.transform = `translateX(${-intro.i * 100}%)`;
  document.querySelectorAll('.slide').forEach((s, k) => s.classList.toggle('on', k === intro.i));
  $('#introDots').innerHTML = Array.from({ length: intro.n }, (_, k) => `<button class="dot ${k === intro.i ? 'on' : ''}" data-k="${k}" aria-label="Pantalla ${k + 1}"></button>`).join('');
  const last = intro.i === intro.n - 1;
  $('#introNext').style.visibility = last ? 'hidden' : 'visible';
  $('#introSkip').style.visibility = last ? 'hidden' : 'visible';
}
function openIntro() { document.body.classList.add('intro-open'); goSlide(0); }
function closeIntro() {
  document.body.classList.remove('intro-open');
  store('sincronia-intro', true);
  setTab('dia');
  if (!state.me.birth) setTimeout(() => $('#myBirth').focus(), 400);
}
$('#introNext').onclick = () => goSlide(intro.i + 1);
$('#introSkip').onclick = closeIntro;
$('#introStart').onclick = closeIntro;
$('#introOpen').onclick = openIntro;
function goCouple() {
  document.body.classList.remove('intro-open');
  store('sincronia-intro', true);
  setTab('pareja');
  scrollTo({ top: 0, behavior: 'smooth' });
  const first = [$('#birthA'), $('#nameB'), $('#birthB')].find(el => !el.value) || $('#nameB');
  setTimeout(() => first.focus(), 400);
}
$('#introCouple').onclick = goCouple;
$('#coupleCta').onclick = goCouple;
$('#introDots').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) goSlide(+b.dataset.k); });
addEventListener('keydown', e => {
  if (!document.body.classList.contains('intro-open')) return;
  if (e.key === 'ArrowRight') goSlide(intro.i + 1);
  if (e.key === 'ArrowLeft') goSlide(intro.i - 1);
  if (e.key === 'Escape') closeIntro();
});
// Deslizar con el dedo
let sx = null;
$('#intro').addEventListener('pointerdown', e => { sx = e.clientX; });
$('#intro').addEventListener('pointerup', e => {
  if (sx == null) return;
  const dx = e.clientX - sx;
  if (Math.abs(dx) > 50) goSlide(intro.i + (dx < 0 ? 1 : -1));
  sx = null;
});

// ---------- Arranque ----------
if (!store('sincronia-intro')) openIntro();
renderAll();
setTab(['dia', 'pareja', 'info'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'dia');
