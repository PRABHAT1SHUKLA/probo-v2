import express from "express"
import dotenv from "dotenv"
import { RedisManager, Sub } from "./RedisManager"
dotenv.config()

const PORT = process.env.PORT || 3000
const app = express()
Sub.subscribe("length")

app.post("/", async (req, res) => {
  try {
    const { nanoid } = await import("nanoid")
    const id = nanoid()
    RedisManager.lpush("engine", "jxc")
    res.json({
      msg: "Ok"
    })
  } catch (error) {
    console.log(error)
  }
})


app.post("/user/create/:userId", (req, res)=>{
  const userId = req.params.userId

  const response = await RedisManager.sendandAwait()
})

app.post("/onramp/inr" ,async(req,res)=>{
  const {userId , amount} = req.body
  let num = Number(amount)
  const response  = await RedisManager.sendAndAwait({
    type: ONRAMP
  }
    )
})



Sub.on("message", (channel, message) => {
  console.log(message)
})



app.listen(PORT, () => console.log(`server started on port: ${PORT}`))