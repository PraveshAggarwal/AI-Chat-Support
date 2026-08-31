import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Sparkles, Upload, Loader2, CheckCircle, AlertCircle, Plus, FileText, Image as ImageIcon, X } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import TypingIndicator from '../components/TypingIndicator';
import { sendMessage, getConversation, uploadDocument } from '../api';

export default function ChatPage({ conversationId: initialConversationId, onConversationCreated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // New state for ChatGPT-style pending attachment
  const [pendingFile, setPendingFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [toastMsg, setToastMsg] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const isNewChat = messages.length === 0 && !loadingConversation;

  // Load existing conversation if conversationId is provided
  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
    } else {
      setMessages([]);
      setConversationId(null);
    }
  }, [initialConversationId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, pendingFile]);

  // Focus input
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const loadConversation = async (id) => {
    try {
      setLoadingConversation(true);
      const data = await getConversation(id);
      setMessages(data.messages || []);
      setConversationId(id);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  // 1. User selects a file (from button or drag/drop)
  const handleFileSelect = (file) => {
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!['.pdf', '.txt', '.md', '.png', '.jpg', '.jpeg', '.webp'].includes(ext)) { 
      setToastMsg({ type: 'error', text: `File type ${ext} not supported.` });
      setTimeout(() => setToastMsg(null), 4000);
      return; 
    }
    if (file.size > 10 * 1024 * 1024) { 
      setToastMsg({ type: 'error', text: 'File too large. Max 10MB.' });
      setTimeout(() => setToastMsg(null), 4000);
      return; 
    }
    
    // Add to pending state instead of uploading immediately
    setPendingFile(file);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 10);
  };

  // 2. User clicks Send
  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !pendingFile) || isLoading || isUploading) return;

    let currentConversationId = conversationId;
    let uploadedAttachments = [];

    // Step A: Upload the document first if there is one
    if (pendingFile) {
      try {
        setIsUploading(true);
        const data = await uploadDocument(pendingFile, currentConversationId);
        
        if (!currentConversationId && data.conversationId) {
          setConversationId(data.conversationId);
          onConversationCreated?.(data.conversationId);
          currentConversationId = data.conversationId;
        }

        // Push to attachments array for the user message
        if (data.document) {
          uploadedAttachments.push(data.document);
        }
      } catch (err) {
        setToastMsg({ type: 'error', text: err.message });
        setIsUploading(false);
        setTimeout(() => setToastMsg(null), 4000);
        return; // Stop if upload fails
      } finally {
        setIsUploading(false);
        setPendingFile(null); // Clear attachment from input area
      }
    }

    const userMessage = { 
      role: 'user', 
      content: text, 
      attachments: uploadedAttachments,
      timestamp: new Date().toISOString() 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const response = await sendMessage(text, currentConversationId, uploadedAttachments);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.reply,
        sources: response.sources || [],
        timestamp: new Date().toISOString(),
      }]);

      if (!currentConversationId && response.conversationId) {
        setConversationId(response.conversationId);
        onConversationCreated?.(response.conversationId);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}. Please make sure the backend server is running.`,
        sources: [],
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  const onDrop = useCallback((e) => { 
    e.preventDefault(); 
    setDragOver(false); 
    const f = e.dataTransfer?.files?.[0]; 
    if (f) handleFileSelect(f); 
  }, []);
  const onDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const onDragLeave = useCallback((e) => { 
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false); 
    }
  }, []);

  const suggestions = [
    { title: 'What pricing plans', sub: 'do you offer?' },
    { title: 'How do I reset', sub: 'my password?' },
    { title: 'What integrations', sub: 'are available?' },
    { title: 'How can I contact', sub: 'support?' },
  ];

  if (loadingConversation) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid #e5e5e5', borderTopColor: '#10a37f', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
          <p style={{ fontSize: '13px', color: '#8e8ea0' }}>Loading conversation...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div 
      onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}
    >
      {/* Drag Overlay */}
      {dragOver && (
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12, bottom: 12,
          background: 'rgba(255,255,255,0.95)', zIndex: 50,
          border: '2px dashed #10a37f', borderRadius: '16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px', background: '#eaf7f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
          }}>
            <Upload size={32} color="#10a37f" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0d0d0d' }}>Drop document to attach</h2>
          <p style={{ fontSize: '14px', color: '#8e8ea0', marginTop: '8px' }}>Attach to your message</p>
        </div>
      )}

      {/* Toast Notifications */}
      {toastMsg && (
        <div className="anim-fade-up" style={{
          position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 60,
          display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
          background: toastMsg.type === 'error' ? '#fef2f2' : '#eaf7f2',
          border: `1px solid ${toastMsg.type === 'error' ? '#fecaca' : '#d1fae5'}`,
          borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}>
          {toastMsg.type === 'error' ? <AlertCircle size={16} color="#ef4444" /> : <CheckCircle size={16} color="#10a37f" />}
          <span style={{ fontSize: '14px', fontWeight: 500, color: toastMsg.type === 'error' ? '#ef4444' : '#0d8a6a' }}>
            {toastMsg.text}
          </span>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isNewChat ? (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}>
            <div className="anim-fade-up" style={{ marginBottom: '32px', textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: '#eaf7f2', border: '1px solid #d1fae5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Sparkles size={26} color="#10a37f" />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0d0d0d' }}>
                How can I help you today?
              </h1>
              <p style={{ fontSize: '14px', color: '#8e8ea0', marginTop: '8px', maxWidth: '420px' }}>
                I answer questions based on your uploaded knowledge base documents.
              </p>
            </div>

            <div className="anim-fade-up" style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px', width: '100%', maxWidth: '672px', animationDelay: '0.1s',
            }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(`${s.title} ${s.sub}`)}
                  style={{
                    textAlign: 'left', border: '1px solid #e5e5e5',
                    borderRadius: '12px', padding: '14px 16px',
                    background: '#fff', cursor: 'pointer', transition: 'background 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <p style={{ fontSize: '14px', color: '#0d0d0d', fontWeight: 500 }}>{s.title}</p>
                  <p style={{ fontSize: '14px', color: '#8e8ea0' }}>{s.sub}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ paddingTop: '16px', paddingBottom: '8px' }}>
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 16px 16px' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          <div style={{
            position: 'relative', background: '#f4f4f4',
            borderRadius: '16px', border: '1px solid transparent', overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = '#d1d1d1'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'transparent'}
          >
            
            {/* Pending File Attachment Area (ChatGPT style) */}
            {pendingFile && (
              <div className="anim-fade-up" style={{ padding: '10px 14px', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                  background: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px', 
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}>
                  {isUploading ? (
                    <Loader2 size={16} color="#8e8ea0" className="animate-spin" />
                  ) : (
                    pendingFile.type.startsWith('image/') ? <ImageIcon size={16} color="#10a37f" /> : <FileText size={16} color="#10a37f" />
                  )}
                  <span style={{ fontSize: '13px', color: '#0d0d0d', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pendingFile.name}
                  </span>
                  {!isUploading && (
                    <button 
                      onClick={() => setPendingFile(null)}
                      title="Remove attachment"
                      style={{ 
                        background: '#f4f4f4', border: 'none', borderRadius: '50%', width: '20px', height: '20px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8e8ea0', marginLeft: '4px' 
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f4f4f4'; e.currentTarget.style.color = '#8e8ea0'; }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp" 
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
                e.target.value = '';
              }}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading || pendingFile !== null}
              style={{
                position: 'absolute', left: '10px', bottom: '10px',
                width: '32px', height: '32px', borderRadius: '50%',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (isLoading || isUploading || pendingFile !== null) ? 'not-allowed' : 'pointer', 
                background: 'transparent', color: '#8e8ea0',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if(!isLoading && !isUploading && !pendingFile) e.currentTarget.style.background = '#e3e3e3' }}
              onMouseLeave={e => { if(!isLoading && !isUploading && !pendingFile) e.currentTarget.style.background = 'transparent' }}
              title="Attach File"
            >
              <Plus size={20} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message AI Support..."
              rows={1}
              disabled={isLoading || isUploading}
              style={{
                width: '100%', background: 'transparent',
                padding: '14px 52px 14px 48px',
                fontSize: '15px', color: '#0d0d0d',
                border: 'none', outline: 'none', resize: 'none',
                maxHeight: '200px', lineHeight: '1.5', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !pendingFile) || isLoading || isUploading}
              style={{
                position: 'absolute', right: '10px', bottom: '10px',
                width: '32px', height: '32px', borderRadius: '8px',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: ((input.trim() || pendingFile) && !isLoading && !isUploading) ? 'pointer' : 'not-allowed',
                background: ((input.trim() || pendingFile) && !isLoading && !isUploading) ? '#0d0d0d' : '#e3e3e3',
                color: ((input.trim() || pendingFile) && !isLoading && !isUploading) ? '#fff' : '#b4b4b4',
                transition: 'all 0.15s',
              }}
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#b4b4b4', textAlign: 'center', marginTop: '8px' }}>
            AI Support answers from uploaded documents only and may make mistakes.
          </p>
        </div>
      </div>
    </div>
  );
}
