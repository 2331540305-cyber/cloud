const express = require("express");
const http = require("http");
const cors = require("cors");
const { WebSocketServer } = require("ws");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const { LeveldbPersistence } = require("y-leveldb");
const { setupWSConnection } = require("y-websocket/bin/utils");

const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect("mongodb://127.0.0.1:27017/realtime-editor")
  .then(() => console.log(" MongoDB Connected"))
  .catch(err => console.error(" MongoDB Error:", err));

const Snapshot = mongoose.model("Snapshot", new mongoose.Schema({
  fileId: String, content: String, timestamp: { type: Date, default: Date.now }
}));


const persistence = new LeveldbPersistence("./storage");



app.get("/files", async (req, res) => {
  try {
    const files = await Snapshot.distinct("fileId").catch(() => []);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: "Lỗi lấy danh sách file" });
  }
});


app.get("/load/:fileId", async (req, res) => {
  try {
    const ydoc = await persistence.getYDoc(req.params.fileId);
    res.json({ content: ydoc.getText("monaco").toString() });
  } catch (error) {
    res.status(500).json({ error: "Lỗi tải file" });
  }
});


app.post("/save", async (req, res) => {
  try {
    await Snapshot.create(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi lưu file" });
  }
});


const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const io = socketIO(server, { cors: { origin: "*" } });

wss.on("connection", (conn, req) => setupWSConnection(conn, req, { persistence }));

io.on("connection", (socket) => {
  socket.on("join", (room) => socket.join(room));
  socket.on("chat", (data) => io.to(data.room).emit("chat", data));
});

server.on("upgrade", (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);


  if (pathname.startsWith('/socket.io')) {
    return; 
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

server.listen(5000, () => console.log("🚀 Server running at http://localhost:5000"));