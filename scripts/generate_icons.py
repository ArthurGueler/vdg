"""Gera ícones PWA do site "Para Amanda" — coração rosa em fundo escuro."""
import os
import math
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), '..', 'icons')
os.makedirs(OUT, exist_ok=True)

BG = (11, 8, 9)             # --bg do site
HEART = (255, 71, 141)      # --accent-2 (rosa choque)


def heart_polygon(cx, cy, size):
    """Polígono de coração baseado em equação paramétrica."""
    pts = []
    n = 200
    # x = 16 sin³(t), y = 13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * (math.sin(t) ** 3)
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * size / 34, cy - y * size / 34))
    return pts


def make_icon(size: int, maskable: bool = False, rounded: bool = True):
    img = Image.new('RGB', (size, size), BG)
    draw = ImageDraw.Draw(img)

    # Maskable: coração menor (~55%) para safe zone. Standard: ~70%.
    heart_size = int(size * (0.55 if maskable else 0.7))
    cx, cy = size // 2, int(size * 0.52)

    # Sombra suave (glow rosa)
    for r in range(3, 0, -1):
        pts = heart_polygon(cx, cy, heart_size + r * size // 40)
        draw.polygon(pts, fill=(HEART[0] // 4, HEART[1] // 4, HEART[2] // 4))

    pts = heart_polygon(cx, cy, heart_size)
    draw.polygon(pts, fill=HEART)

    if rounded and not maskable:
        # Aplica cantos arredondados
        mask = Image.new('L', (size, size), 0)
        mdraw = ImageDraw.Draw(mask)
        radius = int(size * 0.22)
        mdraw.rounded_rectangle([(0, 0), (size, size)], radius, fill=255)
        rounded_img = Image.new('RGB', (size, size), (0, 0, 0))
        rounded_img.paste(img, mask=mask)
        img = rounded_img

    return img


for size in (192, 512):
    img = make_icon(size)
    path = os.path.join(OUT, f'icon-{size}.png')
    img.save(path, optimize=True)
    print(f'  -> {path}')

img = make_icon(512, maskable=True, rounded=False)
path = os.path.join(OUT, 'icon-512-maskable.png')
img.save(path, optimize=True)
print(f'  -> {path}')

img = make_icon(180)
path = os.path.join(OUT, 'apple-touch-icon.png')
img.save(path, optimize=True)
print(f'  -> {path}')

img = make_icon(32, rounded=False)
path = os.path.join(OUT, 'favicon-32.png')
img.save(path, optimize=True)
print(f'  -> {path}')

print('Done.')
