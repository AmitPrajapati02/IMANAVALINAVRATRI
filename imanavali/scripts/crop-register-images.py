"""Crop registration PNGs to non-transparent content bounds."""
from pathlib import Path
from PIL import Image

REGISTER_DIR = Path(__file__).resolve().parent.parent / "client" / "public" / "images" / "register"


def crop_alpha(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    alpha = img.split()[3]
    bbox = alpha.getbbox()
    if not bbox:
        return img
    return img.crop(bbox)


def main():
    for path in sorted(REGISTER_DIR.glob("*.png")):
        img = Image.open(path)
        cropped = crop_alpha(img)
        cropped.save(path, "PNG")
        print(f"{path.name}: {img.size} -> {cropped.size}")


if __name__ == "__main__":
    main()
