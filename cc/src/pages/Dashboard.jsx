import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import Layout from '../components/Layout';
import { FiCheckCircle, FiUsers, FiUploadCloud, FiUser, FiSettings, FiMail, FiLock } from 'react-icons/fi';
import '../styles/dashboard.css';

const MenuItems = [
  { Icon: FiCheckCircle, label: 'Tasks', path: '/tasks', color: '#6366f1' },
  { Icon: FiUsers, label: 'Team', path: '/team', color: '#8b5cf6' },
  { Icon: FiUploadCloud, label: 'Upload', path: '/upload', color: '#ec4899' },
  { Icon: FiUser, label: 'Members', path: '/members', color: '#14b8a6' },
  { Icon: FiSettings, label: 'Admin', path: '/admin', color: '#f59e0b' }
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome to CoWorking Cloud </h1>
          <p>Manage your tasks, team, and files all in one place</p>
        </div>

        <div className="dashboard-grid">
          {MenuItems.map((item) => (
            <div
              key={item.path}
              className="dashboard-card"
              onClick={() => navigate(item.path)}
              style={{ '--card-color': item.color }}
            >
              <div className="card-icon">
                <item.Icon size={48} />
              </div>
              <h3>{item.label}</h3>
              <p>Manage {item.label.toLowerCase()}</p>
              <div className="card-arrow">→</div>
            </div>
          ))}
        </div>

        <div className="dashboard-stats">
          <div className="stat-item">
            <span className="stat-icon"><FiMail size={32} /></span>
            <div className="stat-content">
              <h4>Your Email</h4>
              <p>{user?.email || 'Loading...'}</p>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon"><FiLock size={32} /></span>
            <div className="stat-content">
              <h4>Account Status</h4>
              <p> Verified</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
