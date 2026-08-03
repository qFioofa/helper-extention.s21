#!/usr/bin/env python3
"""Generate simple placeholder PNG icons for the extension.

Usage: make_icons.py [sizes...]   (default: 16 48 128)
Icons are written to public/icons/icon<size>.png.
"""
import os
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(ROOT, "public", "icons")
DEFAULT_SIZES = [16, 48, 128]


def make_icon(size: int) -> None:
	img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
	draw = ImageDraw.Draw(img)
	radius = size // 5
	draw.rounded_rectangle(
		[0, 0, size - 1, size - 1], radius=radius, fill=(37, 99, 235, 255)
	)
	draw.rounded_rectangle(
		[size // 8, size // 8, size - 1 - size // 8, size - 1 - size // 8],
		radius=radius,
		outline=(255, 255, 255, 255),
		width=max(1, size // 16),
	)
	os.makedirs(OUT_DIR, exist_ok=True)
	path = os.path.join(OUT_DIR, f"icon{size}.png")
	img.save(path)
	print(f"wrote {path}")


def main() -> None:
	args = sys.argv[1:]
	sizes = [int(a) for a in args] if args else DEFAULT_SIZES
	for size in sizes:
		make_icon(size)


if __name__ == "__main__":
	main()
