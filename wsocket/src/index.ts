import { WebSocketServer } from "ws";
import { UserManager } from "./UserManager";

const wss = new WebSocketServer({ port: 3001 })

wss.on("connection", (ws) => {
  // Create a new User and connect it to a ws
  UserManager.getInstance().addUser(ws)
})
