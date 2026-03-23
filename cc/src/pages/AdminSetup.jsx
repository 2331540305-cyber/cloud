import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import '../styles/admin.css';

export default function AdminSetup() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      setUser(currentUser);

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleMakeAdmin = async () => {
    if (!confirm('Make this account admin?')) return;

    setUpdating(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        role: 'admin',
        permissions: [
          'view_tasks',
          'edit_tasks',
          'delete_tasks',
          'view_team',
          'edit_team',
          'view_uploads',
          'upload_files',
          'delete_files'
        ]
      });

      alert('Account updated to Admin!');
      
      // Reload
      const userSnap = await getDoc(userRef);
      setUserData(userSnap.data());
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      alert('Error logging out: ' + error.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-setup-container">
      <div className="setup-header">
        <h1>🔧 Admin Setup</h1>
      </div>

      <div className="setup-content">
        <div className="user-info-card">
          <h2>Current User Info</h2>
          <div className="info-row">
            <label>Email:</label>
            <span>{user?.email}</span>
          </div>
          <div className="info-row">
            <label>UID:</label>
            <span>{user?.uid}</span>
          </div>
          {user?.photoURL && (
            <div className="info-row">
              <label>Photo:</label>
              <img src={user?.photoURL} alt="Profile" className="profile-photo" />
            </div>
          )}
          <div className="info-row">
            <label>Sign-in Provider:</label>
            <span>{user?.providerData[0]?.providerId || 'Email/Password'}</span>
          </div>
        </div>

        {userData ? (
          <div className="user-data-card">
            <h2>Firestore Data</h2>
            <div className="info-row">
              <label>Role:</label>
              <span className={`role-badge role-${userData.role}`}>
                {userData.role || 'Not set'}
              </span>
            </div>
            <div className="info-row">
              <label>Permissions:</label>
              <div className="permissions-list">
                {userData.permissions && userData.permissions.length > 0 ? (
                  userData.permissions.map(perm => (
                    <span key={perm} className="permission-tag">{perm}</span>
                  ))
                ) : (
                  <span>No permissions</span>
                )}
              </div>
            </div>
            <div className="info-row">
              <label>Created At:</label>
              <span>
                {userData.createdAt 
                  ? new Date(userData.createdAt.toDate?.() || userData.createdAt).toLocaleString()
                  : 'N/A'}
              </span>
            </div>

            {userData.role !== 'admin' && (
              <div className="action-section">
                <button className="make-admin-btn" onClick={handleMakeAdmin} disabled={updating}>
                  {updating ? 'Updating...' : '👑 Make This Account Admin'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="error-card">
            <h2>⚠️ No Firestore Data Found</h2>
            <p>Your user account doesn't have a record in Firestore yet.</p>
            <p>Try logging out and logging back in, or contact an admin.</p>
          </div>
        )}
      </div>

      <div className="setup-footer">
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="instructions-section">
        <h3>📝 How to Setup Admin:</h3>
        <ol>
          <li>Make sure you're logged in with your email</li>
          <li>If you see "No Firestore Data", logout and login again</li>
          <li>Once data appears, click "Make This Account Admin"</li>
          <li>Refresh and go to Members page to manage other users</li>
        </ol>
      </div>
    </div>
  );
}
