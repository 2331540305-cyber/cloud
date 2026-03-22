import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

export default function FileExplorer({ setFileId }) {
  const [files, setFiles] = useState([]);
  const [newFile, setNewFile] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/files")
      .then(res => setFiles(res.data.files))
      .catch(() => console.error("Lỗi tải danh sách file"));
  }, []);

  const handleCreate = () => {
    if (newFile.trim()) {
      setFileId(newFile.trim());
    }
  };

  return (
    <div className="explorer-container">
      <div className="explorer-card">
        <header className="explorer-header">
          <h2> Co-working Dashboard</h2>
          <p>Chọn một không gian làm việc hoặc tạo mới để bắt đầu công việc nhé.</p>
        </header>


        <div className="explorer-action-bar">
          <input 
            className="modern-input"
            value={newFile} 
            onChange={e => setNewFile(e.target.value)} 
            placeholder="Nhập tên dự án/file mới..."
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button className="btn-modern btn-primary" onClick={handleCreate}>
            + Tạo không gian
          </button>
        </div>

        <div className="file-grid">
          {files.length > 0 ? (
            files.map(f => (
              <div key={f} className="file-item" onClick={() => setFileId(f)}>
                <div className="file-icon"></div>
                <div className="file-info">
                  <span className="file-name">{f}</span>
                  <span className="file-status">Shared Cloud</span>
                </div>
                <div className="file-arrow">→</div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              Chưa có file nào trên Cloud. Hãy tạo file đầu tiên cho nhóm của bạn!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}