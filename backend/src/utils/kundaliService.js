// Vedic zodiac signs (Rashis)
export const ZODIAC_SIGNS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'
];

// 27 Nakshatras
export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export const getZodiacElement = (sign) => {
  if (!sign) return null;
  if (['Mesha', 'Simha', 'Dhanu'].includes(sign)) return 'Fire';
  if (['Vrishabha', 'Kanya', 'Makara'].includes(sign)) return 'Earth';
  if (['Mithuna', 'Tula', 'Kumbha'].includes(sign)) return 'Air';
  if (['Karka', 'Vrishchika', 'Meena'].includes(sign)) return 'Water';
  return null;
};

const VARNA_BY_SIGN = {
  Mesha: 'Kshatriya', Vrishabha: 'Vaishya', Mithuna: 'Shudra', Karka: 'Brahmin',
  Simha: 'Kshatriya', Kanya: 'Vaishya', Tula: 'Shudra', Vrishchika: 'Brahmin',
  Dhanu: 'Kshatriya', Makara: 'Vaishya', Kumbha: 'Shudra', Meena: 'Brahmin',
};
const VARNA_RANK = { Shudra: 1, Vaishya: 2, Kshatriya: 3, Brahmin: 4 };
const SIGN_LORDS = {
  Mesha: 'Mars', Vrishabha: 'Venus', Mithuna: 'Mercury', Karka: 'Moon',
  Simha: 'Sun', Kanya: 'Mercury', Tula: 'Venus', Vrishchika: 'Mars',
  Dhanu: 'Jupiter', Makara: 'Saturn', Kumbha: 'Saturn', Meena: 'Jupiter',
};
const PLANET_FRIENDS = {
  Sun: ['Moon', 'Mars', 'Jupiter'],
  Moon: ['Sun', 'Mercury'],
  Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'],
  Jupiter: ['Sun', 'Moon', 'Mars'],
  Venus: ['Mercury', 'Saturn'],
  Saturn: ['Mercury', 'Venus'],
};
const PLANET_ENEMIES = {
  Sun: ['Venus', 'Saturn'],
  Moon: [],
  Mars: ['Mercury'],
  Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'],
  Venus: ['Sun', 'Moon'],
  Saturn: ['Sun', 'Moon', 'Mars'],
};
const NAKSHATRA_GANAS = [
  'Deva', 'Manushya', 'Rakshasa', 'Manushya', 'Deva', 'Manushya', 'Deva', 'Deva', 'Rakshasa',
  'Rakshasa', 'Manushya', 'Manushya', 'Deva', 'Rakshasa', 'Deva', 'Rakshasa', 'Deva',
  'Rakshasa', 'Rakshasa', 'Manushya', 'Manushya', 'Deva', 'Rakshasa', 'Rakshasa',
  'Manushya', 'Manushya', 'Deva',
];
const NAKSHATRA_YONIS = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Serpent', 'Dog', 'Cat', 'Sheep', 'Cat',
  'Rat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Buffalo', 'Tiger', 'Deer', 'Deer',
  'Dog', 'Monkey', 'Mongoose', 'Monkey', 'Lion', 'Horse', 'Lion', 'Cow', 'Elephant',
];
const NAKSHATRA_NADIS = NAKSHATRAS.map((_, index) => ['Adi', 'Madhya', 'Antya'][index % 3]);
const ENEMY_YONIS = [
  ['Horse', 'Buffalo'], ['Elephant', 'Lion'], ['Sheep', 'Monkey'], ['Serpent', 'Mongoose'],
  ['Dog', 'Deer'], ['Cat', 'Rat'], ['Cow', 'Tiger'],
];
const VASHYA_GROUPS = {
  Mesha: ['Quadruped'], Vrishabha: ['Quadruped'], Mithuna: ['Human'], Karka: ['Water'],
  Simha: ['Wild'], Kanya: ['Human'], Tula: ['Human'], Vrishchika: ['Insect'],
  Dhanu: ['Human', 'Quadruped'], Makara: ['Quadruped', 'Water'], Kumbha: ['Human'], Meena: ['Water'],
};
const VASHYA_COMPATIBLE = [
  ['Human', 'Quadruped'], ['Human', 'Water'], ['Quadruped', 'Water'], ['Wild', 'Quadruped'],
  ['Insect', 'Water'],
];
const GANA_SCORES = {
  Deva: { Deva: 6, Manushya: 5, Rakshasa: 1 },
  Manushya: { Deva: 5, Manushya: 6, Rakshasa: 0 },
  Rakshasa: { Deva: 1, Manushya: 0, Rakshasa: 6 },
};

const isValidSign = (sign) => ZODIAC_SIGNS.includes(sign);
const isValidNakshatra = (nakshatra) => NAKSHATRAS.includes(nakshatra);

const relationBetweenPlanets = (planetA, planetB) => {
  if (planetA === planetB) return 'friend';
  if (PLANET_FRIENDS[planetA].includes(planetB)) return 'friend';
  if (PLANET_ENEMIES[planetA].includes(planetB)) return 'enemy';
  return 'neutral';
};

const getGrahaMaitriScore = (signA, signB) => {
  const lordA = SIGN_LORDS[signA];
  const lordB = SIGN_LORDS[signB];
  const relationA = relationBetweenPlanets(lordA, lordB);
  const relationB = relationBetweenPlanets(lordB, lordA);
  const points = { friend: 2, neutral: 1, enemy: 0 };
  const score = points[relationA] + points[relationB];
  if (relationA === 'friend' && relationB === 'friend') return 5;
  if (relationA === 'enemy' && relationB === 'enemy') return 0;
  if (relationA === 'friend' || relationB === 'friend') return score === 3 ? 4 : 1;
  if (relationA === 'enemy' || relationB === 'enemy') return 0.5;
  return 3;
};

const scoreFactor = (score, maxScore, details) => ({
  score,
  maxScore,
  details,
});

const getElementalBalance = (signA, signB) => {
  const elementA = getZodiacElement(signA);
  const elementB = getZodiacElement(signB);
  if (!elementA || !elementB) {
    return { score: null, details: 'Rashi element is unavailable' };
  }
  if (elementA === elementB) return { score: 100, details: 'Same element' };
  if (
    (elementA === 'Fire' && elementB === 'Air') || (elementA === 'Air' && elementB === 'Fire') ||
    (elementA === 'Earth' && elementB === 'Water') || (elementA === 'Water' && elementB === 'Earth')
  ) {
    return { score: 80, details: 'Traditionally complementary elements' };
  }
  if (
    (elementA === 'Fire' && elementB === 'Water') || (elementA === 'Water' && elementB === 'Fire') ||
    (elementA === 'Earth' && elementB === 'Air') || (elementA === 'Air' && elementB === 'Earth')
  ) {
    return { score: 25, details: 'Traditionally challenging elements' };
  }
  return { score: 60, details: 'Neutral elemental pairing' };
};

import moonposition from 'astronomia/moonposition';
import sidereal from 'astronomia/sidereal';
import { DateTime } from 'luxon';

const normalizeDegrees = (deg) => ((deg % 360) + 360) % 360;

/** Lahiri ayanamsa (degrees) — standard for Vedic charts in Nepal/India */
const getLahiriAyanamsa = (jd) => {
  const t = (jd - 2451545.0) / 36525.0;
  return 22.460148 + 1.396042 * t + 0.000308 * t * t;
};

const toJulianDay = (dateTimeUtc) =>
  dateTimeUtc.toMillis() / 86400000 + 2440587.5;

const getLocalSiderealTimeDegrees = (jd, longitudeDeg) => {
  const gstHours = sidereal.apparent(jd) / 3600;
  return normalizeDegrees((gstHours + longitudeDeg / 15) * 15);
};

const getTropicalAscendant = (jd, latitude, longitude) => {
  const theta = getLocalSiderealTimeDegrees(jd, longitude) * (Math.PI / 180);
  const obliquity = 23.4392911 * (Math.PI / 180);
  const latRad = latitude * (Math.PI / 180);
  const y = -Math.cos(theta);
  const x = Math.sin(theta) * Math.cos(obliquity) + Math.tan(latRad) * Math.sin(obliquity);
  return normalizeDegrees(Math.atan2(y, x) * (180 / Math.PI));
};

const getSignFromSiderealLongitude = (siderealLon) =>
  ZODIAC_SIGNS[Math.floor(normalizeDegrees(siderealLon) / 30) % 12];

const getNakshatraFromSiderealLongitude = (siderealLon) =>
  NAKSHATRAS[Math.floor(normalizeDegrees(siderealLon) / (360 / 27)) % 27];

/**
 * Calculate Vedic kundali fields from birth data using astronomical ephemeris.
 * zodiacSign = Lagna (ascendant), moonSign = Chandra Rashi, nakshatra = birth star.
 */
export const generateKundali = ({ dateOfBirth, birthTime, latitude, longitude, timezone }) => {
  if (!dateOfBirth || !birthTime) {
    throw new Error('Date of birth and birth time are required');
  }
  if (latitude == null || longitude == null) {
    throw new Error('Birth place coordinates are required');
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Invalid birth place coordinates');
  }
  if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(birthTime)) {
    throw new Error('Invalid birth time format. Use HH:MM');
  }

  const [hours, minutes] = birthTime.split(':').map(Number);
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const zone = timezone || 'UTC';

  const birthDt = DateTime.fromObject(
    { year, month, day, hour: hours, minute: minutes, second: 0 },
    { zone }
  );
  if (!birthDt.isValid) {
    throw new Error('Invalid date of birth');
  }
  if (birthDt > DateTime.now()) {
    throw new Error('Date of birth cannot be in the future');
  }

  const jd = toJulianDay(birthDt.toUTC());
  const ayanamsa = getLahiriAyanamsa(jd);

  const moonLonTropical = moonposition.position(jd).lon * (180 / Math.PI);
  const moonSidereal = normalizeDegrees(moonLonTropical - ayanamsa);

  const ascTropical = getTropicalAscendant(jd, latitude, longitude);
  const ascSidereal = normalizeDegrees(ascTropical - ayanamsa);

  return {
    zodiacSign: getSignFromSiderealLongitude(ascSidereal),
    moonSign: getSignFromSiderealLongitude(moonSidereal),
    nakshatra: getNakshatraFromSiderealLongitude(moonSidereal),
    metadata: JSON.stringify({
      source: 'astronomia-lahiri',
      calculatedAt: new Date().toISOString(),
      moonSiderealLongitude: Number(moonSidereal.toFixed(4)),
      ascSiderealLongitude: Number(ascSidereal.toFixed(4)),
      ayanamsa: Number(ayanamsa.toFixed(4)),
    }),
  };
};

export const calculateCompatibility = (kundaliA, kundaliB, genderA, genderB) => {
  const signA = kundaliA.moonSign || kundaliA.zodiacSign;
  const signB = kundaliB.moonSign || kundaliB.zodiacSign;
  const nakshatraA = kundaliA.nakshatra;
  const nakshatraB = kundaliB.nakshatra;

  if (!isValidSign(signA) || !isValidSign(signB)) {
    throw new Error('Valid Moon signs are required to calculate compatibility');
  }
  if (!isValidNakshatra(nakshatraA) || !isValidNakshatra(nakshatraB)) {
    throw new Error('Valid Nakshatras are required to calculate compatibility');
  }

  const signIndexA = ZODIAC_SIGNS.indexOf(signA);
  const signIndexB = ZODIAC_SIGNS.indexOf(signB);
  const nakshatraIndexA = NAKSHATRAS.indexOf(nakshatraA);
  const nakshatraIndexB = NAKSHATRAS.indexOf(nakshatraB);
  const genderAValue = (genderA || '').toLowerCase();
  const genderBValue = (genderB || '').toLowerCase();
  let varnaScore;

  if (genderAValue === 'male' && genderBValue === 'female') {
    varnaScore = VARNA_RANK[VARNA_BY_SIGN[signA]] >= VARNA_RANK[VARNA_BY_SIGN[signB]] ? 1 : 0;
  } else if (genderAValue === 'female' && genderBValue === 'male') {
    varnaScore = VARNA_RANK[VARNA_BY_SIGN[signB]] >= VARNA_RANK[VARNA_BY_SIGN[signA]] ? 1 : 0;
  } else {
    const sameVarna = VARNA_BY_SIGN[signA] === VARNA_BY_SIGN[signB];
    varnaScore = sameVarna ? 1 : 0.5;
  }

  const groupsA = VASHYA_GROUPS[signA];
  const groupsB = VASHYA_GROUPS[signB];
  const sharesVashyaGroup = groupsA.some((group) => groupsB.includes(group));
  const vashyaScore = sharesVashyaGroup
    ? 2
    : VASHYA_COMPATIBLE.some(([groupA, groupB]) =>
      (groupsA.includes(groupA) && groupsB.includes(groupB)) ||
      (groupsA.includes(groupB) && groupsB.includes(groupA))
    ) ? 1 : 0;

  const taraScoreFrom = (fromIndex, toIndex) => {
    const tara = ((toIndex - fromIndex + 27) % 27) + 1;
    return [0, 2, 4, 6, 8].includes(tara % 9) ? 1.5 : 0;
  };
  const taraScore = taraScoreFrom(nakshatraIndexA, nakshatraIndexB) +
    taraScoreFrom(nakshatraIndexB, nakshatraIndexA);

  const yoniA = NAKSHATRA_YONIS[nakshatraIndexA];
  const yoniB = NAKSHATRA_YONIS[nakshatraIndexB];
  const areEnemyYonis = ENEMY_YONIS.some(([first, second]) =>
    (yoniA === first && yoniB === second) || (yoniA === second && yoniB === first)
  );
  const yoniScore = yoniA === yoniB ? 4 : areEnemyYonis ? 0 : 2;

  const ganaA = NAKSHATRA_GANAS[nakshatraIndexA];
  const ganaB = NAKSHATRA_GANAS[nakshatraIndexB];
  const ganaScore = GANA_SCORES[ganaA][ganaB];
  const grahaMaitriScore = getGrahaMaitriScore(signA, signB);

  const signDistance = (signIndexB - signIndexA + 12) % 12;
  const adverseBhakootDistances = [1, 4, 5, 7, 8, 11];
  const bhakootScore = adverseBhakootDistances.includes(signDistance) ? 0 : 7;

  const nadiA = NAKSHATRA_NADIS[nakshatraIndexA];
  const nadiB = NAKSHATRA_NADIS[nakshatraIndexB];
  const nadiScore = nadiA === nadiB ? 0 : 8;

  const factors = {
    varna: scoreFactor(varnaScore, 1, `${VARNA_BY_SIGN[signA]} and ${VARNA_BY_SIGN[signB]} Varna`),
    vashya: scoreFactor(vashyaScore, 2, sharesVashyaGroup ? 'Rashi Vashya groups align' : 'Rashi Vashya group comparison'),
    tara: scoreFactor(taraScore, 3, 'Birth-star distance and mutual Tara balance'),
    yoni: scoreFactor(yoniScore, 4, areEnemyYonis ? 'Traditionally opposing Yonis' : `${yoniA} and ${yoniB} Yoni`),
    grahaMaitri: scoreFactor(grahaMaitriScore, 5, `${SIGN_LORDS[signA]} and ${SIGN_LORDS[signB]} planetary friendship`),
    gana: scoreFactor(ganaScore, 6, `${ganaA} and ${ganaB} Gana`),
    bhakoot: scoreFactor(bhakootScore, 7, bhakootScore ? 'Favorable Rashi relationship' : 'Traditional 2/12, 5/9, or 6/8 Rashi pairing'),
    nadi: scoreFactor(nadiScore, 8, nadiScore ? 'Different Nadi' : `Same ${nadiA} Nadi`),
  };
  const totalScore = Object.values(factors).reduce((total, factor) => total + factor.score, 0);
  const score = Math.round((totalScore / 36) * 1000) / 10;
  const mentalMatchScore = grahaMaitriScore + ganaScore + taraScore;
  const elementalBalance = getElementalBalance(signA, signB);

  let level = 'Low';
  if (totalScore >= 28) level = 'Excellent';
  else if (totalScore >= 18) level = 'Good';
  else if (totalScore >= 14) level = 'Average';

  return {
    score,
    scoreOutOf36: totalScore,
    maxScore: 36,
    level,
    factors,
    categories: {
      mentalMatch: {
        score: Math.round((mentalMatchScore / 14) * 100),
        maxScore: 100,
        gunaScore: mentalMatchScore,
        gunaMaxScore: 14,
        details: 'Based on Tara, Graha Maitri, and Gana kootas',
      },
      elementalBalance,
    },
    rashis: { personA: signA, personB: signB },
    nakshatras: { personA: nakshatraA, personB: nakshatraB },
    disclaimer: 'Traditional Ashta Koota estimate for cultural reference only; it is not scientific or a guarantee of relationship compatibility.',
  };
};
