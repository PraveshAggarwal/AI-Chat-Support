import { Sparkles } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="anim-fade" style={{ padding: '16px 0' }}>
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#10a37f', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={14} color="#fff" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0d0d0d', marginBottom: '8px' }}>
              AI Support
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="typing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#b4b4b4', display: 'inline-block' }} />
              <span className="typing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c8c8c8', display: 'inline-block' }} />
              <span className="typing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d4d4d4', display: 'inline-block' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
