#!/usr/bin/env python3
"""Render a human-readable build report.

The shell release scripts collect facts about the build (artifacts, timings,
target statuses, warnings/errors) and hand them to this script, which renders
a readable report to stdout and (optionally) to a text file.

Usage:
    report.py --artifacts <tsv> --targets-file <tsv> --project name@ver
              --date "..." --git "branch@sha" --node v20 --npm 10
              --elapsed 1m12s --warnings 2 --errors 0
              [--warnings-log f] [--errors-log f] [--output f]

The artifacts TSV has one entry per line:  label<TAB>path<TAB>kind
where kind is "file" (default) or "dir".

The targets TSV has one entry per line:     name<TAB>status
where status is "success", "failed" or "skipped".
"""
import argparse
import hashlib
import os
import sys

SEP = "=" * 60

STATUS_MARK = {"success": "OK", "failed": "FAILED", "skipped": "SKIPPED"}


def human_size(num: int) -> str:
    size = float(num)
    for unit in ("B", "KB", "MB", "GB"):
        if abs(size) < 1024 or unit == "GB":
            if unit == "B":
                return f"{int(size)} B"
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} GB"


def sha256_of(path: str) -> str:
    if not os.path.isfile(path):
        return "-"
    h = hashlib.sha256()
    try:
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(1 << 16), b""):
                h.update(chunk)
    except OSError:
        return "-"
    return h.hexdigest()


def item_size(path: str, kind: str) -> int:
    if kind == "dir":
        total = 0
        for root, _dirs, files in os.walk(path):
            for f in files:
                try:
                    total += os.path.getsize(os.path.join(root, f))
                except OSError:
                    pass
        return total
    try:
        return os.path.getsize(path)
    except OSError:
        return 0


def load_artifacts(tsv_path: str) -> list:
    artifacts = []
    if not tsv_path or not os.path.isfile(tsv_path):
        return artifacts
    with open(tsv_path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line:
                continue
            parts = line.split("\t")
            if len(parts) < 2:
                continue
            label, path = parts[0], parts[1]
            kind = parts[2] if len(parts) > 2 else "file"
            artifacts.append({"label": label, "path": path, "kind": kind})
    return artifacts


def load_targets(tsv_path: str) -> list:
    targets = []
    if not tsv_path or not os.path.isfile(tsv_path):
        return targets
    with open(tsv_path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line:
                continue
            parts = line.split("\t")
            name = parts[0]
            status = parts[1] if len(parts) > 1 else "success"
            targets.append((name, status))
    return targets


def load_log(path: str) -> list:
    if not path or not os.path.isfile(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [ln.rstrip("\n") for ln in f if ln.strip()]


def render(args) -> str:
    out = []
    out.append(SEP)
    out.append(f"  BUILD REPORT - {args.project}")
    if args.date:
        out.append(f"  Date       : {args.date}")
    if args.git:
        out.append(f"  Git        : {args.git}")
    if args.node:
        out.append(f"  Node       : {args.node}")
    if args.npm:
        out.append(f"  npm        : {args.npm}")
    if args.elapsed:
        out.append(f"  Total time : {args.elapsed}")
    if args.targets:
        out.append(f"  Targets    : {args.targets}")
    out.append(SEP)

    status = "SUCCESS" if args.errors == 0 else "FAILED"
    out.append(f"  Status     : {status}   errors={args.errors} warnings={args.warnings}")

    targets = load_targets(args.targets_file)
    if targets:
        out.append("")
        out.append("  Targets:")
        for name, st in targets:
            mark = STATUS_MARK.get(st, st.upper())
            out.append(f"    - {name:<12} {mark}")

    errors = load_log(args.errors_log)
    if errors:
        out.append("")
        out.append(f"  Errors ({len(errors)}):")
        for line in errors:
            out.append(f"    x {line}")

    warnings = load_log(args.warnings_log)
    if warnings:
        out.append("")
        out.append(f"  Warnings ({len(warnings)}):")
        for line in warnings:
            out.append(f"    ! {line}")

    artifacts = load_artifacts(args.artifacts)
    if artifacts:
        out.append("")
        out.append("  Artifacts:")
        for item in artifacts:
            path = item["path"]
            label = item["label"]
            size = human_size(item_size(path, item["kind"]))
            if item["kind"] == "dir":
                out.append(f"    {label}  ->  {path}  ({size}, directory)")
            else:
                out.append(f"    {label}  ->  {path}  ({size})")
                out.append(f"      sha256 {sha256_of(path)}")

    out.append("")
    out.append(SEP)
    return "\n".join(out)


def main() -> None:
    parser = argparse.ArgumentParser(description="Render build report")
    parser.add_argument("--artifacts", default="", help="TSV file with artifacts")
    parser.add_argument("--targets-file", default="", help="TSV file with target statuses")
    parser.add_argument("--project", default="", help="project name@version")
    parser.add_argument("--date", default="", help="build date")
    parser.add_argument("--git", default="", help="git ref info")
    parser.add_argument("--node", default="", help="node version")
    parser.add_argument("--npm", default="", help="npm version")
    parser.add_argument("--elapsed", default="", help="total build time")
    parser.add_argument("--targets", default="", help="comma separated targets (legacy)")
    parser.add_argument("--warnings", type=int, default=0)
    parser.add_argument("--errors", type=int, default=0)
    parser.add_argument("--warnings-log", default="", help="file with warning lines")
    parser.add_argument("--errors-log", default="", help="file with error lines")
    parser.add_argument("--output", default="", help="also write the report to this file")
    args = parser.parse_args()

    report = render(args)
    print(report)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(report + "\n")
        print(f"report written to {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
