import { RedisManager } from "../RedisManager";
import {
  BUY_ORDER,
  CREATE_MARKET,
  CREATE_USER,
  MessageFromApi,
  MINT,
  ONRAMP,
  SELL_ORDER,
  STOCK_BALANCE,
  STOCK_SYMBOL,
  USER_BALANCE,
} from "../types/fromApi";
import { BuyOrder, Orderbook, SellOrder, Order } from "./orderBook";
import fs from "fs";
import { Fills, Reverse } from "./orderBook";

interface UserBalance {
  [userId: string]: {
    available: number;
    locked: number;
  };
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
  private stockbalances: StockBalances = {};

  constructor() {
    let snapshot = fs.readFileSync("./snapshot.json", "utf-8");
    
    if (snapshot) {
      const snapshotSnapshot = JSON.parse(snapshot.toString());
      this.orderbooks = snapshotSnapshot.orderbooks.map((o: any) => new Orderbook(o.stockSymbol, o.yes, o.no));
      this.inrbalances = snapshotSnapshot.inrbalances;
      this.stockbalances = snapshotSnapshot.stockbalances;
    }

    setInterval(() => {
      this.saveSnapshot();
    }, 1000 * 3);
  }

  private initializeUserBalance(userId: string) {
    this.inrbalances[userId] = {
      available: 0,
      locked: 0
    }
  }

  private initializeStockBalances({ userId, stockSymbol }: { userId: string, stockSymbol: string }) {
    this.stockbalances[userId] = {
      [stockSymbol]: {
        yes: {
          quantity: 0,
          locked: 0
        },
        no: {
          quantity: 0,
          locked: 0
        }
      }
    }
  }

  private saveSnapshot() {
    const snapshot = {
      orderbooks: this.orderbooks.map(o => o.getSnapshot()),
      balances: this.inrbalances,
      stockbalances: this.stockbalances
    }

    fs.writeFileSync("./snapshot.json", JSON.stringify(snapshot));
  }

  process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }) {
    switch (message.type) {
      case CREATE_USER: {
        const userId = message.data.userId;
        if (!this.inrbalances[userId]) {
          this.inrbalances[userId] = {
            available: 0,
            locked: 0,
          };

          this.stockbalances[userId] = {};
          console.log(this.inrbalances);

          RedisManager.getInstance().sendToApi(clientId, {
            type: "USER_CREATED",
            payload: {
              userId: userId,
            },
          });
        } else {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "AlreadyExists",
            payload: {
              msg: "User already exists",
            },
          });
        }
        break;
      }

      case BUY_ORDER: {
        const { userId, price, quantity, stockSymbol, stockType } = message.data
        const response = this.buyOrder(userId, quantity, price, stockType, stockSymbol)
        RedisManager.getInstance().sendToApi(clientId, response)
        this.publishWsTrade({ userId, stockSymbol })
        break;
      }

      case SELL_ORDER: {
        try {
          const userId = message.data.userId;
          const quantity = message.data.quantity;
          const price = message.data.price;
          const stockType = message.data.stockType;
          const stockSymbol = message.data.stockSymbol;

          const response = this.sell(
            userId,
            quantity,
            stockType,
            stockSymbol,
            price
          );

          RedisManager.getInstance().sendToApi(clientId, response);
          console.log(JSON.stringify(this.orderbooks));
        } catch (err) {
          console.log(err);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_NOT_PLACED",
            payload: {
              orderbook: "",
              price: "",
              quantity: "",
              stockSymbol: "",
            },
          });
        }
        break;
      }

      case ONRAMP: {
        const id = message.data.userId;
        const amount = Number(message.data.amount);
        this.onRamp(id, amount);
        console.log(this.inrbalances);
        RedisManager.getInstance().sendToApi(clientId, {
          type: "ONRAMPED",
          payload: {
            msg: `OnRamped user ${id} with ${amount}`,
          },
        });
        break;
      }

      case CREATE_MARKET: {
        const marketCreated = this.createMarket(message.data.stockSymbol);
        if (marketCreated) {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "MARKET_CREATED",
            payload: {
              stockSymbol: message.data.stockSymbol,
              yes: marketCreated.yes,
              no: marketCreated.no
            },
          });
        } else {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "Error",
            payload: {
              msg: "Something went wrong",
            },
          });
        }
        break;
      }

      case MINT: {
        const response = this.onMint(
          message.data.userId,
          message.data.price,
          message.data.stockSymbol
        );
        RedisManager.getInstance().sendToApi(clientId, response);
        console.log(this.inrbalances);
        console.log(JSON.stringify(this.stockbalances));
        break;
      }

      case USER_BALANCE: {
        if (!this.inrbalances[message.data.userId]) {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "NOT_PRESENT",
            payload: {
              msg: "User does not exist",
            },
          });
        } else {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "USER_BALANCE",
            payload: {
              balance: this.inrbalances[message.data.userId],
            },
          });
        }
        break;
      }

      case STOCK_BALANCE: {
        if (!this.stockbalances[message.data.userId]) {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "NOT_PRESENT",
            payload: {
              msg: "User does not exist",
            },
          });
        } else {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "STOCK_BALANCE",
            payload: {
              stockBalance: this.stockbalances[message.data.userId]
            },
          });
        }
        break;
      }

      case STOCK_SYMBOL: {
        const orderBook = this.orderbooks.find(
          (o) => o.stockSymbol === message.data.stockSymbol
        );
        if (!orderBook) {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "NOT_FOUND",
            payload: {
              msg: `orderBook for ${message.data.stockSymbol} does not exist`,
            },
          });
        } else {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDERBOOK",
            payload: {
              stockSymbol: orderBook.stockSymbol,
              yes: orderBook.yes,
              no: orderBook.no
            },
          });
        }
        break;
      }

      default: {
        RedisManager.getInstance().sendToApi(clientId, {
          type: "NoCaseMatched",
          payload: {
            msg: "No case matched"
          }
        })
      }
    }
  }

  buyOrder(userId: string, quantity: number, price: number, stockType: "yes" | "no", stockSymbol: string) {
    const orderBook = this.orderbooks.find((o) => o.stockSymbol === stockSymbol)
    if (!orderBook) {
      return {
        type: "OrderBookNotFound",
        payload: {
          msg: `orderbook with ${stockSymbol} does not exist`
        }
      }
    }
    const userBalance = this.inrbalances[userId]

    const requiredBalance = price * quantity
    if (!userBalance) {
      return {
        type: "UserNotExist",
        payload: {
          msg: "user doesn't exist"
        }
      }
    }

    if (userBalance.available < requiredBalance) {
      return {
        type: "Not sufficient fund",
        payload: {
          msg: "Not sufficient balance"
        }
      }
    }

    this.inrbalances[userId]!.available -= requiredBalance
    this.inrbalances[userId]!.locked += requiredBalance
    
    if (stockType == "yes") {
      let yesSortedKeys = Object.keys(orderBook.yes!).sort()
      yesSortedKeys.filter((key) => { parseInt(key) <= price })

      const buyOrder: BuyOrder = {
        stockType: "yes",
        price: price,
        quantity: quantity,
        sortedKeys: yesSortedKeys,
        userId: userId
      }
      const { fills, reverse, executedQuantity } = orderBook.buy(buyOrder)
      console.log("Orderbook", JSON.stringify(orderBook))
      console.log(fills, reverse)
      this.updateFillsBalance(fills, stockSymbol, stockType)

      this.updateReverseBalance(reverse, stockSymbol, stockType)

      return {
        type: "BUY_ORDER",
        payload: {
          msg: `Executed quantity ${executedQuantity}`
        }
      }
    } else {
      let noSortedKeys = Object.keys(orderBook.no!).sort()
      noSortedKeys.filter((key) => { parseInt(key) <= price })

       const buyOrder: BuyOrder = {
        stockType: "no",
        price: price,
        quantity: quantity,
        sortedKeys: noSortedKeys,
        userId: userId
      }
      const { fills, reverse, executedQuantity } = orderBook.buy(buyOrder)

      this.updateFillsBalance(fills, stockSymbol, stockType)

      this.updateReverseBalance(reverse, stockSymbol, stockType)

      return {
        type: "BUY_ORDER",
        payload: {
          msg: `Executed quantity ${executedQuantity}`
        }
      }
    }
  }

  onRamp(userId: string, amount: number) {
    const userBalance = this.inrbalances[userId];
    if (!userBalance) {
      this.inrbalances[userId] = {
        locked: 0,
        available: amount,
      };
    } else {
      userBalance.available += amount;
    }
  }

  onMint(userId: string, amount: number, stockSymbol: string) {
    const orderBook = this.orderbooks.find(
      (o) => o.stockSymbol === stockSymbol
    );
    if (!orderBook) {
      return {
        type: "Error",
        payload: {
          msg: `orderbook with ${stockSymbol} does not exist`,
        },
      };
    }

    if (!this.inrbalances[userId]) {
      return {
        type: "Error",
        payload: {
          msg: "sorry u need to first onramp to begin minting",
        },
      };
    }

    if (this.inrbalances[userId].available >= amount) {
      if (!this.stockbalances[userId]) {
        this.stockbalances[userId] = {};
      }

      const mintedStocks = amount / 10;
      if (!this.stockbalances[userId][stockSymbol]) {
        this.stockbalances[userId][stockSymbol] = {
          yes: { locked: 0, quantity: mintedStocks },
          no: { locked: 0, quantity: mintedStocks },
        };
        this.inrbalances[userId].available -= amount;
      } else {
        this.stockbalances[userId][stockSymbol].yes!.quantity += mintedStocks;
        this.stockbalances[userId][stockSymbol].no!.quantity += mintedStocks;
        this.inrbalances[userId].available -= amount;
      }

      return {
        type: "Success",
        payload: {
          msg: `minted ${amount} yes and no stocks for ${userId}`,
        },
      };
    } else {
      return {
        type: "Insufficient balance",
        payload: {
          msg: "insufficient funds to proceed with minting",
        },
      };
    }
  }

  createMarket(stockSymbol: string) {
    const orderBook = this.orderbooks.find(
      (o) => o.stockSymbol === stockSymbol
    );
    if (!orderBook) {
      const newOrderBook = new Orderbook(stockSymbol);
      this.orderbooks.push(newOrderBook);
      return newOrderBook;
    }
  }

  filterAndSortOrders(orderBook: Order, maxPrice: number) {
    // Convert the orderBook object into an array of objects with price as a number
    const filteredOrders = Object.entries(orderBook)
      .filter(([price]) => parseFloat(price) <= maxPrice) // Filter by maxPrice
      .map(([price, data]) => ({ price: parseFloat(price), ...data })); // Convert price to number and add to object

    // Sort the filtered orders by price in ascending order
    return filteredOrders.sort((a, b) => a.price - b.price);
  }

  sell(userId: string, quantity: number, stockType: "yes" | "no", stockSymbol: string, price: number) {
    const orderBook = this.orderbooks.find(
      (o) => o.stockSymbol === stockSymbol
    );
    if (!orderBook) {
      return {
        type: "Error",
        payload: {
          msg: `orderbook with ${stockSymbol} does not exist`,
        },
      };
    }

    this.initializeStockBalances({ userId, stockSymbol })
    console.log("Inside Engine Sell Function -----> ", this.stockbalances)
    if ((stockType = "yes")) {
      if (this.stockbalances[userId]![stockSymbol]!.yes!.quantity < quantity) {
        return {
          type: "Order_Cancelled",
          payload: {
            msg: "Not Enough yes stocks to sell",
          },
        };
      }
      this.stockbalances[userId]![stockSymbol]!.yes!.quantity -= quantity;
      this.stockbalances[userId]![stockSymbol]!.yes!.locked += quantity;

      const order: SellOrder = {
        userId: userId,
        price: price,
        stockType: "yes",
        quantity: quantity,
      };
      orderBook.sell(order);

      // to implement websocket logic here to make orerbook changes in ui
      return {
        type: "Order_Placed",
        payload: {
          userId,
          stockSymbol,
        },
      };
    } else {
      if (this.stockbalances[userId]![stockSymbol]!.no!.quantity < quantity) {
        return {
          type: "NotEnoughStockBalance",
          payload: {
            msg: "not enough stock balance to sell"
          }
        }
      }
      this.stockbalances[userId]![stockSymbol]!.no!.quantity -= quantity;
      this.stockbalances[userId]![stockSymbol]!.no!.locked += quantity;

      const order: SellOrder = {
        userId: userId,
        price: price,
        stockType: "no",
        quantity: quantity,
      };
      //implement ws logic here
      orderBook.sell(order);
      return { userId, quantity, price, stockType, stockSymbol };
    }
  }

  updateFillsBalance(fills: Fills[], stockSymbol: string, stockType: string) {
    if(fills.length === 0) {
      return;
    }

    console.log("Sadhu Pratham", fills)
    fills.forEach((fill) => {

      if(!this.inrbalances[fill.userId]) {
        this.initializeUserBalance(fill.userId)
      }

      if(!this.inrbalances[fill.userId]) {
        this.initializeUserBalance(fill.otherUserId)
      }

      if(!this.stockbalances[fill.userId] ) {
        this.initializeStockBalances({ userId: fill.userId, stockSymbol })
      }

      if(!this.stockbalances[fill.userId] ) {
        this.initializeStockBalances({ userId: fill.otherUserId, stockSymbol })
      }

      this.inrbalances[fill.userId]!.locked -= fill.quantity * fill.price

      if (stockType == "yes") {
        this.stockbalances[fill.otherUserId]![stockSymbol]!.yes!.locked -= fill.quantity
        this.stockbalances[fill.userId]![stockSymbol]!.yes!.quantity += fill.quantity
      } else {
        this.stockbalances[fill.otherUserId]![stockSymbol]!.no!.locked -= fill.quantity
        this.stockbalances[fill.userId]![stockSymbol]!.no!.quantity += fill.quantity
      }
    })
  }

  updateReverseBalance(reverse: Reverse[], stockSymbol: string, stockType: string) {
    if(reverse.length === 0) {
      return;
    }
    console.log("Pratham Sadhu", reverse)
    reverse.forEach((rev) => {
      if(!this.inrbalances[rev.userId]) {
        this.initializeUserBalance(rev.userId)
      }

      if(!this.inrbalances[rev.userId]) {
        this.initializeUserBalance(rev.otherUserId)
      }

      if(!this.stockbalances[rev.userId] ) {
        this.initializeStockBalances({ userId: rev.userId, stockSymbol })
      }

      if(!this.stockbalances[rev.userId] ) {
        this.initializeStockBalances({ userId: rev.otherUserId, stockSymbol })
      }

      this.inrbalances[rev.userId]!.locked -= rev.quantity * rev.price
      this.inrbalances[rev.otherUserId]!.locked -= rev.quantity * (1000 - rev.price)

      if (stockType === "yes") {
        this.stockbalances[rev.otherUserId]![stockSymbol]!.yes!.quantity += rev.quantity
        this.stockbalances[rev.userId]![stockSymbol]!.yes!.quantity += rev.quantity
      } else {
        this.stockbalances[rev.otherUserId]![stockSymbol]!.no!.quantity += rev.quantity
        this.stockbalances[rev.userId]![stockSymbol]!.no!.quantity += rev.quantity
      }
    })
  }

  private validateOrder({ userId, quantity, price, userBalance }: { userId: string, quantity: number, price: number, userBalance: UserBalance }) {
    if(!userBalance[userId]) return false;
    if(userBalance[userId].available < quantity * price || price <= 0) return false;
    return true;
  }

  private publishWsTrade({ userId, stockSymbol }: { userId: string, stockSymbol: string }) {
    const orderbook = this.orderbooks.find(o => o.stockSymbol === stockSymbol)

    RedisManager.getInstance().publishMessage(stockSymbol, {
      event: "event_orderbook_update",
      data: {
        yes: orderbook?.yes || {},
        no: orderbook?.no || {}
      }
    })
  }
}

