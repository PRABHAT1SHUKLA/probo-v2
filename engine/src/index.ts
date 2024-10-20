import { Pub, RedisManager } from "./RedisManager";

async function main() {
  // while(1) {
  //   const id = await RedisManager.rpop("engine")
  //   if(id) {
  //     const idLength = id.length
  //     await Pub.publish("length", idLength.toString())
  //   }
  // }

  while(1){
    const response = await RedisManager.rpop("messages" as string)
          if (!response) {
  
          }  else {
              engine.process(JSON.parse(response));
          } 
  
  }
}



main()