#!/bin/sh
# Copy the NES emulator's WebAssembly build into public/nes/.
# Build it first in the emulator repo:  ../better_emulator/web/build.sh
set -e
SRC="${1:-../better_emulator/web/dist}"
DEST="$(dirname "$0")/../public/nes"
[ -f "$SRC/nes_web.wasm" ] || { echo "no build at $SRC — run better_emulator/web/build.sh"; exit 1; }
rm -rf "$DEST" && mkdir -p "$DEST/roms"
cp "$SRC/nes_web.wasm" "$SRC/nes-player.js" "$DEST/"
cp "$SRC"/roms/*.nes "$SRC/roms/ROMS.md" "$DEST/roms/"
echo "synced NES player → public/nes ($(wc -c < "$DEST/nes_web.wasm" | tr -d ' ') byte wasm)"
