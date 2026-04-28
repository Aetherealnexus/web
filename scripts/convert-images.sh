#!/usr/bin/env bash
# convert-images.sh
# Convert PNG images in web/images to WebP using cwebp or ImageMagick.

IMG_DIR="$(dirname "$0")/../images"

if [ ! -d "$IMG_DIR" ]; then
  echo "Images directory not found: $IMG_DIR"
  exit 1
fi

shopt -s nullglob
for f in "$IMG_DIR"/*.png; do
  base=$(basename "$f" .png)
  out_webp="$IMG_DIR/$base.webp"
  echo "Converting $f -> $out_webp"
  if command -v cwebp >/dev/null 2>&1; then
    cwebp -q 80 "$f" -o "$out_webp"
  elif command -v magick >/dev/null 2>&1; then
    magick "$f" -quality 80 "$out_webp"
  else
    echo "Please install 'cwebp' (from libwebp) or ImageMagick (magick) to run this script." >&2
    exit 2
  fi
done

echo "Done. Update your markup/meta to reference the .webp files for faster loads."