#!/usr/bin/env bash
# convert-fonts.sh
# Bash helper to convert PlayfairDisplay TTF fonts to WOFF2 using Google's woff2_compress tool.

FONT_DIR="$(dirname "$0")/../Playfair_Display/static"

if [ ! -d "$FONT_DIR" ]; then
  echo "Font directory not found: $FONT_DIR"
  exit 1
fi

shopt -s nullglob
for f in "$FONT_DIR"/*.ttf; do
  echo "Converting $f"
  if command -v woff2_compress >/dev/null 2>&1; then
    woff2_compress "$f"
    echo "-> $f.woff2"
  else
    echo "woff2_compress not installed. See https://github.com/google/woff2"
    exit 2
  fi
done

echo "Done. If conversion succeeded, update @font-face in your CSS to reference .woff2 first."