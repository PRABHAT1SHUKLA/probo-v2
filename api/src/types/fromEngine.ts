export type MessageFromEngine = {
  type: "USER_CREATED",
  payload:{
     msg?:string
     userId: string
  }
}| {
  type: "ONRAMPED",
  payload:{
    msg: string
    }
}|{
  type:"MARKET_CREATED",
  payload:{
    msg:string
  }
}