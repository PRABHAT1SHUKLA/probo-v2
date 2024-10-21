export interface SellOrder{
  userId : string,
  price : number,
  quantity: number,
  stockType: "yes"|"no"

}

export interface Order{
  
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

 constructor(stockSymbol:string , yes: Order, no: Order){
  this.stockSymbol =  stockSymbol,
  this.yes = yes,
  this.no = no
 }

 


 

  

  sell(sellorder: SellOrder){
       
    }

  }





  // Additional methods to manipulate and query the orderbook can be added here
}

