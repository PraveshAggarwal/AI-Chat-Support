import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, FileText, Trash2, AlertCircle, CheckCircle,
  Loader2, File, Plus, Database,
} from 'lucide-react';
import { getDocuments, uploadDocument, deleteDocument } from '../api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchDocuments(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 4000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(null), 6000); return () => clearTimeout(t); } }, [error]);

  const fetchDocuments = async () => {
    try { setLoading(true); const data = await getDocuments(); setDocuments(data.documents); }
    catch { setError('Failed to load documents. Is the backend running?'); }
    finally { setLoading(false); }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!['.pdf', '.txt', '.md'].includes(ext)) { setError(`File type ${ext} not supported.`); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Max 10MB.'); return; }
    try {
      setUploading(true); setError(null);
      const data = await uploadDocument(file);
      setSuccess(`"${data.document.name}" uploaded!`);
      fetchDocuments();
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { setDeletingId(id); await deleteDocument(id); setSuccess(`"${name}" deleted.`); setDocuments(prev => prev.filter(d => d.id !== id)); }
    catch (err) { setError(err.message); }
    finally { setDeletingId(null); }
  };

  const onDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer?.files?.[0]; if (f) handleUpload(f); }, []);
  const onDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const onDragLeave = useCallback(() => setDragOver(false), []);

  const typeColors = { pdf: { bg: '#fef2f2', color: '#ef4444' }, txt: { bg: '#eff6ff', color: '#3b82f6' }, md: { bg: '#f5f3ff', color: '#8b5cf6' } };
  const getTypeStyle = (type) => typeColors[type] || { bg: '#f5f5f5', color: '#8e8ea0' };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: '#fff',
        borderBottom: '1px solid #e5e5e5', padding: '16px 24px',
      }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Database size={18} color="#8e8ea0" />
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0d0d0d' }}>Knowledge Base</h2>
              <p style={{ fontSize: '12px', color: '#8e8ea0' }}>
                {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
              </p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', background: '#10a37f', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#0d8a6a'}
            onMouseLeave={e => e.currentTarget.style.background = '#10a37f'}
          >
            <Plus size={16} /> Upload
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px' }}>
        {/* Notifications */}
        {success && (
          <div className="anim-fade" style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
            background: '#eaf7f2', border: '1px solid #d1fae5', borderRadius: '8px',
            fontSize: '14px', color: '#10a37f', marginBottom: '16px',
          }}>
            <CheckCircle size={16} /> {success}
          </div>
        )}
        {error && (
          <div className="anim-fade" style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
            fontSize: '14px', color: '#ef4444', marginBottom: '16px',
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Upload zone */}
        <div
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            borderRadius: '12px', border: `2px dashed ${dragOver ? '#10a37f' : '#e5e5e5'}`,
            background: dragOver ? '#eaf7f2' : '#fff',
            cursor: 'pointer', transition: 'all 0.2s', marginBottom: '24px',
            opacity: uploading ? 0.5 : 1, pointerEvents: uploading ? 'none' : 'auto',
          }}
          onMouseEnter={e => { if (!dragOver) e.currentTarget.style.borderColor = '#d1d1d1'; }}
          onMouseLeave={e => { if (!dragOver) e.currentTarget.style.borderColor = '#e5e5e5'; }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
            {uploading ? (
              <>
                <Loader2 size={28} color="#8e8ea0" className="animate-spin" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '14px', color: '#4a4a4a' }}>Processing document...</p>
              </>
            ) : (
              <>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', background: '#f4f4f4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
                }}>
                  <Upload size={22} color="#8e8ea0" />
                </div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#0d0d0d' }}>
                  Drop files here or click to browse
                </p>
                <p style={{ fontSize: '12px', color: '#b4b4b4', marginTop: '4px' }}>
                  PDF, TXT, or MD — Max 10MB
                </p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
            style={{ display: 'none' }}
          />
        </div>

        {/* Document list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Loader2 size={22} color="#8e8ea0" className="animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <FileText size={28} color="#d1d1d1" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', color: '#4a4a4a' }}>No documents yet</p>
            <p style={{ fontSize: '12px', color: '#b4b4b4', marginTop: '4px' }}>
              Upload documents to power your AI assistant
            </p>
          </div>
        ) : (
          <div>
            {documents.map((doc, i) => {
              const ts = getTypeStyle(doc.type);
              return (
                <div
                  key={doc.id}
                  className="anim-fade"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', borderRadius: '8px',
                    transition: 'background 0.15s', cursor: 'default',
                    animationDelay: `${i * 40}ms`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#f9f9f9';
                    const del = e.currentTarget.querySelector('[data-delete]');
                    if (del) del.style.opacity = '1';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    const del = e.currentTarget.querySelector('[data-delete]');
                    if (del) del.style.opacity = '0';
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: ts.bg, color: ts.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {doc.type === 'pdf' ? <FileText size={16} /> : <File size={16} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', color: '#0d0d0d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.name}
                    </p>
                    <p style={{ fontSize: '11px', color: '#b4b4b4', marginTop: '2px' }}>
                      <span style={{ textTransform: 'uppercase', fontWeight: 500 }}>{doc.type}</span>
                      <span style={{ margin: '0 6px' }}>·</span>
                      {formatDate(doc.uploadedAt)}
                    </p>
                  </div>

                  <button
                    data-delete
                    onClick={() => handleDelete(doc.id, doc.name)}
                    disabled={deletingId === doc.id}
                    style={{
                      padding: '8px', borderRadius: '6px', border: 'none',
                      background: 'transparent', color: '#b4b4b4', cursor: 'pointer',
                      opacity: 0, transition: 'all 0.15s', display: 'flex', alignItems: 'center',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#b4b4b4'; e.currentTarget.style.background = 'transparent'; }}
                    title="Delete"
                  >
                    {deletingId === doc.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
