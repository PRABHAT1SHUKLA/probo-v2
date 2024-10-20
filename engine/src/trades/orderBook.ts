interface SellOrder{
  userId : string,
  stockSymbol: string,
  price : number,
  quantity: number,
  stockType: "yes"|"no"

}

export class OrderBook {
  orderbook: {
    [stockSymbol: string]: {
      yes: {
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
      };
      no: {};
    };
  };

  constructor(initialOrderBook?: any) {
    // Initialize with either the provided orderbook or default structure
    this.orderbook = initialOrderBook || {
      BTC_USDT_10_Oct_2024_9_30: {
        yes: {
          '6.5': {
            orders: {
              total: 16,
              users: {
                user1: 8,
                user2: 8
              }
            },
            reverseOrders: {
              total: 10,
              users: {
                user3: 5,
                user4: 5
              }
            }
          }
        },
        no: {}
      }
    };
  }

  sell(sellorder: SellOrder){
    if(!this.orderbook[sellorder.stockSymbol]){
      return {
        
      }
    }

  }





  // Additional methods to manipulate and query the orderbook can be added here
}

