import Redis from "ioredis";
import { Engine } from "./trades/engine";

async function main() {
  const redisClient = new Redis("rediss://default:AWrbAAIjcDE4YTY5OTQ4ZTc0MzA0ZWIzYTQ0OTQyNzI3MjY2ZTU0NHAxMA@accepted-monster-27355.upstash.io:6379")
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