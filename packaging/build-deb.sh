#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
DIST_DIR="$PROJECT_ROOT/dist"

if ! command -v dpkg-deb >/dev/null 2>&1; then
    echo "dpkg-deb is required to build the Debian package." >&2
    exit 1
fi

if [ ! -x "$DIST_DIR/hunterlog" ]; then
    echo "Expected an executable Linux build at $DIST_DIR/hunterlog." >&2
    echo "Build the Linux application first; a Windows .exe cannot be packaged." >&2
    exit 1
fi

ARCH=$(dpkg --print-architecture)
if [ "$ARCH" != "amd64" ]; then
    echo "This Linux build currently supports amd64 only (found: $ARCH)." >&2
    exit 1
fi

VERSION=$(sed -n "s/^__version__ = ['\"]\\([^'\"]*\\)['\"]$/\\1/p" "$PROJECT_ROOT/src/version.py")
if [ -z "$VERSION" ]; then
    echo "Could not read the application version from src/version.py." >&2
    exit 1
fi

PACKAGE_ROOT=$(mktemp -d)
trap 'rm -rf "$PACKAGE_ROOT"' EXIT HUP INT TERM

APP_ROOT="$PACKAGE_ROOT/opt/hunterlog"
mkdir -p "$APP_ROOT" \
    "$PACKAGE_ROOT/usr/bin" \
    "$PACKAGE_ROOT/usr/share/applications" \
    "$PACKAGE_ROOT/usr/share/pixmaps" \
    "$PACKAGE_ROOT/DEBIAN"

cp -a "$DIST_DIR/." "$APP_ROOT/"
rm -f "$APP_ROOT"/*.deb
install -m 0755 "$SCRIPT_DIR/hunterlog" "$PACKAGE_ROOT/usr/bin/hunterlog"
install -m 0644 "$SCRIPT_DIR/hunterlog.desktop" \
    "$PACKAGE_ROOT/usr/share/applications/hunterlog.desktop"
install -m 0644 "$PROJECT_ROOT/src/assets/logo.png" \
    "$PACKAGE_ROOT/usr/share/pixmaps/hunterlog.png"

cat > "$PACKAGE_ROOT/DEBIAN/control" <<EOF
Package: hunterlog
Version: $VERSION
Section: hamradio
Priority: optional
Architecture: $ARCH
Maintainer: cwhelchel et. al.
Depends: libgtk-3-0, libwebkit2gtk-4.0-37 | libwebkit2gtk-4.1-0
Description: POTA and SOTA amateur radio spot viewing and logging application.
 Hunterlog displays and filters spots from various Ham radio programs, tracks hunted references,
 logging to your favorit logger, and various rig control set ups.
Homepage: https://github.com/cwhelchel/hunterlog
EOF

chmod 0755 "$PACKAGE_ROOT/DEBIAN"
OUTPUT="$DIST_DIR/hunterlog_${VERSION}_${ARCH}.deb"
dpkg-deb --build --root-owner-group "$PACKAGE_ROOT" "$OUTPUT"
echo "Created $OUTPUT"

# next github steps need to know how to build the output filename
if [ -n "${GITHUB_ENV+x}" ]; then
    echo "setting github env"
    echo "HL_VER=$VERSION" >> "$GITHUB_ENV"
    echo "BUILD_ARCH=$ARCH" >> "$GITHUB_ENV"
fi

