#!/usr/bin/env bash
# Trim and compress a clip you have the rights to host (video.type = "file").
# Usage: scripts/trim_clip.sh input.mp4 pitches/<slug>/clip.mp4 00:00:05 00:03:30
set -euo pipefail
if [ $# -ne 4 ]; then
  echo "usage: $0 <input> <output.mp4> <start hh:mm:ss> <end hh:mm:ss>" >&2
  exit 1
fi
ffmpeg -y -i "$1" -ss "$3" -to "$4" \
  -vf "scale=-2:720" -c:v libx264 -preset slow -crf 26 \
  -c:a aac -b:a 128k -movflags +faststart "$2"
echo "Wrote $2"
