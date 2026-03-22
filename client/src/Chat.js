import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

export default function Chat({ fileId, token, username }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const socket = io("http://localhost:5000", { 
      auth: { token: token || "dummy-token" } 
    });
    socketRef.current = socket;
    socket.emit("join", fileId);
    socket.on("chat", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chat");
      socket.disconnect();
    };
  }, [fileId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const send = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit("chat", { 
      room: fileId, 
      user: username || "Dev_User", 
      message: input 
    });
    setInput("");
  };

  return (
    <div className="chat-container">

      <div className="chat-header" style={{ padding: "20px", borderBottom: "2px solid #333" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}></span>
          <span style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "1px", color: "#fff" }}>
            THẢO LUẬN NHÓM
          </span>
        </div>
        <span className="online-indicator" style={{ fontSize: "12px", fontWeight: "bold" }}>
          ● TRỰC TUYẾN
        </span>
      </div>

      <div className="chat-messages" style={{ padding: "20px" }}>
        {messages.map((m, i) => {
          const isMe = m.user === username;
          return (
            <div key={i} className={`chat-bubble-wrapper ${isMe ? "me" : "others"}`}>

              <div className="chat-user-name" style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>
                {m.user}
              </div>

              <div className="chat-bubble" style={{ fontSize: "15px", padding: "12px 18px" }}>
                {m.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area" style={{ padding: "20px" }}>
        <input
          className="chat-input-field"
          style={{ height: "45px", fontSize: "15px" }} 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Viết gì đó với đồng đội..."
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button 
          className="btn-modern btn-send" 
          style={{ height: "45px", padding: "0 25px", fontSize: "15px" }}
          onClick={send}
        >
          Gửi
        </button>
      </div>
    </div>
  );
}