import express from "express"
import dotenv from "dotenv"
import { RedisManager } from "./RedisManager"
import { CREATE_USER, ONRAMP } from "./types/to"
dotenv.config()

const PORT = process.env.PORT || 3000
const app = express()



app.post("/user/create/:userId", async(req, res)=>{
  const userId = req.params.userId

  const response = await RedisManager.getInstance().sendAndAwait({
    type: CREATE_USER,
    data:{
      userId:userId
    }
})
})

app.post("/onramp/inr" ,async(req,res)=>{
  const {userId , amount} = req.body
  let num = Number(amount)
  const response  = await RedisManager.getInstance().sendAndAwait({
    type: ONRAMP,
    data:{
      userId,
      amount
    }
  }
    )
})


app.listen(PORT, () => console.log(`server started on port: ${PORT}`))