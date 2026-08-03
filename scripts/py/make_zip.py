#!/usr/bin/env python3
"""Create a zip archive of a source directory, keeping relative paths.

Usage: make_zip.py <source_dir> <output_zip>
"""
import os
import sys
import zipfile


def main() -> None:
	if len(sys.argv) != 3:
		print(f"usage: {sys.argv[0]} <source_dir> <output_zip>", file=sys.stderr)
		sys.exit(2)

	src, dest = sys.argv[1], sys.argv[2]
	with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
		for root, _, files in os.walk(src):
			for f in files:
				path = os.path.join(root, f)
				zf.write(path, os.path.relpath(path, src))


if __name__ == "__main__":
	main()
