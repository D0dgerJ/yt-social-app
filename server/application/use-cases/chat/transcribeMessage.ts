import prisma from "../../../infrastructure/database/prismaClient.js";

interface TranscribeMessageInput {
  messageId: number;
  userId: number;
}

export const transcribeMessage = async ({
  messageId,
  userId,
}: TranscribeMessageInput) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      mediaFiles: {
        select: {
          id: true,
          url: true,
          type: true,
          originalName: true,
          mime: true,
          size: true,
        },
      },
    },
  });

  if (!message || message.isDeleted) {
    throw new Error("Message not found");
  }

  const isParticipant = await prisma.participant.findFirst({
    where: {
      conversationId: message.conversationId,
      userId,
    },
    select: { id: true },
  });

  if (!isParticipant) {
    throw new Error("You do not have access to this chat");
  }

  if (message.audioText && message.audioText.trim()) {
    return {
      messageId: message.id,
      text: message.audioText,
      fromCache: true,
    };
  }

  const audioMedia =
    message.mediaFiles.find((m) => m.type === "audio") ??
    (message.mediaType === "audio" && message.mediaUrl
      ? { url: message.mediaUrl }
      : null);

  if (!audioMedia || !audioMedia.url) {
    throw new Error("This message has no audio to transcribe");
  }

  const sourceUrl = audioMedia.url;

  const transcript = await fakeSpeechToText(sourceUrl);

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { audioText: transcript },
    select: { id: true, audioText: true },
  });

  return {
    messageId: updated.id,
    text: updated.audioText || transcript,
    fromCache: false,
  };
};

// !!! Важное место для будущего апгрейда:
// здесь потом можно подключить Whisper / внешний STT-API / свой сервис
async function fakeSpeechToText(_sourceUrl: string): Promise<string> {
  // Сейчас — просто заглушка, чтобы фронт и весь поток работал без ошибок
  return "🔊 Transcription is not configured yet";
}
