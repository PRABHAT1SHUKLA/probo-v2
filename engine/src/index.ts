import { Pub, RedisManager } from "./RedisManager";

async function main() {
  while(1) {
    const id = await RedisManager.rpop("engine")
    if(id) {
      const idLength = id.length
      await Pub.publish("length", idLength.toString())
    }
  }
}

main()