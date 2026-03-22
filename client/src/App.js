// src/App.jsx
import React, { useState, useEffect, useRef } from "react"; // Thêm useRef
import "./App.css"; 
import FileExplorer from "./FileExplorer";
import Editor from "./Editor";
import Chat from "./Chat";
import Header from "./Header";

export default function App() {
  const [fileId, setFileId] = useState(null);
  const [username] = useState("Anya_" + Math.floor(Math.random() * 100));
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Dùng ref để có thể gọi hàm save từ bên trong Editor component
  const editorRef = useRef(null);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // HÀM SAVE: Gọi đến hàm save của Editor
  const handleSave = () => {
    if (editorRef.current && editorRef.current.save) {
      editorRef.current.save();
    } else {
      console.log("Đang lưu mặc định (fileId):", fileId);
      // Cậu có thể thêm axios.post lưu file ở đây nếu muốn
    }
  };

  // HÀM SHARE: Hiện thông báo copy link
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Đã sao chép liên kết mời đồng đội! 🔗");
  };

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove("light-mode");
    } else {
      document.body.classList.add("light-mode");
    }
  }, [isDarkMode]);

  if (!fileId) return <FileExplorer setFileId={setFileId} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* TRUYỀN CÁC HÀM SAVE VÀ SHARE VÀO ĐÂY */}
      <Header 
        fileId={fileId} 
        toggleTheme={toggleTheme} 
        isDarkMode={isDarkMode}
        save={handleSave} 
        share={handleShare}
      />

      <div style={mainLayout}>
        <div style={{ display: "flex", flex: 3, padding: "10px 5px 10px 10px" }}>
          <div className="panel-container" style={{ flex: 1 }}>
            {/* Thêm ref để Header có thể kích hoạt hàm save bên trong Editor */}
            <Editor 
               ref={editorRef} 
               fileId={fileId} 
               username={username} 
               isDarkMode={isDarkMode} 
            />
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, padding: "10px 10px 10px 5px" }}>
          <div className="panel-container" style={{ flex: 1 }}>
            <Chat fileId={fileId} username={username} />
          </div>
        </div>
      </div>
    </div>
  );
}

const mainLayout = {
  flex: 1,
  display: "flex",
  background: "var(--bg-dark)",
  overflow: "hidden" 
};