//TODO: Can we share the types between the ws layer and the engine?

import { Order } from "../trades/orderBook"

export type TickerUpdateMessage = {
  stream: string, 
  data: {
      c?: string,
      h?: string,
      l?: string,
      v?: string,
      V?: string,
      s?: string,
      id: number,
      e: "ticker"
  }
}

export type DepthUpdateMessage = {
  stream: string,
  data: {
      b?: [string, string][],
      a?: [string, string][],
      e: "depth"
  }
}

export type TradeAddedMessage = {
  event: string,
  data: {
    yes: Order,
    no: Order
  }
}

export type WsMessage = TickerUpdateMessage | DepthUpdateMessage | TradeAddedMessage;
