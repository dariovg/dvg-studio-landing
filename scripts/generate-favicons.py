#!/usr/bin/env python3
"""Genera favicons cuadrados con padding desde logo-dvg-icon.png."""

from __future__ import annotations

import base64
import io
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
SRC = ASSETS / "logo-dvg-icon.png"
BG = (10, 14, 39, 255)  # #0A0E27


def rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    return mask


def build_icon(size: int) -> Image.Image:
    logo = Image.open(SRC).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), BG)

    pad = int(size * 0.1)
    max_w = size - pad * 2
    max_h = int(size * 0.52)
    scale = min(max_w / logo.width, max_h / logo.height)
    w = max(1, int(logo.width * scale))
    h = max(1, int(logo.height * scale))
    logo = logo.resize((w, h), Image.Resampling.LANCZOS)
    x = (size - w) // 2
    y = (size - h) // 2
    canvas.paste(logo, (x, y), logo)

    radius = max(4, size // 5)
    mask = rounded_mask(size, radius)
    out = Image.new("RGBA", (size, size), BG)
    out.paste(canvas, (0, 0), mask)
    return out


def render_sharp(size: int) -> Image.Image:
    base = 512 if size <= 180 else size
    return build_icon(base).resize((size, size), Image.Resampling.LANCZOS)


def write_embedded_svg(icon: Image.Image, path: Path) -> None:
    buf = io.BytesIO()
    icon.save(buf, format="PNG", optimize=True)
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" '
        'role="img" aria-label="DVG Studio">'
        f'<image width="64" height="64" href="data:image/png;base64,{encoded}"/>'
        "</svg>"
    )
    path.write_text(svg, encoding="utf-8")


def main() -> None:
    sizes = {
        ASSETS / "favicon-16.png": 16,
        ASSETS / "favicon-32.png": 32,
        ASSETS / "favicon.png": 180,
        ASSETS / "apple-touch-icon.png": 180,
    }

    icons: dict[int, Image.Image] = {}
    for path, size in sizes.items():
        icon = render_sharp(size)
        icons[size] = icon
        icon.save(path, format="PNG", optimize=True)
        print(f"✓ {path.relative_to(ROOT)} ({size}x{size})")

    ico_path = ROOT / "favicon.ico"
    master = render_sharp(48)
    master.save(
        ico_path,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[icons[16], icons[32]],
    )
    print(f"✓ {ico_path.relative_to(ROOT)}")

    write_embedded_svg(render_sharp(64), ASSETS / "favicon.svg")
    print("✓ assets/favicon.svg (base64 embebido)")


if __name__ == "__main__":
    main()
