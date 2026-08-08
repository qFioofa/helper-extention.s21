#!/usr/bin/env python3

"""Adapt a Chrome-style MV3 manifest for Firefox.

Firefox does not support background.service_worker, so the shared
manifest.json must be rewritten for the Firefox package to use
background.scripts instead. Idempotent and safe to run before the gecko
id injection.

Usage: adapt_firefox_manifest.py <manifest_path>
"""

import json
import sys


def main() -> None:
    if len(sys.argv) != 2:
        print(f"usage: {sys.argv[0]} <manifest_path>", file=sys.stderr)
        sys.exit(2)

    path = sys.argv[1]
    with open(path) as f:
        manifest = json.load(f)

    bg = manifest.get("background")
    if isinstance(bg, dict):
        service_worker = bg.get("service_worker")
        if service_worker:
            # Chrome MV3 -> Firefox MV3 background page/scripts.
            bg.pop("service_worker", None)
            bg.setdefault("scripts", [service_worker])
            manifest["background"] = bg

    with open(path, "w") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")


if __name__ == "__main__":
    main()
