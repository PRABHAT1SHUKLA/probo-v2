import {Redis, RedisCommander} from "ioredis";

// export const RedisManager = new Redis()

// export const Pub = new Redis()




export class RedisManager {
  private client: Redis;
  private static instance: RedisManager;

  constructor() {
      this.client = new Redis();
    
      
  }

  public static getInstance() {
      if (!this.instance)  {
          this.instance = new RedisManager();
      }
      return this.instance;
  }

  public pushMessage(message: DbMessage) {
      this.client.lpush("db_processor", JSON.stringify(message));
  }

  public publishMessage(channel: string, message: WsMessage) {
      this.client.publish(channel, JSON.stringify(message));
  }

  public sendToApi(clientId: string, message: MessageToApi) {
      this.client.publish(clientId, JSON.stringify(message));
  }
}