import { Orderbook, SellOrder } from "./orderBook";
import fs from "fs"

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
    let snapshot = null
    try {
      if (process.env.WITH_SNAPSHOT) {
        snapshot = fs.readFileSync("./snapshot.json");
      }
    } catch (e) {
      console.log("No snapshot found");
    }

    if (snapshot) {
      const snapshotSnapshot = JSON.parse(snapshot.toString());
      this.orderbooks = snapshotSnapshot.orderbooks.map((o: any) => new Orderbook(o.stockSymbol, o.yes, o.no));
      this.inrbalances = snapshotSnapshot.inrbalances;
      this.stockbalances = snapshotSnapshot.stockbalances;
    } else {
      this.orderbooks = [new Orderbook('new', {}, {})];
      this.setinrBalances();
      this.setstockbalances()
    }
    setInterval(() => {
      this.saveSnapshot();
    }, 1000 * 3);
  }
  setinrBalances() {

  }


  saveSnapshot() {
    const snapshotSnapshot = {
      orderbooks: this.orderbooks.map(o => o.getSnapshot()),
      balances: Array.from(this.balances.entries())
    }
    fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotSnapshot));
  }


    


  buyOrder(userId: string, quantity: number, price: number, stockType: "yes"|"no", stockSymbol:string) {
    const userBalance = this.inrbalances[userId]

    const requiredBalance = price * quantity
    if (!userBalance) {
      throw new Error(" user doesn't exist  ")
    }

    if (this.inrbalances[userId]?.available! < requiredBalance) {
      throw new Error("Not sufficient balance")
    } else {
      this.inrbalances[userId]!.available -= requiredBalance
      this.inrbalances[userId]!.locked += requiredBalance
    }
    
    if(this.orderbooks[stockSymbol]) 
   
     

  }

  sellStockBalance(userId: string, quantity: number, stockType: "yes" | "no", stockSymbol: string , price:number) {


    const orderBook = this.orderbooks.find((o) => o.stockSymbol === stockSymbol)
    if (!orderBook) {
      throw new Error(`orderbook with ${stockSymbol} does not exist`)
    }
    if (stockType = "yes") {
      if (this.stockbalances[userId]![stockSymbol]!.yes!.quantity < quantity) {
        throw new Error(" not enough stock balance to sell")
      } else {
        this.stockbalances[userId]![stockSymbol]!.yes!.quantity -= quantity
        this.stockbalances[userId]![stockSymbol]!.yes!.locked += quantity
      }
      const order: SellOrder={
        userId: userId,
        price:price,
        stockType:"yes",
        quantity: quantity,
      }



        orderBook.sell(order )

        return ("")
   

    } else {
      if (this.stockbalances[userId]![stockSymbol]!.no!.quantity < quantity) {
        throw new Error(" not enough stock balance to sell")
      } else {
        this.stockbalances[userId]![stockSymbol]!.no!.quantity -= quantity
        this.stockbalances[userId]![stockSymbol]!.no!.locked += quantity
      }

      const order: SellOrder={
        userId: userId,
        price:price,
        stockType:"no",
        quantity: quantity,

      }

        

        orderBook.sell(order)

    }
    
    

  }


  onRamp(userId: string, amount: number) {
    const userBalance = this.inrbalances[userId];
    if (!userBalance) {
      this.inrbalances[userId] = {
        locked: 0,
        available: 0
      }
    } else {
      userBalance.available += amount;
    }
  }

  onMint(userId: string, amount: number, stockSymbol: string) {

    const orderBook = this.orderbooks.find((o) => o.stockSymbol === stockSymbol)
    if (!orderBook) {
      throw new Error(`orderbook with ${stockSymbol} does not exist`)
    }

    if (!this.inrbalances[userId]?.available) {
      throw new Error(" sorry u need to first onramp to begin minting")
    }

    if (this.inrbalances[userId].available >= amount) {
      if (!this.stockbalances[userId]) {
        this.stockbalances[userId] = {}
      }

      const mintedStocks = amount / 10
      if (!this.stockbalances[userId][stockSymbol]) {
        this.stockbalances[userId][stockSymbol] = { yes: { locked: 0, quantity: mintedStocks }, no: { locked: 0, quantity: mintedStocks } }
      } else {
        this.stockbalances[userId][stockSymbol].yes!.quantity += mintedStocks
        this.stockbalances[userId][stockSymbol].no!.quantity += mintedStocks

      }

      return (`minted ${amount} yes and no stocks for ${userId}`)



    } else {
      throw new Error("insufficient funds to proceed with minting")
    }




  }

}