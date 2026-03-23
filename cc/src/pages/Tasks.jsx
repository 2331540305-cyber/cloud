import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import Layout from '../components/Layout';
import CollaborativeEditor from '../components/CollaborativeEditor'; 
import { FiEdit3, FiCheckCircle, FiInfo } from 'react-icons/fi';
import '../styles/tasks.css';

export default function Tasks() {
  const [user, setUser] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState('general-notes'); 
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate('/login');
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <Layout>
      <div className="tasks-page-container">
        <div className="page-header">
          <div className="header-title">
            <FiCheckCircle size={28} color="#6366f1" />
            <h2>Task Collaboration Workspace</h2>
          </div>
          <p>Chọn một task bên dưới để cùng đồng đội soạn thảo nội dung thời gian thực.</p>
        </div>

        <div className="tasks-content-grid">
          <aside className="tasks-sidebar">
            <h3>Danh sách công việc</h3>
            <div 
              className={`task-item ${selectedTaskId === 'general-notes' ? 'active' : ''}`}
              onClick={() => setSelectedTaskId('general-notes')}
            >
              <FiEdit3 /> <span> Ghi chú chung dự án</span>
            </div>
            <div 
              className={`task-item ${selectedTaskId === 'feature-plan' ? 'active' : ''}`}
              onClick={() => setSelectedTaskId('feature-plan')}
            >
              <FiEdit3 /> <span> Kế hoạch tính năng mới</span>
            </div>
          </aside>

          <main className="editor-workspace">
            <div className="workspace-info">
              <FiInfo /> 
              <span>Mọi thay đổi sẽ được đồng bộ ngay lập tức với tất cả thành viên đang xem.</span>
            </div>
            
            <CollaborativeEditor 
              docId={selectedTaskId} 
              userName={user?.displayName || user?.email} 
            />
          </main>
        </div>
      </div>
    </Layout>
  );
}