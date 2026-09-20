/**
 * Asset Photography and Location Visual Assets
 */
export const IMAGES = {
  CAMPUS_HERO: '/images/hostel_campus_hero.jpg',
  ROOM_INTERIOR: '/images/hostel_room_view.jpg',
  DESK_CHAIR: '/images/asset_desk_chair.jpg',
  CEILING_FAN: '/images/asset_ceiling_fan.jpg',
};

export function getAssetImage(name = '', category = '') {
  const combined = `${name} ${category}`.toLowerCase();
  if (combined.includes('fan') || combined.includes('electrical') || combined.includes('light') || combined.includes('ac') || combined.includes('geyser')) {
    return IMAGES.CEILING_FAN;
  }
  if (combined.includes('chair') || combined.includes('table') || combined.includes('desk') || combined.includes('study') || combined.includes('furniture')) {
    return IMAGES.DESK_CHAIR;
  }
  if (combined.includes('bed') || combined.includes('cot') || combined.includes('mattress') || combined.includes('almirah') || combined.includes('room') || combined.includes('cupboard')) {
    return IMAGES.ROOM_INTERIOR;
  }
  return IMAGES.DESK_CHAIR;
}
