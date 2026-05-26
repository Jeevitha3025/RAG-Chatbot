import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Sparkles, Loader } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL 
  ? `${import.meta.env.VITE_BACKEND_URL}/api` 
  : '/api';

const SUGGESTIONS = [
  "How many vacation days do I get?",
  "What are the CloudSync Pro pricing plans?",
  "What is the 401k match policy?",
  "What's the remote work policy?",
  "Who do I contact for IT issues?",
  "What compliance certifications does JL Group of Institutions have?",
];

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'Sorry, something went wrong.',
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Network error — is the backend running?', sources: [] },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={17} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>JL Group of Institutions Knowledge Assistant</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>RAG-powered · Answers from your company docs</div>
        </div>
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, color: 'var(--green)',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
          Live
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
        {messages.length === 0 ? (
          <EmptyState onSuggest={sendMessage} />
        ) : (
          <>
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {loading && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-end',
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '8px 8px 8px 14px',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask about company policies, products, HR, compliance…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: 13, lineHeight: 1.5,
              resize: 'none', maxHeight: 120, fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            {loading ? <Loader size={14} color="var(--text3)" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} color={input.trim() ? '#fff' : 'var(--text3)'} />}
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6, textAlign: 'center' }}>
          Press Enter to send · Shift+Enter for new line
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div style={{
      display: 'flex', gap: 10, marginBottom: 16,
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'var(--bg3)' : 'linear-gradient(135deg, #7c6af7, #a78bfa)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser ? <User size={13} color="var(--text2)" /> : <Bot size={13} color="#fff" />}
      </div>
      <div style={{ maxWidth: '75%' }}>
        <div style={{
          padding: '10px 14px', borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isUser ? 'var(--accent)' : 'var(--bg2)',
          border: isUser ? 'none' : '1px solid var(--border)',
          fontSize: 13, lineHeight: 1.6, color: isUser ? '#fff' : 'var(--text)',
          whiteSpace: 'pre-wrap',
        }}>
          {message.content}
        </div>
        {!isUser && message.sources?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {message.sources.map((s, i) => (
              <span key={i} style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 20,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <FileText size={9} /> {s.fileName}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bot size={13} color="#fff" />
      </div>
      <div style={{
        padding: '12px 16px', borderRadius: '14px 14px 14px 4px',
        background: 'var(--bg2)', border: '1px solid var(--border)',
        display: 'flex', gap: 4, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ onSuggest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', paddingBottom: 40 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, marginBottom: 16,
        background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Sparkles size={26} color="#fff" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Ask anything about JL Group of Institutions</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>Powered by RAG — answers from real company documents</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 520 }}>
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 12,
              background: 'var(--bg2)', border: '1px solid var(--border)',
              color: 'var(--text2)', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent2)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)'; }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
