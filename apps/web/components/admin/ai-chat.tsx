'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { Bot, Send, X, Loader2, CalendarPlus, Check, BellRing, ClipboardCheck } from 'lucide-react';
import { authStore, useAuth } from '@/lib/auth-store';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const EVENT_TYPE_CS: Record<string, string> = {
  PRACTICE: 'Trénink',
  MATCH: 'Zápas',
  TOURNAMENT: 'Turnaj',
  MEETING: 'Schůzka',
  SOCIAL: 'Akce',
};

interface CreateEventInput {
  type: keyof typeof EVENT_TYPE_CS;
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string;
}

function fmt(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function AiChatWidget() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  // Per-club config drives whether the assistant is on + which model shows.
  const { data: config } = useQuery<{ enabled: boolean; model: string }>({
    queryKey: ['chat-config', auth.clubId],
    queryFn: () => apiFetch('/chat/config'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    staleTime: 60_000,
  });

  const { messages, sendMessage, addToolResult, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/v1/chat',
      headers: () => {
        const token = authStore.getAccessToken();
        const clubId = authStore.getClubId();
        return {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(clubId ? { 'x-club-id': clubId } : {}),
        };
      },
    }),
    // After the user confirms/declines a createEvent tool, let the model wrap up.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  // Only render for authenticated club members; allow a kill-switch via env,
  // and respect the per-club enabled flag (hide once we know it's disabled).
  if (process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === 'false') return null;
  if (!auth.isAuthenticated || !auth.clubId) return null;
  if (config && !config.enabled) return null;

  const busy = status === 'submitted' || status === 'streaming';

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput('');
  }

  async function confirmCreateEvent(toolCallId: string, evt: CreateEventInput) {
    try {
      await apiFetch('/events', { method: 'POST', body: JSON.stringify(evt) });
      addToolResult({ tool: 'createEvent', toolCallId, output: `Událost "${evt.title}" byla vytvořena.` });
    } catch {
      addToolResult({ tool: 'createEvent', toolCallId, output: 'Vytvoření události selhalo.' });
    }
  }

  async function confirmSendReminder(toolCallId: string, eventId: string) {
    try {
      const r = await apiFetch<{ sent: number; skipped: number }>(`/events/${eventId}/remind`, { method: 'POST' });
      addToolResult({ tool: 'sendEventReminder', toolCallId, output: `Připomínka odeslána ${r.sent} členům (přeskočeno ${r.skipped}).` });
    } catch {
      addToolResult({ tool: 'sendEventReminder', toolCallId, output: 'Odeslání připomínky selhalo.' });
    }
  }

  async function confirmMarkAttendance(toolCallId: string, eventId: string, absent: string[]) {
    try {
      const detail = await apiFetch<{ attendees: Array<{ memberId: string; name: string }> }>(`/events/${eventId}`);
      const absentLower = absent.map((n) => n.toLowerCase().trim()).filter(Boolean);
      const attendances = detail.attendees.map((a) => ({
        memberId: a.memberId,
        attended: !absentLower.some((n) => a.name.toLowerCase().includes(n)),
      }));
      await apiFetch(`/events/${eventId}/attendance`, { method: 'PATCH', body: JSON.stringify({ attendances }) });
      const present = attendances.filter((a) => a.attended).length;
      addToolResult({ tool: 'markAttendance', toolCallId, output: `Docházka označena: ${present} přítomných, ${attendances.length - present} nepřítomných.` });
    } catch {
      addToolResult({ tool: 'markAttendance', toolCallId, output: 'Označení docházky selhalo.' });
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-white shadow-lg transition-transform hover:scale-105"
        aria-label={open ? 'Zavřít asistenta' : 'Otevřít AI asistenta'}
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[540px] w-[min(380px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <header className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Bot className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">AI asistent</span>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {config?.model ?? 'lokální model'}
            </span>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="mt-10 text-center text-sm text-muted-foreground">
                <Bot className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p>Zeptej se na cokoli ohledně klubu.</p>
                <p className="mt-1 text-xs opacity-70">
                  „Kdo přijde ve čtvrtek?" · „Kdo nezaplatil?" · „Najdi cvičení na rychlost"
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[88%] space-y-2 rounded-xl px-3 py-2 text-sm',
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                  )}
                >
                  {m.parts.map((part, i) => {
                    if (part.type === 'text') {
                      return (
                        <p key={i} className="whitespace-pre-wrap leading-relaxed">
                          {part.text}
                        </p>
                      );
                    }

                    // Human-in-the-loop confirmation for the createEvent action.
                    if (part.type === 'tool-createEvent') {
                      const callId = (part as { toolCallId: string }).toolCallId;
                      const state = (part as { state: string }).state;
                      const evt = (part as { input?: CreateEventInput }).input;

                      if (state === 'input-available' && evt) {
                        return (
                          <div key={i} className="rounded-lg border border-border bg-background p-3 text-foreground">
                            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                              <CalendarPlus className="h-3.5 w-3.5 text-primary" />
                              Vytvořit událost?
                            </div>
                            <dl className="space-y-0.5 text-xs">
                              <div><span className="text-muted-foreground">Typ: </span>{EVENT_TYPE_CS[evt.type] ?? evt.type}</div>
                              <div><span className="text-muted-foreground">Název: </span>{evt.title}</div>
                              <div><span className="text-muted-foreground">Začátek: </span>{fmt(evt.startsAt)}</div>
                              <div><span className="text-muted-foreground">Konec: </span>{fmt(evt.endsAt)}</div>
                              {evt.location && <div><span className="text-muted-foreground">Místo: </span>{evt.location}</div>}
                            </dl>
                            <div className="mt-2 flex gap-2">
                              <Button size="sm" className="h-7 text-xs" onClick={() => confirmCreateEvent(callId, evt)}>
                                Vytvořit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => addToolResult({ tool: 'createEvent', toolCallId: callId, output: 'Uživatel akci zrušil.' })}
                              >
                                Zrušit
                              </Button>
                            </div>
                          </div>
                        );
                      }
                      if (state === 'output-available') {
                        return (
                          <p key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Check className="h-3 w-3" /> {String((part as { output?: unknown }).output ?? '')}
                          </p>
                        );
                      }
                      return null;
                    }

                    // Action: send RSVP reminder (confirmed).
                    if (part.type === 'tool-sendEventReminder') {
                      const callId = (part as { toolCallId: string }).toolCallId;
                      const state = (part as { state: string }).state;
                      const eventId = (part as { input?: { eventId: string } }).input?.eventId;
                      if (state === 'input-available' && eventId) {
                        return (
                          <div key={i} className="rounded-lg border border-border bg-background p-3 text-foreground">
                            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                              <BellRing className="h-3.5 w-3.5 text-primary" /> Poslat připomínku?
                            </div>
                            <p className="text-xs text-muted-foreground">Odešle RSVP připomínku členům, kteří dosud neodpověděli.</p>
                            <div className="mt-2 flex gap-2">
                              <Button size="sm" className="h-7 text-xs" onClick={() => confirmSendReminder(callId, eventId)}>Poslat</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addToolResult({ tool: 'sendEventReminder', toolCallId: callId, output: 'Uživatel akci zrušil.' })}>Zrušit</Button>
                            </div>
                          </div>
                        );
                      }
                      if (state === 'output-available') {
                        return (
                          <p key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Check className="h-3 w-3" /> {String((part as { output?: unknown }).output ?? '')}
                          </p>
                        );
                      }
                      return null;
                    }

                    // Action: mark attendance (confirmed).
                    if (part.type === 'tool-markAttendance') {
                      const callId = (part as { toolCallId: string }).toolCallId;
                      const state = (part as { state: string }).state;
                      const inp = (part as { input?: { eventId: string; absent?: string[] } }).input;
                      if (state === 'input-available' && inp?.eventId) {
                        const absent = inp.absent ?? [];
                        return (
                          <div key={i} className="rounded-lg border border-border bg-background p-3 text-foreground">
                            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                              <ClipboardCheck className="h-3.5 w-3.5 text-primary" /> Označit docházku?
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {absent.length === 0
                                ? 'Všichni členové týmu budou označeni jako přítomní.'
                                : `Nepřítomní: ${absent.join(', ')}. Ostatní přítomní.`}
                            </p>
                            <div className="mt-2 flex gap-2">
                              <Button size="sm" className="h-7 text-xs" onClick={() => confirmMarkAttendance(callId, inp.eventId, absent)}>Označit</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addToolResult({ tool: 'markAttendance', toolCallId: callId, output: 'Uživatel akci zrušil.' })}>Zrušit</Button>
                            </div>
                          </div>
                        );
                      }
                      if (state === 'output-available') {
                        return (
                          <p key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Check className="h-3 w-3" /> {String((part as { output?: unknown }).output ?? '')}
                          </p>
                        );
                      }
                      return null;
                    }

                    // Read tools — show a subtle "using tool" chip while it runs.
                    if (part.type.startsWith('tool-')) {
                      return (
                        <p key={i} className="flex items-center gap-1 text-[11px] italic text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" /> hledám data…
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Přemýšlím…
              </div>
            )}
          </div>

          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Zeptej se na klub…"
                rows={1}
                className="max-h-24 min-h-9 resize-none py-2 text-sm"
              />
              <Button size="icon" className="h-9 w-9 shrink-0" disabled={busy || !input.trim()} onClick={submit}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
