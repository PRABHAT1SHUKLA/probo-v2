import Redis from "ioredis";
import { UserManager } from "./UserManager";

// Engine will send response to pubsub via channel, where channel names will be of userId

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private subscriptions: Map<string, string[]> = new Map()
  private reverseSubscriptions: Map<string, string[]> = new Map();
  private redisClient: Redis;

  private constructor() {
    this.redisClient = new Redis()
  }

  public static getInstance() {
    if(!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }


  // Through this function you will subscribe to pubsubs and if you get any message from pubsubs you will forward it to the browser via websockets
  public subscribe(userId: string, subscription: string) {
    console.log("Sahu")
    if(this.subscriptions.get(userId)?.includes(subscription)) {
      return;
    }
    console.log("Pratham")

    this.subscriptions.set(userId, (this.subscriptions.get(userId) || []).concat(subscription));
    this.reverseSubscriptions.set(subscription, (this.reverseSubscriptions.get(subscription) || []).concat(userId));

    if(this.reverseSubscriptions.get(subscription)?.length === 1) {
      this.redisClient.subscribe(subscription)
      console.log("Hi There")
      this.redisClient.on("message", (channel: string, message: string) => {
        // const parsedMessage = JSON.parse(message)
        this.reverseSubscriptions.get(channel)?.forEach(s => UserManager.getInstance().getUser(s)?.emit(message));
      })
      console.log("Hi There")
    }
  }

  public unsubscribe(userId: string, subscription: string) {
    const subscriptions = this.subscriptions.get(userId);
    if (subscriptions) {
      this.subscriptions.set(userId, subscriptions.filter(s => s !== subscription));
    }
    const reverseSubscriptions = this.reverseSubscriptions.get(subscription);
    if (reverseSubscriptions) {
      this.reverseSubscriptions.set(subscription, reverseSubscriptions.filter(s => s !== userId));
      if (this.reverseSubscriptions.get(subscription)?.length === 0) {
        this.reverseSubscriptions.delete(subscription);
        this.redisClient.unsubscribe(subscription);
      }
    }
  }
}