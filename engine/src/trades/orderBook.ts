export interface SellOrder {
  userId: string,
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
    } else {
      this.yes[price]!.orders.total+=quantity
      if(!this.yes[price]!.orders.users[userId]){
        this.yes[price]!.orders.users[userId] =quantity

      }else{
        this.yes[price]!.orders.users[userId]+=quantity
      }
      

    }else{
      if (stockType == "no") {
        if (!this.yes[price]) {
          this.yes[price] = {
            orders: {
              total: quantity,
              users: { userId: quantity }
            }
          }
        }
      } else {
        this.no[price]!.orders.total+=quantity
        if(!this.no[price]!.orders.users[userId]){
          this.no[price]!.orders.users[userId] =quantity
  
        }else{
          this.no[price]!.orders.users[userId]+=quantity
        }

    }





  }


}

  
// Additional methods to manipulate and query the orderbook can be added here


