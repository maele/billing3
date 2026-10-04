import logging

from flask import Blueprint, Response, jsonify, request

from ..rendering import PayloadError, render_pdf_bytes, render_preview_html

bp = Blueprint('api', __name__)
log = logging.getLogger(__name__)


@bp.post('/render/preview')
def preview():
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify(error='Expected JSON body'), 400
    try:
        html = render_preview_html(payload)
    except PayloadError as exc:
        return jsonify(error=str(exc)), 400
    return Response(html, mimetype='text/html; charset=utf-8')


@bp.post('/render/pdf')
def pdf():
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify(error='Expected JSON body'), 400
    try:
        data = render_pdf_bytes(payload)
    except PayloadError as exc:
        return jsonify(error=str(exc)), 400
    except Exception:
        log.exception("PDF generation failed")
        return jsonify(error='PDF rendering failed'), 500

    doc = payload.get('document') or {}
    number = str(doc.get('document_number') or 'document')
    safe = ''.join(c for c in number if c.isalnum() or c in '-_.')

    return Response(
        data,
        mimetype='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="{safe}.pdf"'},
    )
