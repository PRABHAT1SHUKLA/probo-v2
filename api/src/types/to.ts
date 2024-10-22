export const CREATE_USER="CREATE_USER"
export const ONRAMP = "ONRAMP"

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
}