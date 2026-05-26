import { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, Database, X, CheckCircle, Loader } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL 
  ? `${import.meta.env.VITE_BACKEND_URL}/api` 
  : '/api';

const CATEGORY_COLORS = {
  'Human Resources': '#a78bfa',
  'Products': '#34d399',
  'Legal & Compliance': '#fbbf24',
  'IT': '#60a5fa',
  'General': '#f472b6',
};

export default function Sidebar({ refreshTrigger, onDocChange }) {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [category, setCategory] = useState('General');
  const fileRef = useRef();

  const fetchDocs = async () => {
    try {
      const res = await fetch(`${API}/documents`);
      const data = await res.json();
      setDocs(data.documents || []);
      onDocChange(data.documents || []);
    } catch { }
  };

  useEffect(() => { fetchDocs(); }, [refreshTrigger]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);

    const form = new FormData();
    form.append('file', file);
    form.append('category', category);

    try {
      const res = await fetch(`${API}/documents/upload`, { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) {
        setUploadMsg({ type: 'success', text: `✓ ${data.fileName} indexed (${data.chunkCount} chunks)` });
        fetchDocs();
      } else {
        setUploadMsg({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch (err) {
      setUploadMsg({ type: 'error', text: 'Network error' });
    } finally {
      setUploading(false);
      fileRef.current.value = '';
      setTimeout(() => setUploadMsg(null), 4000);
    }
  };

  const handleDelete = async (docId, name) => {
    if (!confirm(`Remove "${name}" from knowledge base?`)) return;
    try {
      await fetch(`${API}/documents/${docId}`, { method: 'DELETE' });
      fetchDocs();
    } catch { }
  };

  const catColor = (cat) => CATEGORY_COLORS[cat] || '#f472b6';

  return (
    <div style={{
      width: 260, minWidth: 260, height: '100vh',
      background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Database size={16} color="var(--accent)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Knowledge Base</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{docs.length} document{docs.length !== 1 ? 's' : ''} indexed</div>
      </div>

      {/* Upload area */}
      <div style={{ padding: '12px 12px 0' }}>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{
            width: '100%', padding: '6px 8px', marginBottom: 8,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text2)', fontSize: 12,
          }}
        >
          {['Human Resources', 'Products', 'Legal & Compliance', 'IT', 'General'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          style={{
            width: '100%', padding: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6, borderRadius: 8,
            background: uploading ? 'var(--bg3)' : 'var(--accent)',
            border: 'none', color: '#fff', fontSize: 12, fontWeight: 500,
            cursor: uploading ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s',
          }}
        >
          {uploading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={13} />}
          {uploading ? 'Indexing…' : 'Upload PDF / TXT'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.txt" style={{ display: 'none' }} onChange={handleUpload} />

        {uploadMsg && (
          <div style={{
            marginTop: 8, padding: '6px 10px', borderRadius: 6, fontSize: 11,
            background: uploadMsg.type === 'success' ? '#1a2e1a' : '#2e1a1a',
            color: uploadMsg.type === 'success' ? 'var(--green)' : 'var(--red)',
            border: `1px solid ${uploadMsg.type === 'success' ? '#2a4a2a' : '#4a2a2a'}`,
          }}>
            {uploadMsg.text}
          </div>
        )}
      </div>

      {/* Document list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {docs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, marginTop: 24, lineHeight: 1.6 }}>
            No documents yet.<br />Mock company docs are<br />pre-loaded on startup.
          </div>
        ) : (
          docs.map(doc => (
            <div key={doc.id} style={{
              padding: '9px 10px', borderRadius: 8, marginBottom: 4,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <FileText size={13} color={catColor(doc.category)} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 500, color: 'var(--text)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{doc.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                  <span style={{ color: catColor(doc.category) }}>{doc.category}</span>
                  {' · '}{doc.chunkCount} chunks
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc.id, doc.name)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text3)', padding: 2, flexShrink: 0,
                }}
                title="Remove document"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
