// Round coordinates to approximately 200m precision
// 0.002 degrees is roughly 200 meters at the equator
export const roundCoordinates = (lat, lng) => {
  const precision = 0.002;
  return {
    lat: Math.round(lat / precision) * precision,
    lng: Math.round(lng / precision) * precision
  };
};