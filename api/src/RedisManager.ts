import Redis from "ioredis";

import { MessageFromEngine } from "./types/fromEngine";
import { MessageToEngine } from "./types/toEngine";

export class RedisManager {
  private client: Redis;
  private publisher: Redis;
  private static instance: RedisManager;

  private constructor() {
    this.client = new Redis("rediss://default:AWrbAAIjcDE4YTY5OTQ4ZTc0MzA0ZWIzYTQ0OTQyNzI3MjY2ZTU0NHAxMA@accepted-monster-27355.upstash.io:6379")
    this.publisher = new Redis("rediss://default:AWrbAAIjcDE4YTY5OTQ4ZTc0MzA0ZWIzYTQ0OTQyNzI3MjY2ZTU0NHAxMA@accepted-monster-27355.upstash.io:6379")
  }

  // This will initialize the RedisManager class only once so that not more than once instance get created.
  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager()
    }
    return this.instance
  }

  public sendAndAwait(message: MessageToEngine) {
    return new Promise<MessageFromEngine>((resolve) => {
      const id = this.getRandomClientId()
      this.client.subscribe(id)
      this.client.on("message", (channel, message) => {
        if (channel === id) {
          this.client.unsubscribe(id)
          resolve(JSON.parse(message))
        }
      })
      this.publisher.lpush("engineQueue", JSON.stringify({ clientId: id, message }))
    })
  }

  public getRandomClientId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}