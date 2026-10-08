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

  function appendAnswerText(body, text) {
    // Render only paired bold markers. All content remains text nodes;
    // HTML, scripts and links from model output are never executed.
    // Some outputs escape the markers as \*\*: accept paired escaped
    // markers too, without unescaping any other user/model content.
    const source = String(text || '');
    const pattern = /(\*\*|\\\*\\\*)([^\n]+?)\1/g;
    let cursor = 0;
    for (const match of source.matchAll(pattern)) {
      body.appendChild(document.createTextNode(source.slice(cursor, match.index)));
      const strong = document.createElement('strong'); strong.textContent = match[2];
      body.appendChild(strong);
      cursor = match.index + match[0].length;
    }
    body.appendChild(document.createTextNode(source.slice(cursor)));
  }

  function addMessage(role, text, key, scroll = true) {
    const article = document.createElement('article'); article.className = `or-message ${role}`;
    if (role === 'assistant') {
      const label = document.createElement('span'); label.className = 'or-message-label'; label.textContent = 'Oraclia'; article.appendChild(label);
    }
    const body = document.createElement('div');
    if (role === 'assistant') appendAnswerText(body, text);
    else body.textContent = text;
    article.appendChild(body);
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

  // Import the complete JSON produced by Guardar copia; a bare key is not a conversation.
  const importButton = document.createElement('button');
  importButton.type = 'button'; importButton.id = 'or-import';
  importButton.textContent = 'Cargar conversación';
  document.getElementById('or-export').after(importButton);
  const importFile = document.createElement('input');
  importFile.type = 'file'; importFile.id = 'or-import-file';
  importFile.accept = '.json,application/json'; importFile.hidden = true;
  importButton.after(importFile);
  let importing = false;

  function validateImport(value) {
    const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
    const strings = v => Array.isArray(v) && v.every(s => typeof s === 'string');
    function rejectUnsafe(v) {
      if (!v || typeof v !== 'object') return;
      for (const k of Object.keys(v)) {
        if (['__proto__', 'constructor', 'prototype'].includes(k)) throw Error('El archivo contiene campos no admitidos.');
        rejectUnsafe(v[k]);
      }
    }
    rejectUnsafe(value);
    function conversation(c) {
      if (!object(c) || !Array.isArray(c.memory) || c.memory.length > 2000 ||
          !object(c.movementKeys) || (c.continuityKey != null && typeof c.continuityKey !== 'string')) throw Error('El archivo no es una copia completa de Oraclia.');
      for (const t of c.memory) {
        if (!object(t) || typeof t.user !== 'string' || typeof t.assistant !== 'string' ||
            (t.turn_id != null && typeof t.turn_id !== 'string')) throw Error('Hay mensajes con un formato no válido.');
      }
      for (const key of Object.values(c.movementKeys)) {
        if (!object(key) || typeof key.turn_id !== 'string' ||
            (key.symbols != null && !strings(key.symbols)) ||
            (key.alternatives != null && !strings(key.alternatives))) throw Error('Hay trazas con un formato no válido.');
        if (key.relations != null && (!Array.isArray(key.relations) ||
            !key.relations.every(r => object(r) && (r.members == null || strings(r.members))))) throw Error('Hay relaciones con un formato no válido.');
        if (key.absences != null && (!Array.isArray(key.absences) || !key.absences.every(object))) throw Error('Hay ausencias con un formato no válido.');
        if (key.symbol_change && (!object(key.symbol_change) ||
            !['kept','added','removed'].every(k => strings(key.symbol_change[k])))) throw Error('Hay cambios de símbolos con un formato no válido.');
        if (key.usage && (!object(key.usage) || (key.usage.stages != null &&
            (!Array.isArray(key.usage.stages) || !key.usage.stages.every(object))))) throw Error('Hay registros de uso con un formato no válido.');
      }
    }
    if (!object(value) || value.version !== 1 || !Array.isArray(value.archives) ||
        value.archives.length > 2000) throw Error('Selecciona el JSON completo de «Guardar copia», no una traza suelta.');
    conversation(value);
    value.archives.forEach(a => {
      conversation(a);
      if (typeof a.saved_at !== 'string' || !Number.isFinite(Date.parse(a.saved_at))) throw Error('Hay conversaciones guardadas con un formato no válido.');
    });
    return value;
  }

  importButton.addEventListener('click', () => {
    if (!send.disabled && !importing) importFile.click();
  });
  importFile.addEventListener('change', async () => {
    const file = importFile.files[0];
    if (!file || send.disabled || importing) { importFile.value = ''; return; }
    importing = true; send.disabled = true; importButton.disabled = true;
    try {
      if (file.size > 10 * 1024 * 1024) throw Error('El archivo supera el máximo de 10 MB.');
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(Error('No se ha podido leer el archivo.'));
        reader.readAsText(file);
      });
      let loaded;
      try { loaded = JSON.parse(text); } catch (_) { throw Error('El archivo no contiene JSON válido.'); }
      validateImport(loaded);
      const archives = [...state.archives];
      if (state.memory.length) archives.push({saved_at:new Date().toISOString(),memory:state.memory,movementKeys:state.movementKeys,continuityKey:state.continuityKey});
      archives.push(...loaded.archives);
      const next = {version:1,memory:loaded.memory,movementKeys:loaded.movementKeys,continuityKey:loaded.continuityKey || null,archives};
      // Persist before replacing the active conversation: quota errors preserve current data.
      try { localStorage.setItem(STORAGE, JSON.stringify(next)); }
      catch (_) { throw Error('No hay espacio para guardar esta copia. La conversación actual sigue intacta.'); }
      state = next; storageError = ''; redraw();
      status.textContent = 'Conversación cargada con su traza. La anterior sigue guardada. Al enviar un mensaje, el contexto recuperado se enviará a Oraclia.';
      input.focus();
    } catch (error) {
      status.textContent = error.message || 'No se ha podido cargar la conversación.';
    } finally {
      importing = false; send.disabled = false; importButton.disabled = false; importFile.value = '';
    }
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
