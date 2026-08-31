import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import AuthPage from './pages/AuthPage';

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatKey, setChatKey] = useState(0); // forces ChatPage remount
  const [sidebarRefresh, setSidebarRefresh] = useState(0); // forces sidebar data refetch

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e5e5e5', borderTopColor: '#10a37f', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', color: '#8e8ea0' }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Start a fresh new chat
  const handleNewChat = () => {
    setActiveConversationId(null);
    setChatKey(k => k + 1);
  };

  // Select an existing conversation from sidebar
  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setChatKey(k => k + 1);
  };

  // Called after first message creates a new conversation
  const handleConversationCreated = (newId) => {
    setActiveConversationId(newId);
    setSidebarRefresh(k => k + 1);
  };

  // Called after every AI reply to refresh sidebar titles
  const handleConversationUpdated = () => {
    setSidebarRefresh(k => k + 1);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#fff' }}>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        refreshKey={sidebarRefresh}
      />

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', height: '100vh',
        marginLeft: sidebarOpen ? '260px' : '0',
        transition: 'margin-left 0.3s ease',
      }}>
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              position: 'fixed', top: '12px', left: '12px', zIndex: 40,
              padding: '8px', borderRadius: '8px', border: 'none',
              background: 'transparent', color: '#8e8ea0', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Open sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
        )}

        <Routes>
          <Route path="/" element={
            <ChatPage
              key={chatKey}
              conversationId={activeConversationId}
              onConversationCreated={handleConversationCreated}
              onConversationUpdated={handleConversationUpdated}
            />
          } />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthRedirect />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function AuthRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <AuthPage />;
}
