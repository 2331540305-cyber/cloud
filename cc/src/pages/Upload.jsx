import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { uploadcareConfig } from '../config/uploadcare';
import Layout from '../components/Layout';
import { FiCloud, FiUpload, FiPaperclip, FiFolder, FiInbox, FiFile, FiDownload, FiTrash2, FiInfo, FiEdit3 } from 'react-icons/fi';
import '../styles/upload.css';

export default function Upload() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      loadFiles(user.uid);
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadFiles = async (userId) => {
    try {
      const q = query(collection(db, 'files'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const fileList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setFiles(fileList.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert('File too large (max 100MB)');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('UPLOADCARE_PUB_KEY', uploadcareConfig.publicKey);
      formData.append('file', file);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 30, 90));
      }, 200);

      const response = await fetch('https://upload.uploadcare.com/base/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const fileUuid = data.file;

      let fileUrl = `https://ucarecdn.com/${fileUuid}/-/preview/`;
      let fileSize = file.size;

      try {
        const updateResponse = await fetch(
          `https://api.uploadcare.com/files/${fileUuid}/storage/`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${uploadcareConfig.secretKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'keep_subscriptions': true })
          }
        );

        if (updateResponse.ok) {
          const fileInfoResponse = await fetch(
            `https://api.uploadcare.com/files/${fileUuid}/`,
            {
              headers: {
                'Authorization': `Bearer ${uploadcareConfig.secretKey}`
              }
            }
          );

          if (fileInfoResponse.ok) {
            const fileInfo = await fileInfoResponse.json();
            fileUrl = `https://ucarecdn.com/${fileUuid}/-/download/${file.name}`;
            fileSize = fileInfo.size || file.size;
          }
        }
      } catch (err) {
        console.warn('Could not fetch file info:', err);
        fileUrl = `https://ucarecdn.com/${fileUuid}/-/download/${file.name}`;
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      await addDoc(collection(db, 'files'), {
        userId: user.uid,
        fileName: file.name || 'Unnamed File',
        fileSize: fileSize || file.size || 0,
        fileUrl: fileUrl || '',
        uploadcareUuid: fileUuid || '',
        uploadedAt: new Date()
      });

      setTimeout(async () => {
        alert(' File uploaded successfully!');
        document.getElementById('fileInput').value = '';
        setUploadProgress(0);
        await loadFiles(user.uid);
      }, 300);
    } catch (error) {
      console.error('Upload error:', error);
      alert(' Error uploading file: ' + error.message);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file) => {
    if (!confirm(`Delete "${file.fileName}"?`)) return;

    try {
      await deleteDoc(doc(db, 'files', file.id));
      await fetch(`https://api.uploadcare.com/files/${file.uploadcareUuid}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${uploadcareConfig.secretKey}`
        }
      });
      alert(' File deleted');
      await loadFiles(user.uid);
    } catch (error) {
      alert(' Error deleting file: ' + error.message);
    }
  };

  const handleDownloadFile = (file) => {
    fetch(file.fileUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(err => alert(' Download failed: ' + err.message));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading files...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="upload-container">
        <div className="upload-header">
          <h1><FiCloud size={36} /> Uploadcare</h1>
          <p>Upload and manage your files securely with Uploadcare CDN</p>
        </div>

        <div className="upload-content">
          <div className="upload-box">
            <div className="upload-form">
              <h2><FiUpload size={24} /> Upload File</h2>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="fileInput"
                    onChange={handleUploadFile}
                    disabled={uploading}
                    className="file-input"
                  />
                  <label htmlFor="fileInput" className="file-label">
                    <span className="file-icon"><FiPaperclip size={32} /></span>
                    <span className="file-text">Click or drag file here...</span>
                  </label>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{Math.round(uploadProgress)}%</span>
                  </div>
                )}
              </form>
            </div>

            <div className="upload-info">
              <h3><FiInfo size={20} /> Features</h3>
              <ul>
                <li>Max file size: <strong>100 MB</strong></li>
                <li>CDN powered by Uploadcare</li>
                <li>Personal storage for each user</li>
                <li>Fast & reliable uploads</li>
                <li>Automatic backups</li>
              </ul>
            </div>
          </div>

          <div className="files-box">
            <h2><FiFolder size={24} /> Your Files ({files.length})</h2>
            
            {files.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon"><FiInbox size={48} /></span>
                <p>No files yet</p>
                <p className="empty-hint">Upload your first file to get started</p>
              </div>
            ) : (
              <div className="files-table">
                <div className="table-header">
                  <div className="col-name">File Name</div>
                  <div className="col-size">Size</div>
                  <div className="col-date">Uploaded</div>
                  <div className="col-actions">Actions</div>
                </div>
                <div className="table-body">
                  {files.map((file) => (
                    <div key={file.id} className="table-row">
                      <div className="col-name">
                        <span className="file-icon"><FiFile size={20} /></span>
                        <span className="file-name">{file.fileName}</span>
                      </div>
                      <div className="col-size">
                        {formatFileSize(file.fileSize)}
                      </div>
                      <div className="col-date">
                        {file.uploadedAt 
                          ? new Date(file.uploadedAt.toDate?.() || file.uploadedAt).toLocaleDateString()
                          : 'N/A'}
                      </div>
                      <div className="col-actions">

                        <button 
                          className="btn-icon btn-edit"
                          onClick={() => navigate(`/edit/${file.uploadcareUuid}`)}
                          title="Edit content"
                          style={{ color: '#6366f1' }}
                        >
                          <FiEdit3 size={18} />
                        </button>

                        <button 
                          className="btn-icon btn-download"
                          onClick={() => handleDownloadFile(file)}
                          title="Download"
                        >
                          <FiDownload size={18} />
                        </button>
                        <button 
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(file)}
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}