// import { WASocket } from "@whiskeysockets/baileys";

import EventEmitter from "events";

// let socket: WASocket;

// export function getSocket(): WASocket {
//   return socket;
// }

// export function setSocket(_socket: WASocket) {
//   console.log(">>> Updating Socket Variable....");
  
//   socket = _socket;
// }

export const socketEventEmitter: EventEmitter = new EventEmitter();