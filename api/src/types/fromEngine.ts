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
    userId: string
    balance: {
      available: number
      locked : number
    }
  }
}