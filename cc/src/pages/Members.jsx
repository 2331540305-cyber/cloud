import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { PERMISSIONS } from '../config/permissions';
import '../styles/members.css';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingData, setEditingData] = useState({ role: 'member', permissions: [] });
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
        
        if (!userSnap.exists()) {
          alert('User data not found');
          navigate('/login');
          return;
        }

        const userRole = userSnap.data().role;
        
        if (userRole !== 'admin') {
          alert('Admin access only - Your current role: ' + (userRole || 'none'));
          navigate('/dashboard');
          return;
        }

        setIsAdmin(true);
        
        const usersSnap = await getDocs(collection(db, 'users'));
        const membersList = [];
        usersSnap.forEach(doc => {
          membersList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setMembers(membersList);
      } catch (error) {
        console.error('Error loading members:', error);
        alert('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleEditClick = (member) => {
    setEditingMemberId(member.id);
    setEditingData({
      role: member.role || 'member',
      permissions: member.permissions || []
    });
  };

  const handleSaveChanges = async () => {
    try {
      const userRef = doc(db, 'users', editingMemberId);
      await updateDoc(userRef, {
        role: editingData.role,
        permissions: editingData.permissions
      });
      alert('Member updated successfully');
      setEditingMemberId(null);
      
      const usersSnap = await getDocs(collection(db, 'users'));
      const membersList = [];
      usersSnap.forEach(doc => {
        membersList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setMembers(membersList);
    } catch (error) {
      alert('Error updating member: ' + error.message);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (confirm('Are you sure you want to delete this member?')) {
      try {
        const userRef = doc(db, 'users', memberId);
        await deleteDoc(userRef);
        alert('Member deleted successfully');
        
        const usersSnap = await getDocs(collection(db, 'users'));
        const membersList = [];
        usersSnap.forEach(doc => {
          membersList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setMembers(membersList);
      } catch (error) {
        alert('Error deleting member: ' + error.message);
      }
    }
  };

  const handlePermissionChange = (permission) => {
    setEditingData(prev => {
      const permissions = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions };
    });
  };

  if (loading) return <div className="loading">Loading members...</div>;

  if (!isAdmin) return <div className="error">Admin access only</div>;

  return (
    <div className="members-container">
      <div className="members-header">
        <h1>Members Management</h1>
      </div>

      <table className="members-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Permissions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            editingMemberId === member.id ? (
              <tr key={member.id} className="edit-row">
                <td>{member.email}</td>
                <td>
                  <select 
                    value={editingData.role}
                    onChange={(e) => setEditingData(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <div className="permission-checkboxes">
                    {Object.values(PERMISSIONS).map(perm => (
                      <label key={perm}>
                        <input
                          type="checkbox"
                          checked={editingData.permissions.includes(perm)}
                          onChange={() => handlePermissionChange(perm)}
                        />
                        {perm}
                      </label>
                    ))}
                  </div>
                </td>
                <td className="actions">
                  <button className="btn-save" onClick={handleSaveChanges}>Save</button>
                  <button className="btn-cancel" onClick={() => setEditingMemberId(null)}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={member.id}>
                <td>{member.email}</td>
                <td>
                  <span className={`role-badge role-${member.role || 'member'}`}>
                    {(member.role || 'member').charAt(0).toUpperCase() + (member.role || 'member').slice(1)}
                  </span>
                </td>
                <td className="permissions-cell">
                  {(member.permissions || []).map(p => (
                    <span key={p} className="permission-tag">{p}</span>
                  ))}
                </td>
                <td className="actions">
                  <button className="btn-edit" onClick={() => handleEditClick(member)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDeleteMember(member.id)}>Delete</button>
                </td>
              </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );
}
