export interface SellOrder {
  userId: string,
  price: number,
  quantity: number,
  stockType: "yes" | "no"

}

export interface BuyOrder {
  userid: string,
  price: number,
  quantity: number,
  stockType: "yes" | "no"
}

export interface Order {

  [price: string]: {
    orders: {
      total: number;
      users: { [userId: string]: number };
    };
    reverseOrders?: {
      total: number;
      users: { [userId: string]: number };
    };
  };
}

export class Orderbook {
  stockSymbol: string;
  yes: Order;
  no: Order;

  constructor(stockSymbol: string, yes: Order, no: Order) {
    this.stockSymbol = stockSymbol,
      this.yes = yes,
      this.no = no
  }








  sell(sellorder: SellOrder) {
    const { userId, price, quantity, stockType } = sellorder


    if (stockType == "yes") {
      if (!this.yes[price]) {
        this.yes[price] = {
          orders: {
            total: quantity,
            users: { userId: quantity }
          }
        }
      }
      else {
        this.yes[price]!.orders.total += quantity
        if (!this.yes[price]!.orders.users[userId]) {
          this.yes[price]!.orders.users[userId] = quantity

        } else {
          this.yes[price]!.orders.users[userId] += quantity
        }


      }
    } else {
      if (stockType == "no") {
        if (!this.no[price]) {
          this.no[price] = {
            orders: {
              total: quantity,
              users: { userId: quantity }
            }
          }
        }
      } else {
        this.no[price]!.orders.total += quantity
        if (!this.no[price]!.orders.users[userId]) {
          this.no[price]!.orders.users[userId] = quantity

        } else {
          this.no[price]!.orders.users[userId] += quantity
        }

      }






    }


  }



  buy(buyorder: BuyOrder) {

    const { userid, quantity, price, stockType } = buyorder

    let fills = []
    let executedQuantity = 0

    if (stockType == "yes") {
      if (!this.yes[price]) {
        if (!this.no[price]) {
          this.no[price] = {
            orders: { total: 0, users: {} },
            reverseOrders: { total: quantity, users: {} }
          }

          this.no[price].reverseOrders!.users[userid] = quantity

        }
        else {
          this.no[price].reverseOrders!.total += quantity
          if (!this.no[price].reverseOrders!.users[userid]) {
            this.no[price].reverseOrders!.users[userid] = quantity
          } else {
            this.no[price].reverseOrders!.users[userid] += quantity
          }
        }


      } else {
        const availableQuantity = this.yes[price].orders.total
        const reverseOrdersQuantity = this.yes[price].reverseOrders!.total

        const totalAvailableYesOrders = availableQuantity+reverseOrdersQuantity
    
        if(quantity<=totalAvailableYesOrders){
          //In this case we don't need to create any new reverseorders on the opposite side
          if(this.yes[price].reverseOrders!.total>=quantity){
            this.yes[price].reverseOrders!.total-=quantity
            let remaining = quantity
            for (const user in this.yes[price].reverseOrders!.users){
              if(remaining<=0) break;
              const userOrder = this.yes[price].reverseOrders!.users[user]!

              if(userOrder<=remaining){}
                 remaining-=userOrder

                 
              executedQuantity += userOrder
              fills.push({
                userId: userid,
                otherUserId: user,
                quantity: userOrder,
                price: 10-price

              })
            }

          }
        }








        let remaining = availableQuantity
        if (availableQuantity >= quantity) {
          this.yes[price].orders.total -= quantity;

          for (const user in this.yes[price].orders.users) {
            if (remaining <= 0) break;

            const userOrder = this.yes[price].orders.users[user]!

            if (userOrder <= remaining) {
              remaining -= userOrder

              executedQuantity += userOrder
              fills.push({
                userId: userid,
                otherUserId: user,
                quantity: userOrder,
                price: price

              })

              delete this.yes[price].orders.users[user]
            } else {
              this.yes[price].orders.users[user]! -= remaining
              executedQuantity += remaining
              fills.push({
                userId: userid,
                otherUserId: user,
                quantity: remaining,
                price: price
              })
            }



          }

        } else {
          let reverseNoorders = quantity - this.yes[price].orders.total

          this.yes[price].orders.total = 0
          for (const user in this.yes[price].orders.users) {
            const userOrder = this.yes[price].orders.users[user]
            executedQuantity += userOrder!

            fills.push({
              userId: userid,
              otheruserId: user,
              price: price,
              quantity: quantity

            })
            delete this.yes[price].orders.users[user]
          }
          if (!this.no[price]) {
            this.no[price] = {
              orders: { total: 0, users: {} },
              reverseOrders: { total: 0, users: {} }
            }

            this.no[price].reverseOrders!.total = reverseNoorders
            this.no[price].reverseOrders!.users[userid] = reverseNoorders


          } else {
            this.no[price].reverseOrders!.total += reverseNoorders
            if (!this.no[price].reverseOrders!.users[userid]) {
              this.no[price].reverseOrders!.users[userid] = reverseNoorders
            } else {
              this.no[price].reverseOrders!.users[userid] += reverseNoorders

            }
          }

        }
      }
    }

  }



}



// Additional methods to manipulate and query the orderbook can be added here


