# Billing System 3.0

Privacy-first, open-source quotation & invoice generator.

## Tenets

1. **No server-side storage.** The Flask process is a stateless HTML/PDF renderer.
   All data lives in the browser's localStorage. Nothing is written to a database,
   to disk, or to a session cookie.
2. **Optional portability.** Users can export their workspace as a JSON file and
   import it back on any device. This is the only way data leaves the browser —
   and only when the user clicks the button.

## Running

    python -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    python run.py

Open http://127.0.0.1:5124.

## Where data lives

Browser `localStorage` under the key `billing3.workspace.v1`. Clearing site data
wipes everything. Export before you clear.

## PDF generation

The browser POSTs the document JSON to `/api/render/pdf`, the server renders it
with WeasyPrint, returns PDF bytes, and immediately discards the request body.
Nothing is logged or cached.
