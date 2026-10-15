/* ==========================================================
   Projeto Mercadinho — lógica da calculadora de compras
   Todos os valores são guardados em CENTAVOS (inteiros) para
   evitar erros de arredondamento de ponto flutuante.
   ========================================================== */
(() => {
  'use strict';

  const STORAGE_KEY = 'mercadinho:v1';
  const WARN_RATIO = 0.85;      // a partir de 85% do limite, alerta laranja
  const MAX_DIGITS = 9;         // até R$ 9.999.999,99
  const MAX_QTY_DIGITS = 3;     // até 999 unidades

  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmt = (cents) => money.format(cents / 100).replace(/ /g, ' ');

  const $ = (id) => document.getElementById(id);
  const el = {
    app: $('app'), screen: $('screen'), preview: $('preview'),
    budgetChip: $('budgetChip'), budgetChipValue: $('budgetChipValue'), newBtn: $('newBtn'),
    spent: $('spentValue'), remaining: $('remainingValue'), remainingLabel: $('remainingLabel'),
    count: $('countValue'), bar: $('bar'), barFill: $('barFill'),
    alert: $('alert'), alertTitle: $('alertTitle'), alertText: $('alertText'), alertTip: $('alertTip'),
    list: $('list'), empty: $('empty'), keypad: $('keypad'),
    addLabel: $('addLabel'), addSign: $('addSign'), cancelSetup: $('cancelSetup'),
    toast: $('toast'), toastText: $('toastText'), toastUndo: $('toastUndo'),
  };

  /* ---------- Estado ---------- */
  let state = load() || { budget: null, items: [], nextId: 1 };
  let mode = state.budget ? 'shop' : 'setup';
  let entry = { price: '', qty: '', qtyMode: false };
  let lastLevel = null;
  let toastTimer = null;
  let undoAction = null;

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (data && Array.isArray(data.items)) return data;
    } catch (_) { /* sem armazenamento: começa vazio */ }
    return null;
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  /* ---------- Cálculos ---------- */
  const lineTotal = (it) => it.price * it.qty;
  const spent = () => state.items.reduce((s, it) => s + lineTotal(it), 0);
  const entryPrice = () => parseInt(entry.price || '0', 10);
  const entryQty = () => Math.max(1, parseInt(entry.qty || '1', 10));
  const entryTotal = () => entryPrice() * entryQty();

  /* ---------- Entrada pelo teclado ---------- */
  function press(key) {
    vibrate(8);
    if (/^\d+$/.test(key)) return typeDigits(key);

    switch (key) {
      case 'back':
        if (entry.qtyMode) {
          if (entry.qty) entry.qty = entry.qty.slice(0, -1);
          else entry.qtyMode = false;
        } else {
          entry.price = entry.price.slice(0, -1);
        }
        break;
      case 'clear':
        entry = { price: '', qty: '', qtyMode: false };
        break;
      case 'times':
        if (mode !== 'shop') return;
        if (!entryPrice()) { flashPreview('Digite o preço primeiro, depois a quantidade'); return; }
        entry.qtyMode = !entry.qtyMode;
        if (!entry.qtyMode) entry.qty = '';
        break;
      case 'undo':
        if (mode !== 'shop' || !state.items.length) return;
        removeItem(state.items[state.items.length - 1].id);
        return;
      case 'add':
        mode === 'setup' ? confirmBudget() : addItem();
        return;
    }
    render();
  }

  function typeDigits(d) {
    if (entry.qtyMode) {
      if (d === '00' && !entry.qty) return;
      const next = (entry.qty + d).replace(/^0+/, '');
      if (next.length <= MAX_QTY_DIGITS) entry.qty = next;
    } else {
      const next = (entry.price + d).replace(/^0+/, '');
      if (next.length <= MAX_DIGITS) entry.price = next;
    }
    render();
  }

  /* ---------- Ações ---------- */
  function confirmBudget() {
    const value = entryPrice();
    if (!value) { shake(el.screen); flashPreview('Informe um valor maior que zero'); return; }
    state.budget = value;
    save();
    mode = 'shop';
    entry = { price: '', qty: '', qtyMode: false };
    lastLevel = null;
    render();
  }

  function addItem() {
    const price = entryPrice();
    if (!price) { shake(el.screen); flashPreview('Digite o preço do produto'); return; }
    state.items.push({ id: state.nextId++, price, qty: entryQty() });
    entry = { price: '', qty: '', qtyMode: false };
    save();
    render();
    el.list.parentElement.scrollTop = 0;
  }

  function removeItem(id) {
    const index = state.items.findIndex((it) => it.id === id);
    if (index < 0) return;
    const [removed] = state.items.splice(index, 1);
    save();
    render();
    showToast(`Item de ${fmt(lineTotal(removed))} removido`, () => {
      state.items.splice(index, 0, removed);
      save();
      render();
    });
  }

  function startBudgetEdit() {
    mode = 'setup';
    entry = { price: String(state.budget || ''), qty: '', qtyMode: false };
    render();
  }

  function cancelBudgetEdit() {
    mode = 'shop';
    entry = { price: '', qty: '', qtyMode: false };
    render();
  }

  function newPurchase() {
    if (state.items.length && !confirm('Começar uma nova compra? A lista atual será apagada.')) return;
    state = { budget: null, items: [], nextId: 1 };
    save();
    mode = 'setup';
    entry = { price: '', qty: '', qtyMode: false };
    lastLevel = null;
    render();
  }

  /* ---------- Renderização ---------- */
  function render() {
    el.app.dataset.mode = mode;
    renderScreen();

    if (mode === 'setup') {
      el.addSign.textContent = '✓';
      el.addLabel.textContent = state.budget ? 'Salvar' : 'Começar';
      el.cancelSetup.hidden = !state.budget;
      el.preview.className = 'preview';
      el.preview.textContent = state.budget ? 'Novo limite de gastos' : 'Limite de gastos';
      return;
    }

    el.addSign.textContent = '+';
    el.addLabel.textContent = 'Adicionar';
    const total = spent();
    const budget = state.budget;
    const left = budget - total;
    const ratio = total / budget;
    const level = total > budget ? 'over' : ratio >= WARN_RATIO ? 'warn' : 'ok';

    el.app.dataset.level = level;
    el.budgetChipValue.textContent = fmt(budget);
    el.spent.textContent = fmt(total);
    el.remainingLabel.textContent = left < 0 ? 'Passou' : 'Restante';
    el.remaining.textContent = fmt(Math.abs(left));
    el.count.textContent = state.items.reduce((s, it) => s + it.qty, 0);
    el.barFill.style.width = Math.min(100, ratio * 100) + '%';
    el.bar.setAttribute('aria-valuenow', Math.round(Math.min(100, ratio * 100)));

    renderAlert(total, budget);
    renderList();
    renderPreview(total, budget);

    el.keypad.querySelector('[data-key="undo"]').disabled = !state.items.length;
    el.keypad.querySelector('[data-key="times"]').classList.toggle('is-on', entry.qtyMode);

    if (level === 'over' && lastLevel && lastLevel !== 'over') {
      vibrate([60, 40, 60]);
      shake(el.alert);
    }
    lastLevel = level;
  }

  function renderScreen() {
    let html = fmt(entryPrice());
    if (entry.qtyMode) {
      html += ` <span class="qty">× ${entry.qty || '<span class="cursor">_</span>'}</span>`;
    }
    el.screen.innerHTML = html;
    fitScreen();
  }

  // Diminui a fonte do visor quando o número não cabe (como no iPhone)
  function fitScreen() {
    el.screen.style.fontSize = '';
    const max = el.screen.parentElement.clientWidth - 8;
    let size = parseFloat(getComputedStyle(el.screen).fontSize);
    while (el.screen.scrollWidth > max && size > 24) {
      size -= 2;
      el.screen.style.fontSize = size + 'px';
    }
  }

  function renderPreview(total, budget) {
    const value = entryTotal();
    el.preview.className = 'preview';
    if (!entryPrice()) {
      el.preview.textContent = entry.qtyMode ? 'Digite a quantidade'
        : total > budget ? ' '
        : `Você ainda pode gastar ${fmt(budget - total)}`;
      return;
    }
    const after = total + value;
    const qtyInfo = entryQty() > 1 ? `${entryQty()} × ${fmt(entryPrice())} = ${fmt(value)} · ` : '';
    if (after > budget) {
      el.preview.classList.add('is-warn');
      el.preview.textContent = total > budget
        ? `${qtyInfo}Vai passar ${fmt(after - budget)} do limite`
        : `${qtyInfo}Este item vai passar ${fmt(after - budget)} do limite`;
    } else {
      el.preview.classList.add('is-ok');
      el.preview.textContent = `${qtyInfo}Depois deste item, restam ${fmt(budget - after)}`;
    }
  }

  function renderAlert(total, budget) {
    if (total <= budget) { el.alert.hidden = true; clearHighlight(); return; }
    const over = total - budget;
    el.alert.hidden = false;
    el.alertTitle.textContent = `Você passou ${fmt(over)} do limite`;
    el.alertText.innerHTML =
      `Para inteirar, você precisará de mais <strong>${fmt(over)}</strong> ` +
      `(total <strong>${fmt(total)}</strong>).`;

    // Sugestão: o item mais barato que, sozinho, resolve o estouro
    const fix = state.items
      .filter((it) => lineTotal(it) >= over)
      .sort((a, b) => lineTotal(a) - lineTotal(b))[0];
    if (fix) {
      const n = state.items.indexOf(fix) + 1;
      el.alertTip.textContent = `Dica: tire o item ${n} (${fmt(lineTotal(fix))}) e volte ao limite.`;
      highlight(fix.id);
    } else {
      el.alertTip.textContent = 'Dica: toque no × dos itens para removê-los.';
      clearHighlight();
    }
  }

  let highlighted = null;
  function highlight(id) { highlighted = id; }
  function clearHighlight() { highlighted = null; }

  function renderList() {
    el.empty.hidden = state.items.length > 0;
    el.list.innerHTML = state.items.map((it, i) => `
      <li class="item${it.id === highlighted ? ' highlight' : ''}">
        <span class="item-n">${i + 1}</span>
        <span class="item-desc">${it.qty > 1 ? `${it.qty} × ${fmt(it.price)}` : ''}</span>
        <span class="item-total">${fmt(lineTotal(it))}</span>
        <button type="button" class="item-del" data-remove="${it.id}" aria-label="Remover item ${i + 1}">×</button>
      </li>`).join('');
  }

  /* ---------- Feedback ---------- */
  let previewTimer = null;
  function flashPreview(text) {
    clearTimeout(previewTimer);
    el.preview.className = 'preview is-warn';
    el.preview.textContent = text;
    previewTimer = setTimeout(render, 1800);
  }

  function shake(node) {
    node.classList.remove('shake');
    void node.offsetWidth; // reinicia a animação
    node.classList.add('shake');
  }

  function vibrate(pattern) {
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (_) {} }
  }

  function showToast(text, onUndo) {
    clearTimeout(toastTimer);
    undoAction = onUndo;
    el.toastText.textContent = text;
    el.toast.hidden = false;
    toastTimer = setTimeout(hideToast, 4000);
  }
  function hideToast() { el.toast.hidden = true; undoAction = null; }

  /* ---------- Eventos ---------- */
  el.keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-key]');
    if (btn && !btn.disabled) press(btn.dataset.key);
  });

  el.list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (btn) removeItem(Number(btn.dataset.remove));
  });

  document.querySelectorAll('[data-quick]').forEach((btn) =>
    btn.addEventListener('click', () => { entry.price = btn.dataset.quick; confirmBudget(); }));

  el.budgetChip.addEventListener('click', startBudgetEdit);
  el.cancelSetup.addEventListener('click', cancelBudgetEdit);
  el.newBtn.addEventListener('click', newPurchase);
  el.toastUndo.addEventListener('click', () => { if (undoAction) undoAction(); hideToast(); });

  // Teclado físico (computador)
  const keyMap = { Backspace: 'back', Delete: 'clear', Escape: 'clear', Enter: 'add', '+': 'add', '=': 'add', '*': 'times', x: 'times', X: 'times', '-': 'undo' };
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = /^\d$/.test(e.key) ? e.key : keyMap[e.key];
    if (!key) return;
    e.preventDefault();
    const btn = el.keypad.querySelector(`[data-key="${key}"]`);
    if (btn) { btn.classList.add('pressed'); setTimeout(() => btn.classList.remove('pressed'), 120); }
    if (!btn || !btn.disabled) press(key);
  });

  window.addEventListener('resize', fitScreen);

  // Funciona offline quando publicado (GitHub Pages usa HTTPS)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  render();
})();
