const Redis = require('ioredis');
const redis = new Redis();

const USER_EXPIRY = 5 * 60; // 5 minutes in seconds

const redisUtils = {
  async addUser(userId, userData) {
    await redis.setex(`user:${userId}`, USER_EXPIRY, JSON.stringify(userData));
  },

  async getNearbyUsers(userLat, userLng, radiusKm = 2) {
    const users = [];
    const cursor = await redis.scan(0, 'MATCH', 'user:*');
    
    for (const key of cursor[1]) {
      const userData = JSON.parse(await redis.get(key));
      if (userData) {
        const distance = calculateDistance(userLat, userLng, userData.lat, userData.lng);
        if (distance <= radiusKm) {
          users.push({ ...userData, id: key.split(':')[1] });
        }
      }
    }
    return users;
  },

  async removeUser(userId) {
    await redis.del(`user:${userId}`);
  }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(value) {
  return value * Math.PI / 180;
}

module.exports = redisUtils;