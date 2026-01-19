#!/bin/bash
# Generate macOS .icns file from source PNG

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SOURCE_IMAGE="$PROJECT_DIR/src/images/bonzi.png"
BUILD_DIR="$PROJECT_DIR/build"
ICONSET_DIR="$BUILD_DIR/icon.iconset"

echo "Generating macOS icons..."

# Create iconset directory
mkdir -p "$ICONSET_DIR"

# Generate all required sizes for macOS iconset
# sips is a macOS built-in image processing tool
sips -z 16 16     "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_16x16.png"
sips -z 32 32     "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_16x16@2x.png"
sips -z 32 32     "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_32x32.png"
sips -z 64 64     "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_32x32@2x.png"
sips -z 128 128   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_128x128.png"
sips -z 256 256   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_128x128@2x.png"
sips -z 256 256   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_256x256.png"
sips -z 512 512   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_256x256@2x.png"
sips -z 512 512   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_512x512.png"
sips -z 1024 1024 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_512x512@2x.png"

# Convert iconset to icns
iconutil -c icns "$ICONSET_DIR" -o "$BUILD_DIR/icon.icns"

# Also copy a 512x512 PNG as fallback
cp "$ICONSET_DIR/icon_512x512.png" "$BUILD_DIR/icon.png"

# Clean up iconset directory
rm -rf "$ICONSET_DIR"

echo "Icons generated successfully!"
echo "  - $BUILD_DIR/icon.icns"
echo "  - $BUILD_DIR/icon.png"
