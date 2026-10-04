"""Turn an untrusted JSON payload into a namespace tree safe for templates,
and render it to HTML or PDF. Nothing is persisted.
"""
import os
from decimal import Decimal, InvalidOperation
from types import SimpleNamespace

from flask import current_app, render_template
from weasyprint import HTML

from .constants import resolve_template_style

DOCUMENT_CSS_RELPATH = os.path.join('static', 'css', 'documents.css')


class PayloadError(ValueError):
    pass


def _require(obj, key, label):
    if not isinstance(obj, dict) or key not in obj:
        raise PayloadError(f"Missing {label}")
    return obj[key]


def _to_decimal(value) -> Decimal:
    try:
        return Decimal(str(value)).quantize(Decimal('0.01'))
    except (InvalidOperation, TypeError, ValueError):
        raise PayloadError(f"Invalid money value: {value!r}")


def _to_int(value, label, minimum=1) -> int:
    try:
        n = int(value)
    except (TypeError, ValueError):
        raise PayloadError(f"{label} must be an integer")
    if n < minimum:
        raise PayloadError(f"{label} must be >= {minimum}")
    return n


def _clean(value, max_len=4000) -> str:
    if value is None:
        return ''
    return str(value)[:max_len]


def _build_line_item(raw) -> SimpleNamespace:
    quantity = _to_int(raw.get('quantity', 1), 'Line item quantity')
    unit_price = _to_decimal(raw.get('unit_price', '0'))
    ns = SimpleNamespace(
        description=_clean(raw.get('description'), 255),
        specifications=_clean(raw.get('specifications'), 2000),
        quantity=quantity,
        unit_price=unit_price,
    )
    ns.total = ns.unit_price * ns.quantity
    return ns


def _build_vendor(raw) -> SimpleNamespace:
    return SimpleNamespace(
        name=_clean(raw.get('name'), 200),
        registration_number=_clean(raw.get('registration_number'), 100),
        email=_clean(raw.get('email'), 200),
        phone=_clean(raw.get('phone'), 50),
        address=_clean(raw.get('address'), 2000),
        logo_data_uri=_clean(raw.get('logo_data_uri'), 8_000_000) or None,
        template_style=raw.get('template_style') or 'standard',
    )


def _build_client(raw) -> SimpleNamespace:
    return SimpleNamespace(
        name=_clean(raw.get('name'), 200),
        contact_person=_clean(raw.get('contact_person'), 200),
        email=_clean(raw.get('email'), 200),
        phone=_clean(raw.get('phone'), 50),
        address=_clean(raw.get('address'), 2000),
    )


def build_document_view(payload):
    if not isinstance(payload, dict):
        raise PayloadError("Payload must be a JSON object")

    doc = _require(payload, 'document', 'document')
    vendor_raw = _require(payload, 'vendor', 'vendor')
    client_raw = _require(payload, 'client', 'client')

    vendor = _build_vendor(vendor_raw)
    client = _build_client(client_raw)

    items_raw = doc.get('line_items') or []
    if not isinstance(items_raw, list) or not items_raw:
        raise PayloadError("Document must have at least one line item")

    items = [_build_line_item(i) for i in items_raw if isinstance(i, dict)]
    if not items:
        raise PayloadError("Document must have at least one line item")

    document = SimpleNamespace(
        doc_type=_clean(doc.get('doc_type'), 20),
        document_number=_clean(doc.get('document_number'), 50),
        lot_number=_clean(doc.get('lot_number'), 100) or None,
        issue_date=_clean(doc.get('issue_date'), 40),
        due_date=_clean(doc.get('due_date'), 40) or None,
        notes=_clean(doc.get('notes'), 8000),
        vendor=vendor,
        client=client,
        line_items=items,
    )
    document.total_amount = sum((i.total for i in items), Decimal('0.00'))

    if document.doc_type not in ('Quotation', 'Invoice'):
        raise PayloadError("doc_type must be 'Quotation' or 'Invoice'")

    return document


def _document_body_html(document) -> str:
    style = resolve_template_style({'template_style': document.vendor.template_style})
    return render_template(
        f"documents/view_{style}.html",
        document=document,
        logo_data_uri=document.vendor.logo_data_uri,
    )


def _read_document_css() -> str:
    path = os.path.join(current_app.root_path, DOCUMENT_CSS_RELPATH)
    with open(path, 'r', encoding='utf-8') as fh:
        return fh.read()


def _wrap_full_html(body: str, css: str) -> str:
    return (
        '<!DOCTYPE html><html><head><meta charset="utf-8">'
        f'<style>{css}</style></head>'
        f'<body class="document-body">{body}</body></html>'
    )


def render_preview_html(payload) -> str:
    document = build_document_view(payload)
    body = _document_body_html(document)
    return _wrap_full_html(body, _read_document_css())


def render_pdf_bytes(payload) -> bytes:
    document = build_document_view(payload)
    body = _document_body_html(document)
    full_html = _wrap_full_html(body, _read_document_css())
    return HTML(string=full_html).write_pdf(
        presentational_hints=True,
        optimize_size=('fonts', 'images'),
    )
