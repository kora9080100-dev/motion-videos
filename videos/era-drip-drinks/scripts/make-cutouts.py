"""Cut each cup out of public/photo.jpg into public/cups/<name>.png.

The outlines are hand-traced in photo pixel coordinates (900x1600).
Run with: python3 scripts/make-cutouts.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SUPERSAMPLE = 4

POLYS = {
    "hibiscus": [(0, 1228), (30, 1205), (70, 1192), (130, 1186), (190, 1194), (245, 1210), (280, 1228), (286, 1245), (272, 1262), (262, 1300), (248, 1400), (232, 1500), (215, 1560), (205, 1600), (0, 1600)],
    "coffee": [(300, 1158), (340, 1150), (400, 1146), (470, 1148), (530, 1158), (552, 1185), (562, 1222), (560, 1240), (548, 1252), (540, 1350), (533, 1450), (527, 1600), (299, 1600), (292, 1450), (287, 1300), (285, 1250), (274, 1236), (276, 1200), (286, 1172)],
    "latte": [(900, 1205), (850, 1200), (790, 1196), (730, 1205), (680, 1225), (640, 1250), (615, 1280), (608, 1305), (620, 1322), (645, 1330), (655, 1400), (668, 1500), (690, 1600), (900, 1600)],
}


def main() -> None:
    photo = Image.open(ROOT / "public" / "photo.jpg").convert("RGB")
    w, h = photo.size
    for name, poly in POLYS.items():
        big = Image.new("L", (w * SUPERSAMPLE, h * SUPERSAMPLE), 0)
        ImageDraw.Draw(big).polygon([(x * SUPERSAMPLE, y * SUPERSAMPLE) for x, y in poly], fill=255)
        mask = big.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
        # Black out everything outside the cup so the PNG stays small.
        cut = Image.composite(photo, Image.new("RGB", (w, h)), mask.point(lambda v: 255 if v else 0))
        cut.putalpha(mask)
        cut.save(ROOT / "public" / "cups" / f"{name}.png", optimize=True)


if __name__ == "__main__":
    main()
