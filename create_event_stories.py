from pathlib import Path
import random

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps


ROOT = Path(__file__).parent
SOURCE = Path("/Users/ulianatsvirko/Downloads/Кулисы — PNG")
OUT = ROOT / "output" / "event-stories"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1080, 1920
INK = "#050505"
PAPER = "#F4F3EF"
MUTED = "#9B9B96"
PINK = "#FF1493"
LINE = "#343432"

BENI = ROOT / "assets/fonts/beni-black.otf"
REGULAR = ROOT / "assets/fonts/kinetika-regular.otf"
MEDIUM = ROOT / "assets/fonts/kinetika-medium.otf"
BOLD = ROOT / "assets/fonts/kinetika-bold.otf"
HEAVY = ROOT / "assets/fonts/kinetika-heavy.otf"
LOCKUP = ROOT / "assets/sens-logo-lockup.png"
USER_IMAGES = Path("/Users/ulianatsvirko/Downloads")
HANDWRITTEN = Path("/System/Library/Fonts/Noteworthy.ttc")


def font(path, size):
    return ImageFont.truetype(str(path), size)


def cover(path, brightness=.48, contrast=1.18, position=.5):
    image = Image.open(path).convert("RGB")
    scale = max(W / image.width, H / image.height)
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (image.width - W) // 2
    max_top = image.height - H
    top = round(max_top * position)
    image = image.crop((left, top, left + W, top + H))
    image = ImageOps.grayscale(image).convert("RGB")
    image = ImageEnhance.Contrast(image).enhance(contrast)
    return ImageEnhance.Brightness(image).enhance(brightness)


def fit_width_background(path, y, brightness=.48, contrast=1.18):
    source = Image.open(path).convert("RGB")
    source = ImageOps.grayscale(source).convert("RGB")
    source = ImageEnhance.Contrast(source).enhance(contrast)
    source = ImageEnhance.Brightness(source).enhance(brightness)
    height = round(source.height * W / source.width)
    source = source.resize((W, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (W, H), INK)
    canvas.paste(source, (0, y))
    return canvas


def overlay(image, color=(0, 0, 0, 120)):
    return Image.alpha_composite(image.convert("RGBA"), Image.new("RGBA", image.size, color))


def add_grain(image, opacity=16, seed=17):
    random.seed(seed)
    noise = Image.new("L", image.size)
    noise.putdata([random.randrange(80, 176) for _ in range(W * H)])
    grain = Image.merge("RGBA", (noise, noise, noise, Image.new("L", image.size, opacity)))
    return Image.alpha_composite(image.convert("RGBA"), grain)


def draw_tracking(draw, xy, value, face, fill, tracking=3, stroke_width=0, stroke_fill=None):
    x, y = xy
    for char in value:
        draw.text((x, y), char, font=face, fill=fill, stroke_width=stroke_width, stroke_fill=stroke_fill or fill)
        x += draw.textlength(char, font=face) + tracking


def fit_beni(draw, value, max_width, preferred, minimum=56):
    size = preferred
    while size > minimum:
        face = font(BENI, size)
        if draw.textbbox((0, 0), value, font=face)[2] <= max_width:
            return face
        size -= 2
    return font(BENI, minimum)


def logo(image, x=72, y=1710, width=330):
    mark = Image.open(LOCKUP).convert("RGBA")
    ratio = width / mark.width
    mark = mark.resize((width, round(mark.height * ratio)), Image.Resampling.LANCZOS)
    image.alpha_composite(mark, (x, y))


def meta(draw, number, right="25.09 / 19:00"):
    face = font(HEAVY, 24)
    draw_tracking(draw, (72, 102), f"СТОРИС  {number:02d} / 05", face, PINK, 2)
    box = draw.textbbox((0, 0), right, font=face)
    draw.text((W - 72 - (box[2] - box[0]), 102), right, font=face, fill=PAPER)
    draw.line((72, 150, W - 72, 150), fill=PINK, width=2)


def save(image, number):
    image = add_grain(image, seed=number * 31)
    image.convert("RGB").save(OUT / f"sens-event-story-{number:02d}.jpg", quality=96, subsampling=0)


def story_1():
    image = overlay(cover(USER_IMAGES / "♥.jpeg", brightness=.55, position=.48), (0, 0, 0, 74))
    draw = ImageDraw.Draw(image)

    y = 240
    for value, color, size in [
        ("ВСЕМ", PAPER, 178),
        ("ПРИВЕТ!", PINK, 190),
    ]:
        face = fit_beni(draw, value, W - 144, size)
        draw_tracking(draw, (72, y), value, face, color, 4)
        y += round(face.size * .94)

    draw.text((78, 625), "у нас новости", font=font(HANDWRITTEN, 57), fill=PAPER)

    draw.text((74, 1110), "МЫ С НЕТЕРПЕНИЕМ", font=font(BOLD, 38), fill=PAPER)
    draw.text((74, 1175), "РАДЫ ОБЪЯВИТЬ ВАМ", font=font(BOLD, 38), fill=PAPER)
    draw.text((74, 1265), "О НАШЕМ ПЕРВОМ", font=font(HEAVY, 41), fill=PINK)
    draw.text((74, 1335), "МЕРОПРИЯТИИ.", font=font(HEAVY, 41), fill=PINK)
    logo(image)
    save(image, 1)


def story_2():
    image = overlay(cover(USER_IMAGES / "_ (41).jpeg", brightness=.54, position=.5), (0, 0, 0, 88))
    draw = ImageDraw.Draw(image)
    draw.text((74, 300), "ЕСЛИ БЫ У ВАС БЫЛА", font=font(HEAVY, 42), fill=PAPER)
    draw.text((74, 375), "ВОЗМОЖНОСТЬ ЗАДАТЬ", font=font(HEAVY, 42), fill=PAPER)
    draw.text((74, 450), "ВОПРОС АРТИСТУ БАЛЕТА", font=font(HEAVY, 42), fill=PAPER)
    draw.text((74, 525), "УРОВНЯ ПРЕМЬЕРА ИЛИ ПРИМЫ —", font=font(HEAVY, 42), fill=PAPER)
    draw.text((74, 660), "о чём бы вы спросили?", font=font(HANDWRITTEN, 64), fill=PINK)
    draw.rectangle((72, 1130, W - 72, 1285), outline=PAPER, width=3)
    draw.text((108, 1180), "МЕСТО ДЛЯ СТИКЕРА «ВАШ ОТВЕТ»", font=font(BOLD, 27), fill=MUTED)
    logo(image)
    save(image, 2)


def story_3():
    image = overlay(
        fit_width_background(USER_IMAGES / "SKMBT_C25010111710560-copy.webp", y=470, brightness=.58),
        (0, 0, 0, 78),
    )
    draw = ImageDraw.Draw(image)
    draw_tracking(draw, (72, 260), "ТАКАЯ", font(BENI, 205), PAPER, 5)
    draw_tracking(draw, (72, 425), "ВОЗМОЖНОСТЬ", fit_beni(draw, "ВОЗМОЖНОСТЬ", W - 144, 185), PINK, 4)
    draw_tracking(draw, (72, 575), "БУДЕТ", font(BENI, 205), PAPER, 5)
    draw_tracking(draw, (72, 740), "У НАС.", font(BENI, 220), PAPER, 5)
    draw.text((74, 1110), "НА ВСТРЕЧЕ БУДЕТ", font=font(BOLD, 34), fill=PAPER)
    draw.text((74, 1170), "ОТКРЫТЫЙ МИКРОФОН.", font=font(HEAVY, 40), fill=PINK)
    draw.text((74, 1250), "ВЫ СМОЖЕТЕ ЗАДАТЬ СВОЙ ВОПРОС", font=font(BOLD, 29), fill=PAPER)
    draw.text((74, 1305), "И ПОЛУЧИТЬ ЧЕСТНЫЙ ОТВЕТ", font=font(BOLD, 29), fill=PAPER)
    draw.text((74, 1360), "БЕЗ ЗАРАНЕЕ ПОДГОТОВЛЕННОГО СЦЕНАРИЯ.", font=font(BOLD, 29), fill=PAPER)
    logo(image)
    save(image, 3)


def story_4():
    image = Image.new("RGBA", (W, H), INK)
    draw = ImageDraw.Draw(image)
    outline = font(BENI, 154)
    draw_tracking(draw, (-8, 215), "ПО ОБЕ", outline, INK, 4, 3, PAPER)
    draw_tracking(draw, (-8, 340), "СТОРОНЫ", outline, INK, 4, 3, PAPER)
    post = Image.open(SOURCE / "Кулисы — 01.png").convert("RGB")
    post_w = 682
    post_h = round(post_w * 1.25)
    post = post.resize((post_w, post_h), Image.Resampling.LANCZOS)
    px, py = 199, 580
    draw.rectangle((px - 10, py - 10, px + post_w + 10, py + post_h + 10), outline=PINK, width=4)
    image.paste(post, (px, py))
    draw.text((72, 1510), "ВСЕ ПОДРОБНОСТИ — В НОВОМ ПОСТЕ", font=font(HEAVY, 30), fill=PAPER)
    draw.text((72, 1565), "ПЕРЕХОДИТЕ К ПУБЛИКЦИИ  ↗", font=font(BOLD, 28), fill=PINK)
    logo(image)
    save(image, 4)


def story_5():
    image = overlay(
        fit_width_background(USER_IMAGES / "images (5).jpeg", y=420, brightness=.54),
        (0, 0, 0, 76),
    )
    draw = ImageDraw.Draw(image)

    draw_tracking(draw, (72, 240), "25.09", font(BENI, 300), PINK, 8)
    draw_tracking(draw, (72, 500), "19:00", font(BENI, 235), PAPER, 8)
    draw.text((74, 735), "ПРОСТРАНСТВО СЭНС", font=font(HEAVY, 34), fill=PAPER)
    draw.text((74, 790), "ул. Кульман, 1/2", font=font(MEDIUM, 32), fill=MUTED)
    draw.text((74, 875), "20 руб. до 24.09  /  25 руб. в день события", font=font(BOLD, 29), fill=PAPER)

    # Instagram's native link sticker is placed over this high-contrast target area.
    sy = 1185
    draw.rectangle((72, sy, W - 72, sy + 170), fill=PAPER)
    draw.text((112, sy + 36), "ЗАРЕГИСТРИРОВАТЬСЯ", font=font(HEAVY, 34), fill=INK)
    draw.text((112, sy + 93), "ДОБАВЬТЕ LINK STICKER СЮДА", font=font(BOLD, 22), fill=INK)
    draw.text((W - 144, sy + 55), "↗", font=font(BENI, 76), fill=PINK)

    draw.text((72, 1450), "МЕСТ НЕМНОГО.", font=font(BOLD, 31), fill=PAPER)
    draw.text((72, 1505), "РЕГИСТРАЦИЯ УЖЕ ОТКРЫТА.", font=font(HEAVY, 31), fill=PINK)
    logo(image)
    save(image, 5)


def contact_sheet():
    thumb_w = 270
    thumb_h = 480
    sheet = Image.new("RGB", (thumb_w * 5 + 108, thumb_h + 90), "#181818")
    for index in range(1, 6):
        slide = Image.open(OUT / f"sens-event-story-{index:02d}.jpg")
        slide.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        sheet.paste(slide, (18 + (index - 1) * (thumb_w + 18), 18))
    sheet.save(OUT / "contact-sheet.jpg", quality=94)


if __name__ == "__main__":
    story_1()
    story_2()
    story_3()
    story_4()
    story_5()
    contact_sheet()
    print(f"Created 5 stories in {OUT}")
