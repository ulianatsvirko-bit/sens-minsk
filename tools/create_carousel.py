from PIL import Image, ImageDraw, ImageFont, ImageEnhance
from pathlib import Path
import random

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'output' / 'carousel'
OUT.mkdir(parents=True, exist_ok=True)
W,H = 1080,1350
INK='#050505'; PAPER='#F4F3EF'; MUTED='#9B9B96'; PINK='#FF1493'; LINE='#343432'
FONT=ROOT/'assets/fonts/kinetika-regular.otf'; BOLD=ROOT/'assets/fonts/kinetika-bold.otf'; HEAVY=ROOT/'assets/fonts/kinetika-heavy.otf'; BENI=ROOT/'assets/fonts/beni-black.otf'
photos=['space/hero.jpg','space/lounge.jpg','space/balls.jpg','space/blocks.jpg','space/detail.jpg','space/exterior.jpg','space/hero.jpg','space/lounge.jpg','space/blocks.jpg','space/balls.jpg','space/exterior.jpg','space/hero.jpg']

def f(path,size): return ImageFont.truetype(str(path),size)
def bg(name, dark=True):
    im=Image.open(ROOT/'assets'/name).convert('RGB')
    scale=max(W/im.width,H/im.height); im=im.resize((int(im.width*scale),int(im.height*scale)))
    left=(im.width-W)//2; top=(im.height-H)//2; im=im.crop((left,top,left+W,top+H))
    if dark:
        im=ImageEnhance.Contrast(im).enhance(1.15); im=ImageEnhance.Brightness(im).enhance(.58)
        shade=Image.new('RGBA',(W,H),(0,0,0,95)); im=Image.alpha_composite(im.convert('RGBA'),shade).convert('RGB')
    return im
def text(draw,xy,s,font,fill=PAPER,anchor=None,stroke=0): draw.text(xy,s,font=font,fill=fill,anchor=anchor,stroke_width=stroke,stroke_fill=fill)
def footer(draw,n):
    draw.line((64,H-84,W-64,H-84),fill=LINE,width=2)
    text(draw,(64,H-48),'СЭНС  /  КУЛЬМАН 1/2',f(HEAVY,22),PAPER)
    text(draw,(W-64,H-48),f'{n:02d} / 12',f(HEAVY,22),MUTED,anchor='ra')
def make(i,title,sub,bullets=None,photo=None,accent=None,light=False):
    im=bg(photo or photos[i-1], dark=not light); d=ImageDraw.Draw(im)
    if light: d.rectangle((0,0,W,H),fill=INK)
    text(d,(64,82),f'СЛАЙД {i:02d}',f(HEAVY,20),PINK)
    # oversized number for poster feel
    text(d,(W-58,55),f'{i:02d}',f(BENI,190),PAPER,anchor='ra')
    text(d,(64,205),title,f(BENI,74),PAPER)
    y=330
    if sub:
        text(d,(68,y),sub,f(BOLD,30),PINK if accent else PAPER); y+=75
    if bullets:
        for b in bullets:
            # compact but readable list
            d.ellipse((70,y+12,82,y+24),fill=PINK)
            text(d,(106,y),b,f(FONT,27),PAPER); y+=52
    footer(d,i)
    return im

slides=[]
slides.append(make(1,'СЭНС — пространство\nдля ваших событий','Трансформируемая сцена и зал до 100 мест\nв центре Минска.', ['АРЕНДА  ·  ПОД КЛЮЧ  ·  КОЛЛАБОРАЦИИ'], 'space/exterior.jpg'))
slides.append(make(2,'Что можно\nпровести','', ['спектакль и перформанс','лекцию и практикум','мастер-класс и интенсив','кинопоказ и репетицию','презентацию и камерную встречу','фуршет, резиденцию, закрытое событие'], 'space/balls.jpg'))
slides.append(make(3,'Пространство-\nтрансформер','Один зал. Разные события.', ['373 м² — общая площадь','221,1 м² — площадь зала','7 м — высота потолка','до 100 мест в театральной рассадке','мобильная сцена и танцевальный линолеум'], 'space/hero.jpg'))
slides.append(make(4,'Дополнительные\nзоны','Всё, что нужно гостям и команде.', ['welcome-зона — 81,2 м²','барная стойка и барные столы','гримёрка — 39,1 м²','гардероб и два санузла','Wi‑Fi · парковка · первый этаж','доступность для маломобильных групп'], 'space/lounge.jpg'))
slides.append(make(5,'Базовый комплект\nзвука','Звук уже в стоимости аренды.', ['Audiocenter','Behringer X32 Compact','2 радиосистемы Shure','2 микрофона SM58','XLR-коммутация','управление с iPad или iPhone'], 'space/detail.jpg'))
slides.append(make(6,'Базовый комплект\nсвета','Сцена, которая поддерживает действие.', ['профильный LED-свет','LED Fresnel RGBW','вращающиеся wash и BSW','MEANReal MA2 Command Wing','совместимость с grandMA2'], 'space/hero.jpg'))
slides.append(make(7,'Видео и\nинфраструктура','Продумано для монтажа и гостей.', ['проектор Sony','LED-экран 3 × 2 м — сентябрь 2026','отдельный вход с улицы и со двора','заезд через шлагбаум по согласованию','первый этаж · монтаж около 30 минут'], 'space/exterior.jpg'))
slides.append(make(8,'Почасовая\nаренда','', ['190 BYN / час','минимальный заказ — от 3 часов','Пн–Чт — 2 000 BYN / сутки','Пт–Вс — 2 500 BYN / сутки'], 'space/blocks.jpg'))
slides.append(make(9,'Событие\nпод ключ','Базовый пакет.', ['до 50 мест — 3 500 BYN','каждое место сверх 50 — +50 BYN','100 гостей — 6 000 BYN','техперсонал — +300 BYN','кейтеринг и welcome drink — индивидуально'], 'space/lounge.jpg'))
slides.append(make(10,'Коллаборации\nи постоянные слоты','Ищем форматы, которые растут вместе.', ['события в афише СЭНС','продвижение и организация проекта','регулярные занятия и показы','постоянные слоты','индивидуальные условия'], 'space/balls.jpg'))
slides.append(make(11,'Как\nзабронировать','Напишите «ПЛОЩАДКА» в Direct\nили на sensehubminsk@gmail.com', ['формат и дату','количество гостей','технические требования','нужную конфигурацию'], 'space/exterior.jpg'))
slides.append(make(12,'СЭНС — пространство\nдля действия','Кульман 1/2, Минск\nТеатр, дом и открытая сцена.', ['@senseminsk','sensehubminsk@gmail.com'], 'space/hero.jpg'))
for i,im in enumerate(slides,1):
    im.save(OUT/f'sens-carousel-{i:02d}.jpg',quality=94,subsampling=0)
print(f'created {len(slides)} slides in {OUT}')
