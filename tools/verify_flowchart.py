#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifikasi hasil build flowchart:
  1. .drawio adalah XML valid dan berisi seluruh halaman.
  2. Setiap panah/waypoint tersimpan (edge + Array points).
  3. Validator layout bersih (tidak ada node tumpang tindih / panah menembus node).
  4. PNG pratinjau ada, ukurannya sesuai geometri halaman.
  5. Uji piksel: warna panah dan isian node benar-benar tergambar di koordinat yang dihitung.

Jalankan:  python tools/verify_flowchart.py
"""

from __future__ import annotations

import os
import sys
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from build_flowchart import PngRenderer, label_point, page_points, resolve_edges, validate_page  # noqa: E402
import flowchart_spec  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRAWIO = os.path.join(ROOT, "flowchart_ruangrasa.drawio")
PNG_DIR = os.path.join(ROOT, "docs", "flowchart-png")

MARGIN, SCALE = 40.0, 2.0


def hex_to_rgb(h: str):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def near(a, b, tol=26):
    return all(abs(x - y) <= tol for x, y in zip(a, b))


def main() -> int:
    from PIL import Image

    problems = []
    pages = list(flowchart_spec.PAGES)

    # ---- 1 & 2: struktur XML
    if not os.path.exists(DRAWIO):
        print(f"[X] file tidak ditemukan: {DRAWIO}")
        return 1
    root = ET.parse(DRAWIO).getroot()
    if root.tag != "mxfile":
        problems.append("root XML bukan <mxfile>")
    diagrams = list(root)
    print(f"[XML] {DRAWIO}\n      {len(diagrams)} halaman terdeteksi")
    if len(diagrams) != len(pages):
        problems.append(f"jumlah halaman .drawio ({len(diagrams)}) != spec ({len(pages)})")
    for d, page in zip(diagrams, pages):
        r = d.find("mxGraphModel").find("root")
        cells = r.findall("mxCell")
        verts = [c for c in cells if c.get("vertex") == "1"]
        edges = [c for c in cells if c.get("edge") == "1"]
        if len(edges) != len(page.edges) or len(verts) != len(page.nodes):
            problems.append(f"{page.id}: jumlah cell tidak cocok (vertex {len(verts)}/{len(page.nodes)}, edge {len(edges)}/{len(page.edges)})")
        without_anchor = [c.get("id") for c in edges if "exitX=" not in (c.get("style") or "") or "entryX=" not in (c.get("style") or "")]
        if without_anchor:
            problems.append(f"{page.name}: panah tanpa exit/entry anchor: {without_anchor[:4]}")
        print(f"      · {d.get('name')}: vertex={len(verts)} panah={len(edges)}")

    # ---- 3: validator layout + 4 & 5: PNG
    r = PngRenderer(scale=SCALE)
    for i, page in enumerate(pages, start=1):
        issues = validate_page(page)
        errs = [x for x in issues if x.startswith("ERROR")]
        warns = [x for x in issues if x.startswith("WARN")]
        status = "OK " if not errs and not warns else ("ERR" if errs else "WARN")
        print(f"[{status}] {i:02d} {page.name} — {len(page.nodes)} node, {len(page.edges)} panah, {len(warns)} warning")
        for msg in errs + warns:
            print("      " + msg)
        problems += [f"{page.name}: {e}" for e in errs]

        nodes, rects = page_points(page)
        resolved = resolve_edges(page, nodes, rects)
        max_x = max([page.width] + [rects[n.id][2] for n in page.nodes if n.shape != "text"])
        max_y = max([page.height] + [rects[n.id][3] for n in page.nodes if n.shape != "text"])
        exp_w = int((max_x + MARGIN * 2) * SCALE)
        exp_h = int((max_y + MARGIN * 2) * SCALE)
        png = os.path.join(PNG_DIR, f"{i:02d}-{page.slug}.png")
        if not os.path.exists(png):
            problems.append(f"PNG hilang: {png}")
            continue
        img = Image.open(png).convert("RGB")
        if img.size != (exp_w, exp_h):
            problems.append(f"{os.path.basename(png)}: ukuran {img.size} != perkiraan {(exp_w, exp_h)}")
        if img.size != (exp_w, exp_h):
            continue

        # uji panah: contoh titik di ujung ruas terpanjang (bebas dari kotak label di tengah)
        checked = 0
        for re_ in resolved[:8]:
            seg = max(zip(re_.pts, re_.pts[1:]), key=lambda p: ((p[1][0] - p[0][0]) ** 2 + (p[1][1] - p[0][1]) ** 2))
            a, b = seg
            want = hex_to_rgb(re_.edge.color)
            ok = any(near(self_sample(img, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t), want, 60)
                     for t in (0.08, 0.15, 0.85, 0.92))
            if not ok:
                problems.append(
                    f"{os.path.basename(png)}: garis panah '{re_.edge.id}' {a}->{b} tidak ditemukan "
                    f"(warna diharapkan ~{want})")
            checked += 1

        # uji isian node: mayoritas titik contoh di dalam node harus berwarna fill node
        for n in page.nodes[:5]:
            if n.shape in ("text", "lane"):
                continue
            x0, y0, x1, y1 = rects[n.id]
            want = hex_to_rgb(n.fill)
            hits = 0
            total = 0
            for fx in (0.15, 0.5, 0.85):
                for fy in (0.15, 0.5, 0.85):
                    total += 1
                    if near(self_sample(img, x0 + (x1 - x0) * fx, y0 + (y1 - y0) * fy), want, 40):
                        hits += 1
            if hits < total * 0.4:
                problems.append(f"{os.path.basename(png)}: isian node '{n.id}' tidak sesuai ({hits}/{total} titik cocok dengan {want})")
        print(f"      PNG {os.path.basename(png)} {img.size} — {checked} uji garis panah + 5 uji isian node")

    print("\n=== HASIL ===")
    if problems:
        print(f"{len(problems)} masalah:")
        for p in problems:
            print("  - " + p)
        return 1
    print("Semua pemeriksaan lolos: XML valid, layout bersih, panah terkunci pada node, PNG tergambar.")
    return 0


def self_sample(img, x, y):
    """Ambil piksel pada koordinat halaman (x,y) dengan memperhitungkan margin & skala."""
    px = int((MARGIN + x) * SCALE)
    py = int((MARGIN + y) * SCALE)
    px = max(0, min(img.width - 1, px))
    py = max(0, min(img.height - 1, py))
    return img.getpixel((px, py))


if __name__ == "__main__":
    raise SystemExit(main())
