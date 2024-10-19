import express from "express"
import { nanoid } from "nanoid"
import dotenv from "dotenv"
import { RedisManager } from "./RedisManager"
dotenv.config()

const PORT = process.env.PORT || 3000
const app = express()

app.post("/", async (req, res) => {
  try {
    const id = nanoid()
    RedisManager.lpush("engine", id)
  } catch (error) {
    console.log(error)
  }
})

app.listen(PORT, () => `server started on port: ${PORT}`)