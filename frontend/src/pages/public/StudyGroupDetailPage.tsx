import { useState, useEffect, useRef, useTransition } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, ShieldCheck, Share2, BookOpen } from 'lucide-react';
import { groupService } from '../../services/groupService';
import { socketService } from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { ROUTES } from '../../constants';
import type { StudyGroup, GroupMessage, GroupMember } from '../../types';
import toast from 'react-hot-toast';
import styles from './StudyGroupDetailPage.module.css';

export function StudyGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);
  const { user } = useAuth();

  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  // Load initial group data and messages
  useEffect(() => {
    if (!groupId) return;

    let isMounted = true;
    setLoading(true);

    const init = async () => {
      try {
        const [g, msgs, mems] = await Promise.allSettled([
          groupService.getGroup(groupId),
          groupService.getMessages(groupId),
          groupService.getMembers(groupId),
        ]);

        if (!isMounted) return;

        if (g.status === 'fulfilled') {
          setGroup(g.value);
        }
        if (msgs.status === 'fulfilled') {
          setMessages(msgs.value);
        }
        if (mems.status === 'fulfilled') {
          setMembers(mems.value);
        }
      } catch (err) {
        console.error('Failed to load group room:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    // Socket.IO real-time connection
    socketService.joinGroup(groupId);

    const unsubMsg = socketService.onNewMessage((newMsg) => {
      if (newMsg.groupId === groupId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => (m.id || m.messageId) === (newMsg.id || newMsg.messageId))) {
            return prev;
          }
          return [...prev, newMsg];
        });
      }
    });

    const unsubDeleted = socketService.onMessageDeleted(({ groupId: gId, messageId }) => {
      if (gId === groupId) {
        setMessages((prev) => prev.filter((m) => (m.id || m.messageId) !== messageId));
      }
    });

    const unsubOnline = socketService.onOnlineMembers(({ groupId: gId, count }) => {
      if (gId === groupId) {
        setGroup((prev) => (prev ? { ...prev, onlineCount: count } : null));
      }
    });

    const unsubTypingStart = socketService.onTypingStart(({ groupId: gId, userId, userName }) => {
      if (gId === groupId && userId !== user?.id) {
        const name = userName || 'Someone';
        setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
      }
    });

    const unsubTypingStop = socketService.onTypingStop(({ groupId: gId, userId }) => {
      if (gId === groupId && userId !== user?.id) {
        setTypingUsers([]);
      }
    });

    const unsubError = socketService.onError(({ message }) => {
      toast.error(message || 'Chat error');
    });

    return () => {
      isMounted = false;
      socketService.leaveGroup(groupId);
      unsubMsg();
      unsubDeleted();
      unsubOnline();
      unsubTypingStart();
      unsubTypingStop();
      unsubError();
    };
  }, [groupId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!groupId) return;

    socketService.sendTypingStart(groupId);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketService.sendTypingStop(groupId);
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !groupId) return;

    const text = inputText.trim();
    setInputText('');

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socketService.sendTypingStop(groupId);

    try {
      // Send via socket
      socketService.sendMessage(groupId, text);
    } catch {
      // Fallback to REST
      try {
        const saved = await groupService.sendMessage(groupId, text);
        startTransition(() => {
          setMessages((prev) => [...prev, saved]);
        });
      } catch (err: any) {
        toast.error(err?.response?.data?.error?.message || 'Could not send message.');
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-gray-500)' }}>
          Entering study room...
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Study Group Not Found"
          description="This study group does not exist or has been archived."
          action={{
            label: 'Explore Groups',
            onClick: () => { window.location.href = ROUTES.STUDY_GROUPS; },
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to={ROUTES.STUDY_GROUPS} className={styles.backLink}>
        <ArrowLeft size={16} /> Back to study groups
      </Link>

      <div className={styles.layout}>
        {/* Main Discussion Feed */}
        <div className={styles.mainSection}>
          <div className={styles.chatHeader}>
            <div className={styles.groupInfo}>
              <h1 className={styles.groupTitle}>{group.name}</h1>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <Badge variant="primary">{group.subject || 'General'}</Badge>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                  {group.onlineCount ?? 1} online now
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Share2 size={14} />}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Room link copied to clipboard!');
              }}
            >
              Share Link
            </Button>
          </div>

          <div className={styles.messageArea}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-gray-400)' }}>
                No messages yet. Be the first to start the discussion!
              </div>
            ) : (
              messages.map((msg) => {
                const isSelf =
                  (user && (msg.userId === user.id || msg.senderId === user.id)) ||
                  msg.user?.name === 'You' ||
                  msg.sender?.name === 'You';
                const senderName = msg.user?.name || msg.sender?.name || 'Group Member';
                const avatar = msg.user?.avatarUrl || msg.user?.profilePic || msg.sender?.avatarUrl || msg.sender?.profilePic;
                const timestamp = msg.createdAt || msg.sentAt || new Date().toISOString();

                return (
                  <div
                    key={msg.id || msg.messageId}
                    className={`${styles.messageRow} ${isSelf ? styles.messageSelf : ''}`}
                  >
                    <Avatar
                      src={avatar || undefined}
                      name={senderName}
                      size="sm"
                    />
                    <div>
                      {!isSelf && <div className={styles.senderName}>{senderName}</div>}
                      <div className={`${styles.messageBubble} ${isSelf ? styles.messageBubbleSelf : ''}`}>
                        <p className={styles.messageText}>{msg.content}</p>
                        <div className={styles.messageTime}>
                          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {typingUsers.length > 0 && (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontStyle: 'italic', padding: 'var(--space-2)' }}>
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className={styles.inputBar}>
            <input
              type="text"
              placeholder="Ask a question or share a study tip with the group..."
              value={inputText}
              onChange={handleInputChange}
              className={styles.chatInput}
            />
            <Button variant="primary" type="submit" leftIcon={<Send size={16} />}>
              Send
            </Button>
          </form>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
              About Group
            </h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', lineHeight: 'var(--line-height-relaxed)', marginBottom: 'var(--space-4)' }}>
              {group.description || 'Collaborative study space for peer learning and questions.'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
              <ShieldCheck size={16} color="var(--color-success)" />
              <span>Moderated & Safe Study Community</span>
            </div>
          </div>

          <div className={styles.sidebarCard}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
              Active Members ({members.length > 0 ? members.length : group.memberCount || 1})
            </h3>
            <div className={styles.memberList}>
              {members.length > 0 ? (
                members.map((m) => (
                  <div key={m.userId} className={styles.memberItem}>
                    <span className={styles.onlineDot} />
                    <Avatar
                      src={m.user?.avatarUrl || m.user?.profilePic || undefined}
                      name={m.user?.name || `User ${m.userId}`}
                      size="xs"
                    />
                    <span>
                      {m.user?.name || `User ${m.userId}`}
                      {m.userId === user?.id && ' (You)'}
                      {m.role === 'admin' && <Badge variant="success" style={{ marginLeft: 6 }}>Admin</Badge>}
                    </span>
                  </div>
                ))
              ) : (
                <div className={styles.memberItem}>
                  <span className={styles.onlineDot} />
                  <Avatar name={user?.name || 'Member'} size="xs" />
                  <span>{user?.name || 'You'} (You)</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.sidebarCard}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
              Group Resources
            </h3>
            <Link to={ROUTES.RESOURCES} style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm" fullWidth leftIcon={<BookOpen size={14} />}>
                Browse Shared Materials
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
