import Redis from "ioredis";
import { Engine } from "./trades/engine";

async function main() {
  const redisClient = new Redis()
  const engine = new Engine()

  while(1){
    const response = await redisClient.brpop("engineQueue", 0)
    if(response) {
      const [key, item] = response
      engine.process(JSON.parse(item))
    }
  }
}

main()