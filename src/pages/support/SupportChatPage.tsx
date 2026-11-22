import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { adminApi } from '@/shared/api/admin.api';
import { useAuthStore } from '@/shared/store/auth.store';
import { io, type Socket } from 'socket.io-client';

interface SupportConversation {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  status: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadByAdmin?: number;
}

interface SupportMessage {
  id: string;
  body: string;
  senderRole: 'customer' | 'admin';
  createdAt: string;
}

const SOCKET_URL = (
  (import.meta.env.VITE_SOCKET_URL as string | undefined) ??
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/api\/v\d+$/, '') ??
  (import.meta.env.PROD ? 'https://ridezo-backend.onrender.com' : 'http://localhost:4000')
);

export function SupportChatPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  const loadConversations = useCallback(async () => {
    const result = await adminApi.listSupportConversations();
    setConversations(result.items);
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const result = await adminApi.listSupportMessages(conversationId);
    setMessages(result.messages);
  }, []);

  useEffect(() => {
    void loadConversations().catch((err) => {
      setError(err instanceof Error ? err.message : 'Could not load support chats');
    });
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) return;
    void loadMessages(activeId).catch((err) => {
      setError(err instanceof Error ? err.message : 'Could not load messages');
    });
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    socket.on('support:message', (message: SupportMessage & { conversationId?: string }) => {
      const currentActive = activeIdRef.current;
      if (
        currentActive &&
        String((message as { conversationId?: string }).conversationId ?? '') === currentActive
      ) {
        setMessages((current) =>
          current.some((item) => item.id === message.id) ? current : [...current, message],
        );
      }
      void loadConversations().catch(() => undefined);
    });
    socket.on('support:conversation', () => {
      void loadConversations().catch(() => undefined);
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, loadConversations]);

  const send = async () => {
    if (!activeId || !draft.trim()) return;
    setBusy(true);
    setError('');
    try {
      const message = await adminApi.sendSupportMessage(activeId, draft.trim());
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      );
      setDraft('');
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reply');
    } finally {
      setBusy(false);
    }
  };

  const active = conversations.find((item) => item.id === activeId) ?? null;

  return (
    <div>
      <PageHeader
        title="Support Chat"
        description="Reply to User Help & Support conversations in real time."
      />
      {error ? <p className="mb-4 text-sm text-admin-rose">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-admin-line bg-white">
          <div className="border-b border-admin-line px-4 py-3 text-sm font-semibold text-admin-ink">
            Conversations
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="p-4 text-sm text-admin-muted">No support chats yet.</p>
            ) : (
              conversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className={`block w-full border-b border-admin-line px-4 py-3 text-left hover:bg-slate-50 ${
                    activeId === item.id ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-admin-ink">{item.userName}</p>
                    {item.unreadByAdmin ? (
                      <span className="rounded-full bg-admin-teal px-2 py-0.5 text-[10px] font-bold text-white">
                        {item.unreadByAdmin}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-admin-muted">
                    {item.lastMessagePreview || 'No messages yet'}
                  </p>
                  <p className="mt-1 text-[11px] text-admin-muted">
                    {item.userPhone || item.userEmail || item.userId}
                    {item.lastMessageAt
                      ? ` · ${new Date(item.lastMessageAt).toLocaleString()}`
                      : ''}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex min-h-[70vh] flex-col rounded-2xl border border-admin-line bg-white">
          {active ? (
            <>
              <div className="border-b border-admin-line px-4 py-3">
                <p className="text-sm font-semibold text-admin-ink">{active.userName}</p>
                <p className="text-xs text-admin-muted">
                  {active.userPhone || 'No phone'}
                  {active.userEmail ? ` · ${active.userEmail}` : ''}
                </p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      message.senderRole === 'admin'
                        ? 'ml-auto bg-admin-teal text-white'
                        : 'bg-slate-100 text-admin-ink'
                    }`}
                  >
                    <p>{message.body}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        message.senderRole === 'admin' ? 'text-white/80' : 'text-admin-muted'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="flex gap-2 border-t border-admin-line p-4">
                <input
                  className="admin-input flex-1"
                  placeholder="Reply to the user…"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                />
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={busy || !draft.trim()}
                  onClick={() => void send()}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-admin-muted">
              Select a conversation to reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
