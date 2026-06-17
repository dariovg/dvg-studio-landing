#!/usr/bin/env python3
"""Genera favicons cuadrados con padding desde logo-dvg-icon.png."""

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

    pad = int(size * 0.11)
    max_w = size - pad * 2
    max_h = int(size * 0.5)
    scale = min(max_w / logo.width, max_h / logo.height)
    w = int(logo.width * scale)
    h = int(logo.height * scale)
    logo = logo.resize((w, h), Image.Resampling.LANCZOS)
    x = (size - w) // 2
    y = (size - h) // 2
    canvas.paste(logo, (x, y), logo)

    radius = max(4, size // 5)
    mask = rounded_mask(size, radius)
    out = Image.new("RGBA", (size, size), BG)
    out.paste(canvas, (0, 0), mask)
    return out


def main() -> None:
    outputs = {
        "favicon-16.png": 16,
        "favicon-32.png": 32,
        "favicon.png": 180,
        "apple-touch-icon.png": 180,
    }
    for name, size in outputs.items():
        icon = build_icon(size)
        icon.save(ASSETS / name, format="PNG", optimize=True)
        print(f"✓ {name} ({size}x{size})")


if __name__ == "__main__":
    main()
