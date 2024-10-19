import Redis from "ioredis";

export const RedisManager = new Redis(process.env.UPSTASH_REDIS_REST_URL!)