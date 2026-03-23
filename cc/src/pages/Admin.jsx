import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import '../styles/admin.css';

export default function Admin() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const role = userSnap.data().role;
          if (role !== 'admin') {
            alert('Admin access only - Your role: ' + (role || 'none'));
            navigate('/dashboard');
          }
        } else {
          alert('User data not found in Firestore');
          navigate('/admin-setup');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        alert('Error: ' + error.message);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>👑 Admin Panel</h2>
      </div>
      <div className="admin-content">
        <p>Welcome to Admin Panel!</p>
        <p><a href="/members">Go to Members Management →</a></p>
      </div>
    </div>
  );
}
