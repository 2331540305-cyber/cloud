import { useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ref, onValue, set, off } from 'firebase/database';
import { rtdb } from '../config/firebase';
import { FiUsers, FiSave } from 'react-icons/fi';
import '../styles/editor.css';

export default function CollaborativeEditor({ docId, userName }) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Đang kết nối...');
  const quillRef = useRef(null);
  const isIncomingUpdate = useRef(false); 

  useEffect(() => {
    if (!docId) return;

    const docRef = ref(rtdb, `documents/${docId}`);

    const unsubscribe = onValue(docRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        isIncomingUpdate.current = true; 
        setContent(data);
      }
      setStatus('Sẵn sàng soạn thảo');
    });

    return () => off(docRef);
  }, [docId]);

  const handleEditorChange = (value, delta, source) => {
    if (source === 'user') {
      setContent(value);
      const docRef = ref(rtdb, `documents/${docId}`);
      set(docRef, value).catch(err => setStatus('Lỗi đồng bộ!'));
    }
  };

  return (
    <div className="realtime-editor-box">
      <div className="editor-toolbar-top">
        <div className="status-badge">
          <FiUsers className="icon-pulse" />
          <span>{status}</span>
        </div>
        <div className="doc-info">
          ID Tài liệu: <strong>{docId}</strong>
        </div>
      </div>
      
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={content}
        onChange={handleEditorChange}
        modules={CollaborativeEditor.modules}
        placeholder="Nhập nội dung tài liệu chung tại đây..."
      />
      
      <div className="editor-footer">
        <FiSave /> Tự động lưu vào Cloud khi bạn gõ
      </div>
    </div>
  );
}

CollaborativeEditor.modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'color', 'background'],
    ['clean']
  ],
};