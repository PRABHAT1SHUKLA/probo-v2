export interface SellOrder {
  userId: string;
  price: number;
  quantity: number;
  stockType: "yes" | "no";
}

export interface BuyOrder {
  userId: string;
  price: number;
  quantity: number;
  stockType: "yes" | "no";
  sortedKeys: string[]
}

export interface Order {
  [price: number]: {
    orders: {
      total: number;
      users: { [userId: string]: number };
    };
    reverseOrders: {
      total: number;
      users: { [userId: string]: number };
    };
  };
}

export interface Fills {
  userId: string;
  otherUserId: string;
  quantity: number;
  price: number;
}

export interface Reverse {
  userId: string;
  otherUserId: string;
  quantity: number;
  price: number;
}

export class Orderbook {
  stockSymbol: string;
  yes: Order | null;
  no: Order | null;

  constructor(stockSymbol: string, yes: Order | null, no: Order | null) {
    this.stockSymbol = stockSymbol;
    this.yes = yes;
    this.no = no;
  }

  getSnapshot() {
    return {
      stockSymbol: this.stockSymbol,
      yes: this.yes,
      no: this.no,
    };
  }

  sell(sellorder: SellOrder) {
    const { userId, price, quantity, stockType } = sellorder;
    if (stockType == "yes") {
      if (this.yes === null ){
        this.yes={}
      }
      if(!this.yes[price]) {
        this.yes[price]= {
            orders: {
              total: quantity,
              users: {
                [userId]: quantity
              }
            },
            reverseOrders: {
              total: 0,
              users: {}
            }
          }
          return;
        }else{
          this.yes[price].orders.total += quantity;
          if (!this.yes[price].orders.users[userId]) {
            this.yes[price].orders.users[userId] = quantity;
          } else {
            this.yes[price].orders.users[userId] += quantity;
          }
          return;

        }
      
       } else {
        if (this.no === null ){
          this.no={}
        }
        if(!this.no[price]) {
          this.no[price]= {
              orders: {
                total: quantity,
                users: {
                  [userId]: quantity
                }
              },
              reverseOrders: {
                total: 0,
                users: {}
              }
            }
            return;
          }else{
            this.no[price].orders.total += quantity;
            if (!this.no[price].orders.users[userId]) {
              this.no[price].orders.users[userId] = quantity;
            } else {
              this.no[price].orders.users[userId] += quantity;
            }
            return;
  
          }
       }
  }

  isObjectEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
  }

  buy({ userId, quantity, price, stockType, sortedKeys }: BuyOrder) {
    let fills : Fills[] = [];
    let reverse : Reverse[] = [];
    let executedQuantity = 0;

    if(stockType === "yes" && this.yes !== null && this.no !== null) {
      let totalAvailableQuantity = 0;
      let totalNormalOrdersQuantity = 0;
      let totalReverseOrdersQuanity = 0;
      sortedKeys.map((key) => {
        totalAvailableQuantity += this.yes![parseInt(key)]!.orders!.total + this.yes![parseInt(key)]!.reverseOrders!.total
        totalNormalOrdersQuantity += this.yes![parseInt(key)]!.orders!.total
        totalReverseOrdersQuanity += this.yes![parseInt(key)]!.reverseOrders!.total
      })

      // Case1: No order was available so we'll create a reverse order in "no"
      if (sortedKeys.length === 0 && totalAvailableQuantity === 0) {
        if (!this.no[price]) {
          this.no[price] = {
            orders: { total: 0, users: {} },
            reverseOrders: { total: quantity, users: { [userId]: quantity } },
          };
          return { reverse, fills, executedQuantity };
        } else {
          this.no[price].reverseOrders.total += quantity;
          if (!this.no[price].reverseOrders.users[userId]) {
            this.no[price].reverseOrders.users[userId] = quantity;
          } else {
            this.no[price].reverseOrders.users[userId] += quantity;
          }
          return{ reverse, fills, executedQuantity };
        }
      }
      let remaining = quantity

      // Case 2: HERE all "YES" ORDER WAS AVAILABLE no need to create new ReverseOrders
      if (quantity <= totalAvailableQuantity) {
        for(const key in sortedKeys) {
          if(remaining === 0) break; // Write return instead of break;

          if(this.yes![parseInt(key)]?.reverseOrders.total! >= remaining) {
            this.yes![parseInt(key)]!.reverseOrders.total -= remaining
            const usersKey = Object.keys(this.yes![parseInt(key)]!.reverseOrders.users)
            for(const user in usersKey) {
              const userOrderQuantity = this.yes[key]!.reverseOrders!.users[user];
              if(remaining === 0) break;
              if(userOrderQuantity! <= remaining) {
                remaining -= userOrderQuantity!
                executedQuantity += userOrderQuantity!
                reverse.push({
                  userId, // This is the user who is buying reverse Order which someone created
                  otherUserId: user, // This is the user who wants to buy the stock at particular price but he couldn't get due to unavailability.
                  quantity: userOrderQuantity!,
                  price: 10 - price
                })
                delete this.yes[parseInt(key)]?.reverseOrders.users[user]
              } else {
                executedQuantity += remaining
                this.yes[key]!.reverseOrders!.users[user]! -= remaining // In this line let say user quantity is { "1": 7, "2": 4 }, you want only 2 quantity then { "1": 5, "2": 4 }
                reverse.push({
                  userId,
                  otherUserId: user,
                  quantity: remaining, // we use reamaing because what is left is whole executed once by a current user
                  price: 10 - price
                })
                // Because order executed at once.
                remaining = 0;
              }
            }
            return { reverse, fills, executedQuantity };
          } else if (this.yes![parseInt(key)]?.reverseOrders.total! < remaining) {
            // Because all orders are executed at once
            this.yes[parseInt(key)]!.reverseOrders.total = 0;

            const usersKey = Object.keys(this.yes![parseInt(key)]!.reverseOrders.users)
            for(const user in usersKey) {
              const userOrderQuantity = this.yes[key]!.reverseOrders!.users[user];
              if(remaining === 0) break;
              if(userOrderQuantity! <= remaining) {
                remaining -= userOrderQuantity!
                executedQuantity += userOrderQuantity!
                reverse.push({
                  userId, // This is the user who is buying reverse Order which someone created
                  otherUserId: user, // This is the user who wants to buy the stock at particular price but he couldn't get due to unavailability.
                  quantity: userOrderQuantity!,
                  price: 10 - price
                })
                delete this.yes[parseInt(key)]?.reverseOrders.users[user]
              }
            }
          } else if(this.yes![parseInt(key)]?.orders.total! >= remaining) {
            this.yes![parseInt(key)]!.orders.total -= remaining
            const usersKey = Object.keys(this.yes![parseInt(key)]!.orders.users)
            for(const user in usersKey) {
              const userOrderQuantity = this.yes[key]!.orders!.users[user];
              if(remaining === 0) break;
              if(userOrderQuantity! <= remaining) {
                remaining -= userOrderQuantity!
                executedQuantity += userOrderQuantity!
                reverse.push({
                  userId, // This is the user who is buying reverse Order which someone created
                  otherUserId: user, // This is the user who wants to buy the stock at particular price but he couldn't get due to unavailability.
                  quantity: userOrderQuantity!,
                  price: 10 - price
                })
                delete this.yes[parseInt(key)]?.orders.users[user]
              } else {
                executedQuantity += remaining
                this.yes[key]!.reverseOrders!.users[user]! -= remaining // In this line let say user quantity is { "1": 7, "2": 4 }, you want only 2 quantity then { "1": 5, "2": 4 }
                fills.push({
                  userId,
                  otherUserId: user,
                  quantity: remaining, // we use reamaing because what is left is whole executed once by a current user
                  price: 10 - price
                })
                // Because order executed at once.
                remaining = 0;
              }
            }
            return { reverse, fills, executedQuantity };
          } else if(this.yes![parseInt(key)]?.orders.total! < remaining) {
            // Because all orders are executed at once
            this.yes[parseInt(key)]!.orders.total = 0;

            const usersKey = Object.keys(this.yes![parseInt(key)]!.orders.users)
            for(const user in usersKey) {
              const userOrderQuantity = this.yes[key]!.orders!.users[user];
              if(remaining === 0) break;
              if(userOrderQuantity! <= remaining) {
                remaining -= userOrderQuantity!
                executedQuantity += userOrderQuantity!
                fills.push({
                  userId, // This is the user who is buying reverse Order which someone created
                  otherUserId: user, // This is the user who wants to buy the stock at particular price but he couldn't get due to unavailability.
                  quantity: userOrderQuantity!,
                  price: 10 - price
                })
                delete this.yes[parseInt(key)]?.orders.users[user]
              }
            }
          }
        }  
      } 

      // Demand is more than supply.
      else {
        for(const key in sortedKeys) {
          if (this.yes![parseInt(key)]?.reverseOrders.total! < remaining) {
            // Update orderbook
            // Because all orders are executed at once
            this.yes[parseInt(key)]!.reverseOrders.total = 0;

            const usersKey = Object.keys(this.yes![parseInt(key)]!.reverseOrders.users)
            for(const user in usersKey) {
              const userOrderQuantity = this.yes[key]!.reverseOrders!.users[user];
              if(remaining === 0) break;
              if(userOrderQuantity! <= remaining) {
                remaining -= userOrderQuantity!
                executedQuantity += userOrderQuantity!
                reverse.push({
                  userId, // This is the user who is buying reverse Order which someone created
                  otherUserId: user, // This is the user who wants to buy the stock at particular price but he couldn't get due to unavailability.
                  quantity: userOrderQuantity!,
                  price: 10 - price
                })
                delete this.yes[parseInt(key)]?.reverseOrders.users[user]
              }
            }
          } else if(this.yes![parseInt(key)]?.orders.total! < remaining) {
            // Because all orders are executed at once
            this.yes[parseInt(key)]!.orders.total = 0;

            const usersKey = Object.keys(this.yes![parseInt(key)]!.orders.users)
            for(const user in usersKey) {
              const userOrderQuantity = this.yes[key]!.orders!.users[user];
              if(remaining === 0) break;
              if(userOrderQuantity! <= remaining) {
                remaining -= userOrderQuantity!
                executedQuantity += userOrderQuantity!
                fills.push({
                  userId, // This is the user who is buying reverse Order which someone created
                  otherUserId: user, // This is the user who wants to buy the stock at particular price but he couldn't get due to unavailability.
                  quantity: userOrderQuantity!,
                  price: 10 - price
                })
                delete this.yes[parseInt(key)]?.orders.users[user]
              }
            }
          }
        }

        if(remaining !== 0) {
          if (!this.no[price]) {
            this.no[price] = {
              orders: { total: 0, users: {} },
              reverseOrders: { total: quantity, users: { [userId]: quantity } },
            };
          } else {
            this.no[price].reverseOrders.total += quantity;
            if (!this.no[price].reverseOrders.users[userId]) {
              this.no[price].reverseOrders.users[userId] = quantity;
            } else {
              this.no[price].reverseOrders.users[userId] += quantity;
            }
          }
        }

        return { reverse, fills, executedQuantity };
      } 
    }

    return { reverse, fills, executedQuantity }
  }

  getDepth(stockSymbol: string) {
    return {
      yesOrders: this.yes,
      noOrders: this.no,
    };
  }
}

// Additional methods to manipulate and query the orderbook can be added here
