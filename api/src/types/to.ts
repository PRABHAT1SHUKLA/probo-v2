
export type MessageToEngine ={
  type: "CREATE_USER",
  data:{
     userId: string

  }
}|{
  type: "ONRAMP",
  data:{
    userId: string
    amount: number
  }
}