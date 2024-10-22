import express from "express"
import dotenv from "dotenv"
import { RedisManager } from "./RedisManager"
import { CREATE_USER, ONRAMP, SELL_ORDER, USER_BALANCE } from "./types/toEngine"
dotenv.config()

const PORT = process.env.PORT || 3000
const app = express()


//user creation endpoint
app.post("/user/create/:userId", async (req, res) => {
  const userId = req.params.userId

  const response = await RedisManager.getInstance().sendAndAwait({
    type: CREATE_USER,
    data: {
      userId: userId
    }
  })
})

//onRamped user balance

app.post("/onramp/inr", async (req, res) => {
  const { userId, amount } = req.body
  let num = Number(amount)
  const response = await RedisManager.getInstance().sendAndAwait({
    type: ONRAMP,
    data: {
      userId,
      amount
    }
  }
  )
  res.json(response.payload)
})

//sell order endpoint 

app.post("/order/sell", async (req, res) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body
  const response = await RedisManager.getInstance().sendAndAwait({
    type: "SELL_ORDER",
    data: {
      userId, stockSymbol, quantity, price, stockType

    }
  })
  res.json(response.payload)
})

//get user balance
app.get('/balance/inr/:userId', async (req, res) => {
  const userId = req.params.userId;
  const response = await RedisManager.getInstance().sendAndAwait({
    type: USER_BALANCE,
    data: {
      userId: userId
    }
  })

  res.json(response.payload)
})

//minting
app.post('/trade/mint', async(req,res)=>{
  const { userId, stockSymbol, quantity, price } = req.body;
  const response = await RedisManager.getInstance().sendAndAwait({
    type: MINT,
    data:{
      userId : userId,
      stockSymbol : stockSymbol,
      quantity: quantity,
      price: price
    }

  })
  res.json(response.payload)
})

app.post('/order/buy', async(req,res)=>{})


app.listen(PORT, () => console.log(`server started on port: ${PORT}`))