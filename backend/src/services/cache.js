const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = process.env.REDIS_PORT || 6379;
      
      console.log(`Attempting to connect to Redis at ${redisHost}:${redisPort}`);
      
      this.client = redis.createClient({
        socket: {
          host: redisHost,
          port: parseInt(redisPort),
        }
      });

      this.client.on('connect', () => {
        console.log(`Redis client connected to ${redisHost}:${redisPort}`);
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.log('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('ready', () => {
        console.log('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      console.log('Redis connection established successfully');
    } catch (error) {
      console.log('Failed to connect to Redis:', error.message);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const result = await this.client.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.log('Redis get error:', error.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.log('Redis set error:', error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.log('Redis del error:', error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}

module.exports = new CacheService(); 