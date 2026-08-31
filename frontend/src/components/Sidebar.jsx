import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, FileText, Plus, LogOut, Trash2, SquarePen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getConversations, deleteConversation } from '../api';

export default function Sidebar({ isOpen, onToggle, activeConversationId, onSelectConversation, onNewChat, refreshKey }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);

  // Fetch conversations on mount and when refreshKey changes
  useEffect(() => {
    fetchConversations();
  }, [refreshKey]);

  const fetchConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data.conversations || []);
    } catch {
      // Silently fail
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        onNewChat();
      }
    } catch { /* ignore */ }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleNewChat = () => {
    onNewChat();
    navigate('/');
  };

  if (!isOpen) return null;

  // Group conversations by date
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = [];
  const todayItems = [];
  const yesterdayItems = [];
  const weekItems = [];
  const olderItems = [];

  conversations.forEach(c => {
    const d = new Date(c.updatedAt || c.createdAt);
    if (d.toDateString() === today.toDateString()) todayItems.push(c);
    else if (d.toDateString() === yesterday.toDateString()) yesterdayItems.push(c);
    else if (d > weekAgo) weekItems.push(c);
    else olderItems.push(c);
  });

  if (todayItems.length) groups.push({ label: 'Today', items: todayItems });
  if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems });
  if (weekItems.length) groups.push({ label: 'Previous 7 days', items: weekItems });
  if (olderItems.length) groups.push({ label: 'Older', items: olderItems });

  return (
    <aside
      className="anim-fade"
      style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: '260px',
        background: '#f9f9f9', display: 'flex', flexDirection: 'column',
        zIndex: 30, borderRight: '1px solid #e5e5e5',
      }}
    >
      {/* Top bar — sidebar toggle + new chat */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 8px' }}>
        <button
          onClick={onToggle}
          style={btnStyle()}
          onMouseEnter={e => e.currentTarget.style.background = '#ececec'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title="Close sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        </button>
        <button
          onClick={handleNewChat}
          style={btnStyle()}
          onMouseEnter={e => e.currentTarget.style.background = '#ececec'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title="New chat"
        >
          <SquarePen size={18} />
        </button>
      </div>

      {/* New Chat button — prominent */}
      <div style={{ padding: '0 8px 4px' }}>
        <button
          onClick={handleNewChat}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
            padding: '10px 12px', borderRadius: '8px', fontSize: '14px',
            border: '1px solid #e5e5e5', background: '#fff', cursor: 'pointer',
            color: '#0d0d0d', fontWeight: 500, transition: 'all 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >
          <Plus size={16} color="#8e8ea0" />
          <span>New chat</span>
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#e5e5e5', margin: '8px 16px' }} />

      {/* Conversation history */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {conversations.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#b4b4b4', textAlign: 'center', padding: '24px 0' }}>
            No conversations yet.<br />Start a new chat above!
          </p>
        ) : (
          groups.map(group => (
            <div key={group.label} style={{ marginBottom: '4px' }}>
              <p style={{
                fontSize: '11px', fontWeight: 600, color: '#8e8ea0',
                padding: '10px 12px 6px', textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {group.label}
              </p>
              {group.items.map(c => {
                const isActive = activeConversationId === c.id;
                const isHovered = hoveredId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => { onSelectConversation(c.id); navigate('/'); }}
                    onMouseEnter={() => setHoveredId(c.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                      background: isActive ? '#e3e3e3' : isHovered ? '#ececec' : 'transparent',
                      transition: 'background 0.12s',
                    }}
                  >
                    <MessageSquare size={14} color="#b4b4b4" style={{ flexShrink: 0 }} />
                    <span style={{
                      flex: 1, fontSize: '13px',
                      color: isActive ? '#0d0d0d' : '#333',
                      fontWeight: isActive ? 500 : 400,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {c.title || 'New Chat'}
                    </span>
                    {isHovered && (
                      <button
                        onClick={(e) => handleDelete(e, c.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#b4b4b4', display: 'flex', alignItems: 'center',
                          padding: '2px', flexShrink: 0,
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#b4b4b4'}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* User section */}
      <div style={{ padding: '8px', borderTop: '1px solid #e5e5e5' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '8px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: '#10a37f', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: '14px', fontWeight: 600, color: '#fff',
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </p>
            <p style={{ fontSize: '11px', color: '#8e8ea0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#b4b4b4', display: 'flex', alignItems: 'center', padding: '6px',
              borderRadius: '6px',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#b4b4b4'; e.currentTarget.style.background = 'transparent'; }}
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function btnStyle() {
  return {
    padding: '8px', borderRadius: '8px', border: 'none',
    background: 'transparent', color: '#8e8ea0', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
  };
}
