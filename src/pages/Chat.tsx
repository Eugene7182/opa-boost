import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileNav } from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Users2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Conversation {
  id: string;
  title: string | null;
  type: string;
  updated_at: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

export default function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv);
      subscribeToMessages(selectedConv);
    }
  }, [selectedConv]);

  const loadConversations = async () => {
    if (!user) return;

    const { data: participantData } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (!participantData) return;

    const convIds = participantData.map(p => p.conversation_id);
    
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .in('id', convIds)
      .eq('active', true)
      .order('updated_at', { ascending: false });

    if (data) setConversations(data);
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles!chat_messages_sender_id_fkey(full_name)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data as any);
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data: newMsg } = await supabase
            .from('chat_messages')
            .select(`
              *,
              profiles!chat_messages_sender_id_fkey(full_name)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (newMsg) {
            setMessages(prev => [...prev, newMsg as any]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || !user) return;

    setLoading(true);

    const { error } = await supabase.from('chat_messages').insert([{
      conversation_id: selectedConv,
      sender_id: user.id,
      content: newMessage.trim(),
      message_type: 'text',
    }]);

    if (error) {
      toast({ title: 'Ошибка отправки', description: error.message, variant: 'destructive' });
    } else {
      setNewMessage('');
    }

    setLoading(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  };

  if (!selectedConv) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Чаты</h1>
            </div>
            <Button size="icon" variant="ghost">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <main className="p-4 space-y-3">
          {conversations.map((conv) => (
            <Card 
              key={conv.id} 
              className="p-4 cursor-pointer hover:bg-accent/5 transition-colors"
              onClick={() => setSelectedConv(conv.id)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Users2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{conv.title || 'Чат'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conv.updated_at).toLocaleDateString('ru')}
                  </p>
                </div>
                <Badge variant="secondary">{conv.type}</Badge>
              </div>
            </Card>
          ))}
          
          {conversations.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              <p>Нет активных чатов</p>
            </Card>
          )}
        </main>

        <MobileNav />
      </div>
    );
  }

  const currentConv = conversations.find(c => c.id === selectedConv);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedConv(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{currentConv?.title || 'Чат'}</h1>
            <p className="text-xs text-muted-foreground">{currentConv?.type}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-2xl p-3`}>
                {!isOwn && (
                  <p className="text-xs font-semibold mb-1">{msg.profiles?.full_name}</p>
                )}
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </main>

      <form onSubmit={handleSend} className="border-t bg-card p-4 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Написать сообщение..."
          disabled={loading}
        />
        <Button type="submit" size="icon" disabled={loading || !newMessage.trim()}>
          <Send className="w-5 h-5" />
        </Button>
      </form>

      <MobileNav />
    </div>
  );
}
