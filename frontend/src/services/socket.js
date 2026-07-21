import { io } from "socket.io-client";

/* =========================
   SOCKET CONFIGURATION
========================= */

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

/* =========================
   SOCKET CONNECTION
========================= */

const socket = io(
  SOCKET_URL,
  {
    transports: [
      "websocket",
      "polling"
    ],

    reconnection: true,

    reconnectionAttempts:
      Infinity,

    reconnectionDelay:
      1000,

    reconnectionDelayMax:
      5000,

    timeout:
      20000,

    autoConnect:
      true
  }
);

/* =========================
   SOCKET EVENTS
========================= */

socket.on(
  "connect",
  () => {

    console.log(
      "✅ Connected to orchestration server"
    );
  }
);

socket.on(
  "disconnect",
  (reason) => {

    console.log(
      `❌ Disconnected from orchestration server: ${reason}`
    );
  }
);

socket.io.on(
  "reconnect_attempt",
  () => {

    console.log(
      "♻️ Reconnecting to orchestration server..."
    );
  }
);

socket.io.on(
  "reconnect",
  () => {

    console.log(
      "✅ Reconnected successfully"
    );
  }
);

socket.on(
  "connect_error",
  (err) => {

    console.error(
      "❌ Socket connection error:",
      err.message
    );
  }
);

export default socket;