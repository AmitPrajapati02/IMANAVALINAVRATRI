"""Remove outer black matte from registration banner PNGs (make transparent)."""
from pathlib import Path
from PIL import Image

REGISTER_DIR = Path(__file__).resolve().parent.parent / "client" / "public" / "images" / "register"
THRESHOLD = 28  # treat near-black as matte


def color_close_to_black(r, g, b, a):
    if a == 0:
        return True
    return r <= THRESHOLD and g <= THRESHOLD and b <= THRESHOLD


def flood_transparent(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    pixels = img.load()
    visited = set()
    stack = []

    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))

    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        if (x, y) in visited:
            continue
        visited.add((x, y))
        r, g, b, a = pixels[x, y]
        if not color_close_to_black(r, g, b, a):
            continue
        pixels[x, y] = (r, g, b, 0)
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    return img


def main():
    for path in sorted(REGISTER_DIR.glob("*.png")):
        img = Image.open(path)
        out = flood_transparent(img)
        out.save(path, "PNG")
        print(f"Processed {path.name}")


if __name__ == "__main__":
    main()
