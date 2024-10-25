import { RedisManager } from "../RedisManager";
import { CREATE_MARKET, CREATE_USER, MessageFromApi, ONRAMP, SELL_ORDER } from "../types/fromApi";
import { BuyOrder, Orderbook, SellOrder } from "./orderBook";
import fs from "fs";
import { Fills , reverse} from "./orderBook";

interface UserBalance {
  [userId: string]: {
    available: number;
    locked: number;
  }
}


interface StockBalances {
  [userId: string]: {
    [stockSymbol: string]: {
      yes?: {
        quantity: number;
        locked: number;
      };
      no?: {
        quantity: number;
        locked: number;
      };
    };
  };
}


export class Engine {

  private orderbooks: Orderbook[] = [];
  private inrbalances: UserBalance = {};
  private stockbalances: StockBalances = {}
  constructor() {
    // let snapshot = null
    // try {
    //   if (process.env.WITH_SNAPSHOT) {
    //     snapshot = fs.readFileSync("./snapshot.json");
    //   }
    // } catch (e) {
    //   console.log("No snapshot found");
    // }

    // if (snapshot) {
    //   const snapshotSnapshot = JSON.parse(snapshot.toString());
    //   this.orderbooks = snapshotSnapshot.orderbooks.map((o: any) => new Orderbook(o.stockSymbol, o.yes, o.no));
    //   this.inrbalances = snapshotSnapshot.inrbalances;
    //   this.stockbalances = snapshotSnapshot.stockbalances;
    // } else {
    //   this.orderbooks = [new Orderbook('new', {}, {})];
    //   this.setinrBalances();
    //   this.setstockbalances()
    // }
    // setInterval(() => {
    //   this.saveSnapshot();
    // }, 1000 * 3);
  }
  setinrBalances() {

    this.inrbalances["user1"] = {
      available: 10000,
      locked: 0
    },
      this.inrbalances["user2"] = {
        available: 10000,
        locked: 0
      }

  }
  setstockbalances() {
    this.stockbalances["user1"] = {
      btc: {
        yes: {
          quantity: 50,
          locked: 0
        },
        no: {
          quantity: 50,
          locked: 0
        }
      }
    },
      this.stockbalances["user2"] = {
        btc: {
          yes: {
            quantity: 50,
            locked: 0
          },
          no: {
            quantity: 50,
            locked: 0
          }
        }
      }

  }


  // saveSnapshot() {
  //   const snapshotSnapshot = {
  //     orderbooks: this.orderbooks.map(o => o.getSnapshot()),
  //     balances: this.inrbalances
  //   }
  //   fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotSnapshot));
  // }


  process({ message, clientId }: { message: MessageFromApi, clientId: string }) {

    switch (message.type) {
      case CREATE_USER:
        const userId = message.data.userId
        if (!this.inrbalances[userId]) {
          this.inrbalances[userId] = {
            available: 0,
            locked: 0
          }

          this.stockbalances[userId] = {}

          RedisManager.getInstance().sendToApi(clientId, {
            type: "USER_CREATED",
            payload: {
              userId: userId
            }
          })
        } else {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "AlreadyExists",
            payload: {
              msg: "User already exists"
            }
          })
        }
        break;
      // case SELL_ORDER:
      //   try {
      //     const userId = message.data.userId
      //     const quantity = message.data.quantity
      //     const price = message.data.price
      //     const stockType = message.data.stockType
      //     const stockSymbol = message.data.stockSymbol

      //     const { } = this.sell(userId, quantity, stockType, stockSymbol, price)

      //     RedisManager.getInstance().sendToApi(clientId, {
      //       type: "ORDER_PLACED",
      //       payload: {

      //         userId: userId,
      //         stockSymbol: stockSymbol
      //       }
      //     })


      //   } catch (err) {
      //     console.log(err)
      //     RedisManager.getInstance().sendToApi(clientId, {
      //       type: "ORDER_NOT_PLACED",
      //       payload: {
      //         orderbook: "",
      //         price: "",
      //         quantity: "",
      //         stockSymbol: ""
      //       }
      //     })

      //   }
      // case ONRAMP:
      //   const userid = message.data.userId
      //   const amount = Number(message.data.amount)
      //   this.onRamp(userid, amount)
      //   break;

      // case SELL_ORDER:
      //   try {

      //     const userId = message.data.userId
      //     const quantity = message.data.quantity
      //     const stockType = message.data.stockType
      //     const stockSymbol = message.data.stockSymbol
      //     const price = message.data.price

      //   }

      case CREATE_MARKET:
        const isMarketCreated = this.createMarket(message.data.stockSymbol)
        if(isMarketCreated) {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "MARKET_CREATED",
            payload: {
              msg: `Market with ${message.data.stockSymbol} has been created`
            }
          })
        } else {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "Error",
            payload: {
              msg: "Something went wrong"
            }
          })
        }
        break;
    }
  }



  // buyOrder(userId: string, quantity: number, price: number, stockType: "yes" | "no", stockSymbol: string) {

  //   const orderBook = this.orderbooks.find((o) => o.stockSymbol === stockSymbol)
  //   if (!orderBook) {
  //     throw new Error(`orderbook with ${stockSymbol} does not exist`)
  //   }


  //   const userBalance = this.inrbalances[userId]

  //   const requiredBalance = price * quantity
  //   if (!userBalance) {
  //     throw new Error(" user doesn't exist  ")
  //   }

  //   if (this.inrbalances[userId]?.available! < requiredBalance) {
  //     throw new Error("Not sufficient balance")
  //   } else {
  //     this.inrbalances[userId]!.available -= requiredBalance
  //     this.inrbalances[userId]!.locked += requiredBalance
  //   }

  //   if (stockType == "yes") {

  //     const buyOrder: BuyOrder = {
  //       stockType: "yes",
  //       price: price,
  //       quantity: quantity,
  //       userid: userId
  //     }

  //   const {fills[] , reverse , executedQuantity} = orderBook.buy(buyOrder)

  //   this.updateBalance(fills[], stockSymbol ,stockType)

  //   } else {
  //     const buyOrder: BuyOrder = {
  //       stockType: "no",
  //       price: price,
  //       quantity: quantity,
  //       userid: userId
  //     }

  //     orderBook.buy(buyOrder)

  //   }





  // }

  // sell(userId: string, quantity: number, stockType: "yes" | "no", stockSymbol: string, price: number) {
    
  //   const orderBook = this.orderbooks.find((o) => o.stockSymbol === stockSymbol)
  //   if (!orderBook) {
  //     throw new Error(`orderbook with ${stockSymbol} does not exist`)
  //   }
  //   if (stockType = "yes") {
  //     if (this.stockbalances[userId]![stockSymbol]!.yes!.quantity < quantity) {
  //       throw new Error("Not Enough yes stocks to sell")
  //     } else {
  //       this.stockbalances[userId]![stockSymbol]!.yes!.quantity -= quantity
  //       this.stockbalances[userId]![stockSymbol]!.yes!.locked += quantity
  //     }
  //     const order: SellOrder = {
  //       userId: userId,
  //       price: price,
  //       stockType: "yes",
  //       quantity: quantity,
  //     }



  //     orderBook.sell(order)

  //     // to implement websocket logic here to make orerbook changes in ui

  //     return { userId, quantity, price, stockType, stockSymbol }


  //   } else {
  //     if (this.stockbalances[userId]![stockSymbol]!.no!.quantity < quantity) {
  //       throw new Error(" not enough stock balance to sell")
  //     } else {
  //       this.stockbalances[userId]![stockSymbol]!.no!.quantity -= quantity
  //       this.stockbalances[userId]![stockSymbol]!.no!.locked += quantity
  //     }

  //     const order: SellOrder = {
  //       userId: userId,
  //       price: price,
  //       stockType: "no",
  //       quantity: quantity,

  //     }

  //     //implement ws logic here

  //     orderBook.sell(order)

  //   }
  // }


  // 
  // onRamp(userId: string, amount: number) {
  //   const userBalance = this.inrbalances[userId];
  //   if (!userBalance) {
  //     this.inrbalances[userId] = {
  //       locked: 0,
  //       available: amount
  //     }
  //   } else {
  //     userBalance.available += amount;
  //   }
  // }
  
  // 
  // onMint(userId: string, amount: number, stockSymbol: string) {
  //   const orderBook = this.orderbooks.find((o) => o.stockSymbol === stockSymbol)
  //   if (!orderBook) {
  //     throw new Error(`orderbook with ${stockSymbol} does not exist`)
  //   }

  //   if (!this.inrbalances[userId]?.available) {
  //     throw new Error(" sorry u need to first onramp to begin minting")
  //   }

  //   if (this.inrbalances[userId].available >= amount) {
  //     if (!this.stockbalances[userId]) {
  //       this.stockbalances[userId] = {}
  //     }

  //     const mintedStocks = amount / 10
  //     if (!this.stockbalances[userId][stockSymbol]) {
  //       this.stockbalances[userId][stockSymbol] = { yes: { locked: 0, quantity: mintedStocks }, no: { locked: 0, quantity: mintedStocks } }
  //     } else {
  //       this.stockbalances[userId][stockSymbol].yes!.quantity += mintedStocks
  //       this.stockbalances[userId][stockSymbol].no!.quantity += mintedStocks

  //     }

  //     return (`minted ${amount} yes and no stocks for ${userId}`)



  //   } else {
  //     throw new Error("insufficient funds to proceed with minting")
  //   }
  // }

  createMarket(stockSymbol:string){
    const orderBook = this.orderbooks.find((o) => o.stockSymbol === stockSymbol)
    if(!orderBook){
      const newOrderBook = new Orderbook(stockSymbol, null, null)
      this.orderbooks.push(newOrderBook)
      return true
    }
  }

  


  // updateBalance(Fills:Fills[] , stockSymbol:string , stockType: "yes"|"no") {
    
  //   Fills.forEach((fill) =>{
  //     const total = fill.amount* fill.price
  //     this.inrbalances[fill.otherUserId]!.locked-=total

  //     if (!this.stockbalances[fill.userId]) {
  //       this.stockbalances[fill.userId] = {};
  //     }

  //     if (!this.stockbalances[fill.userId]![stockSymbol]) {
  //       this.stockbalances[fill.userId]![stockSymbol] = {
  //         yes: { locked: 0, quantity: 0 },
  //         no: { locked: 0, quantity: 0 }
  //       };
  //     }
       
  //     //@ts-ignore
  //     this.stockbalances[fill.userId][stockSymbol][stockType].locked += fill.amount;
  //     //@ts-ignore
  //     this.stockbalances[fill.userId][stockSymbol][stockType].quantity += fill.amount;

  //   })
  //  }

  //  updateReverseBalance(reverse: reverse[] , stockSymbol:string , stockType: "yes"|"no"){
  //   reverse.forEach((reverse)=>{
      
  //   })

  //  }

  // updateStock() { }



}