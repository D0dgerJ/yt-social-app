import prisma from '../../../infrastructure/database/prismaClient';

interface CreateChatInput {
  userIds: number[];
  name?: string;
}

export const createChat = async ({ userIds, name }: CreateChatInput) => {
  if (!userIds || userIds.length < 2) {
    throw new Error('At least two users are required to start a chat');
  }

  const isGroup = userIds.length > 2 || !!name;

  const conversation = await prisma.conversation.create({
    data: {
      name: isGroup ? name : null,
      isGroup,
      participants: {
        create: userIds.map(userId => ({ userId })),
      },
    },
    include: {
      participants: true,
    },
  });

  return conversation;
};
