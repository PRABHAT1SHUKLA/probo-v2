export type MessageFromApi ={
  type : "SELL",
  data:{
    stockSymbol : string
    price: number
    quantity: number
    stockType: "yes"|"no"
    userId: string
  } | {
    type: "BUY",
    data:{
      stockSymbol : string
      quantity : number
      stockType : "yes"|"no"
      userId : string
    }
  } | {
    type : "ONRAMP",
    data:{
      userId : string,
      amount : number
    }
   } | {
    type : "GET_DEPTH",
    data:{
      stockSymbol : string
    }
   }

}