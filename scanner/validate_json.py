#!/usr/bin/env python3
"""Reject scan/refresh output files that are invalid JSON or contain merge conflict markers."""
import json, os, sys

def main():
    label = sys.argv[1] if len(sys.argv) > 1 else "validate"
    paths = sys.argv[2:]
    failed = 0
    for path in paths:
        if not os.path.exists(path):
            print(label, "missing (ok)", path)
            continue
        text = open(path, encoding="utf-8").read()
        if "<<<<<<<" in text or ">>>>>>>" in text:
            print(label, "CONFLICT MARKERS in", path)
            failed = 1
            continue
        try:
            json.loads(text)
        except Exception as e:
            print(label, "INVALID JSON", path, e)
            failed = 1
            continue
        print(label, "ok", path)
    return failed

if __name__ == "__main__":
    sys.exit(main())
