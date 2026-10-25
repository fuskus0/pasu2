const $ = s => document.querySelector(s);
const EXT = ['iso','cso','chd','isz','bin','elf'];
let file, M;
const setStatus = (t, s='') => { $('#status').textContent = t; $('#status').dataset.s = s; };

// --- Carga de archivo (solo local, nunca se sube) ---
$('#file').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const x = f.name.split('.').pop().toLowerCase();
  if (!EXT.includes(x)) { setStatus(`Formato .${x} no soportado`, 'err'); $('#start').disabled = true; return; }
  file = f; $('#gname').textContent = f.name; $('#start').disabled = false;
  setStatus('Listo para iniciar');
};

// --- Inicio del motor ---
$('#start').onclick = async () => {
  if (!crossOriginIsolated) { setStatus('Falta aislamiento COOP/COEP: recarga la página', 'err'); return; }
  $('#start').disabled = true; setStatus('Cargando motor…', 'busy');
  try {
    const base = new URL('emulator/', location.href);
    const { default: Play } = await import(new URL('Play.js', base).href);
    M = await Play({
      locateFile: p => new URL(p, base).href,
      mainScriptUrlOrBlob: new URL('Play.js', base).href,
    });
    let done = true;
    M.discImageDevice = {
      getFileSize: () => file.size,
      read(dst, off, size) {
        done = false;
        file.slice(off, Math.min(off + size, file.size)).arrayBuffer()
          .then(b => { M.HEAPU8.set(new Uint8Array(b), dst); done = true; })
          .catch(() => { done = true; setStatus('Error leyendo el archivo', 'err'); });
      },
      isDone: () => done,
    };
    try { M.FS.mkdir('/work'); } catch {}
    M.ccall('initVm', '', [], []);
    M.bootDiscImage(file.name);
    setStatus('Emulando', 'ok'); $('#outputCanvas').focus();
    // Estas funciones no están documentadas en el motor: se activan solo si existen.
    for (const [id, fn] of [['pause','pauseVm'],['resume','resumeVm'],['reset','resetVm']]) {
      const b = $('#' + id);
      b.disabled = typeof M[fn] !== 'function';
      b.title = b.disabled ? 'El motor no exporta esta función' : '';
      b.onclick = () => { M[fn](); setStatus(id === 'pause' ? 'Pausado' : 'Emulando', id === 'pause' ? '' : 'ok'); };
    }
  } catch (e) {
    console.error(e); setStatus('Error: ' + (e.message || e), 'err'); $('#start').disabled = false;
  }
};

$('#full').onclick = () => $('.screen').requestFullscreen?.();
$('#scale').onchange = e => $('.screen').classList.toggle('int', e.target.value === 'int');

// --- Gamepad -> teclas sintéticas (el motor solo lee teclado) ---
// VERIFICAR estas teclas contra Source/ui_js/Main.cpp de Play!.
const BTN = {0:'Cross',1:'Circle',2:'Square',3:'Triangle',4:'L1',5:'R1',6:'L2',7:'R2',8:'Select',9:'Start',10:'L3',11:'R3',12:'Up',13:'Down',14:'Left',15:'Right'};
const DEF = {0:'KeyZ',1:'KeyX',2:'KeyA',3:'KeyS',4:'Digit1',5:'Digit8',6:'Digit2',7:'Digit9',8:'ShiftRight',9:'Enter',10:'Digit3',11:'Digit0',12:'ArrowUp',13:'ArrowDown',14:'ArrowLeft',15:'ArrowRight'};
let map; try { map = JSON.parse(localStorage.getItem('ps2map')) || {...DEF}; } catch { map = {...DEF}; }
const save = () => { try { localStorage.setItem('ps2map', JSON.stringify(map)); } catch {} };
function drawMap() {
  $('#map').replaceChildren(...Object.entries(BTN).map(([i, n]) => {
    const b = document.createElement('button'); b.textContent = `${n}: ${map[i]}`;
    b.onclick = () => { b.textContent = `${n}: pulsa tecla…`;
      addEventListener('keydown', ev => { ev.preventDefault(); map[i] = ev.code; save(); drawMap(); }, {once: true}); };
    return b;
  }));
}
$('#mapreset').onclick = () => { map = {...DEF}; save(); drawMap(); };
drawMap();
const held = {};
const fire = (type, code) => { const o = {code, key: code, bubbles: true}; ($('#outputCanvas')).dispatchEvent(new KeyboardEvent(type, o)); document.dispatchEvent(new KeyboardEvent(type, o)); };
function poll() {
  const pads = [...navigator.getGamepads()].filter(Boolean);
  $('#pads').textContent = pads.length ? pads.map(p => p.id.slice(0, 30)).join(', ') : 'ninguno';
  const p = pads[0];
  if (p) {
    const on = {};
    p.buttons.forEach((b, i) => { if (map[i]) on[map[i]] = on[map[i]] || b.pressed; });
    const [lx, ly] = p.axes; // sticks analógicos: solo como dirección digital
    if (ly < -.5) on[map[12]] = true; if (ly > .5) on[map[13]] = true;
    if (lx < -.5) on[map[14]] = true; if (lx > .5) on[map[15]] = true;
    for (const c of new Set([...Object.keys(held), ...Object.keys(on)])) {
      if (on[c] && !held[c]) { held[c] = 1; fire('keydown', c); }
      else if (!on[c] && held[c]) { delete held[c]; fire('keyup', c); }
    }
  }
  requestAnimationFrame(poll);
}
addEventListener('gamepadconnected', e => setStatus('Mando conectado: ' + e.gamepad.id.slice(0, 24)));
addEventListener('gamepaddisconnected', () => setStatus('Mando desconectado'));
poll();
