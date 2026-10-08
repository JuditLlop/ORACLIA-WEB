/* Visible conversation and inspectable movement trace; no extra model request. */
(() => {
  'use strict';
  const API = 'https://oraclia-api.onrender.com/oraclia';
  const STORAGE = 'oraclia.conversation.v1';
  const form = document.getElementById('or-form');
  const input = document.getElementById('or-input');
  const send = document.getElementById('or-send');
  const status = document.getElementById('or-status');
  const messages = document.getElementById('or-messages');
  const archiveSelect = document.getElementById('or-archive');
  let state = {version: 1, memory: [], movementKeys: {}, continuityKey: null, archives: []};
  let storageError = '';

  function save() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
      storageError = '';
    } catch (_) {
      storageError = 'No se ha podido guardar en este navegador. Usa «Guardar copia» para conservar la conversación.';
    }
  }

  function field(dl, label, value) {
    if (value === null || value === undefined || value === '') return;
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.textContent = String(value);
    dl.append(dt, dd);
  }

  function addKey(article, key) {
    if (!key || typeof key !== 'object') return;
    const details = document.createElement('details'); details.className = 'or-key';
    const summary = document.createElement('summary'); summary.textContent = '◉ Ver la traza';
    const dl = document.createElement('dl');
    field(dl, 'Registro', 'Lectura registrada antes de generar la respuesta. Es una propuesta del sistema, revisable.');
    field(dl, 'Símbolos', (key.symbols || []).join(' · ') || 'Sin despliegue simbólico');
    field(dl, 'Lo que traes · lectura del sistema', key.observed);
    field(dl, 'Movimiento propuesto', key.reading);
    (key.relations || []).forEach(r => field(dl, (r.members || []).join(' · '), r.description));
    field(dl, 'Forma', key.form);
    field(dl, 'Cambio de símbolos', key.symbol_change ?
      `Se mantienen: ${key.symbol_change.kept.join(' · ') || '—'}\nEntran: ${key.symbol_change.added.join(' · ') || '—'}\nSalen: ${key.symbol_change.removed.join(' · ') || '—'}` : null);
    (key.alternatives || []).forEach(a => field(dl, 'Otra lectura posible', a));
    (key.absences || []).forEach(a => field(dl, `Ausencia propuesta · ${a.symbol}`, `${a.evidence}\n${a.effect}`));
    field(dl, 'Procedencia', 'Tú aportas el mensaje y las revisiones. El sistema propone la lectura simbólica y la LLM genera la expresión. No se presupone que aceptes la propuesta.');
    if (key.feedback_on_previous) {
      field(dl, 'Tu retorno sobre la propuesta anterior', `${key.feedback_on_previous.status}: «${key.feedback_on_previous.evidence}»\nClasificación del lector a partir de tus palabras, revisable.`);
    }
    field(dl, 'Preparada', key.prepared_at);
    if (key.usage) {
      field(dl, 'Uso registrado', `${key.usage.input_tokens} tokens de entrada · ${key.usage.output_tokens} de salida (incluye razonamiento cuando lo hay).`);
      (key.usage.stages || []).forEach(s => field(dl, s.stage, `${s.model} · entrada ${s.input_tokens} · salida ${s.output_tokens} · entrada en caché ${s.cached_input_tokens} · razonamiento ${s.reasoning_tokens}`));
    }
    field(dl, 'Tamaño de esta clave', key.bytes ? `${key.bytes} bytes` : null);
    details.append(summary, dl); article.appendChild(details);
  }

  function addMessage(role, text, key, scroll = true) {
    const article = document.createElement('article'); article.className = `or-message ${role}`;
    if (role === 'assistant') {
      const label = document.createElement('span'); label.className = 'or-message-label'; label.textContent = 'Oraclia'; article.appendChild(label);
    }
    const body = document.createElement('div'); body.textContent = text; article.appendChild(body);
    if (role === 'assistant') addKey(article, key);
    messages.appendChild(article);
    if (scroll) article.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  }

  function redraw() {
    messages.replaceChildren();
    for (const turn of state.memory) {
      if (typeof turn.user === 'string') addMessage('user', turn.user, null, false);
      if (typeof turn.assistant === 'string') addMessage('assistant', turn.assistant, state.movementKeys[turn.turn_id], false);
    }
    archiveSelect.replaceChildren();
    const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Conversaciones guardadas'; archiveSelect.appendChild(placeholder);
    state.archives.forEach((archive, i) => {
      const option = document.createElement('option'); option.value = String(i); option.textContent = `${new Date(archive.saved_at).toLocaleString()} · ${archive.memory.length} turnos`; archiveSelect.appendChild(option);
    });
    archiveSelect.hidden = state.archives.length === 0;
  }

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
    if (saved && saved.version === 1 && Array.isArray(saved.memory) && saved.movementKeys && Array.isArray(saved.archives)) state = saved;
  } catch (_) { storageError = 'No se ha podido recuperar el registro guardado. Puedes continuar y guardar una copia.'; }
  redraw();
  status.textContent = storageError || (state.memory.length ? 'Conversación recuperada de este navegador.' : '');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const text = input.value.trim(); if (!text || send.disabled) return;
    redraw();
    addMessage('user', text); input.value = ''; send.disabled = true;
    status.textContent = 'Oraclia está pensando…';
    try {
      // The archive remains local. Only three recent movement keys accompany
      // the conversational history; the API bounds model history to eight turns.
      const memory = state.memory.map((turn, i) => {
        const copy = {...turn};
        if (i >= state.memory.length - 3 && state.movementKeys[turn.turn_id]) copy.movement_key = state.movementKeys[turn.turn_id];
        return copy;
      });
      const payload = {text, memory};
      if (state.continuityKey) payload.continuity_key = state.continuityKey;
      const response = await fetch(API, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
      if (!response.ok) throw new Error(`Error de conexión (${response.status})`);
      const data = await response.json();
      if (!data.message || data.state === 'error') throw new Error('No se ha podido completar la respuesta. Puedes volver a intentarlo.');
      const oldMemory = state.memory;
      const returned = Array.isArray(data.memory) ? data.memory : [...oldMemory, {user: text, assistant: data.message}];
      state.memory = returned.map((turn, i) => {
        const copy = {...turn};
        const key = copy.movement_key || (i === returned.length - 1 ? data.movement_key : null);
        if (key && key.turn_id) { copy.turn_id = key.turn_id; state.movementKeys[key.turn_id] = key; }
        else if (!copy.turn_id && oldMemory[i]) copy.turn_id = oldMemory[i].turn_id;
        delete copy.movement_key;
        return copy;
      });
      state.continuityKey = data.continuity_key || null;
      redraw();
      if (messages.lastElementChild) messages.lastElementChild.scrollIntoView({behavior: 'smooth', block: 'nearest'});
      save(); status.textContent = [data.conversation_warning, storageError].filter(Boolean).join(' ');
    } catch (error) {
      status.textContent = error.message || 'No se ha podido conectar con Oraclia.';
      input.value = text;
    } finally { send.disabled = false; input.focus(); }
  });

  document.getElementById('or-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `oraclia-traza-${new Date().toISOString().slice(0,10)}.json`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.getElementById('or-new').addEventListener('click', () => {
    if (send.disabled) return;
    if (state.memory.length) state.archives.push({saved_at: new Date().toISOString(), memory: state.memory, movementKeys: state.movementKeys, continuityKey: state.continuityKey});
    state.memory = []; state.movementKeys = {}; state.continuityKey = null;
    redraw(); save(); status.textContent = storageError || 'Nueva conversación. La anterior se conserva en la copia exportable.';
  });
  archiveSelect.addEventListener('change', () => {
    if (send.disabled || archiveSelect.value === '') return;
    const index = Number(archiveSelect.value);
    const archive = state.archives[index]; if (!archive) return;
    state.archives.splice(index, 1);
    if (state.memory.length) state.archives.push({saved_at: new Date().toISOString(), memory: state.memory, movementKeys: state.movementKeys, continuityKey: state.continuityKey});
    state.memory = archive.memory; state.movementKeys = archive.movementKeys;
    state.continuityKey = archive.continuityKey || null;
    redraw(); save(); status.textContent = storageError || 'Conversación recuperada.';
  });
  document.getElementById('or-delete').addEventListener('click', () => {
    if (send.disabled || !window.confirm('¿Borrar todas las conversaciones y trazas guardadas en este navegador?')) return;
    try { localStorage.removeItem(STORAGE); } catch (_) { status.textContent = 'No se han podido borrar los datos guardados.'; return; }
    state = {version: 1, memory: [], movementKeys: {}, continuityKey: null, archives: []};
    storageError = ''; redraw(); status.textContent = 'Datos guardados borrados.';
  });
})();
