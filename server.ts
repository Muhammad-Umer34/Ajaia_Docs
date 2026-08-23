import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ── WebSocket Room Management ──────────────────────────────────────────
// Each document ID maps to a Set of connected WebSocket clients
const rooms = new Map<string, Set<WebSocket>>();

function joinRoom(documentId: string, ws: WebSocket) {
  if (!rooms.has(documentId)) {
    rooms.set(documentId, new Set());
  }
  rooms.get(documentId)!.add(ws);
  console.log(`[WS] Client joined room "${documentId}" (${rooms.get(documentId)!.size} clients)`);
}

function leaveRoom(documentId: string, ws: WebSocket) {
  const room = rooms.get(documentId);
  if (room) {
    room.delete(ws);
    console.log(`[WS] Client left room "${documentId}" (${room.size} clients)`);
    if (room.size === 0) {
      rooms.delete(documentId);
    }
  }
}

function broadcastToRoom(documentId: string, message: string, sender: WebSocket) {
  const room = rooms.get(documentId);
  if (!room) return;
  for (const client of room) {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// ── Start Server ───────────────────────────────────────────────────────
app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Attach WebSocket server to the same HTTP server
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    let currentRoom: string | null = null;

    ws.on("message", (raw: Buffer | string) => {
      try {
        const data = JSON.parse(raw.toString());

        switch (data.type) {
          case "join": {
            // Leave previous room if switching documents
            if (currentRoom) {
              leaveRoom(currentRoom, ws);
            }
            currentRoom = data.documentId;
            joinRoom(data.documentId, ws);

            // Send acknowledgment
            ws.send(JSON.stringify({ type: "joined", documentId: data.documentId }));
            break;
          }

          case "leave": {
            if (currentRoom) {
              leaveRoom(currentRoom, ws);
              currentRoom = null;
            }
            break;
          }

          case "doc:update": {
            // Broadcast content update to all other clients in the same room
            if (currentRoom) {
              broadcastToRoom(
                currentRoom,
                JSON.stringify({
                  type: "doc:update",
                  content: data.content,
                  senderId: data.senderId,
                  updatedAt: data.updatedAt,
                }),
                ws
              );
            }
            break;
          }

          case "doc:title": {
            // Broadcast title update to all other clients in the same room
            if (currentRoom) {
              broadcastToRoom(
                currentRoom,
                JSON.stringify({
                  type: "doc:title",
                  title: data.title,
                  senderId: data.senderId,
                }),
                ws
              );
            }
            break;
          }

          case "doc:saved": {
            // Notify other clients that the document was saved (with new updatedAt)
            if (currentRoom) {
              broadcastToRoom(
                currentRoom,
                JSON.stringify({
                  type: "doc:saved",
                  updatedAt: data.updatedAt,
                }),
                ws
              );
            }
            break;
          }

          case "doc:permissions": {
            // Broadcast permission changes so affected users' UIs lock/unlock immediately
            if (currentRoom) {
              broadcastToRoom(
                currentRoom,
                JSON.stringify({
                  type: "doc:permissions",
                  documentId: currentRoom,
                }),
                ws
              );
            }
            break;
          }

          case "ping": {
            ws.send(JSON.stringify({ type: "pong" }));
            break;
          }
        }
      } catch (err) {
        // Ignore malformed messages
      }
    });

    ws.on("close", () => {
      if (currentRoom) {
        leaveRoom(currentRoom, ws);
      }
    });

    ws.on("error", (err) => {
      // Ignore abnormal socket closure errors on tab refresh
      if (currentRoom) {
        leaveRoom(currentRoom, ws);
      }
    });
  });

  wss.on("error", () => {
    // Ignore WebSocket server transport errors
  });

  server.listen(port, () => {
    console.log(`\n  ▲ Ajaia Docs Server`);
    console.log(`  - Local:     http://${hostname}:${port}`);
    console.log(`  - WebSocket: ws://${hostname}:${port}`);
    console.log(`  - Mode:      ${dev ? "development" : "production"}\n`);
  });
});
