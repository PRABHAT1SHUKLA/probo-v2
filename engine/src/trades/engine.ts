import { Orderbook } from "./orderBook";
import fs from "fs"

interface UserBalance {
  [key: string]: {
      available: number;
      locked: number;
  }
}


export class Engine{

  private orderbooks: Orderbook[] = [];
  private balances: Map<string, UserBalance> = new Map();
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
        this.orderbooks = snapshotSnapshot.orderbooks.map((o: any) => new Orderbook(o.baseAsset, o.bids, o.asks, o.lastTradeId, o.currentPrice));
        this.balances = new Map(snapshotSnapshot.balances);
    } else {
        this.orderbooks = [new Orderbook()];
        this.setBaseBalances();
    }
    setInterval(() => {
        this.saveSnapshot();
    }, 1000 * 3);
}

saveSnapshot() {
  const snapshotSnapshot = {
      orderbooks: this.orderbooks.map(o => o.getSnapshot()),
      balances: Array.from(this.balances.entries())
  }
  fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotSnapshot));
}


  createSellOrder(userId:string , quantity:number, price:number , stockSymbol: string , stockType:"yes"|"no"){
    
     const orderBook  = this.orderbooks.find((o)=> o.orderbook.stockSymbol === stockSymbol)
  }

}