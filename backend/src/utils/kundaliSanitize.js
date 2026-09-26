/** Strip sensitive kundali fields for public responses */
export const sanitizeKundaliForPublic = (kundali) => {
  if (!kundali || kundali.isVisible === false) return null;
  return {
    zodiacSign: kundali.zodiacSign,
    nakshatra: kundali.nakshatra,
    moonSign: kundali.moonSign,
    isVisible: true,
  };
};

/** Strip exact coordinates from profile for public responses */
export const sanitizeProfileForPublic = (profile) => {
  if (!profile) return profile;
  const { latitude, longitude, ...rest } = profile;
  return rest;
};
