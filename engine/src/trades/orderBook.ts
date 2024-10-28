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

export interface Fills {
  userId: string;
  otherUserId: string;
  amount: number;
  price: number;
}

export interface reverse {
  userId: string;
  otherUserId: string;
  amount: number;
  price: number;
}

export class Orderbook {
  stockSymbol: string;
  yes: Order | null;
  no: Order | null;

  constructor(stockSymbol: string, yes: Order | null, no: Order | null) {
    this.stockSymbol = stockSymbol;
    (this.yes = yes), (this.no = no);
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
      if (this.yes === null) {
        this.yes = {};
      }
      if (!this.yes[price]) {
        this.yes[price] = {
          orders: {
            total: quantity,
            users: { [userId]: quantity },
          },
          reverseOrders: {
            total: 0,
            users: {},
          }
        };
      } else {
        this.yes[price]!.orders.total += quantity;
        if (!this.yes[price]!.orders.users[userId]) {
          this.yes[price]!.orders.users[userId] = quantity;
        } else {
          this.yes[price]!.orders.users[userId] += quantity;
        }
      }
    } else {
      if (this.no === null) {
        this.no = {};
      }
      if (!this.no[price]) {
        this.no[price] = {
          orders: {
            total: quantity,
            users: { userId: quantity },
          },
          reverseOrders: {
            total: 0,
            users: {},
          }
        };
      } else {
        this.no[price]!.orders.total += quantity;
        if (!this.no[price]!.orders.users[userId]) {
          this.no[price]!.orders.users[userId] = quantity;
        } else {
          this.no[price]!.orders.users[userId] += quantity;
        }
      }
    }
  }

  isObjectEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
  }


  buy(buyorder: BuyOrder) {
    const { userId, quantity, price, stockType, sortedKeys } = buyorder;

    let fills = [];
    let reverse = [];
    let executedQuantity = 0;




    if (stockType == "yes" && this.yes !== null && this.no !== null) {

      //CASE 1 : HERE NO ORDER WAS AVAILABLE
      


      let totalavailableQuantity = 0
      for (const key in sortedKeys) {
        totalavailableQuantity += (this.yes[key]!.orders!.total + this.yes[key]!.reverseOrders!.total)
      }

      if (sortedKeys.length === 0 && totalavailableQuantity==0) {
        if (!this.no[price]) {
          this.no[price] = {
            orders: { total: 0, users: {} },
            reverseOrders: { total: quantity, users: { [userId]: quantity } },
          };
          return
          //this.no[price].reverseOrders!.users[userId] = quantity;
        } else {
          this.no[price].reverseOrders!.total += quantity;
          if (!this.no[price].reverseOrders!.users[userId]) {
            this.no[price].reverseOrders!.users[userId] = quantity;
          } else {
            this.no[price].reverseOrders!.users[userId] += quantity;
          }
          return
        }
      }

      //CASE 2 : HERE all YES ORDER WAS AVAILABLE , no need to create new ReverseOrders
      let remaining = quantity
      if (quantity <= totalavailableQuantity) {
      
        let batman = 0

        for (const key in sortedKeys) {

          //tracking here each price object
          const totalnormalorders = this.yes[key]?.orders.total
          const totalreverseorders = this.yes[key]?.reverseOrders?.total

          const totalavailablepriceorders = totalnormalorders! + totalreverseorders!

          if (remaining <= totalavailablepriceorders) {
            //here in this case remaining will be filled
            if (totalreverseorders! >= remaining) {
              this.yes[key]!.reverseOrders!.total! -= remaining

              for (const user in this.yes[key]!.reverseOrders!.users) {
                if (remaining <= 0) break;
                const userOrder = this.yes[key]!.reverseOrders!.users[user]!;
                if (userOrder <= remaining) {
                  if (userOrder <= remaining) {
                    remaining -= userOrder;
                    executedQuantity += userOrder;
                    reverse.push({
                      userId: userId,
                      otherUserId: user,
                      quantity: userOrder,
                      price: 10 - price,
                    });
                    delete this.yes[price]!.reverseOrders!.users[user];


                  } else {
                    this.yes[price]!.reverseOrders!.users[user]! -= remaining;
                    executedQuantity += remaining;
                    reverse.push({
                      userId: userId,
                      otherUserId: user,
                      quantity: remaining,
                      price: 10 - price,
                    });
                    remaining = 0;

                  }
                }

              }

              return

            }

            if (totalreverseorders == 0) {
              this.yes[key]!.orders!.total -= remaining
              for (const user in this.yes[price]!.orders!.users) {
                if (remaining <= 0) break;
                const userOrder = this.yes[price]!.orders!.users[user]!;
                if (userOrder <= remaining) {
                  remaining -= userOrder;
                  executedQuantity += userOrder;
                  fills.push({
                    userId: userId,
                    otherUserId: user,
                    quantity: userOrder,
                    price: price,
                  });

                  delete this.yes[price]!.orders.users[user];
                } else {
                  this.yes[price]!.orders.users[user]! -= remaining;
                  executedQuantity += remaining;
                  fills.push({
                    userId: userId,
                    otherUserId: user,
                    quantity: remaining,
                    price: price,
                  });
                  remaining = 0
                }
              }

              return
            }

            if (totalreverseorders! < remaining) {
              const remainingReverse = remaining - totalreverseorders!
              this.yes[key]!.reverseOrders!.total -= 0
              for (const user in this.yes[key]?.reverseOrders?.users) {
                const userOrder = this.yes[key]!.reverseOrders.users[user]!
                remaining -= userOrder;
                executedQuantity += userOrder;
                reverse.push({
                  userId: userId,
                  otherUserId: user,
                  quantity: userOrder,
                  key: 10 - Number(key),
                });
                delete this.yes[key]!.reverseOrders!.users[user];
              }

              this.yes[key]!.orders.total -= remaining
              for (const user in this.yes[key]!.orders!.users) {
                if (remaining <= 0) break;
                const userOrder = this.yes[key]!.orders!.users[user]!;
                if (userOrder <= remaining) {
                  remaining -= userOrder
                  executedQuantity += userOrder
                  fills.push({
                    userId: userId,
                    otherUserId: user,
                    quantity: userOrder,
                    price: price,
                  });
                  delete this.yes[key]!.orders!.users[user]
                } else {
                  this.yes[price]!.orders.users[user]! -= remaining;
                  executedQuantity += remaining;
                  fills.push({
                    userId: userId,
                    otherUserId: user,
                    quantity: remaining,
                    price: price,
                  });
                  remaining = 0
                }
              }


            }

            // for (const user in this.yes[key]!.reverseOrders!.users) {
            //   batman = remaining
            //   if (this.yes[key]!.reverseOrders!.users[user]! <= remaining) {
            //     if (remaining <= 0) break;
            //     const userOrder = this.yes[price].reverseOrders!.users[user]!;

            //   }
            // }

          } else {
            //here the loop will continue for next iteration of different price object after matching all the reverse and normal orders

            if(totalreverseorders == 0){
              for(const user in this.yes[key]?.orders.users){
                const userOrder = this.yes[key].orders.users[user]!
                remaining -= userOrder
                executedQuantity += userOrder
                fills.push({
                  userId: userId,
                  otherUserId: user,
                  quantity: userOrder,
                  price: key,
                });
                delete this.yes[key]!.orders!.users[user]
              }
              this.yes[key]!.orders.total=0
              continue;
            }

            if(totalnormalorders==0){
              for(const user in this.yes[key]!.reverseOrders!.users){
                const userOrder = this.yes[key]!.reverseOrders!.users[user]!
                remaining -= userOrder
                executedQuantity += userOrder
                reverse.push({
                  userId: userId,
                  otherUserId: user,
                  quantity: userOrder,
                  price: 10 - Number(key),
                });
                delete this.yes[key]!.reverseOrders!.users[user]

              }
              this.yes[key]!.reverseOrders!.total=0
              continue;
            }

            for(const user in this.yes[key]!.reverseOrders!.users){
              const userOrder = this.yes[key]!.reverseOrders!.users[user]!
              remaining -= userOrder
              executedQuantity += userOrder
              reverse.push({
                userId: userId,
                otherUserId: user,
                quantity: userOrder,
                price: 10 - Number(key),
              });
              delete this.yes[key]!.reverseOrders!.users[user]

            }
            this.yes[key]!.reverseOrders!.total=0

            for(const user in this.yes[key]?.orders.users){
              const userOrder = this.yes[key].orders.users[user]!
              remaining -= userOrder
              executedQuantity += userOrder
              fills.push({
                userId: userId,
                otherUserId: user,
                quantity: userOrder,
                price: key,
              });
              delete this.yes[key]!.orders!.users[user]
            }
            this.yes[key]!.orders.total=0
            continue;

          }
        }


      }else{
        const noOfReverseOrders= remaining - totalavailableQuantity

        for (const key in sortedKeys){
          for(const user in this.yes[key]!.reverseOrders!.users){
            const userOrder = this.yes[key]!.reverseOrders!.users[user]!
            remaining -= userOrder
            executedQuantity += userOrder
            reverse.push({
              userId: userId,
              otherUserId: user,
              quantity: userOrder,
              price: 10 - Number(key),
            });
            delete this.yes[key]!.reverseOrders!.users[user]

          }
          this.yes[key]!.reverseOrders!.total=0

          for(const user in this.yes[key]?.orders.users){
            const userOrder = this.yes[key].orders.users[user]!
            remaining -= userOrder
            executedQuantity += userOrder
            fills.push({
              userId: userId,
              otherUserId: user,
              quantity: userOrder,
              price: key,
            });
            delete this.yes[key]!.orders!.users[user]
          }
          this.yes[key]!.orders.total=0
          continue;

        }

        if (!this.no[price]) {
          this.no[price] = {
            orders: { total: 0, users: {} },
            reverseOrders: { total:noOfReverseOrders, users: { [userId]: noOfReverseOrders } },
          };
          return
          //this.no[price].reverseOrders!.users[userId] = quantity;
        } else {
          this.no[price].reverseOrders!.total += noOfReverseOrders;
          if (!this.no[price].reverseOrders!.users[userId]) {
            this.no[price].reverseOrders!.users[userId] = noOfReverseOrders;
          } else {
            this.no[price].reverseOrders!.users[userId] += noOfReverseOrders;
          }
          return
        }


      }


      // if (stockType == "yes" && this.yes !== null) {
      //   if (!this.yes[price]) {
      //     if (!this.no[price]) {
      //       this.no[price] = {
      //         orders: { total: 0, users: {} },
      //         reverseOrders: { total: quantity, users: {} },
      //       };

      //       this.no[price].reverseOrders!.users[userId] = quantity;
      //     } else {
      //       this.no[price].reverseOrders!.total += quantity;
      //       if (!this.no[price].reverseOrders!.users[userId]) {
      //         this.no[price].reverseOrders!.users[userId] = quantity;
      //       } else {
      //         this.no[price].reverseOrders!.users[userId] += quantity;
      //       }
      //     }
      //   } else {
      //     const availableQuantity = this.yes[price].orders.total;
      //     const reverseOrdersQuantity = this.yes[price].reverseOrders!.total;
      //     const totalAvailableYesOrders =
      //       availableQuantity + reverseOrdersQuantity;

      //     if (quantity <= totalAvailableYesOrders) {
      //       //In this case we don't need to create any new reverseorders on the opposite side
      //       if (this.yes[price].reverseOrders!.total >= quantity) {
      //         this.yes[price].reverseOrders!.total -= quantity;
      //         let remaining = quantity;
      //         for (const user in this.yes[price].reverseOrders!.users) {
      //           if (remaining <= 0) break;
      //           const userOrder = this.yes[price].reverseOrders!.users[user]!;

      //           if (userOrder <= remaining) {
      //             remaining -= userOrder;
      //             executedQuantity += userOrder;
      //             reverse.push({
      //               userId: userId,
      //               otherUserId: user,
      //               quantity: userOrder,
      //               price: 10 - price,
      //             });
      //             delete this.yes[price].reverseOrders!.users[user];
      //           } else {
      //             this.yes[price].reverseOrders!.users[user]! -= remaining;
      //             executedQuantity += remaining;
      //             reverse.push({
      //               userId: userId,
      //               otherUserId: user,
      //               quantity: remaining,
      //               price: 10 - price,
      //             });
      //           }
      //         }
      //       } else {
      //         if (reverseOrdersQuantity == 0) {
      //           let remaining = quantity;
      //           this.yes[price].orders.total -= quantity;
      //           for (const user in this.yes[price].orders!.users) {
      //             if (remaining <= 0) break;
      //             const userOrder = this.yes[price].orders!.users[user]!;
      //             if (userOrder <= remaining) {
      //               remaining -= userOrder;
      //               executedQuantity += userOrder;
      //               fills.push({
      //                 userId: userId,
      //                 otherUserId: user,
      //                 quantity: userOrder,
      //                 price: price,
      //               });

      //               delete this.yes[price].orders.users[user];
      //             } else {
      //               this.yes[price].orders.users[user]! -= remaining;
      //               executedQuantity += remaining;
      //               fills.push({
      //                 userId: userId,
      //                 otherUserId: user,
      //                 quantity: remaining,
      //                 price: price,
      //               });
      //             }
      //           }
      //         } else {
      //           let remaining = quantity;
      //           let reverseOrders = this.yes[price].reverseOrders!.total;
      //           for (const user in this.yes[price].reverseOrders!.users) {
      //             reverse.push({
      //               userId: userId,
      //               otherUserId: user,
      //               quantity: remaining,
      //               price: 10 - price,
      //             });
      //             delete this.yes[price].reverseOrders!.users[user];
      //           }
      //           remaining -= reverseOrders;
      //           this.yes[price].reverseOrders!.total = 0;

      //           this.yes[price].orders!.total -= remaining;

      //           for (const user in this.yes[price].orders!.users) {
      //             if (remaining <= 0) break;
      //             const userOrder = this.yes[price].orders!.users[user]!;
      //             if (userOrder <= remaining) {
      //               remaining -= userOrder;

      //               executedQuantity += userOrder;
      //               fills.push({
      //                 userId: userId,
      //                 otherUserId: user,
      //                 quantity: userOrder,
      //                 price: price,
      //               });

      //               delete this.yes[price].orders.users[user];
      //             } else {
      //               this.yes[price].orders.users[user]! -= remaining;
      //               executedQuantity += remaining;
      //               fills.push({
      //                 userId: userId,
      //                 otherUserId: user,
      //                 quantity: remaining,
      //                 price: price,
      //               });
      //             }
      //           }
      //         }
      //       }
      //     } else {
      //       // here we need to implement new reverseorders on the opposite or no side
      //       if (reverseOrdersQuantity == 0) {
      //         let remaining = quantity - availableQuantity;
      //         this.yes[price].orders.total = 0;
      //         for (const user in this.yes[price].orders.users) {
      //           const userOrder = this.yes[price].orders.users[user]!;

      //           executedQuantity += userOrder;
      //           fills.push({
      //             userId: userId,
      //             otherUserId: user,
      //             quantity: userOrder,
      //             price: price,
      //           });

      //           delete this.yes[price].orders.users[user];
      //         }
      //         delete this.yes[price];
      //         if (!this.no[price]) {
      //           this.no[price] = {
      //             orders: { total: 0, users: {} },
      //             reverseOrders: { total: 0, users: {} },
      //           };

      //           this.no[price].reverseOrders!.total = remaining;
      //           this.no[price].reverseOrders!.users[userId] = remaining;
      //         } else {
      //           this.no[price].reverseOrders!.total += remaining;
      //           if (!this.no[price].reverseOrders!.users[userId]) {
      //             this.no[price].reverseOrders!.users[userId] = remaining;
      //           } else {
      //             this.no[price].reverseOrders!.users[userId] += remaining;
      //           }
      //         }
      //       } else if (availableQuantity == 0) {
      //         let remaining = quantity - reverseOrdersQuantity;
      //         this.yes[price].reverseOrders!.total = 0;
      //         for (const user in this.yes[price].reverseOrders!.users) {
      //           const userOrder = this.yes[price].reverseOrders!.users[user]!;

      //           executedQuantity += userOrder;
      //           reverse.push({
      //             userId: userId,
      //             otherUserId: user,
      //             quantity: userOrder,
      //             price: price,
      //           });

      //           delete this.yes[price].orders.users[user];
      //         }

      //         delete this.yes[price];
      //         if (!this.no[price]) {
      //           this.no[price] = {
      //             orders: { total: 0, users: {} },
      //             reverseOrders: { total: 0, users: {} },
      //           };

      //           this.no[price].reverseOrders!.total = remaining;
      //           this.no[price].reverseOrders!.users[userId] = remaining;
      //         } else {
      //           this.no[price].reverseOrders!.total += remaining;
      //           if (!this.no[price].reverseOrders!.users[userId]) {
      //             this.no[price].reverseOrders!.users[userId] = remaining;
      //           } else {
      //             this.no[price].reverseOrders!.users[userId] += remaining;
      //           }
      //         }
      //       } else {
      //         let remaining =
      //           quantity - (availableQuantity + reverseOrdersQuantity);
      //         this.yes[price].reverseOrders!.total = 0;
      //         for (const user in this.yes[price].reverseOrders!.users) {
      //           const userOrder = this.yes[price].reverseOrders!.users[user]!;

      //           executedQuantity += userOrder;
      //           reverse.push({
      //             userId: userId,
      //             otherUserId: user,
      //             quantity: userOrder,
      //             price: price,
      //           });

      //           delete this.yes[price].orders.users[user];
      //         }
      //         this.yes[price].orders!.total = 0;
      //         for (const user in this.yes[price].orders.users) {
      //           const userOrder = this.yes[price].orders.users[user]!;

      //           executedQuantity += userOrder;
      //           fills.push({
      //             userId: userId,
      //             otherUserId: user,
      //             quantity: userOrder,
      //             price: price,
      //           });

      //           delete this.yes[price].orders.users[user];
      //         }
      //         delete this.yes[price];

      //         if (!this.no[price]) {
      //           this.no[price] = {
      //             orders: { total: 0, users: {} },
      //             reverseOrders: { total: 0, users: {} },
      //           };

      //           this.no[price].reverseOrders!.total = remaining;
      //           this.no[price].reverseOrders!.users[userId] = remaining;
      //         } else {
      //           this.no[price].reverseOrders!.total += remaining;
      //           if (!this.no[price].reverseOrders!.users[userId]) {
      //             this.no[price].reverseOrders!.users[userId] = remaining;
      //           } else {
      //             this.no[price].reverseOrders!.users[userId] += remaining;
      //           }
      //         }
      //       }
      //     }
      //   }
      // }
    }else{
      
    }
  }

    getDepth(stockSymbol: string) {
      return {
        yesOrders: this.yes,
        noOrders: this.no,
      };
    }
  }

// Additional methods to manipulate and query the orderbook can be added here
