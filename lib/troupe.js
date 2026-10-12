// Troupe members for the homepage cards and the member dialog.
// To add photos, a bio or Instagram: put files in assets/troupe/<id>/ and fill `gallery` / `bio` / `instagram`.

const PORTRAIT = { width: 853, height: 1280 };

// Each shot is an alt text; prefix it with "wide:" for a landscape photo.
// `long` / `short` are the pixel sides of the files (1600 × 1066 unless the source was smaller).
const shots = (id, alts, { long = 1600, short = 1066 } = {}) => alts.map((alt, i) => {
  const wide = alt.startsWith('wide:');
  return {
    src: `assets/troupe/${id}/${String(i + 1).padStart(2, '0')}.jpg`,
    alt: wide ? alt.slice(5) : alt,
    width: wide ? long : short,
    height: wide ? short : long
  };
});

export const TROUPE = [
  { id: 'alexandra-buyalskaya', name: 'Александра Буяльская', role: 'Художественный руководитель', photo: 'assets/troupe/alexandra-buyalskaya.jpg' },
  { id: 'tatiana-lebedeva', name: 'Татьяна Лебедева', role: 'Артистка · балетмейстер', photo: 'assets/troupe/tatiana-lebedeva.jpg' },
  {
    id: 'elizaveta-esipova', name: 'Елизавета Есипова', role: 'Артистка балета', photo: 'assets/troupe/elizaveta-esipova.jpg',
    bio: 'Окончила Белорусский государственный университет культуры и искусств.',
    instagram: '',
    gallery: shots('elizaveta-esipova', [
      'Елизавета Есипова в профиль, чёрно-белый портрет',
      'Елизавета Есипова на полу в луче света, тянет руку вверх',
      'Елизавета Есипова с поднятыми руками, закрыв глаза',
      'Елизавета Есипова в наклоне, смотрит в камеру',
      'Елизавета Есипова полулёжа на полу зала',
      'Елизавета Есипова в наклоне с поднятой рукой'
    ])
  },
  {
    id: 'maria-mikhaliuk', name: 'Мария Михалюк', role: 'Артистка', photo: 'assets/troupe/maria-mikhaliuk.jpg',
    gallery: shots('maria-mikhaliuk', [
      'Мария Михалюк, цветной портрет крупным планом',
      'Мария Михалюк в низкой позе на полу зала с поднятой рукой',
      'Мария Михалюк с рукой над головой, чёрно-белый портрет',
      'Мария Михалюк спиной к камере, руки согнуты над головой',
      'Мария Михалюк запрокинула голову в луче света',
      'Мария Михалюк в наклоне, руки вытянуты над головой',
      'Мария Михалюк смотрит вверх в луче света, вариант кадра',
      'Мария Михалюк в стойке на плече, ноги вверх',
      'Мария Михалюк лёжа, голова запрокинута, чёрно-белый кадр'
    ])
  },
  {
    id: 'konstantin-matsukevich', name: 'Константин Мацукевич', role: 'Артист', photo: 'assets/troupe/konstantin-matsukevich.jpg',
    gallery: shots('konstantin-matsukevich', [
      'Константин Мацукевич, руки обрамляют лицо, цветной портрет',
      'Константин Мацукевич в глубоком выпаде с поднятой рукой в пустом зале',
      'Константин Мацукевич в наклоне с раскинутыми руками, чёрно-белый кадр',
      'Константин Мацукевич склонил голову между ладоней, чёрно-белый портрет',
      'Константин Мацукевич лёжа на полу, ноги подняты вверх',
      'Константин Мацукевич в наклоне у окон зала',
      'Константин Мацукевич, руки у лица, цветной портрет',
      'Константин Мацукевич в выпаде с поднятой рукой, вариант кадра',
      'Константин Мацукевич склонил голову между ладоней, вариант кадра'
    ])
  },
  {
    id: 'alexey-valkovich', name: 'Алексей Валькович', role: 'Артист', photo: 'assets/troupe/alexey-valkovich.jpg',
    gallery: shots('alexey-valkovich', [
      'Алексей Валькович сидит верхом на стуле, обняв спинку',
      'Алексей Валькович на стуле в луче света, крупнее',
      'Алексей Валькович стоит на кубе посреди зала',
      'Алексей Валькович сидит на стуле в глубине зала',
      'wide:Алексей Валькович положил голову на руки за столом',
      'Алексей Валькович лежит на руке, чёрно-белый портрет'
    ], { long: 1280, short: 853 })
  },
  { id: 'alexandra-kinevich', name: 'Александра Киневич', role: 'Артистка', photo: 'assets/troupe/alexandra-kinevich.jpg' },
  { id: 'anna-arkhipova', name: 'Анна Архипова', role: 'Артистка', photo: 'assets/troupe/anna-arkhipova.jpg' },
  {
    id: 'nikita-skurat', name: 'Никита Скурат', role: 'Артист', photo: 'assets/troupe/nikita-skurat.jpg',
    gallery: shots('nikita-skurat', [
      'Никита Скурат сидит на стуле посреди зала',
      'Никита Скурат в выпаде на полу пустого зала, рядом опрокинутый стул',
      'Никита Скурат в прыжке ногами вверх на тёмном фоне',
      'wide:Никита Скурат смотрит в камеру из-под руки, чёрно-белый портрет',
      'Никита Скурат босиком на сцене, кадр из-за кулисы',
      'Никита Скурат держит партнёров в общей композиции труппы',
      'Никита Скурат смотрит в камеру из-под руки, вертикальный кадр',
      'wide:Никита Скурат впереди группы артистов, чёрно-белый портрет'
    ])
  }
];

/** @param {string} id */
export function findMember(id) {
  return TROUPE.find((member) => member.id === id);
}

/** Gallery shots, or the card portrait when a member has no gallery yet. */
export function memberGallery(member) {
  if (member.gallery?.length) return member.gallery;
  return [{ src: member.photo, alt: member.name, ...PORTRAIT }];
}

/** Turns "@handle", "instagram.com/handle?…" or a full URL into a clean profile link; anything else → ''. */
export function instagramUrl(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(?:@|(?:https?:\/\/)?(?:www\.)?instagram\.com\/)?([A-Za-z0-9._]{1,30})\/?(?:\?.*)?$/);
  return match ? `https://www.instagram.com/${match[1]}/` : '';
}
