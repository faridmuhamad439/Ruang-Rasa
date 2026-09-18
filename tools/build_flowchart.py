#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==========================================================================================
 RUANG RASA COFFEE - FLOWCHART BUILDER (spec -> .drawio + PNG preview + layout validator)
==========================================================================================

Skrip ini adalah "compiler" dokumentasi flowchart untuk aplikasi web Ruang Rasa.

  flowchart_spec.py   (deklaratif: page/node/edge)      <-- sumber kebenaran diagram
          |
          v
  build_flowchart.py  (skrip ini)
          |-- flowchart_ruangrasa.drawio   (multi-page, siap dibuka di diagrams.net / draw.io)
          |-- docs/flowchart-png/*.png     (pratinjau gambar, dirender dengan Pillow)
          |-- laporan validasi layout      (overlap node, arrow menembus node, label kepanjangan)

Pemakaian:
    python tools/build_flowchart.py
    python tools/build_flowchart.py --no-png
    python tools/build_flowchart.py --out-drawio build/flow.drawio --out-dir build/png

Catatan: PNG adalah render *aproksimasi* dari geometri yang sama (pixel tidak 100% identik
dengan renderer resmi draw.io), tetapi seluruh posisi node, titik belok panah, dan label
dihitung dari data yang sama sehingga tata letak yang terlihat di PNG identik dengan .drawio.
==========================================================================================
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence, Tuple

from PIL import Image, ImageDraw, ImageFont

# ------------------------------------------------------------------------------------------
# 0. PALET WARNA (Custom Coffeehouse Design System Ruang Rasa)
# ------------------------------------------------------------------------------------------
BG = "#FFFFFF"
INK = "#1F2937"          # teks utama
INK_SOFT = "#475569"     # teks sekunder
COPPER = "#B87333"       # aksen utama (copper)
DARK = "#382418"         # cokelat espresso (start/end)
KASIR = "#475569"
ORANGE = "#EA580C"
AMBER = "#D97706"
GREEN = "#16A34A"
BLUE = "#2563EB"
PURPLE = "#9333EA"
RED = "#DC2626"
PINK = "#DB2777"
TEAL = "#0D9488"

LANE_CUST = "#FBF8F4"
LANE_KASIR = "#F8FAFC"
LANE_DAPUR = "#FFFBEB"
LANE_WAITER = "#EFF6FF"
LANE_DRIVER = "#F0FDF4"
LANE_ADMIN = "#FAF5FF"
LANE_SYS = "#F5F3FF"

# ------------------------------------------------------------------------------------------
# 1. PRIMITIF SPESIFIKASI (dipakai oleh flowchart_spec.py)
# ------------------------------------------------------------------------------------------


@dataclass
class Node:
    id: str
    label: str = ""
    x: float = 0
    y: float = 0
    w: float = 200
    h: float = 60
    shape: str = "process"
    fill: str = "#FFFFFF"
    stroke: str = COPPER
    font_color: Optional[str] = None
    font_size: int = 12
    bold: bool = False
    italic: bool = False
    align: str = "center"
    parent: Optional[str] = None
    rows: Optional[List[str]] = None
    start_size: int = 34
    vertical: bool = False
    opacity: int = 100
    stroke_width: int = 2


@dataclass
class Edge:
    id: str
    src: str
    dst: str
    label: str = ""
    points: List[Tuple[float, float]] = field(default_factory=list)
    src_side: Optional[str] = None
    dst_side: Optional[str] = None
    dashed: bool = False
    color: str = INK_SOFT
    width: int = 2
    font_size: int = 10
    font_color: str = INK
    arrow: str = "classic"


@dataclass
class Page:
    id: str
    name: str
    slug: str
    nodes: List[Node]
    edges: List[Edge]
    width: float = 1600
    height: float = 1200
    subtitle: str = ""


def N(nid: str, label: str = "", x: float = 0, y: float = 0, w: float = 200, h: float = 60, **kw) -> Node:
    """Buat node. Posisi relatif terhadap `parent` (lane) bila parent diisi."""
    return Node(id=nid, label=label, x=x, y=y, w=w, h=h, **kw)


def E(eid: str, src: str, dst: str, label: str = "", points: Optional[Sequence[Tuple[float, float]]] = None, **kw) -> Edge:
    """Buat edge. `points` memakai koordinat HALAMAN (absolut), bukan relatif lane."""
    return Edge(id=eid, src=src, dst=dst, label=label, points=list(points or []), **kw)


# ------------------------------------------------------------------------------------------
# 2. GEOMETRI
# ------------------------------------------------------------------------------------------
SIDES: Dict[str, Tuple[float, float]] = {
    "N": (0.5, 0.0), "S": (0.5, 1.0), "W": (0.0, 0.5), "E": (1.0, 0.5),
    "NW": (0.0, 0.0), "NE": (1.0, 0.0), "SW": (0.0, 1.0), "SE": (1.0, 1.0), "C": (0.5, 0.5),
}

Rect = Tuple[float, float, float, float]


def abs_rect(node: Node, nodes: Dict[str, Node]) -> Rect:
    bx, by = 0.0, 0.0
    if node.parent:
        p = nodes.get(node.parent)
        if p is not None:
            pr = abs_rect(p, nodes)
            bx, by = pr[0], pr[1]
    return (bx + node.x, by + node.y, bx + node.x + node.w, by + node.y + node.h)


def center(rect: Rect) -> Tuple[float, float]:
    return ((rect[0] + rect[2]) / 2.0, (rect[1] + rect[3]) / 2.0)


def anchor(rect: Rect, side: str) -> Tuple[float, float]:
    fx, fy = SIDES[side]
    return (rect[0] + (rect[2] - rect[0]) * fx, rect[1] + (rect[3] - rect[1]) * fy)


def auto_side(src: Rect, dst: Rect) -> str:
    """Sisi pada `src` yang menghadap `dst`."""
    scx, scy = center(src)
    dcx, dcy = center(dst)
    dx, dy = dcx - scx, dcy - scy
    if abs(dy) >= abs(dx):
        return "S" if dy > 0 else "N"
    return "E" if dx > 0 else "W"


def page_points(page: Page) -> Tuple[Dict[str, Node], Dict[str, Rect]]:
    nodes = {n.id: n for n in page.nodes}
    rects = {n.id: abs_rect(n, nodes) for n in page.nodes}
    return nodes, rects


@dataclass
class ResolvedEdge:
    edge: Edge
    pts: List[Tuple[float, float]]
    src_side: str
    dst_side: str
    src_rect: Rect
    dst_rect: Rect


def resolve_edges(page: Page, nodes: Dict[str, Node], rects: Dict[str, Rect]) -> List[ResolvedEdge]:
    out: List[ResolvedEdge] = []
    for e in page.edges:
        if e.src not in rects or e.dst not in rects:
            continue
        sr, dr = rects[e.src], rects[e.dst]
        s = e.src_side or auto_side(sr, dr)
        d = e.dst_side or auto_side(dr, sr)
        pts = [anchor(sr, s)] + list(e.points) + [anchor(dr, d)]
        out.append(ResolvedEdge(e, pts, s, d, sr, dr))
    return out


def seg_length(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    return ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) ** 0.5


def longest_segment(pts: List[Tuple[float, float]]) -> Tuple[Tuple[float, float], Tuple[float, float], float]:
    best = (0.0, pts[0], pts[0])
    for i in range(len(pts) - 1):
        ln = seg_length(pts[i], pts[i + 1])
        if ln > best[0]:
            best = (ln, pts[i], pts[i + 1])
    (ln, a, b) = best
    return (a, b, ln)


def label_point(pts: List[Tuple[float, float]]) -> Tuple[float, float]:
    """Titik label = tengah segmen terpanjang dari polyline."""
    (a, b, _) = longest_segment(pts)
    return ((a[0] + b[0]) / 2.0, (a[1] + b[1]) / 2.0)


def label_box_size(e: Edge) -> Tuple[float, float]:
    """Ukuran kotak label (lebar, tinggi) termasuk padding, dalam satuan halaman."""
    if not e.label:
        return (0.0, 0.0)
    lines = str(e.label).split("\n")
    tw = max(text_width(l, e.font_size) for l in lines)
    return (tw + 10.0, len(lines) * e.font_size * 1.3 + 4.0)


def label_offset(e: Edge, pts: List[Tuple[float, float]]) -> Tuple[float, float]:
    """Geser label agar tidak menutupi garis panah pada ruas yang pendek.

    Label digeser ke atas ruas horizontal bila kotak label tidak muat di sepanjang ruas.
    """
    if not e.label:
        return (0.0, 0.0)
    (a, b, _) = longest_segment(pts)
    lw, lh = label_box_size(e)
    if abs(b[0] - a[0]) >= abs(b[1] - a[1]):
        if lw + 12.0 > abs(b[0] - a[0]):
            return (0.0, -(lh / 2.0 + 9.0))
    return (0.0, 0.0)


# ------------------------------------------------------------------------------------------
# 3. FONT & TEKS (dipakai validator + renderer)
# ------------------------------------------------------------------------------------------
_FONT_DIRS = [
    "C:/Windows/Fonts",
    "/usr/share/fonts/truetype/dejavu",
    "/Library/Fonts",
    "/System/Library/Fonts/Supplemental",
]
_FONT_FILES = {
    (False, False): ["segoeui.ttf", "DejaVuSans.ttf", "Arial.ttf", "Verdana.ttf"],
    (True, False): ["segoeuib.ttf", "DejaVuSans-Bold.ttf", "Arialbd.ttf", "Verdana Bold.ttf"],
    (False, True): ["segoeuii.ttf", "DejaVuSans-Oblique.ttf", "Ariali.ttf"],
    (True, True): ["segoeuiz.ttf", "DejaVuSans-BoldOblique.ttf", "Arialbi.ttf"],
}
_font_cache: Dict[Tuple[int, bool, bool], ImageFont.FreeTypeFont] = {}


def font(size: int, bold: bool = False, italic: bool = False):
    key = (int(size), bool(bold), bool(italic))
    if key in _font_cache:
        return _font_cache[key]
    for name in _FONT_FILES.get((bold, italic), _FONT_FILES[(False, False)]):
        for d in _FONT_DIRS:
            p = os.path.join(d, name)
            if os.path.exists(p):
                f = ImageFont.truetype(p, int(size))
                _font_cache[key] = f
                return f
    f = ImageFont.load_default(int(size))
    _font_cache[key] = f
    return f


def text_width(s: str, size: int, bold: bool = False) -> float:
    return font(size, bold).getlength(s)


def wrapped_lines(text: str, size: int, bold: bool, max_w: float) -> List[str]:
    out: List[str] = []
    for raw in str(text).split("\n"):
        if not raw.strip():
            out.append("")
            continue
        f = font(size, bold)
        cur = ""
        for word in raw.split(" "):
            trial = (cur + " " + word).strip()
            if cur == "" or f.getlength(trial) <= max_w:
                cur = trial
            else:
                out.append(cur)
                cur = word
        out.append(cur)
    return out


# ------------------------------------------------------------------------------------------
# 4. VALIDATOR LAYOUT ("pastikan semuanya rapih")
# ------------------------------------------------------------------------------------------


def _ancestors(node: Node, nodes: Dict[str, Node]) -> List[str]:
    out, cur = [], node.parent
    while cur:
        out.append(cur)
        cur = nodes[cur].parent if cur in nodes else None
    return out


def _rects_overlap(a: Rect, b: Rect) -> bool:
    return not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1])


def _seg_samples(a, b, step=6.0):
    ln = seg_length(a, b)
    if ln <= 0:
        return [a]
    n = max(2, int(ln / step))
    return [(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n) for i in range(n + 1)]


def _point_in(r: Rect, p, pad: float = -2.0) -> bool:
    return (r[0] + pad) < p[0] < (r[2] - pad) and (r[1] + pad) < p[1] < (r[3] - pad)


def validate_page(page: Page) -> List[str]:
    """Kembalikan daftar masalah. Format: 'ERROR|WARN :: pesan'."""
    problems: List[str] = []
    nodes, rects = page_points(page)

    seen = set()
    for n in page.nodes:
        if n.id in seen:
            problems.append(f"ERROR :: id node duplikat '{n.id}'")
        seen.add(n.id)
        if n.parent and n.parent not in nodes:
            problems.append(f"ERROR :: node '{n.id}' punya parent tidak dikenal '{n.parent}'")

    eids = set()
    for e in page.edges:
        if e.id in eids:
            problems.append(f"ERROR :: id edge duplikat '{e.id}'")
        eids.add(e.id)
        if e.src not in rects:
            problems.append(f"ERROR :: edge '{e.id}' sumber '{e.src}' tidak ada")
        if e.dst not in rects:
            problems.append(f"ERROR :: edge '{e.id}' tujuan '{e.dst}' tidak ada")
        if e.src == e.dst:
            problems.append(f"ERROR :: edge '{e.id}' self-loop (src == dst)")

    # (a) node saling tumpang tindih (kecuali relasi lane <-> isi lane)
    drawable = [n for n in page.nodes if n.shape != "text"]
    for i in range(len(drawable)):
        for j in range(i + 1, len(drawable)):
            a, b = drawable[i], drawable[j]
            if b.id in _ancestors(a, nodes) or a.id in _ancestors(b, nodes):
                continue
            if a.shape == "lane" or b.shape == "lane":
                if _ancestors(a, nodes) or _ancestors(b, nodes):
                    continue
            if _rects_overlap(rects[a.id], rects[b.id]):
                problems.append(f"ERROR :: node '{a.id}' dan '{b.id}' saling tumpang tindih")

    # (b) isi lane harus berada di dalam area konten lane
    for n in page.nodes:
        if not n.parent or n.parent not in nodes:
            continue
        lane = nodes[n.parent]
        if lane.shape != "lane":
            continue
        lr = rects[lane.id]
        hdr = lane.start_size
        content = (lr[0] + hdr, lr[1], lr[2], lr[3]) if lane.vertical else (lr[0], lr[1] + hdr, lr[2], lr[3])
        r = rects[n.id]
        if r[0] < content[0] or r[1] < content[1] or r[2] > content[2] or r[3] > content[3]:
            problems.append(f"WARN  :: node '{n.id}' keluar dari area konten lane '{lane.id}'")

    # (c) panah tidak boleh menembus badan node lain
    resolved = resolve_edges(page, nodes, rects)
    for re_ in resolved:
        skip = {re_.edge.src, re_.edge.dst}
        for n in page.nodes:
            if n.id in skip or n.shape in ("text",):
                continue
            if n.shape == "lane":
                continue
            r = rects[n.id]
            for k in range(len(re_.pts) - 1):
                for p in _seg_samples(re_.pts[k], re_.pts[k + 1]):
                    if _point_in(r, p):
                        problems.append(
                            f"ERROR :: panah '{re_.edge.id}' ({re_.edge.src}->{re_.edge.dst}) menembus node '{n.id}'"
                        )
                        break
                else:
                    continue
                break

    # (d) sambungan panah tidak melintasi node lain (garis diagonal)
    for re_ in resolved:
        for k in range(len(re_.pts) - 1):
            a, b = re_.pts[k], re_.pts[k + 1]
            if abs(a[0] - b[0]) > 0.6 and abs(a[1] - b[1]) > 0.6:
                problems.append(f"WARN  :: panah '{re_.edge.id}' punya ruas diagonal")

    # (e) label harus muat di dalam node (setelah word-wrap)
    for n in page.nodes:
        if not n.label or n.shape in ("text",):
            continue
        usable = n.w - 18
        if n.shape == "decision":
            usable = n.w * 0.62
        if n.shape == "ellipse":
            usable = n.w * 0.68
        if n.shape == "lane":
            usable = n.w - 10
        lines = wrapped_lines(n.label, n.font_size, n.bold, usable)
        longest_word = max((text_width(w, n.font_size, n.bold) for w in str(n.label).replace("\n", " ").split()), default=0)
        need = len(lines) * n.font_size * 1.34
        head = n.start_size if n.shape == "lane" else 0
        if longest_word > usable + 2:
            problems.append(f"WARN  :: ada kata pada label '{n.id}' ({longest_word:.0f}px) melebihi lebar teks ({usable:.0f}px)")
        elif need > (n.h - head - 8):
            problems.append(
                f"WARN  :: label '{n.id}' butuh {need:.0f}px tinggi (tersedia {n.h - head - 8:.0f}px, {len(lines)} baris)"
            )
    return problems


# ------------------------------------------------------------------------------------------
# 5. WRITER .DRAWIO
# ------------------------------------------------------------------------------------------


def xesc(s: str) -> str:
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


def value_attr(s: str, raw_html: bool = False) -> str:
    """Nilai atribut XML. Label HTML (mis. ERD) tetap harus di-escape (<b> -> &lt;b&gt;)."""
    return xesc(s).replace("\n", "&#10;")


def node_style(n: Node) -> str:
    parts: List[str] = []
    if n.shape == "text":
        parts.append("text;html=1;strokeColor=none;fillColor=none;")
        parts.append(f"align={n.align};")
        parts.append(f"fontColor={n.font_color or INK};fontSize={n.font_size};")
        fs = (1 if n.bold else 0) + (2 if n.italic else 0)
        if fs:
            parts.append(f"fontStyle={fs};")
        return "".join(parts)
    if n.shape == "process":
        parts.append("rounded=1;arcSize=14;whiteSpace=wrap;html=1;")
    elif n.shape == "stadium":
        parts.append("rounded=1;arcSize=50;whiteSpace=wrap;html=1;")
    elif n.shape == "rect":
        parts.append("rounded=0;whiteSpace=wrap;html=1;")
    elif n.shape == "decision":
        parts.append("rhombus;whiteSpace=wrap;html=1;")
    elif n.shape == "ellipse":
        parts.append("ellipse;whiteSpace=wrap;html=1;")
    elif n.shape == "cylinder":
        parts.append("shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=14;")
    elif n.shape == "note":
        parts.append("shape=note;whiteSpace=wrap;html=1;size=16;")
    elif n.shape == "hexagon":
        parts.append("shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;")
    elif n.shape == "lane":
        parts.append(
            "swimlane;html=1;container=1;collapsible=0;startSize=%d;horizontal=%d;"
            % (n.start_size, 0 if n.vertical else 1)
        )
    elif n.shape == "entity":
        parts.append("rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;spacingTop=2;")
    else:
        parts.append("whiteSpace=wrap;html=1;")
    parts.append(f"fillColor={n.fill};strokeColor={n.stroke};strokeWidth={n.stroke_width};")
    if n.shape != "entity":
        parts.append("verticalAlign=middle;")
    parts.append(f"align={n.align};")
    parts.append(f"fontColor={n.font_color or INK};fontSize={n.font_size};")
    fs = (1 if n.bold else 0) + (2 if n.italic else 0)
    if fs:
        parts.append(f"fontStyle={fs};")
    if n.opacity != 100:
        parts.append(f"opacity={n.opacity};")
    return "".join(parts)


def node_value(n: Node) -> Tuple[str, bool]:
    if n.shape == "entity":
        head = f"<b>{xesc(n.label)}</b>"
        rows = "<br>".join(xesc(r) for r in (n.rows or []))
        return f"{head}<hr size=1><div align='left'>{rows}</div>", True
    return n.label, False


def edge_style(re: ResolvedEdge) -> str:
    e = re.edge
    parts = [
        "edgeStyle=none;html=1;rounded=0;",
        f"strokeColor={e.color};strokeWidth={e.width};",
        f"endArrow={e.arrow};endFill=1;endSize=8;",
        f"exitX={SIDES[re.src_side][0]};exitY={SIDES[re.src_side][1]};exitDx=0;exitDy=0;exitPerimeter=0;",
        f"entryX={SIDES[re.dst_side][0]};entryY={SIDES[re.dst_side][1]};entryDx=0;entryDy=0;entryPerimeter=0;",
        f"fontSize={e.font_size};fontColor={e.font_color};labelBackgroundColor=#FFFFFF;",
    ]
    if e.label:
        parts.append("labelBackgroundColor=#FFFFFF;")
    if e.dashed:
        parts.append("dashed=1;dashPattern=8 6;")
    return "".join(parts)


def write_drawio(pages: List[Page], path: str) -> None:
    lines: List[str] = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(
        '<mxfile host="app.diagrams.net" agent="RuangRasa Flowchart Builder" version="24.7.17" type="device">'
    )
    for page in pages:
        nodes, rects = page_points(page)
        resolved = resolve_edges(page, nodes, rects)
        lines.append(f'  <diagram id="{xesc(page.id)}" name="{xesc(page.name)}">')
        lines.append(
            '    <mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" '
            'connect="1" arrows="1" fold="1" page="1" pageScale="1" '
            f'pageWidth="{int(page.width)}" pageHeight="{int(page.height)}" math="0" shadow="0">'
        )
        lines.append("      <root>")
        lines.append('        <mxCell id="0" />')
        lines.append('        <mxCell id="1" parent="0" />')
        for n in page.nodes:
            val, raw = node_value(n)
            parent = n.parent or "1"
            lines.append(
                f'        <mxCell id="{xesc(n.id)}" value="{value_attr(val, raw)}" '
                f'style="{node_style(n)}" vertex="1" parent="{xesc(parent)}">'
            )
            lines.append(
                f'          <mxGeometry x="{_num(n.x)}" y="{_num(n.y)}" width="{_num(n.w)}" '
                f'height="{_num(n.h)}" as="geometry" />'
            )
            lines.append("        </mxCell>")
        for re_ in resolved:
            e = re_.edge
            lines.append(
                f'        <mxCell id="{xesc(e.id)}" value="{value_attr(e.label)}" '
                f'style="{edge_style(re_)}" edge="1" parent="1" source="{xesc(e.src)}" target="{xesc(e.dst)}">'
            )
            lines.append('          <mxGeometry relative="1" as="geometry">')
            if e.points:
                lines.append('            <Array as="points">')
                for (px, py) in e.points:
                    lines.append(f'              <mxPoint x="{_num(px)}" y="{_num(py)}" />')
                lines.append("            </Array>")
            offx, offy = label_offset(e, re_.pts)
            if offx or offy:
                lines.append(f'            <mxPoint as="offset" x="{_num(offx)}" y="{_num(offy)}" />')
            lines.append("          </mxGeometry>")
            lines.append("        </mxCell>")
        lines.append("      </root>")
        lines.append("    </mxGraphModel>")
        lines.append("  </diagram>")
    lines.append("</mxfile>")
    lines.append("")
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(lines))


def _num(v: float) -> str:
    return str(int(round(v))) if abs(v - round(v)) < 0.01 else f"{v:.1f}"


# ------------------------------------------------------------------------------------------
# 6. RENDERER PNG (Pillow)
# ------------------------------------------------------------------------------------------
class PngRenderer:
    def __init__(self, scale: float = 2.0, margin: float = 40.0):
        self.s = scale
        self.margin = margin

    # ---- util
    def _xy(self, x: float, y: float) -> Tuple[float, float]:
        # margin ikut diskalakan agar kanvas rapi di semua skala
        return ((self.margin + x) * self.s, (self.margin + y) * self.s)

    def _rect(self, r: Rect):
        x0, y0 = self._xy(r[0], r[1])
        x1, y1 = self._xy(r[2], r[3])
        return [x0, y0, x1, y1]

    def _font(self, size: int, bold: bool, italic: bool = False):
        return font(max(7, int(round(size * self.s))), bold, italic)

    # ---- teks
    def draw_text_block(self, draw, text, rect: Rect, size: int, bold: bool, color: str,
                        align: str = "center", valign: str = "middle", pad: float = 8.0,
                        wrap_ratio: float = 1.0, italic: bool = False) -> None:
        if not text:
            return
        f = self._font(size, bold, italic)
        usable = (rect[2] - rect[0] - 2 * pad) * wrap_ratio
        lines = wrapped_lines(text, max(7, int(round(size * self.s))), bold, usable)
        lh = (size * 1.32) * self.s
        total = lh * len(lines)
        cx0, cy0 = self._xy(rect[0], rect[1])
        cx1, cy1 = self._xy(rect[2], rect[3])
        if valign == "middle":
            y = (cy0 + cy1) / 2 - total / 2
        elif valign == "top":
            y = cy0 + pad * self.s
        else:
            y = cy1 - total - pad * self.s
        for ln in lines:
            wpx = f.getlength(ln)
            if align == "center":
                x = (cx0 + cx1) / 2 - wpx / 2
            elif align == "left":
                x = cx0 + pad * self.s
            else:
                x = cx1 - wpx - pad * self.s
            draw.text((x, y), ln, font=f, fill=color)
            y += lh

    # ---- bentuk
    def _poly(self, draw, pts, fill, stroke, width):
        poly = [self._xy(*p) for p in pts]
        draw.polygon(poly, fill=fill)
        draw.line(poly + [poly[0]], fill=stroke, width=int(width * self.s), joint="curve")

    def _rounded(self, draw, rect: Rect, radius: float, fill, stroke, width, vertical_radius=None):
        x0, y0, x1, y1 = self._rect(rect)
        r = radius * self.s
        if vertical_radius is not None:
            # stadium / ellipse-like: radius = half height
            r = min((y1 - y0) / 2, (x1 - x0) / 2)
        draw.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=fill,
                               outline=stroke, width=int(width * self.s))

    def _dashed_seg(self, draw, a, b, color, width, dash=9.0, gap=6.0):
        total = seg_length(a, b)
        if total <= 0:
            return
        pos = 0.0
        ux, uy = (b[0] - a[0]) / total, (b[1] - a[1]) / total
        while pos < total:
            end = min(pos + dash, total)
            p1 = self._xy(a[0] + ux * pos, a[1] + uy * pos)
            p2 = self._xy(a[0] + ux * end, a[1] + uy * end)
            draw.line([p1, p2], fill=color, width=int(width * self.s))
            pos = end + gap

    def _arrow_head(self, draw, a, b, color, size=9.0):
        d = seg_length(a, b)
        if d < 0.5:
            return
        ux, uy = (b[0] - a[0]) / d, (b[1] - a[1]) / d
        tip = self._xy(b[0], b[1])
        base = self._xy(b[0] - ux * size, b[1] - uy * size)
        px, py = -uy, ux
        half = size * 0.42
        p1 = self._xy(b[0] - ux * size + px * half, b[1] - uy * size + py * half)
        p2 = self._xy(b[0] - ux * size - px * half, b[1] - uy * size - py * half)
        draw.polygon([tip, p1, p2], fill=color)
        draw.line([base, tip], fill=color, width=1)

    # ---- node
    def draw_node(self, draw, n: Node, rect: Rect, nodes: Dict[str, Node]) -> None:
        fill = n.fill
        stroke = n.stroke

        if n.shape == "text":
            self.draw_text_block(draw, n.label, rect, n.font_size, n.bold,
                                 n.font_color or INK, n.align, "middle", pad=0, italic=n.italic)
            return

        if n.shape == "lane":
            self._rounded(draw, rect, 10, fill, stroke, n.stroke_width)
            if n.vertical:
                strip = (rect[0], rect[1], rect[0] + n.start_size, rect[3])
            else:
                strip = (rect[0], rect[1], rect[2], rect[1] + n.start_size)
            self._rounded(draw, strip, 10, _mix(stroke, "#FFFFFF", 0.86), stroke, n.stroke_width)
            if n.vertical:
                self._rotated_text(draw, n.label, strip, n.font_size)
            else:
                self.draw_text_block(draw, n.label, strip, n.font_size, True,
                                     n.font_color or INK, "center", "middle", pad=6)
            return

        if n.shape == "decision":
            cx = (rect[0] + rect[2]) / 2
            cy = (rect[1] + rect[3]) / 2
            self._poly(draw, [(cx, rect[1]), (rect[2], cy), (cx, rect[3]), (rect[0], cy)],
                       fill, stroke, n.stroke_width)
            self.draw_text_block(draw, n.label, rect, n.font_size, n.bold,
                                 n.font_color or INK, "center", "middle", pad=6, wrap_ratio=0.62)
            return

        if n.shape == "ellipse":
            x0, y0, x1, y1 = self._rect(rect)
            draw.ellipse([x0, y0, x1, y1], fill=fill, outline=stroke, width=int(n.stroke_width * self.s))
            self.draw_text_block(draw, n.label, rect, n.font_size, n.bold,
                                 n.font_color or INK, "center", "middle", pad=6, wrap_ratio=0.68)
            return

        if n.shape == "cylinder":
            x0, y0, x1, y1 = self._rect(rect)
            ex = (y1 - y0) * 0.16
            draw.rectangle([x0, y0 + ex, x1, y1 - ex], fill=fill, outline=fill)
            draw.arc([x0, y0, x1, y0 + 2 * ex], 0, 360, fill=stroke, width=int(n.stroke_width * self.s))
            draw.arc([x0, y1 - 2 * ex, x1, y1], 0, 360, fill=stroke, width=int(n.stroke_width * self.s))
            draw.line([x0, y0 + ex, x0, y1 - ex], fill=stroke, width=int(n.stroke_width * self.s))
            draw.line([x1, y0 + ex, x1, y1 - ex], fill=stroke, width=int(n.stroke_width * self.s))
            self.draw_text_block(draw, n.label, (rect[0], rect[1] + ex / self.s, rect[2], rect[3]),
                                 n.font_size, n.bold, n.font_color or INK, "center", "middle", pad=8)
            return

        if n.shape == "note":
            x0, y0, x1, y1 = self._rect(rect)
            c = 16 * self.s
            pts = [(x0, y0), (x1 - c, y0), (x1, y0 + c), (x1, y1), (x0, y1)]
            draw.polygon(pts, fill=fill)
            draw.line(pts + [pts[0]], fill=stroke, width=int(n.stroke_width * self.s))
            draw.line([(x1 - c, y0), (x1 - c, y0 + c), (x1, y0 + c)], fill=stroke, width=int(self.s))
            self.draw_text_block(draw, n.label, rect, n.font_size, n.bold,
                                 n.font_color or INK, "left", "middle", pad=10)
            return

        if n.shape == "hexagon":
            x0, y0, x1, y1 = self._rect(rect)
            k = (x1 - x0) * 0.12
            pts = [(x0 + k, y0), (x1 - k, y0), (x1, (y0 + y1) / 2), (x1 - k, y1), (x0 + k, y1), (x0, (y0 + y1) / 2)]
            draw.polygon(pts, fill=fill)
            draw.line(pts + [pts[0]], fill=stroke, width=int(n.stroke_width * self.s))
            self.draw_text_block(draw, n.label, rect, n.font_size, n.bold,
                                 n.font_color or INK, "center", "middle", pad=8, wrap_ratio=0.78)
            return

        if n.shape == "entity":
            # header band + daftar kolom
            self._rounded(draw, rect, 0, fill, stroke, n.stroke_width)
            hdr = (rect[0], rect[1], rect[2], rect[1] + n.start_size)
            x0, y0, x1, y1 = self._rect(hdr)
            draw.rectangle([x0, y0 + 1, x1, y1], fill=_mix(n.stroke, "#FFFFFF", 0.78))
            draw.line([x0, y1, x1, y1], fill=stroke, width=int(n.stroke_width * self.s))
            self.draw_text_block(draw, n.label, hdr, n.font_size + 1, True,
                                 n.font_color or INK, "center", "middle", pad=6)
            rows = n.rows or []
            body_top = rect[1] + n.start_size
            body = (rect[0], body_top, rect[2], rect[3])
            if rows:
                f = self._font(max(8, n.font_size - 1), False)
                lh = (n.font_size - 1) * 1.38
                bx0, by0 = self._xy(body[0], body[1])
                for i, row in enumerate(rows):
                    y = by0 + (i + 0.5) * lh * self.s + 2
                    draw.text((bx0 + 8 * self.s, y - lh * self.s / 2), row, font=f,
                              fill=n.font_color or INK)
            return

        # process / stadium / rect
        stadium = n.shape == "stadium"
        self._rounded(draw, rect, 6 if stadium else 8, fill, stroke, n.stroke_width,
                      vertical_radius=True if stadium else None)
        self.draw_text_block(draw, n.label, rect, n.font_size, n.bold,
                             n.font_color or INK, n.align, "middle", pad=9)

    def _rotated_text(self, draw, text, strip: Rect, size: int) -> None:
        f = self._font(size, True)
        w = int(f.getlength(text) + 6)
        h = int(size * 1.5 * self.s)
        tmp = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        d2 = ImageDraw.Draw(tmp)
        d2.text((0, 0), text, font=f, fill=INK)
        tmp = tmp.rotate(90, expand=True)
        x0, y0 = self._xy(strip[0], strip[1])
        cx = (x0 + self._xy(strip[2], strip[3])[0]) / 2
        cy = (y0 + self._xy(strip[2], strip[3])[1]) / 2
        self.img.paste(tmp, (int(cx - tmp.width / 2), int(cy - tmp.height / 2)), tmp)

    def render(self, page: Page, path: str) -> Tuple[int, int]:
        nodes, rects = page_points(page)
        resolved = resolve_edges(page, nodes, rects)

        max_x = max([page.width] + [rects[n.id][2] for n in page.nodes if n.shape != "text"] or [page.width])
        max_y = max([page.height] + [rects[n.id][3] for n in page.nodes if n.shape != "text"] or [page.height])
        W = int((max_x + self.margin * 2) * self.s)
        H = int((max_y + self.margin * 2) * self.s)
        self.img = Image.new("RGB", (W, H), BG)
        draw = ImageDraw.Draw(self.img)

        lanes = [n for n in page.nodes if n.shape == "lane"]
        others = [n for n in page.nodes if n.shape != "lane"]
        for n in lanes:
            self.draw_node(draw, n, rects[n.id], nodes)

        # panah digambar setelah node agar rapi di atas bentuk
        for re_ in resolved:
            e = re_.edge
            pts = re_.pts
            for k in range(len(pts) - 1):
                if e.dashed:
                    self._dashed_seg(draw, pts[k], pts[k + 1], e.color, e.width)
                else:
                    draw.line([self._xy(*pts[k]), self._xy(*pts[k + 1])], fill=e.color,
                              width=int(e.width * self.s))
            if e.arrow != "none":
                self._arrow_head(draw, pts[-2], pts[-1], e.color)

        for n in others:
            self.draw_node(draw, n, rects[n.id], nodes)

        # label edge paling atas
        for re_ in resolved:
            e = re_.edge
            if not e.label:
                continue
            lx, ly = label_point(re_.pts)
            ox, oy = label_offset(e, re_.pts)
            lx, ly = lx + ox, ly + oy
            f = self._font(e.font_size, False)
            lines = str(e.label).split("\n")
            tw = max(f.getlength(l) for l in lines)
            th = len(lines) * e.font_size * 1.3 * self.s
            cx, cy = self._xy(lx, ly)
            padx, pady = 5 * self.s, 2 * self.s
            box = [cx - tw / 2 - padx, cy - th / 2 - pady, cx + tw / 2 + padx, cy + th / 2 + pady]
            draw.rectangle(box, fill=BG)
            y = box[1] + pady
            for l in lines:
                draw.text((cx - f.getlength(l) / 2, y), l, font=f, fill=e.font_color)
                y += e.font_size * 1.3 * self.s

        self.img.save(path)
        return W, H


def _mix(hex_a: str, hex_b: str, t: float) -> str:
    """Campur dua warna (t=0 -> hex_a, t=1 -> hex_b)."""
    a = hex_a.lstrip("#")
    b = hex_b.lstrip("#")
    ra, ga, ba = int(a[0:2], 16), int(a[2:4], 16), int(a[4:6], 16)
    rb, gb, bb = int(b[0:2], 16), int(b[2:4], 16), int(b[4:6], 16)
    r = int(ra + (rb - ra) * t)
    g = int(ga + (gb - ga) * t)
    bl = int(ba + (bb - ba) * t)
    return f"#{r:02X}{g:02X}{bl:02X}"


# ------------------------------------------------------------------------------------------
# 7. MAIN
# ------------------------------------------------------------------------------------------


def main(argv: Optional[List[str]] = None) -> int:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ap = argparse.ArgumentParser(description="Build Ruang Rasa flowchart (.drawio + PNG).")
    ap.add_argument("--out-drawio", default=os.path.join(root, "flowchart_ruangrasa.drawio"))
    ap.add_argument("--out-dir", default=os.path.join(root, "docs", "flowchart-png"))
    ap.add_argument("--no-png", action="store_true", help="hanya tulis .drawio")
    ap.add_argument("--scale", type=float, default=2.0, help="faktor skala render PNG")
    args = ap.parse_args(argv)

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import flowchart_spec  # noqa: E402

    pages: List[Page] = list(flowchart_spec.PAGES)

    os.makedirs(os.path.dirname(args.out_drawio), exist_ok=True)
    write_drawio(pages, args.out_drawio)
    print(f"[drawio] {args.out_drawio}  ({len(pages)} halaman)")

    if not args.no_png:
        os.makedirs(args.out_dir, exist_ok=True)
        r = PngRenderer(scale=args.scale)
        for i, p in enumerate(pages, start=1):
            name = f"{i:02d}-{p.slug}.png"
            w, h = r.render(p, os.path.join(args.out_dir, name))
            print(f"[png   ] {os.path.join(args.out_dir, name)}  ({w}x{h})")

    print("\n=== VALIDASI LAYOUT ===")
    total_err = 0
    total_warn = 0
    for i, p in enumerate(pages, start=1):
        problems = validate_page(p)
        errs = [x for x in problems if x.startswith("ERROR")]
        warns = [x for x in problems if x.startswith("WARN")]
        total_err += len(errs)
        total_warn += len(warns)
        status = "OK" if not errs else "ERROR"
        print(f"[{i:02d}] {p.name}  ({len(p.nodes)} node, {len(p.edges)} panah)  -> {status}")
        seen = set()
        for msg in errs + warns:
            if msg in seen:
                continue
            seen.add(msg)
            print(f"      {msg}")
    print(f"\nRingkasan: {total_err} ERROR, {total_warn} WARNING")
    return 1 if total_err else 0


if __name__ == "__main__":
    raise SystemExit(main())
