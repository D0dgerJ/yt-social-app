// /services/chatApi.ts
import axios from '@/utils/api/axiosInstance';
import * as legacy from '@/utils/api/chat.api';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ---------- helpers ----------
export type UploadResult = { url: string; name: string; mime: string };

function normalizeUpload(data: any): UploadResult[] {
  const raw =
    Array.isArray(data) ? data :
    data?.urls ?? data?.files ?? data?.data ?? data?.result ?? (data?.file ? [data.file] : data);

  const arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  return arr
    .map((it: any) => ({
      url: it?.url ?? it?.fileUrl ?? it?.path ?? it?.Location ?? it?.location ?? '',
      name: it?.name ?? it?.fileName ?? it?.originalname ?? it?.filename ?? '',
      mime: it?.mime ?? it?.mimetype ?? it?.type ?? '',
    }))
    .filter(u => u.url);
}

function toAbsoluteFromApi(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    const base = (axios as any)?.defaults?.baseURL || '';
    const origin = new URL(base).origin;
    return new URL(u, origin).href;
  } catch {
    return u;
  }
}

// ---------- uploads ----------
export async function uploadFiles(files: File[]): Promise<{ urls: UploadResult[] }> {
  if (!files?.length) return { urls: [] };

  // сервер принимает только single('file') → шлём по одному
  const results: UploadResult[] = [];
  for (const file of files) {
    const fd = new FormData();
    fd.append('file', file); // ВАЖНО: ключ 'file'
    const res = await axios.post('/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const one = normalizeUpload(res?.data);
    if (one[0]) results.push(one[0]);
  }

  if (!results.length) throw new Error('Upload failed: empty response');
  return { urls: results };
}

// ---------- send ----------
export async function sendMessageREST(payload: {
  clientMessageId?: string;
  conversationId: number;
  encryptedContent?: string;
  content?: string;
  media?: { url: string; name?: string; mime: string } | undefined;
  replyToId?: number;
}) {
  const body: any = {
    // бэк читает из body
    clientMessageId: payload.clientMessageId, // ВАЖНО для дедупликации
    content: payload.encryptedContent ?? payload.content ?? '',
    repliedToId: payload.replyToId,
  };

  if (payload.media?.url) {
    const abs = toAbsoluteFromApi(payload.media.url);
    body.mediaUrl = abs;
    body.fileName = payload.media.name;
    const mime = payload.media.mime || '';
    if (mime.startsWith('image/')) body.mediaType = 'image';
    else if (mime.startsWith('video/')) body.mediaType = 'video';
    else if (mime.startsWith('audio/')) body.mediaType = 'audio';
    else body.mediaType = 'file';
  }

  // новый контроллер: POST /chat/:chatId/messages
  const { data } = await axios.post(`/chat/${payload.conversationId}/messages`, body);
  return data;
}

// ---------- history (cursor-based) ----------
export async function getChatMessages(
  conversationId: number,
  opts: { cursorId?: number | null; direction?: 'forward' | 'backward'; limit?: number } = {}
): Promise<{ messages: any[]; nextCursor?: number; prevCursor?: number }> {
  const params: any = {};
  if (opts.cursorId != null) params.cursorId = opts.cursorId;
  if (opts.direction) params.direction = opts.direction;
  if (opts.limit != null) params.limit = opts.limit;

  const { data } = await axios.get(`/chat/${conversationId}/messages`, { params });
  // ожидаемый формат бэка: { messages, pageInfo: { nextCursor?, prevCursor? } } или просто {messages}
  const messages: any[] = data?.messages ?? data ?? [];
  const nextCursor = data?.pageInfo?.nextCursor;
  const prevCursor = data?.pageInfo?.prevCursor;
  return { messages, nextCursor, prevCursor };
}

// ---------- reactions ----------
const reactionsCache = new Map<number, { ts: number; data: any[] }>();
const REACTIONS_TTL = 60_000;

export function invalidateReactionsCache(messageId: number) {
  reactionsCache.delete(messageId);
}

export async function getMessageReactions(messageId: number): Promise<any[]> {
  if (!messageId || messageId < 1) return [];
  const cached = reactionsCache.get(messageId);
  if (cached && Date.now() - cached.ts < REACTIONS_TTL) return cached.data;

  const { data } = await axios.get(`/chat/messages/${messageId}/reactions`);
  const res = Array.isArray(data) ? data : Array.isArray(data?.reactions) ? data.reactions : [];
  reactionsCache.set(messageId, { ts: Date.now(), data: res });
  return res;
}

export const getReactionsREST = getMessageReactions;

export async function toggleReactionREST(_conversationId: number, messageId: number, emoji: string) {
  const { data } = await axios.post(`/chat/messages/${messageId}/react`, { emoji });
  reactionsCache.delete(messageId);
  return data;
}

// ---------- edit / delete ----------
export async function editMessageREST(conversationId: number, messageId: number, newText: string) {
  const { data } = await axios.patch(`/chat/${conversationId}/messages/${messageId}`, {
    content: newText,
  });
  return data;
}

export async function deleteMessageREST(conversationId: number, messageId: number) {
  await axios.delete(`/chat/${conversationId}/messages/${messageId}`);
}

// ---------- delivered / read ----------
export async function markDeliveredREST(conversationId: number) {
  const { data } = await axios.post(`/chat/${conversationId}/delivered`, {});
  return data;
}

export async function markReadREST(conversationId: number) {
  const { data } = await axios.post(`/chat/${conversationId}/read`, {});
  return data;
}

// ---------- transcribe ----------

export async function transcribeMessageREST(messageId: number): Promise<string> {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE}/api/v1/chat/messages/${messageId}/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data?.text ?? '';
}