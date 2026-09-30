#!/bin/sh
# Copy OVERDRIVE's WebAssembly build into public/overdrive/.
# Build it first:  cd ../../Desktop/3d_shooter && source ~/emsdk/emsdk_env.sh && make web
set -e
SRC="${1:-$HOME/Desktop/3d_shooter/web/dist}"
DEST="$(dirname "$0")/../public/overdrive"
[ -f "$SRC/overdrive.wasm" ] || { echo "no build at $SRC — run 'make web' in 3d_shooter"; exit 1; }
rm -rf "$DEST" && mkdir -p "$DEST"
cp "$SRC/index.html" "$SRC/overdrive.js" "$SRC/overdrive.wasm" "$SRC/overdrive.data" "$DEST/"
echo "synced OVERDRIVE → public/overdrive ($(du -sh "$DEST" | cut -f1))"
