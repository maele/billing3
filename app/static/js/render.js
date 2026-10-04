const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  if (value == null) return '';
  return String(value).replace(/[&<>"']/g, c => ESC_MAP[c]);
}

export function fmtMoney(value) {
  const n = Number(value);
  if (!isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function docTotal(doc) {
  return (doc.line_items || []).reduce((sum, item) => {
    const q = Number(item.quantity) || 0;
    const p = Number(item.unit_price) || 0;
    return sum + q * p;
  }, 0);
}

const ICON = {
  plus:   '<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  empty:  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/></svg>',
  user:   '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
  brief:  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
};

/* ---------- Dashboard ---------- */

export function dashboardView() {
  return `
    <div class="flex items-end justify-between mb-8">
      <div>
        <p class="eyebrow mb-1.5">Overview</p>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-stone-900 leading-none">Dashboard</h1>
      </div>
      <a href="#/documents/new" class="btn-primary">${ICON.plus} New document</a>
    </div>
    <div id="dashboard-content"></div>
  `;
}

export function dashboardLists(documents, getVendor, getClient) {
  const row = (d) => {
    const vendor = getVendor(d.vendor_id);
    const client = getClient(d.client_id);
    return `
      <tr class="row ${d.doc_type === 'Invoice' ? 'row-invoice' : 'row-quote'}" data-doc-id="${esc(d.id)}">
        <td class="py-3 pl-4 pr-3">
          <div class="num text-stone-900 font-medium">${esc(d.document_number)}</div>
          <div class="text-[11px] text-stone-400 mt-0.5">${esc(d.doc_type)}</div>
        </td>
        <td class="py-3 px-3 text-[13px] text-stone-700">${esc(vendor ? vendor.name : '—')}</td>
        <td class="py-3 px-3 text-[13px] text-stone-500">${esc(client ? client.name : '—')}</td>
        <td class="py-3 px-3 text-[13px] text-stone-500 whitespace-nowrap">${esc(d.issue_date || '')}</td>
        <td class="py-3 px-3 text-right num text-stone-900">${fmtMoney(docTotal(d))}</td>
        <td class="py-3 pl-3 pr-4">
          <div class="row-actions">
            <button type="button" class="btn-outline btn-sm" data-action="open" data-id="${esc(d.id)}">Open</button>
            ${d.doc_type === 'Quotation' ? `<button type="button" class="btn-ghost btn-sm" data-action="convert" data-id="${esc(d.id)}" title="Convert to Invoice">Invoice</button>` : ''}
            <button type="button" class="btn-ghost btn-sm" data-action="duplicate" data-id="${esc(d.id)}" title="Duplicate">Copy</button>
            <button type="button" class="btn-danger btn-sm btn-icon" data-action="delete" data-id="${esc(d.id)}" title="Delete">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  };

  const empty = (kind) => `
    <tr><td colspan="6" class="py-16 text-center">
      <div class="inline-flex flex-col items-center gap-3 text-stone-300">
        ${ICON.empty}
        <p class="text-[13px] text-stone-400">No ${kind} yet.</p>
        <a href="#/documents/new" class="btn-outline btn-sm mt-1">Create one</a>
      </div>
    </td></tr>`;

  const panel = (title, count, rowsHTML, emptyKind) => `
    <section class="panel overflow-hidden">
      <header class="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/80">
        <div class="flex items-center gap-2.5">
          <h2 class="eyebrow">${title}</h2>
          <span class="num text-[11px] text-stone-400">${String(count).padStart(2,'0')}</span>
        </div>
      </header>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>
    </section>`;

  const quotations = documents.filter(d => d.doc_type === 'Quotation');
  const invoices = documents.filter(d => d.doc_type === 'Invoice');

  return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      ${panel('Quotations', quotations.length, quotations.length ? quotations.map(row).join('') : empty('quotations'), 'quotations')}
      ${panel('Invoices', invoices.length, invoices.length ? invoices.map(row).join('') : empty('invoices'), 'invoices')}
    </div>
  `;
}

/* ---------- Vendors ---------- */

export function vendorsView(vendors) {
  if (!vendors.length) {
    return `
      <div class="flex items-end justify-between mb-8">
        <div>
          <p class="eyebrow mb-1.5">Directory</p>
          <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-stone-900 leading-none">Vendors</h1>
        </div>
      </div>
      <div class="panel py-16 text-center">
        <div class="inline-flex flex-col items-center gap-3 text-stone-300">
          ${ICON.brief}
          <p class="text-[13px] text-stone-400">No vendors yet.</p>
          <button type="button" class="btn-primary btn-sm mt-1" id="btn-add-vendor">${ICON.plus} Add vendor</button>
        </div>
      </div>`;
  }

  const rows = vendors.map(v => `
    <tr class="row">
      <td class="py-3 pl-4 pr-3">
        <div class="flex items-center gap-3">
          ${v.logo_data_uri
            ? `<img src="${esc(v.logo_data_uri)}" alt="" class="w-7 h-7 rounded object-contain bg-white border border-stone-200 p-0.5">`
            : `<div class="w-7 h-7 rounded bg-stone-100 flex items-center justify-center text-[11px] font-semibold text-stone-500">${esc((v.name || '?').charAt(0).toUpperCase())}</div>`}
          <span class="text-[13.5px] font-medium text-stone-900">${esc(v.name)}</span>
        </div>
      </td>
      <td class="py-3 px-3 num text-stone-600">${esc(v.registration_number || '—')}</td>
      <td class="py-3 px-3 text-[13px] text-stone-600">${esc(v.email || '—')}</td>
      <td class="py-3 px-3">
        <span class="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">${esc(v.template_style || 'standard')}</span>
      </td>
      <td class="py-3 pl-3 pr-4">
        <div class="row-actions">
          <button type="button" class="btn-outline btn-sm" data-action="edit-vendor" data-id="${esc(v.id)}">Edit</button>
          <button type="button" class="btn-danger btn-sm btn-icon" data-action="delete-vendor" data-id="${esc(v.id)}" title="Delete">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');

  return `
    <div class="flex items-end justify-between mb-8">
      <div>
        <p class="eyebrow mb-1.5">Directory</p>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-stone-900 leading-none">Vendors</h1>
      </div>
      <button type="button" class="btn-primary" id="btn-add-vendor">${ICON.plus} Add vendor</button>
    </div>
    <section class="panel overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="hidden md:table-header-group">
            <tr class="eyebrow">
              <th class="py-3 pl-4 pr-3 font-medium">Name</th>
              <th class="py-3 px-3 font-medium">IBR#</th>
              <th class="py-3 px-3 font-medium">Email</th>
              <th class="py-3 px-3 font-medium">Template</th>
              <th class="py-3 pl-3 pr-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">${rows}</tbody>
        </table>
      </div>
    </section>`;
}

/* ---------- Clients ---------- */

export function clientsView(clients) {
  if (!clients.length) {
    return `
      <div class="flex items-end justify-between mb-8">
        <div>
          <p class="eyebrow mb-1.5">Directory</p>
          <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-stone-900 leading-none">Clients</h1>
        </div>
      </div>
      <div class="panel py-16 text-center">
        <div class="inline-flex flex-col items-center gap-3 text-stone-300">
          ${ICON.user}
          <p class="text-[13px] text-stone-400">No clients yet.</p>
          <button type="button" class="btn-primary btn-sm mt-1" id="btn-add-client">${ICON.plus} Add client</button>
        </div>
      </div>`;
  }

  const rows = clients.map(c => `
    <tr class="row">
      <td class="py-3 pl-4 pr-3">
        <div class="flex items-center gap-3">
          <div class="w-7 h-7 rounded bg-stone-100 flex items-center justify-center text-[11px] font-semibold text-stone-500">${esc((c.name || '?').charAt(0).toUpperCase())}</div>
          <span class="text-[13.5px] font-medium text-stone-900">${esc(c.name)}</span>
        </div>
      </td>
      <td class="py-3 px-3 text-[13px] text-stone-600">${esc(c.email || '—')}</td>
      <td class="py-3 px-3 num text-stone-600">${esc(c.phone || '—')}</td>
      <td class="py-3 pl-3 pr-4">
        <div class="row-actions">
          <button type="button" class="btn-outline btn-sm" data-action="edit-client" data-id="${esc(c.id)}">Edit</button>
          <button type="button" class="btn-danger btn-sm btn-icon" data-action="delete-client" data-id="${esc(c.id)}" title="Delete">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');

  return `
    <div class="flex items-end justify-between mb-8">
      <div>
        <p class="eyebrow mb-1.5">Directory</p>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-stone-900 leading-none">Clients</h1>
      </div>
      <button type="button" class="btn-primary" id="btn-add-client">${ICON.plus} Add client</button>
    </div>
    <section class="panel overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="hidden md:table-header-group">
            <tr class="eyebrow">
              <th class="py-3 pl-4 pr-3 font-medium">Name</th>
              <th class="py-3 px-3 font-medium">Email</th>
              <th class="py-3 px-3 font-medium">Phone</th>
              <th class="py-3 pl-3 pr-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">${rows}</tbody>
        </table>
      </div>
    </section>`;
}

/* ---------- Document editor ---------- */

export function documentEditorView(doc, vendors, clients) {
  const vendorOptions = ['<option value="">Select a vendor</option>']
    .concat(vendors.map(v => `<option value="${esc(v.id)}"${v.id === doc.vendor_id ? ' selected' : ''}>${esc(v.name)}</option>`))
    .join('');
  const clientOptions = ['<option value="">Select a client</option>']
    .concat(clients.map(c => `<option value="${esc(c.id)}"${c.id === doc.client_id ? ' selected' : ''}>${esc(c.name)}</option>`))
    .join('');

  const rows = doc.line_items.map((item, idx) => lineItemRow(item, idx)).join('');

  return `
    <div class="flex items-end justify-between mb-8 gap-4 flex-wrap">
      <div>
        <p class="eyebrow mb-1.5">${doc.doc_type === 'Invoice' ? 'Invoice' : 'Quotation'}</p>
        <h1 class="num text-[22px] font-medium tracking-[-0.01em] text-stone-900 leading-none">${esc(doc.document_number)}</h1>
      </div>
      <a href="#/" class="btn-ghost btn-sm">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Back
      </a>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-5 items-start">
      <form id="doc-form" data-doc-id="${esc(doc.id)}" autocomplete="off" class="panel p-6 space-y-6">

        <section>
          <h2 class="eyebrow mb-3.5">Details</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Type</label>
              <select name="doc_type" class="input">
                <option value="Quotation"${doc.doc_type === 'Quotation' ? ' selected' : ''}>Quotation</option>
                <option value="Invoice"${doc.doc_type === 'Invoice' ? ' selected' : ''}>Invoice</option>
              </select>
            </div>
            <div>
              <label class="label">Number</label>
              <input type="text" name="document_number" value="${esc(doc.document_number)}" readonly class="input input-readonly">
            </div>
          </div>
        </section>

        <div class="hairline"></div>

        <section>
          <h2 class="eyebrow mb-3.5">Parties</h2>
          <div class="space-y-4">
            <div>
              <label class="label">Vendor (From)</label>
              <div class="flex gap-2">
                <select name="vendor_id" class="input flex-1">${vendorOptions}</select>
                <button type="button" class="btn-outline btn-icon" id="btn-inline-vendor" title="Add new vendor">${ICON.plus}</button>
              </div>
            </div>
            <div>
              <label class="label">Client (To)</label>
              <div class="flex gap-2">
                <select name="client_id" class="input flex-1">${clientOptions}</select>
                <button type="button" class="btn-outline btn-icon" id="btn-inline-client" title="Add new client">${ICON.plus}</button>
              </div>
            </div>
          </div>
        </section>

        <div class="hairline"></div>

        <section>
          <h2 class="eyebrow mb-3.5">Dates</h2>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="label">Issued</label>
              <input type="date" name="issue_date" value="${esc(doc.issue_date || '')}" class="input">
            </div>
            <div>
              <label class="label">Due</label>
              <input type="date" name="due_date" value="${esc(doc.due_date || '')}" class="input">
            </div>
            <div>
              <label class="label">Lot</label>
              <input type="text" name="lot_number" value="${esc(doc.lot_number || '')}" class="input" placeholder="optional">
            </div>
          </div>
        </section>

        <div class="hairline"></div>

        <section>
          <div class="flex items-center justify-between mb-3.5">
            <h2 class="eyebrow">Line items</h2>
            <span class="num text-[11px] text-stone-400 hidden sm:inline">${doc.line_items.length} row${doc.line_items.length === 1 ? '' : 's'}</span>
          </div>
          <div class="rounded-md border border-stone-200 overflow-hidden bg-white">
            <div class="hidden sm:grid grid-cols-[minmax(0,1fr)_5rem_7rem_2.5rem] gap-3 px-3.5 py-2.5 bg-stone-50 border-b border-stone-200 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">
              <div>Description</div>
              <div>Qty</div>
              <div>Price</div>
              <div></div>
            </div>
            <div id="line-items-body">${rows}</div>
          </div>
          <div class="mt-3 flex">
            <button type="button" id="add-row-btn" class="btn-outline btn-sm w-full justify-center sm:w-auto sm:ml-auto">
              ${ICON.plus} Add line item
            </button>
          </div>
        </section>

        <div class="hairline"></div>

        <section>
          <h2 class="eyebrow mb-3.5">Notes</h2>
          <textarea name="notes" rows="4" class="input" placeholder="Terms, payment info, bank details…">${esc(doc.notes || '')}</textarea>
        </section>

        <div class="flex flex-wrap gap-2 pt-1">
          <button type="submit" class="btn-primary">Save document</button>
          <button type="button" class="btn-outline" id="btn-download-pdf">Download PDF</button>
          <button type="button" class="btn-ghost" id="btn-print">Print</button>
        </div>
      </form>

      <aside class="xl:sticky xl:top-20">
        <div class="panel overflow-hidden">
          <header class="flex items-center justify-between px-4 py-2.5 border-b border-stone-200/80">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span class="eyebrow">Live preview</span>
            </div>
            <button type="button" class="btn-ghost btn-sm" id="btn-refresh-preview">Refresh</button>
          </header>
          <iframe id="preview-frame" title="Preview" class="w-full block border-0 bg-white" style="height: 78vh;"></iframe>
        </div>
      </aside>
    </div>
  `;
}

export function lineItemRow(item, idx) {
  return `
    <div class="line-item grid grid-cols-2 gap-2.5 p-4 border-b border-stone-100 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_5rem_7rem_2.5rem] sm:items-start sm:py-3 sm:px-3.5 sm:gap-3" data-idx="${idx}">
      <div class="col-span-2 sm:col-span-1">
        <label class="block sm:hidden text-[10.5px] font-medium uppercase tracking-[0.08em] text-stone-500 mb-1.5">Description &amp; specs</label>
        <input type="text" name="description" value="${esc(item.description || '')}" placeholder="Item description" class="input text-[13px]">
        <textarea name="specifications" rows="2" placeholder="Specifications (optional)" class="input text-[12.5px] mt-1.5">${esc(item.specifications || '')}</textarea>
      </div>
      <div>
        <label class="block sm:hidden text-[10.5px] font-medium uppercase tracking-[0.08em] text-stone-500 mb-1.5">Qty</label>
        <input type="number" name="quantity" value="${esc(item.quantity || 1)}" min="1" step="1" class="input num text-[13px] text-center sm:text-left">
      </div>
      <div>
        <label class="block sm:hidden text-[10.5px] font-medium uppercase tracking-[0.08em] text-stone-500 mb-1.5">Price</label>
        <input type="number" name="unit_price" value="${esc(item.unit_price || '0.00')}" min="0" step="0.01" class="input num text-[13px] text-center sm:text-left">
      </div>
      <div class="col-span-2 sm:col-span-1 flex justify-end sm:justify-center sm:pt-0.5">
        <button type="button" class="remove-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Remove line item">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span class="sm:hidden">Remove</span>
        </button>
      </div>
    </div>
  `;
}
