import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, set, push, serverTimestamp, off, onDisconnect, remove } from 'firebase/database';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth, rtdb, db } from '../config/firebase';
import Layout from '../components/Layout';
import Editor from '@monaco-editor/react';
import { FiCode, FiFile, FiPlus, FiArrowLeft, FiMessageSquare, FiTrash2, FiUsers, FiSend } from 'react-icons/fi';
import '../styles/team-code.css';

export default function Team() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const isIncomingUpdate = useRef(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadTeamFiles();
        setupPresence(currentUser);
        listenToOnlineUsers();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadTeamFiles = async () => {
    const q = query(collection(db, 'team_projects'));
    const querySnapshot = await getDocs(q);
    setFiles(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    try {
      const docRef = await addDoc(collection(db, 'team_projects'), {
        fileName: newFileName.endsWith('.js') ? newFileName : `${newFileName}.js`,
        createdBy: user.email,
        createdAt: new Date()
      });
      await set(ref(rtdb, `team_code/${docRef.id}`), `// Project: ${newFileName}\n// Chào mừng team!`);
      setIsCreating(false);
      setNewFileName('');
      loadTeamFiles();
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleSelectFile = (file) => {
    setSelectedFile(file);
    const codeRef = ref(rtdb, `team_code/${file.id}`);
    onValue(codeRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null && !isIncomingUpdate.current) setCode(data);
      isIncomingUpdate.current = false;
    });
    onValue(ref(rtdb, `team_chats/${file.id}`), (s) => {
      setMessages(s.exists() ? Object.values(s.val()) : []);
    });
  };

  const handleCodeChange = (value) => {
    isIncomingUpdate.current = true;
    setCode(value);
    set(ref(rtdb, `team_code/${selectedFile.id}`), value);
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !selectedFile) return;
    const chatRef = ref(rtdb, `team_chats/${selectedFile.id}`);
    push(chatRef, {
      user: user.displayName || user.email,
      text: inputMsg,
      timestamp: serverTimestamp()
    });
    setInputMsg('');
  };

  const handleDeleteFile = async (e, fileId) => {
    e.stopPropagation();
    if (!window.confirm("Xóa file này khỏi dự án chung?")) return;
    await deleteDoc(doc(db, 'team_projects', fileId));
    await remove(ref(rtdb, `team_code/${fileId}`));
    loadTeamFiles();
  };

  const setupPresence = (u) => {
    const pRef = ref(rtdb, `presence/${u.uid}`);
    set(pRef, { name: u.displayName || u.email, photo: u.photoURL });
    onDisconnect(pRef).remove();
  };

  const listenToOnlineUsers = () => onValue(ref(rtdb, 'presence'), (s) => setOnlineUsers(s.val() || {}));

  if (!selectedFile) {
    return (
      <Layout>
        <div className="file-selector-container">
          <div className="selector-header">
            <h2><FiUsers /> Team Coding Hub</h2>
            <p>Mọi người trong team đều có thể thấy và cùng sửa những file này</p>
          </div>
          <div className="file-grid">
            {files.map(f => (
              <div key={f.id} className="file-card" onClick={() => handleSelectFile(f)}>
                <div className="file-icon"><FiCode size={30} /></div>
                <div className="file-info">
                  <strong>{f.fileName}</strong>
                  <span>Bởi: {f.createdBy?.split('@')[0]}</span>
                </div>
                <button className="btn-delete-file" onClick={(e) => handleDeleteFile(e, f.id)}>
                  <FiTrash2 />
                </button>
              </div>
            ))}
            <div className="file-card add-new" onClick={() => setIsCreating(true)}>
              <FiPlus size={40} />
              <p>Tạo file code mới</p>
            </div>
          </div>
          {isCreating && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Tạo File Code Team</h3>
                <form onSubmit={handleCreateFile}>
                  <input autoFocus placeholder="Tên file..." value={newFileName} onChange={(e) => setNewFileName(e.target.value)} />
                  <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => setIsCreating(false)}>Hủy</button>
                    <button type="submit" className="btn-confirm">Tạo</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="team-workspace">
        <div className="code-section">
          <div className="section-header">
            <div className="header-left">
              <button className="btn-icon" onClick={() => setSelectedFile(null)}><FiArrowLeft /></button>
              <span>{selectedFile.fileName}</span>
            </div>
            <div className="online-avatars">
               {Object.values(onlineUsers).map((u, i) => (
                 <img key={i} src={u.photo || `https://ui-avatars.com/api/?name=${u.name}`} className="user-avatar-mini" title={u.name} />
               ))}
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor 
              height="100%" 
              theme="vs-dark" 
              defaultLanguage="javascript" 
              value={code} 
              onChange={handleCodeChange} 
              options={{ automaticLayout: true, minimap: { enabled: false } }}
            />
          </div>
        </div>

        <div className="chat-section">
          <div className="section-header">
            <FiMessageSquare /> <span>Team Chat</span>
          </div>
          
          <div className="chat-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.user === (user?.displayName || user?.email) ? 'mine' : ''}`}>
                <small>{m.user?.split('@')[0]}</small>
                <p>{m.text}</p>
              </div>
            ))}
          </div>

          <form className="chat-input" onSubmit={sendChat}>
            <input 
              value={inputMsg} 
              onChange={(e) => setInputMsg(e.target.value)} 
              placeholder="Nhắn gì đó..." 
            />
            <button type="submit"><FiSend /></button>
          </form>
        </div>
      </div>
    </Layout>
  );
}