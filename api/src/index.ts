import express from "express"
import dotenv from "dotenv"
import { RedisManager } from "./RedisManager"
dotenv.config()

const PORT = process.env.PORT || 3000
const app = express()

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

app.listen(PORT, () => console.log(`server started on port: ${PORT}`))