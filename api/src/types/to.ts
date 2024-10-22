export const CREATE_USER="CREATE_USER"
export const ONRAMP = "ONRAMP"
export const SELL_ORDER = "SELL_ORDER"

export type MessageToEngine ={
  type: typeof CREATE_USER,
  data:{
     userId: string

  }
}|{
  type: typeof ONRAMP,
  data:{
    userId: string
    amount: number
  }
}|{
  type: typeof SELL_ORDER,
  data:{
    userId: string
    price: number
    quantity: number
    stockSymbol: string
    stockType: "yes"|"no"
  }
}