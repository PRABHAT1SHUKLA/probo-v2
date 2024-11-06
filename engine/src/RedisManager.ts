import Redis from "ioredis";
import { WsMessage } from "./types/toWs";

// export const RedisManager = new Redis()

// export const Pub = new Redis()




export class RedisManager {
  private client: Redis;
  private static instance: RedisManager;

  constructor() {
    this.client = new Redis("rediss://default:AWrbAAIjcDE4YTY5OTQ4ZTc0MzA0ZWIzYTQ0OTQyNzI3MjY2ZTU0NHAxMA@accepted-monster-27355.upstash.io:6379");
  }

  public static getInstance() {
      if (!this.instance)  {
          this.instance = new RedisManager;
      }
      return this.instance;
  }

  public sendToApi(clientId: string, message: any) {
    this.client.publish(clientId, JSON.stringify(message));
  }

  // public pushMessage(message: DbMessage) {
  //   this.client.lpush("db_processor", JSON.stringify(message));
  // }

  public publishMessage(channel: string, message: WsMessage) {
    this.client.publish(channel, JSON.stringify(message));
  }
}