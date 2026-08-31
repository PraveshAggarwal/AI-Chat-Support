import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Check, FileText, ChevronDown, ChevronUp, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message }) {
  const { role, content, sources = [] } = message;
  const isUser = role === 'user';
  const [feedback, setFeedback] = useState(null);
  const [showSources, setShowSources] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const iconBtnStyle = (active, color) => ({
    padding: '6px',
    borderRadius: '6px',
    border: 'none',
    background: active ? (color === 'red' ? '#fef2f2' : '#eaf7f2') : 'transparent',
    color: active ? (color === 'red' ? '#ef4444' : '#10a37f') : '#b4b4b4',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.15s',
  });

  return (
    <div className="anim-slide" style={{ padding: '16px 0' }}>
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Avatar */}
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            {isUser ? (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#e3e3e3', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <User size={14} color="#4a4a4a" />
              </div>
            ) : (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#10a37f', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={14} color="#fff" />
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0d0d0d', marginBottom: '4px' }}>
              {isUser ? 'You' : 'AI Support'}
            </p>

            {isUser ? (
              <p style={{ fontSize: '15px', color: '#0d0d0d', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {content}
              </p>
            ) : (
              <div className="md-body" style={{ fontSize: '15px', color: '#4a4a4a' }}>
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}

            {/* Actions bar */}
            {!isUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
                <button
                  onClick={handleCopy}
                  style={iconBtnStyle(false)}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  title="Copy"
                >
                  {copied ? <Check size={15} color="#10a37f" /> : <Copy size={15} />}
                </button>

                <button
                  onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                  style={iconBtnStyle(feedback === 'up', 'green')}
                  onMouseEnter={e => { if (feedback !== 'up') e.currentTarget.style.background = '#f5f5f5'; }}
                  onMouseLeave={e => { if (feedback !== 'up') e.currentTarget.style.background = 'transparent'; }}
                  title="Good response"
                >
                  <ThumbsUp size={15} />
                </button>

                <button
                  onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                  style={iconBtnStyle(feedback === 'down', 'red')}
                  onMouseEnter={e => { if (feedback !== 'down') e.currentTarget.style.background = '#f5f5f5'; }}
                  onMouseLeave={e => { if (feedback !== 'down') e.currentTarget.style.background = 'transparent'; }}
                  title="Bad response"
                >
                  <ThumbsDown size={15} />
                </button>

                {sources.length > 0 && (
                  <button
                    onClick={() => setShowSources(!showSources)}
                    style={{
                      ...iconBtnStyle(false),
                      gap: '4px',
                      padding: '6px 8px',
                      fontSize: '12px',
                      marginLeft: '4px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <FileText size={14} />
                    <span>{sources.length} source{sources.length > 1 ? 's' : ''}</span>
                    {showSources ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                )}
              </div>
            )}

            {/* Sources panel */}
            {!isUser && showSources && sources.length > 0 && (
              <div className="anim-fade" style={{
                marginTop: '8px', background: '#f9f9f9', border: '1px solid #e5e5e5',
                borderRadius: '8px', padding: '12px',
              }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Sources
                </p>
                {sources.map((source, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '13px', color: '#4a4a4a' }}>
                    <FileText size={12} color="#8e8ea0" />
                    <span>{source}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
