import { Orderbook } from "./orderBook";
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


export class Engine{

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
        this.orderbooks = snapshotSnapshot.orderbooks.map((o: any) => new Orderbook(o.stockSymbol , o.yes , o.no));
        this.inrbalances = snapshotSnapshot.inrbalances;
        this.stockbalances = snapshotSnapshot.stockbalances;
    } else {
        this.orderbooks = [new Orderbook('new' ,{} ,{})];
        this.setinrBalances();
        this.setstockbalances()
    }
    setInterval(() => {
        this.saveSnapshot();
    }, 1000 * 3);
}
setinrBalances(){
  
}


saveSnapshot() {
  const snapshotSnapshot = {
      orderbooks: this.orderbooks.map(o => o.getSnapshot()),
      balances: Array.from(this.balances.entries())
  }
  fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotSnapshot));
}


  createSellOrder(userId:string , quantity:number, price:number , stockSymbol: string , stockType:"yes"|"no"){
    
     const orderBook  = this.orderbooks.find((o)=> o.stockSymbol === stockSymbol)
     if(!orderBook){
      throw new Error("orderbook does not exist")
     }

     this.checkandLockBalance(userId, quantity, price )
  }


  buyBalance(userId:string , quantity: number , price:number){
      const userBalance = this.inrbalances[userId]

      const requiredBalance =  price * quantity
      if(!userBalance){
        throw new Error(" user doesn't exist  ")
      }

      if(this.inrbalances[userId]?.available!<requiredBalance){
        throw new Error("Not sufficient balance")
      }else{
        this.inrbalances[userId]!.available-=requiredBalance
        this.inrbalances[userId]!.locked+=requiredBalance
      }
 }

  onRamp(userId: string, amount: number) {
    const userBalance = this.inrbalances[userId];
    if (!userBalance) {
        this.inrbalances[userId]={
          locked:0, 
          available:0
        }
    } else {
        userBalance.available += amount;
    }
}

onMint(userId: string , amount:number , stockSymbol: string){
 
  const orderBook  = this.orderbooks.find((o)=> o.stockSymbol === stockSymbol)
  if(!orderBook){
   throw new Error(`orderbook with ${stockSymbol} does not exist`)
  }

   

}

}