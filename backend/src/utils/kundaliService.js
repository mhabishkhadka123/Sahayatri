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

const calculateZodiacScore = (signA, signB) => {
  if (!signA || !signB) return { score: 0, maxScore: 25, details: 'Missing sign data' };
  if (signA === signB) return { score: 25, maxScore: 25, details: 'Same sign' };
  
  const elemA = getZodiacElement(signA);
  const elemB = getZodiacElement(signB);
  
  if (elemA === elemB) return { score: 25, maxScore: 25, details: 'Same element' };
  
  if ((elemA === 'Fire' && elemB === 'Air') || (elemA === 'Air' && elemB === 'Fire') ||
      (elemA === 'Earth' && elemB === 'Water') || (elemA === 'Water' && elemB === 'Earth')) {
    return { score: 20, maxScore: 25, details: 'Compatible elements' };
  }
  
  if ((elemA === 'Fire' && elemB === 'Water') || (elemA === 'Water' && elemB === 'Fire') ||
      (elemA === 'Earth' && elemB === 'Air') || (elemA === 'Air' && elemB === 'Earth')) {
    return { score: 5, maxScore: 25, details: 'Challenging elements' };
  }
  
  return { score: 12, maxScore: 25, details: 'Neutral elements' };
};

const getNakshatraGroup = (nakshatra) => {
  const index = NAKSHATRAS.indexOf(nakshatra);
  if (index === -1) return -1;
  if (index <= 6) return 0;
  if (index <= 13) return 1;
  if (index <= 20) return 2;
  return 3;
};

const calculateNakshatraScore = (nakA, nakB) => {
  if (!nakA || !nakB) return { score: 0, maxScore: 30, details: 'Missing nakshatra data' };
  if (nakA === nakB) return { score: 30, maxScore: 30, details: 'Same nakshatra' };
  
  const groupA = getNakshatraGroup(nakA);
  const groupB = getNakshatraGroup(nakB);
  
  if (groupA === -1 || groupB === -1) return { score: 0, maxScore: 30, details: 'Invalid nakshatra' };
  if (groupA === groupB) return { score: 30, maxScore: 30, details: 'Same group' };
  if (Math.abs(groupA - groupB) === 1 || Math.abs(groupA - groupB) === 3) return { score: 22, maxScore: 30, details: 'Adjacent groups' };
  if (Math.abs(groupA - groupB) === 2) return { score: 15, maxScore: 30, details: 'Moderate groups' };
  
  return { score: 8, maxScore: 30, details: 'Different groups' };
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

export const calculateCompatibility = (kundaliA, kundaliB) => {
  const zodiac = calculateZodiacScore(kundaliA.zodiacSign, kundaliB.zodiacSign);
  const moonSign = calculateZodiacScore(kundaliA.moonSign, kundaliB.moonSign);
  const nakshatra = calculateNakshatraScore(kundaliA.nakshatra, kundaliB.nakshatra);
  
  let completenessScore = 0;
  const maxCompleteness = 20;
  if (kundaliA.zodiacSign && kundaliB.zodiacSign) completenessScore += 5;
  if (kundaliA.moonSign && kundaliB.moonSign) completenessScore += 5;
  if (kundaliA.nakshatra && kundaliB.nakshatra) completenessScore += 5;
  if (kundaliA.birthTime && kundaliB.birthTime) completenessScore += 5;

  const totalScore = zodiac.score + moonSign.score + nakshatra.score + completenessScore;
  
  let level = 'Low';
  if (totalScore >= 75) level = 'Excellent';
  else if (totalScore >= 55) level = 'Good';
  else if (totalScore >= 35) level = 'Average';

  return {
    score: totalScore,
    level,
    factors: {
      zodiac,
      moonSign,
      nakshatra,
      dataCompleteness: {
        score: completenessScore,
        maxScore: maxCompleteness,
        details: 'Data completeness bonus'
      }
    },
    disclaimer: 'Kundali compatibility estimate based on available birth data. Not a scientific guarantee.'
  };
};
