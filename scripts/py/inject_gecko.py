#!/usr/bin/env python3

"""Inject a Firefox browser_specific_settings.gecko.id into a manifest.

Usage: inject_gecko.py <manifest_path> <gecko_id>
"""
import json
import sys


def main() -> None:
	if len(sys.argv) != 3:
		print(f"usage: {sys.argv[0]} <manifest_path> <gecko_id>", file=sys.stderr)
		sys.exit(2)

	path, gecko_id = sys.argv[1], sys.argv[2]
	with open(path) as f:
		manifest = json.load(f)
	manifest["browser_specific_settings"] = {"gecko": {"id": gecko_id}}
	with open(path, "w") as f:
		json.dump(manifest, f, indent=2)
		f.write("\n")


if __name__ == "__main__":
	main()
