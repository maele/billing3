// Workspace model. localStorage is the only persistence layer.
const STORAGE_KEY = 'billing3.workspace.v1';
const SCHEMA_VERSION = 1;

function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function yearCode() {
  return String(new Date().getFullYear()).slice(-2);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function defaultState() {
  return {
    schema: SCHEMA_VERSION,
    vendors: [],
    clients: [],
    documents: [],
    counters: {},
    settings: { default_template_style: 'standard' },
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schema !== SCHEMA_VERSION) return defaultState();
    return { ...defaultState(), ...parsed };
  } catch (err) {
    console.error('Failed to load workspace:', err);
    return defaultState();
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save workspace:', err);
    throw new Error('Browser storage is full. Export your data, then reset.');
  }
}

export function getState()        { return state; }
export function getVendors()      { return state.vendors; }
export function getClients()      { return state.clients; }
export function getDocuments()    { return state.documents; }
export function getVendor(id)     { return state.vendors.find(v => v.id === id); }
export function getClient(id)     { return state.clients.find(c => c.id === id); }
export function getDocument(id)   { return state.documents.find(d => d.id === id); }
export function today()           { return todayISO(); }

export function resetWorkspace() {
  state = defaultState();
  save();
}

export function exportJSON() {
  return JSON.stringify(
    { ...state, exported_at: new Date().toISOString() },
    null, 2,
  );
}

export function importJSON(text) {
  let parsed;
  try { parsed = JSON.parse(text); }
  catch { throw new Error('File is not valid JSON.'); }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('JSON file must contain an object.');
  }
  if (!Array.isArray(parsed.vendors) || !Array.isArray(parsed.clients) || !Array.isArray(parsed.documents)) {
    throw new Error('JSON file is missing vendors, clients, or documents.');
  }
  state = {
    ...defaultState(),
    vendors: parsed.vendors,
    clients: parsed.clients,
    documents: parsed.documents,
    counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
    settings: parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : { default_template_style: 'standard' },
  };
  save();
}

export function nextDocumentNumber(docType) {
  const prefix = docType === 'Invoice' ? 'I' : 'Q';
  const year = yearCode();
  const existing = new Set(state.documents.map(d => d.document_number));

  // Numeric portion is drawn uniformly from [999, 99999] — never below 999.
  // Zero-padded to 5 digits so the field width stays constant.
  for (let attempt = 0; attempt < 200; attempt++) {
    const n = Math.floor(Math.random() * (99999 - 999 + 1)) + 999;
    const candidate = `${prefix}${year}-${String(n).padStart(5, '0')}`;
    if (!existing.has(candidate)) return candidate;
  }

  // Fallback: deterministic sweep from a random starting point.
  // Only runs if 200 random draws all collide, which is astronomically
  // unlikely for any realistic dataset.
  const start = Math.floor(Math.random() * 90000) + 999;
  for (let i = 0; i < 90000; i++) {
    const n = ((start + i - 999) % 90000) + 999;
    const candidate = `${prefix}${year}-${String(n).padStart(5, '0')}`;
    if (!existing.has(candidate)) return candidate;
  }
  throw new Error('Document number space exhausted for this year.');
}

// ---- vendors ----
export function addVendor(data) {
  const vendor = {
    id: uid(),
    name: data.name || '',
    registration_number: data.registration_number || '',
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
    logo_data_uri: data.logo_data_uri || '',
    template_style: data.template_style || 'standard',
    default_quotation_notes: data.default_quotation_notes || '',
    default_invoice_notes: data.default_invoice_notes || '',
  };
  state.vendors.push(vendor);
  save();
  return vendor;
}

export function updateVendor(id, data) {
  const v = getVendor(id);
  if (!v) return null;
  Object.assign(v, data);
  save();
  return v;
}

export function deleteVendor(id) {
  state.vendors = state.vendors.filter(v => v.id !== id);
  save();
}

// ---- clients ----
export function addClient(data) {
  const client = {
    id: uid(),
    name: data.name || '',
    contact_person: data.contact_person || '',
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
  };
  state.clients.push(client);
  save();
  return client;
}

export function updateClient(id, data) {
  const c = getClient(id);
  if (!c) return null;
  Object.assign(c, data);
  save();
  return c;
}

export function deleteClient(id) {
  state.clients = state.clients.filter(c => c.id !== id);
  save();
}

// ---- documents ----
export function createBlankDocument(docType = 'Quotation') {
  return {
    id: uid(),
    doc_type: docType,
    document_number: nextDocumentNumber(docType),
    lot_number: '',
    issue_date: todayISO(),
    due_date: '',
    notes: '',
    vendor_id: '',
    client_id: '',
    line_items: [{ description: '', specifications: '', quantity: 1, unit_price: '0.00' }],
  };
}

export function saveDocument(doc) {
  const existing = getDocument(doc.id);
  if (existing) {
    Object.assign(existing, doc);
    save();
    return existing;
  }
  state.documents.push({ ...doc });
  save();
  return doc;
}

export function deleteDocument(id) {
  state.documents = state.documents.filter(d => d.id !== id);
  save();
}

export function duplicateDocument(id) {
  const src = getDocument(id);
  if (!src) return null;
  const copy = {
    ...JSON.parse(JSON.stringify(src)),
    id: uid(),
    document_number: nextDocumentNumber(src.doc_type),
    issue_date: todayISO(),
  };
  state.documents.push(copy);
  save();
  return copy;
}

export function payloadFor(doc) {
  return {
    document: {
      doc_type: doc.doc_type,
      document_number: doc.document_number,
      lot_number: doc.lot_number,
      issue_date: doc.issue_date,
      due_date: doc.due_date,
      notes: doc.notes,
      line_items: doc.line_items,
    },
    vendor: getVendor(doc.vendor_id) || { name: '', template_style: 'standard' },
    client: getClient(doc.client_id) || { name: '' },
  };
}

export function convertQuotationToInvoice(id) {
  const src = getDocument(id);
  if (!src || src.doc_type !== 'Quotation') return null;
  const invoice = {
    ...JSON.parse(JSON.stringify(src)),
    id: uid(),
    doc_type: 'Invoice',
    document_number: nextDocumentNumber('Invoice'),
    issue_date: todayISO(),
  };
  state.documents.push(invoice);
  save();
  return invoice;
}
