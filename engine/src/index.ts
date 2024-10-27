import Redis from "ioredis";
import { Engine } from "./trades/engine";

async function main() {
  // while(1) {
  //   const id = await RedisManager.rpop("engine")
  //   if(id) {
  //     const idLength = id.length
  //     await Pub.publish("length", idLength.toString())
  //   }
  // }

  const redisClient = new Redis()
  const engine = new Engine()

  while(1){
    const response = await redisClient.rpop("engineQueue")
    if(response) {
      engine.process(JSON.parse(response))
    }
  }
}

main()