#!/usr/bin/env python3
"""
Regenerates src/fonts/taipei-sans-tc-{regular,bold}.woff2 — ticket 06.

Unicode-range splitting by CJK block (the approach the official npm package
ships) turned out to cost ~2.7MB on first load: common characters are
scattered across many numeric block boundaries, not clustered, so a page
with a handful of Chinese words still triggers ~10 chunk fetches. Subsetting
to the characters this site *actually* uses — extracted straight from the
source files below — produces a single ~113KB file per weight instead.

Re-run this whenever new user-facing Chinese/Japanese text is added (new UI
strings, new Part names, new content pages) so the subset keeps covering
what's really on the page. Requires the merged (unsplit) source fonts —
regenerate those once with:

    python3 -m fontTools.merge --output-file=/tmp/taipei-merged-regular.ttf \
        public/fonts/taipei-sans-tc/Regular/*.woff2
    python3 -m fontTools.merge --output-file=/tmp/taipei-merged-bold.ttf \
        public/fonts/taipei-sans-tc/Bold/*.woff2

(those chunk directories aren't kept in the repo — re-download via
`npm install taipei-sans-tc` in a scratch dir if you need to redo this from
scratch; see ticket 06's notes.)

Usage: python3 scripts/subset-taipei-sans-tc.py <merged-regular.ttf> <merged-bold.ttf>
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent

SOURCE_FILES = [
    "src/messages/zh-TW.json",
    "src/messages/ja.json",
    "src/messages/en.json",
    # Prose the guides render verbatim. Missing from this list until now,
    # which is how ~18 common characters (官, 值, 使, 用, 系, 統, 種, 類, 量,
    # 討, 論 …) ended up outside the subset even though they appear in the UI
    # strings too — the file was last regenerated before those strings were
    # added, and nothing re-checked it. A character outside the subset falls
    # through to whatever face the reader's OS supplies, so a heading renders
    # half in Taipei Sans TC Bold and half in a system Ming.
    "data/mold-batch-guidance.json",
    "data/assessments.json",
]
CONTENT_GLOBS = ["content/guides/**/*.mdx"]
DATA_FILES = {
    "data/parts.json": ["nameZhTw", "nameJa", "nameEn"],
    "data/events.json": ["venueName", "venueAddress", "ageCategory"],
    "data/generation-catalog.json": ["name", "nameZhTw", "nameJa", "notes"],
}


def collect_characters() -> set[str]:
    chars: set[str] = set()

    def walk(obj):
        if isinstance(obj, dict):
            for v in obj.values():
                walk(v)
        elif isinstance(obj, str):
            chars.update(obj)

    for rel in SOURCE_FILES:
        with open(ROOT / rel) as f:
            walk(json.load(f))

    for rel, keys in DATA_FILES.items():
        with open(ROOT / rel) as f:
            records = json.load(f)
        if isinstance(records, dict):
            records = next((v for v in records.values() if isinstance(v, list)), [])
        for record in records:
            if not isinstance(record, dict):
                continue
            for key in keys:
                value = record.get(key)
                if isinstance(value, str):
                    chars.update(value)

    # Long-form content is prose, not fields: take the whole file.
    for pattern in CONTENT_GLOBS:
        for path in sorted(ROOT.glob(pattern)):
            chars.update(path.read_text())

    # Non-ASCII only — Basic Latin is covered separately via --unicodes.
    return {c for c in chars if ord(c) > 0x2E7F or c in "、。「」『』（）：；！？—…／"}


def subset(source_ttf: str, output_name: str):
    chars = collect_characters()
    chars_file = ROOT / ".subset-chars.tmp.txt"
    chars_file.write_text("".join(sorted(chars)))

    output_path = ROOT / "src" / "fonts" / output_name
    subprocess.run(
        [
            sys.executable,
            "-m",
            "fontTools.subset",
            source_ttf,
            "--unicodes=U+0020-007E,U+00A0-00FF",
            f"--text-file={chars_file}",
            "--flavor=woff2",
            f"--output-file={output_path}",
            "--layout-features=*",
            "--name-IDs=*",
        ],
        check=True,
    )
    chars_file.unlink()
    size_kb = output_path.stat().st_size / 1024
    print(f"{output_name}: {len(chars)} non-ASCII characters, {size_kb:.1f} KB")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 scripts/subset-taipei-sans-tc.py <merged-regular.ttf> <merged-bold.ttf>")
        sys.exit(1)
    subset(sys.argv[1], "taipei-sans-tc-regular.woff2")
    subset(sys.argv[2], "taipei-sans-tc-bold.woff2")
