#!/usr/bin/env python3
"""Retry only missing public article snapshots, without caching raw CMS HTML.

Source responses may contain legacy diagnostic output; keep raw responses in RAM.
Only the existing sanitizing editorial converter writes files. Run from any cwd:
  python3 integration/retry-unresolved-public-articles.py
  python3 integration/build-full-archive-index.py
  python3 integration/build-public-access-report.py
"""
from __future__ import annotations
import json
import runpy
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

SITE = Path(__file__).resolve().parent.parent
DATA = SITE / "data"
manifest = json.loads((DATA / "archive/inventory.json").read_text())["records"]
indexed = json.loads((DATA / "linked-index.json").read_text())
targets = [
    record for record in manifest
    if record.get("kind") == "article"
    and record.get("availability") not in {
        "not_found_404", "forbidden_403", "soft_missing_no_public_profile"
    }
    and record["url"] not in indexed
]
pipeline = runpy.run_path(str(SITE / "integration/import-all-public-content.py"))
parser_globals = pipeline["B"]
thread_state = pipeline["THREAD"]


def transient_fetch(url, attempts=2, timeout=20):
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != "cosmatica.org":
        raise ValueError("Public origin restriction")
    error = None
    for attempt in range(attempts):
        try:
            response = requests.get(
                url,
                timeout=(6, timeout),
                headers={"User-Agent": "RKO-Public-Archive-Recovery/2026"},
            )
            response.raise_for_status()
            if not (250 < len(response.content) < 14_000_000):
                raise ValueError("Unexpected source response size")
            page = BeautifulSoup(response.content, "html.parser")
            article_title = page.select_one("#controller_wrap h1")
            if not article_title or len(article_title.get_text(strip=True)) < 4:
                raise ValueError("Missing original article heading")
            thread_state.current = response
            return response
        except (requests.RequestException, ValueError) as exc:
            error = exc
            if attempt + 1 < attempts:
                time.sleep(0.5)
    raise RuntimeError(type(error).__name__) from error


parser_globals["fetch"] = transient_fetch
out = []
for record in targets:
    status, url, info = pipeline["import_one"](record, False)
    destination = DATA / "linked" / (pipeline["key"](url) + ".json")
    if status == "ready":
        stored = json.loads(destination.read_text())
        text = sum(
            len(block.get("text", ""))
            + sum(len(item) for item in block.get("items", []))
            for block in stored.get("blocks", [])
        )
        videos = sum(block.get("type") == "video" for block in stored.get("blocks", []))
        if text < 12 and videos == 0:
            status = "invalid"
            destination.unlink()
        else:
            info = {"textCharacters": text, "videos": videos,
                    "sourceTextCharacters": stored.get("sourceTextCharacters", 0)}
    out.append({"url": url, "status": status, "details": info})
    print("RECOVERY", url.rsplit("/", 1)[-1][:8], status, info, flush=True)
report = {"checked": len(targets), "recovered": sum(x["status"] == "ready" for x in out),
          "failed": [x for x in out if x["status"] != "ready"], "results": out,
          "rawCmsHtmlPersisted": False}
(DATA / "archive/recovery-report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + "\n"
)
print("RECOVERY_REPORT", json.dumps(
    {"checked": report["checked"], "recovered": report["recovered"],
     "failed": len(report["failed"]), "rawCmsHtmlPersisted": False},
    ensure_ascii=False))
if report["failed"]:
    raise SystemExit(2)
