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
  sortedKeys: string[];
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
};

export type Reverse = Fills;

export class Orderbook {
  stockSymbol: string;
  yes: Order;
  no: Order;

  constructor(stockSymbol: string, yes: Order = {}, no: Order = {}) {
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

  private initializeOrder(type: "yes" | "no", price: number, userId: string, quantity: number) {
    const orderType = type === "yes" ? this.yes : this.no;

    if(!orderType[price]) {
      orderType[price] = {
        orders: { total: 0, users: {} },
        reverseOrders: { total: 0, users: {} },
      }
    }

    orderType[price].orders.total += quantity;
    orderType[price].orders.users[userId] = (orderType[price].orders.users[userId] || 0) + quantity;
  }

  private createReverseOrder(
    orderType: Order,
    price: number,
    userId: string,
    quantity: number
  ) {
    if (!orderType[price]) {
      orderType[price] = {
        orders: { total: 0, users: {} },
        reverseOrders: { total: quantity, users: { [userId]: quantity } },
      };
    }

    orderType[price].reverseOrders.total += quantity;
    orderType[price].reverseOrders.users[userId] =
      (orderType[price].reverseOrders.users[userId] || 0) + quantity;
  }

  // else {
  //   this.yes[price].orders.total += quantity;
  //   if (!this.yes[price].orders.users[userId]) {
  //     this.yes[price].orders.users[userId] = quantity;
  //   } else {
  //     this.yes[price].orders.users[userId] += quantity;
  //   }
  //   return;
  // }

  sell(sellorder: SellOrder) {
    const { userId, price, quantity, stockType } = sellorder;
    this.initializeOrder(stockType, price, userId, quantity);
  }

  isObjectEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
  }

  buy({ userId, quantity, price, stockType, sortedKeys }: BuyOrder) {
    let fills : Fills[] = [];
    let reverse : Reverse[] = [];
    let executedQuantity = 0;
    const orderType = stockType === "yes" ? this.yes : this.no;
    const oppositeOrderType = stockType === "yes" ? this.no : this.yes;

    const totalAvailableQuantity = sortedKeys.reduce((total, key) => {
      const keyInt = parseInt(key);
      return (
        total +
        (orderType[keyInt]?.orders.total || 0) +
        (orderType[keyInt]?.reverseOrders.total || 0)
      );
    }, 0);

    if(stockType === "yes") {
      console.log("1 start")

      // Case1: No order was available so we'll create a reverse order in "no"
      if (sortedKeys.length === 0 && totalAvailableQuantity === 0) {
        if (!this.no[price]) {
          this.no[price] = {
            orders: { total: 0, users: {} },
            reverseOrders: { total: quantity, users: { [userId]: quantity } },
          };

          // Doubt: Do we need to push data in reverse array.
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
      console.log("2 point")

      // Case 2: HERE all "YES" ORDER WAS AVAILABLE no need to create new ReverseOrders
      if (quantity <= totalAvailableQuantity) {
        console.log("3. inside loop ")
        sortedKeys.forEach((key) => {
         
          if(remaining === 0) return { reverse, fills, executedQuantity }; // Write return instead of break;

          if(this.yes[parseInt(key)]?.reverseOrders.total! >= remaining) {
            this.yes[parseInt(key)]!.reverseOrders.total -= remaining;
            const usersKey = Object.keys(this.yes![parseInt(key)]!.reverseOrders.users)
            console.log("userkey", usersKey)

            usersKey.forEach((user) => {
              const userOrderQuantity = this.yes[parseInt(key)]!.reverseOrders.users[user];
              if(remaining === 0) return { reverse, fills, executedQuantity };

              if(userOrderQuantity! <= remaining) {
                console.log("inside if last point")
                remaining -= userOrderQuantity!
                executedQuantity += userOrderQuantity!

                reverse.push({
                  userId, // This is the user who is buying reverse Order which someone created
                  otherUserId: user, // This is the user who wants to buy the stock at particular price but he couldn't get due to unavailability.
                  quantity: userOrderQuantity!,
                  price: 10 - price
                })

                delete this.yes![parseInt(key)]?.reverseOrders.users[user]
              } else {
                executedQuantity += remaining
                this.yes![parseInt(key)]!.reverseOrders!.users[user]! -= remaining // In this line let say user quantity is { "1": 7, "2": 4 }, you want only 2 quantity then { "1": 5, "2": 4 }
                reverse.push({
                  userId,
                  otherUserId: user,
                  quantity: remaining, // we use reamaing because what is left is whole executed once by a current user
                  price: 10 - price
                })
                // Because order executed at once.
                remaining = 0;
              }
            })

            return { reverse, fills, executedQuantity };
          } else if (this.yes[parseInt(key)]?.reverseOrders.total! < remaining && this.yes[parseInt(key)]?.reverseOrders.total! !== 0) {
            // Because all orders are executed at once
            this.yes![parseInt(key)]!.reverseOrders.total = 0;

            const usersKey = Object.keys(this.yes![parseInt(key)]!.reverseOrders.users)
            usersKey.forEach((user) => {
              const userOrderQuantity = this.yes![parseInt(key)]!.reverseOrders!.users[user];
              if(remaining === 0) return { reverse, fills, executedQuantity };

              if(userOrderQuantity! <= remaining) {
                remaining -= userOrderQuantity!
                executedQuantity += userOrderQuantity!
                reverse.push({
                  userId, // This is the user who is buying reverse Order which someone created
                  otherUserId: user, // This is the user who wants to buy the stock at particular price but he couldn't get due to unavailability.
                  quantity: userOrderQuantity!,
                  price: 10 - price
                })
                
                delete this.yes![parseInt(key)]?.reverseOrders.users[user]
              }
            }) 
          } else if(this.yes[parseInt(key)]?.orders.total! >= remaining) {
            // console.log("Hi", this.yes![parseInt(key)]!.orders.total)
            this.yes[parseInt(key)]!.orders.total -= remaining
            const usersKey = Object.keys(this.yes[parseInt(key)]!.orders.users)
            console.log("userKeys", usersKey)
            
            usersKey.map((user) => {
              const userOrderQuantity = this.yes[parseInt(key)]!.orders.users[user];
              if(remaining === 0) return { reverse, fills, executedQuantity };

              if(userOrderQuantity! <= remaining) {
                remaining -= userOrderQuantity!
                executedQuantity += userOrderQuantity!
                fills.push({
                  userId, // This is the user who is buying reverse Order which someone created
                  otherUserId: user, // This is the user who wants to buy the stock at particular price but he couldn't get due to unavailability.
                  quantity: userOrderQuantity!,
                  price,
                })

                delete this.yes[parseInt(key)]?.orders.users[user]
              } else {
                executedQuantity += remaining
                this.yes[parseInt(key)]!.orders.users[user]! -= remaining // In this line let say user quantity is { "1": 7, "2": 4 }, you want only 2 quantity then { "1": 5, "2": 4 }
                fills.push({
                  userId,
                  otherUserId: user,
                  quantity: remaining, // we use reamaing because what is left is whole executed once by a current user
                  price,
                })
                // Because order executed at once.
                remaining = 0;
              }
            })

            return { reverse, fills, executedQuantity };
          } else if(this.yes[parseInt(key)]?.orders.total! < remaining) {
            // Because all orders are executed at once
            this.yes[parseInt(key)]!.orders.total = 0;

            const usersKeys = Object.keys(this.yes[parseInt(key)]!.orders.users)
            usersKeys.forEach((user) => {
              const userOrderQuantity = this.yes[parseInt(key)]!.orders.users[user];
              if(remaining === 0) return { reverse, fills, executedQuantity };

              if(userOrderQuantity! <= remaining) {
                remaining -= userOrderQuantity!
                executedQuantity += userOrderQuantity!
                fills.push({
                  userId, // This is the user who is buying reverse Order which someone created
                  otherUserId: user, // This is the user who wants to buy the stock at particular price but he couldn't get due to unavailability.
                  quantity: userOrderQuantity!,
                  price: 10 - price
                })
                delete this.yes![parseInt(key)]?.orders.users[user]
              }
            }) 
          }
        })  
      } 

      // Demand is more than supply.
      else {
        sortedKeys.forEach((key) => {
          if (this.yes[parseInt(key)]?.reverseOrders.total! < remaining) {
            // Update orderbook
            // Because all orders are executed at once
            this.yes[parseInt(key)]!.reverseOrders.total = 0;

            const usersKey = Object.keys(this.yes[parseInt(key)]!.reverseOrders.users)
            usersKey.forEach((user) => {
              const userOrderQuantity = this.yes[parseInt(key)]!.reverseOrders!.users[user];

              if(remaining === 0) return { reverse, fills, executedQuantity };

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
            }) 
          } else if(this.yes![parseInt(key)]?.orders.total! < remaining) {
            // Because all orders are executed at once
            this.yes[parseInt(key)]!.orders.total = 0;

            const usersKey = Object.keys(this.yes![parseInt(key)]!.orders.users)
            usersKey.forEach((user) => {
              const userOrderQuantity = this.yes[parseInt(key)]!.orders!.users[user];
              if(remaining === 0) return { reverse, fills, executedQuantity };

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
            }) 
          }
        })

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
      } 
    }

    return { reverse, fills, executedQuantity }
    //some tests remaining
    
  }

  getDepth(stockSymbol: string) {
    return {
      yesOrders: this.yes,
      noOrders: this.no,
    };
  }
}

// Additional methods to manipulate and query the orderbook can be added here
