#!/usr/bin/env bash
set -euo pipefail
export TAILWINDCSS_VERSION="${TAILWINDCSS_VERSION:-v3.4.17}"
python -m pytailwindcss -i tailwind.input.css -o app/static/css/tailwind.css --minify "$@"
