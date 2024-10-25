export const CREATE_USER = "CREATE_USER";
export const ONRAMP = "ONRAMP";
export const SELL_ORDER = "SELL_ORDER";
export const USER_BALANCE = "USER_BALANCE";
export const BUY_ORDER = "BUY_ORDER";
export const MINT = "MINT";
export const ORDER_BOOK = "ORDER_BOOK";
export const STOCK_SYMBOL = "STOCK_SYMBOL";
export const CREATE_MARKET = "CREATE_MARKET";

export type MessageFromApi =
  | {
      type: typeof CREATE_USER;
      data: {
        userId: string;
      };
    }
  | {
      type: typeof ONRAMP;
      data: {
        userId: string;
        amount: number;
      };
    }
  | {
      type: typeof SELL_ORDER;
      data: {
        userId: string;
        price: number;
        quantity: number;
        stockSymbol: string;
        stockType: "yes" | "no";
      };
    }
  | {
      type: typeof BUY_ORDER;
      data: {
        userId: string;
        stockSymbol: string;
        quantity: string;
        price: string;
        stockType: "yes" | "No";
      };
    }
  | {
      type: typeof USER_BALANCE;
      data: {
        userId: string;
      };
    }
  | {
      type: typeof ORDER_BOOK;
      data: {
        market: string;
      };
    }
  | {
      type: typeof STOCK_SYMBOL;
      data: {
        stockSymbol: string;
      };
    }
  | {
      type: typeof CREATE_MARKET
      data: {
        stockSymbol: string;
      }
    }
  | {
      type: typeof MINT;
      data: {
        userId: string;
        stockSymbol: string;
        quantity: string;
        price: string;
      };
    };
