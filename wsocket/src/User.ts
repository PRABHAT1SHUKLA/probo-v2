import { WebSocket } from "ws";
import { SubscriptionManager } from "./SubscriptionManager";
import { IncomingMessage, SUBSCRIBE, UNSUBSCRIBE } from "./types/in";

export class User {
  private id: string;
  private ws: WebSocket; // Each user has its own unique Socket through which we can send messages
  private subscriptions: string[] = [] // this contains what all events we want to subscribe to eg: eth_usd@depth, eth_usd@ticker

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.addListner()
  }

  public subscribe(subscription: string) {
    this.subscriptions.push(subscription);
  }

  public unsubscribe(subscription: string) {
    this.subscriptions = this.subscriptions.filter(s => s !== subscription);
  }

  // This function will send message to the user
  public emit(message: any) {
    this.ws.send(JSON.stringify(message))
  }

  /*
    This addListner function will listen to the browser, whenever a new client connects or disconnects it subscribes or unsubscribe to the pubsubs.
  */
  private addListner() {
    this.ws.on("message", (message: string) => {
      const parsedMessage: IncomingMessage = JSON.parse(message)
      if(parsedMessage.method === SUBSCRIBE) {
        parsedMessage.params.forEach(s => SubscriptionManager.getInstance().subscribe(this.id, s));
      }

      if (parsedMessage.method === UNSUBSCRIBE) {
        parsedMessage.params.forEach(s => SubscriptionManager.getInstance().unsubscribe(this.id, parsedMessage.params[0] ?? ""));
      }
    })
  }

}