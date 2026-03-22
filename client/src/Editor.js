import React, { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import axios from "axios";
import "./App.css"; 

export default function Editor({ fileId, username }) {
  const ref = useRef(null);
  const editorRef = useRef(null);
  const [status, setStatus] = useState("Đang kết nối...");
  const [usersOnline, setUsersOnline] = useState([]);

  // Hàm lưu file
  const save = async () => {
    if (!editorRef.current) return;
    setStatus("Đang lưu...");
    try {
      await axios.post("http://localhost:5000/save", { 
        fileId, 
        content: editorRef.current.getValue() 
      });
      setStatus("Đã lưu ✅");
      setTimeout(() => setStatus("Đã kết nối"), 1500);
    } catch (err) { 
      setStatus("Lỗi lưu file ❌"); 
    }
  };

  useEffect(() => {
    if (!ref.current) return;

    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider("ws://localhost:5000", fileId, ydoc);
    const yText = ydoc.getText("monaco");

    provider.on("status", (e) => {
      setStatus(e.status === "connected" ? "Đã kết nối" : "Đang kết nối...");
    });

    const editor = monaco.editor.create(ref.current, {
      value: "",
      language: "javascript",
      theme: "vs-dark",
      automaticLayout: true,
      fontSize: 15, // Tăng nhẹ size chữ code
      fontFamily: "var(--font-monaco)",
      minimap: { enabled: false },
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      lineNumbersMinChars: 3,
      padding: { top: 15 }
    });
    editorRef.current = editor;

    const binding = new MonacoBinding(yText, editor.getModel(), new Set([editor]), provider.awareness);

    const userColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    provider.awareness.setLocalStateField("user", { name: username, color: userColor });

    provider.awareness.on("change", () => {
      const states = Array.from(provider.awareness.getStates().values());
      const names = states.filter(s => s.user).map(s => s.user.name);
      setUsersOnline([...new Set(names)]); 
    });

    axios.get(`http://localhost:5000/load/${fileId}`).then(res => {
      if (yText.toString().length === 0 && res.data.content) {
        yText.insert(0, res.data.content);
      }
    });

    return () => {
      binding.destroy();
      editor.dispose();
      provider.destroy();
      ydoc.destroy();
    };
  }, [fileId, username]);

  return (
    <div className="editor-wrapper">
      {/* Thanh Status Bar được làm mới */}
      <div className="editor-status-bar" style={statusBarEnhanced}>
        <div className="status-info" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className={`status-dot ${status.includes("kết nối") ? "online" : ""}`} style={dotStyle}></span>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#ccc" }}>{status}</span>
          <span className="divider" style={{ color: "#444", margin: "0 5px" }}>|</span>
          <span style={{ fontSize: "14px", color: "#999" }}>
            👥 <strong>{usersOnline.length}</strong> thành viên đang gõ
          </span>
        </div>
        
        <div className="user-list-tags" style={{ display: "flex", gap: "8px" }}>
          {usersOnline.map((name, i) => (
            <span key={i} className="user-tag" style={userTagEnhanced}>
              {name}
            </span>
          ))}
        </div>
      </div>

      <div ref={ref} className="monaco-container" />

      {/* Hiệu ứng con trỏ đồng bộ với tên người dùng */}
      <style>{`
        .yRemoteSelection { background-color: rgba(0, 255, 255, 0.15); }
        .yRemoteSelectionHead {
          position: absolute;
          border-left: 2px solid var(--primary-cyan);
          border-color: inherit;
          height: 100%;
        }
        .yRemoteSelectionHead::after {
          position: absolute;
          content: attr(data-user-name);
          top: -1.5em;
          left: -2px;
          padding: 2px 8px;
          font-size: 11px;
          color: #fff;
          font-weight: 600;
          background: inherit;
          border-radius: 4px;
          pointer-events: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}

// Các style bổ sung cho "xịn" hơn
const statusBarEnhanced = {
  padding: "12px 20px",
  background: "#1a1a1a",
  borderBottom: "1px solid #333",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const dotStyle = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "var(--primary-cyan)",
  boxShadow: "0 0 8px var(--primary-cyan)"
};

const userTagEnhanced = {
  background: "rgba(0, 255, 255, 0.1)",
  color: "var(--primary-cyan)",
  padding: "4px 12px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "bold",
  border: "1px solid rgba(0, 255, 255, 0.2)"
};