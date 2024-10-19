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
    RedisManager.lpush("engine", id)
    res.json({
      msg: "Ok"
    })
  } catch (error) {
    console.log(error)
  }
})


Sub.on("message", (channel, message) => {
  console.log(message)
})



app.listen(PORT, () => console.log(`server started on port: ${PORT}`))