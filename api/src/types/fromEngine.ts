export type MessageFromEngine = {
  type: "USER_CREATED",
  payload: {
    msg?: string
    userId: string
  }
} | {
  type: "ONRAMPED",
  payload: {
    msg: string
  }
} | {
  type: "MARKET_CREATED",
  payload: {
    msg: string
  }
} | {
  type: "MINTED_NEW_STOCKS",
  payload: {
    msg?: string,
  }
} | {
  type:"ORDERBOOK",
  payload:{
    order:any
  }
} | {
  type: "NOT_FOUND",
  payload:{
    msg: string
  }
} | {
  type: "NOT_PRESENT",
  payload:{
    msg: string
  }
} | {
  type:"USER_BALANCE",
  payload:{
    msg: string
  }
}