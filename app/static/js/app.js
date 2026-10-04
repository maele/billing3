import * as state from './state.js';
import * as view from './render.js';

const appRoot = document.getElementById('app');
const toastStack = document.getElementById('toast-stack');

// ---------- toast ----------
function toast(message, kind = 'info', timeout = 3500) {
  const tone = {
    info:    'border-l-stone-400',
    success: 'border-l-emerald-500',
    error:   'border-l-red-500',
  };
  const el = document.createElement('div');
  el.className = `pointer-events-auto min-w-[220px] max-w-sm bg-white border border-stone-200 border-l-2 ${tone[kind] || tone.info} rounded-md shadow-[0_4px_16px_rgba(15,23,42,0.08)] px-4 py-2.5 text-[13px] text-stone-700 animate-slidein`;
  el.textContent = message;
  toastStack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .2s, transform .2s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    setTimeout(() => el.remove(), 220);
  }, timeout);
}

// ---------- modal ----------
function openModal(title, bodyHTML, onSubmit) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-[2px] animate-fadein">
      <div class="w-full max-w-lg max-h-[90vh] overflow-auto bg-white rounded-lg shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)]" role="dialog" aria-modal="true">
        <header class="px-6 pt-5 pb-3 border-b border-stone-100 flex items-center justify-between">
          <h3 class="text-[15px] font-semibold text-stone-900">${view.esc(title)}</h3>
          <button type="button" class="text-stone-400 hover:text-stone-700 -m-1 p-1 transition-colors" id="modal-x">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </header>
        <form id="modal-form" class="px-6 py-5 space-y-4">
          ${bodyHTML}
          <div class="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button type="button" class="btn-ghost" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const close = () => { root.innerHTML = ''; };
  root.querySelector('#modal-cancel').addEventListener('click', close);
  root.querySelector('#modal-x').addEventListener('click', close);
  root.firstElementChild.addEventListener('click', e => {
    if (e.target === e.currentTarget) close();
  });
  const escHandler = e => {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
  };
  document.addEventListener('keydown', escHandler);
  root.querySelector('#modal-form').addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      const result = onSubmit(data);
      if (result !== false) close();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

function vendorModalBody(vendor = {}) {
  const styles = ['standard', 'modern', 'minimalist', 'creative', 'corporate', 'eco', 'tech'];
  const opts = styles.map(s =>
    `<option value="${s}"${vendor.template_style === s ? ' selected' : ''}>${s}</option>`
  ).join('');
  return `
    <div><label class="label">Name *</label><input type="text" name="name" value="${view.esc(vendor.name || '')}" required class="input"></div>
    <div class="grid grid-cols-2 gap-4">
      <div><label class="label">IBR#</label><input type="text" name="registration_number" value="${view.esc(vendor.registration_number || '')}" class="input"></div>
      <div><label class="label">Phone</label><input type="text" name="phone" value="${view.esc(vendor.phone || '')}" class="input"></div>
    </div>
    <div><label class="label">Email</label><input type="email" name="email" value="${view.esc(vendor.email || '')}" class="input"></div>
    <div><label class="label">Address</label><textarea name="address" rows="2" class="input">${view.esc(vendor.address || '')}</textarea></div>
    <div><label class="label">Logo</label><input type="file" name="logo" accept="image/png,image/jpeg,image/webp" class="input py-1.5 text-sm"></div>
    <div><label class="label">Template Style</label><select name="template_style" class="input">${opts}</select></div>
    <div><label class="label">Default Quotation Notes</label><textarea name="default_quotation_notes" rows="2" class="input">${view.esc(vendor.default_quotation_notes || '')}</textarea></div>
    <div><label class="label">Default Invoice Notes</label><textarea name="default_invoice_notes" rows="2" class="input">${view.esc(vendor.default_invoice_notes || '')}</textarea></div>
  `;
}

function clientModalBody(client = {}) {
  return `
    <div><label class="label">Name *</label><input type="text" name="name" value="${view.esc(client.name || '')}" required class="input"></div>
    <div class="grid grid-cols-2 gap-4">
      <div><label class="label">Contact Person</label><input type="text" name="contact_person" value="${view.esc(client.contact_person || '')}" class="input"></div>
      <div><label class="label">Phone</label><input type="text" name="phone" value="${view.esc(client.phone || '')}" class="input"></div>
    </div>
    <div><label class="label">Email</label><input type="email" name="email" value="${view.esc(client.email || '')}" class="input"></div>
    <div><label class="label">Address</label><textarea name="address" rows="3" class="input">${view.esc(client.address || '')}</textarea></div>
  `;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function collectVendorData(formEl) {
  const fd = new FormData(formEl);
  const data = Object.fromEntries(fd.entries());
  delete data.logo;
  const logoInput = formEl.querySelector('input[name="logo"]');
  const logoFile = logoInput && logoInput.files[0];
  if (logoFile) {
    if (logoFile.size > 1_500_000) throw new Error('Logo must be under 1.5 MB.');
    data.logo_data_uri = await readFileAsDataURL(logoFile);
  }
  return data;
}

// ---------- preview / pdf ----------
let previewTimer = null;

function collectLineItems(formEl) {
  const body = formEl.querySelector('#line-items-body');
  const items = [];
  body.querySelectorAll('.line-item').forEach(row => {
    const desc = row.querySelector('input[name="description"]').value;
    if (!desc.trim()) return;
    items.push({
      description: desc.trim(),
      specifications: row.querySelector('textarea[name="specifications"]').value,
      quantity: Number(row.querySelector('input[name="quantity"]').value) || 1,
      unit_price: row.querySelector('input[name="unit_price"]').value || '0.00',
    });
  });
  if (!items.length) {
    items.push({ description: '(empty)', specifications: '', quantity: 1, unit_price: '0.00' });
  }
  return items;
}

function collectDocumentFromForm(formEl) {
  return {
    id: formEl.dataset.docId,
    doc_type: formEl.doc_type.value,
    document_number: formEl.document_number.value,
    lot_number: formEl.lot_number.value.trim(),
    issue_date: formEl.issue_date.value,
    due_date: formEl.due_date.value,
    notes: formEl.notes.value,
    vendor_id: formEl.vendor_id.value,
    client_id: formEl.client_id.value,
    line_items: collectLineItems(formEl),
  };
}

async function refreshPreview(formEl) {
  const frame = document.getElementById('preview-frame');
  if (!frame) return;
  const doc = collectDocumentFromForm(formEl);
  const payload = state.payloadFor(doc);
  try {
    const res = await fetch('/api/render/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      frame.srcdoc = `<pre style="padding:1rem;color:#b91c1c;font-family:monospace;">Preview error: ${view.esc(body.error || res.status)}</pre>`;
      return;
    }
    frame.srcdoc = await res.text();
  } catch (err) {
    frame.srcdoc = `<pre style="padding:1rem;color:#b91c1c;font-family:monospace;">Preview failed: ${view.esc(err.message)}</pre>`;
  }
}

function schedulePreview(formEl, delay = 350) {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => refreshPreview(formEl), delay);
}

async function downloadPDF(formEl) {
  const doc = collectDocumentFromForm(formEl);
  const payload = state.payloadFor(doc);
  const res = await fetch('/api/render/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `PDF failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.document_number || 'document'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- views ----------
function renderRoute() {
  const hash = location.hash || '#/';
  const parts = hash.slice(2).split('/').filter(Boolean);
  if (parts.length === 0) return renderDashboard();
  if (parts[0] === 'vendors') return renderVendors();
  if (parts[0] === 'clients') return renderClients();
  if (parts[0] === 'documents' && parts[1] === 'new') return renderDocumentEditor(null);
  if (parts[0] === 'documents' && parts[1]) return renderDocumentEditor(parts[1]);
  renderDashboard();
}

function renderDashboard() {
  appRoot.innerHTML = view.dashboardView();
  const slot = document.getElementById('dashboard-content');
  slot.innerHTML = view.dashboardLists(state.getDocuments(), state.getVendor, state.getClient);

  slot.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === 'open')      location.hash = `#/documents/${id}`;
    if (action === 'convert') {
      if (!confirm('Create an invoice from this quotation?')) return;
      const inv = state.convertQuotationToInvoice(id);
      if (inv) {
        toast('Created invoice ' + inv.document_number, 'success');
        location.hash = '#/documents/' + inv.id;
      }
      return;
    }
    if (action === 'duplicate') {
      const copy = state.duplicateDocument(id);
      if (copy) { toast(`Duplicated as ${copy.document_number}`, 'success'); renderDashboard(); }
    }
    if (action === 'delete') {
      if (!confirm('Delete this document?')) return;
      state.deleteDocument(id);
      toast('Document deleted.', 'success');
      renderDashboard();
    }
  });
}

function renderVendors() {
  appRoot.innerHTML = view.vendorsView(state.getVendors());

  document.getElementById('btn-add-vendor').addEventListener('click', () => {
    openModal('Add Vendor', vendorModalBody(), async () => {
      try {
        const data = await collectVendorData(document.getElementById('modal-form'));
        if (!data.name) { toast('Name is required.', 'error'); return false; }
        state.addVendor(data);
        toast('Vendor added.', 'success');
        renderVendors();
      } catch (err) {
        toast(err.message, 'error');
        return false;
      }
    });
  });

  appRoot.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit-vendor') {
        const vendor = state.getVendor(id);
        openModal('Edit Vendor', vendorModalBody(vendor), async () => {
          try {
            const data = await collectVendorData(document.getElementById('modal-form'));
            state.updateVendor(id, data);
            toast('Vendor updated.', 'success');
            renderVendors();
          } catch (err) {
            toast(err.message, 'error');
            return false;
          }
        });
      }
      if (action === 'delete-vendor') {
        if (!confirm('Delete this vendor? Documents using it will lose their From info.')) return;
        state.deleteVendor(id);
        toast('Vendor deleted.', 'success');
        renderVendors();
      }
    });
  });
}

function renderClients() {
  appRoot.innerHTML = view.clientsView(state.getClients());

  document.getElementById('btn-add-client').addEventListener('click', () => {
    openModal('Add Client', clientModalBody(), data => {
      if (!data.name) { toast('Name is required.', 'error'); return false; }
      state.addClient(data);
      toast('Client added.', 'success');
      renderClients();
    });
  });

  appRoot.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit-client') {
        const client = state.getClient(id);
        openModal('Edit Client', clientModalBody(client), data => {
          state.updateClient(id, data);
          toast('Client updated.', 'success');
          renderClients();
        });
      }
      if (action === 'delete-client') {
        if (!confirm('Delete this client?')) return;
        state.deleteClient(id);
        toast('Client deleted.', 'success');
        renderClients();
      }
    });
  });
}

function renderDocumentEditor(docId) {
  let doc;
  if (docId) {
    doc = state.getDocument(docId);
    if (!doc) { toast('Document not found.', 'error'); location.hash = '#/'; return; }
  } else {
    doc = state.createBlankDocument('Quotation');
  }

  appRoot.innerHTML = view.documentEditorView(doc, state.getVendors(), state.getClients());
  const form = document.getElementById('doc-form');

  function maybeAutofillNotes() {
    const vendor = state.getVendor(form.vendor_id.value);
    if (!vendor) return;
    if (form.notes.value.trim()) return;
    const isQuote = form.doc_type.value === 'Quotation';
    const def = isQuote ? vendor.default_quotation_notes : vendor.default_invoice_notes;
    if (def) form.notes.value = def;
  }

  form.addEventListener('change', e => {
    if (e.target.name === 'vendor_id' || e.target.name === 'doc_type') {
      maybeAutofillNotes();
    }
    schedulePreview(form);
  });
  form.addEventListener('input', () => schedulePreview(form));

  form.addEventListener('click', e => {
    const btn = e.target.closest('.remove-btn');
    if (btn) {
      const body = document.getElementById('line-items-body');
      if (body.querySelectorAll('.line-item').length > 1) {
        btn.closest('.line-item').remove();
        schedulePreview(form, 0);
      }
    }
  });

  document.getElementById('add-row-btn').addEventListener('click', () => {
    const body = document.getElementById('line-items-body');
    const idx = body.querySelectorAll('.line-item').length;
    const temp = document.createElement('div');
    temp.innerHTML = view.lineItemRow({ description: '', specifications: '', quantity: 1, unit_price: '0.00' }, idx);
    body.appendChild(temp.firstElementChild);
    schedulePreview(form, 0);
  });

  document.getElementById('btn-refresh-preview').addEventListener('click', () => refreshPreview(form));
  document.getElementById('btn-print').addEventListener('click', () => {
    const frame = document.getElementById('preview-frame');
    if (frame && frame.contentWindow) frame.contentWindow.print();
  });

  document.getElementById('btn-download-pdf').addEventListener('click', async () => {
    try {
      await downloadPDF(form);
      toast('PDF downloaded.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  document.getElementById('btn-inline-vendor').addEventListener('click', () => {
    openModal('Add Vendor', vendorModalBody(), async () => {
      try {
        const data = await collectVendorData(document.getElementById('modal-form'));
        if (!data.name) { toast('Name is required.', 'error'); return false; }
        const created = state.addVendor(data);
        const select = form.vendor_id;
        const opt = document.createElement('option');
        opt.value = created.id;
        opt.textContent = created.name;
        opt.selected = true;
        select.appendChild(opt);
        maybeAutofillNotes();
        schedulePreview(form, 0);
        toast('Vendor added.', 'success');
      } catch (err) {
        toast(err.message, 'error');
        return false;
      }
    });
  });

  document.getElementById('btn-inline-client').addEventListener('click', () => {
    openModal('Add Client', clientModalBody(), data => {
      if (!data.name) { toast('Name is required.', 'error'); return false; }
      const created = state.addClient(data);
      const select = form.client_id;
      const opt = document.createElement('option');
      opt.value = created.id;
      opt.textContent = created.name;
      opt.selected = true;
      select.appendChild(opt);
      schedulePreview(form, 0);
      toast('Client added.', 'success');
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    try {
      const updated = collectDocumentFromForm(form);
      if (!updated.vendor_id) { toast('Pick a vendor.', 'error'); return; }
      if (!updated.client_id) { toast('Pick a client.', 'error'); return; }
      state.saveDocument(updated);
      toast('Document saved.', 'success');
      location.hash = '#/';
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  refreshPreview(form);
}

// ---------- navbar export/import/reset ----------
document.getElementById('btn-export').addEventListener('click', () => {
  const blob = new Blob([state.exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `billing3-workspace-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Exported.', 'success');
});

document.getElementById('btn-import').addEventListener('click', () => {
  document.getElementById('file-import').click();
});

document.getElementById('file-import').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (!confirm('Importing will replace your current workspace. Continue?')) return;
  try {
    const text = await file.text();
    state.importJSON(text);
    toast('Workspace imported.', 'success');
    location.hash = '#/';
    renderRoute();
  } catch (err) {
    toast(err.message, 'error');
  }
});

document.getElementById('btn-reset').addEventListener('click', () => {
  if (!confirm('This wipes everything in this browser. Export first if unsure. Continue?')) return;
  state.resetWorkspace();
  toast('Workspace reset.', 'success');
  location.hash = '#/';
  renderRoute();
});

// Keyboard: press "n" (when not typing) to create a new document
document.addEventListener('keydown', e => {
  const t = e.target;
  const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  if (typing) return;
  if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    location.hash = '#/documents/new';
  }
});
// ---------- boot ----------
window.addEventListener('hashchange', renderRoute);
renderRoute();
