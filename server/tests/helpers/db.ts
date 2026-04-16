import prisma from '../../infrastructure/database/prismaClient.js';

export async function cleanupDatabase() {
  await prisma.notification.deleteMany();
  await prisma.friendRequest.deleteMany();

  await prisma.reaction.deleteMany();
  await prisma.messageDelivery.deleteMany();
  await prisma.messageView.deleteMany();
  await prisma.pinnedMessage.deleteMany();
  await prisma.pinnedConversation.deleteMany();
  await prisma.mediaFile.deleteMany();
  await prisma.message.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.conversation.deleteMany();

  await prisma.postTag.deleteMany();
  await prisma.tagAlias.deleteMany();
  await prisma.tag.deleteMany();

  await prisma.savedPost.deleteMany();
  await prisma.like.deleteMany();
  await prisma.commentLike.deleteMany();
  await prisma.commentReport.deleteMany();
  await prisma.postReport.deleteMany();
  await prisma.feedInteraction.deleteMany();

  await prisma.comment.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();
  await prisma.userSanction.deleteMany();

  await prisma.user.deleteMany();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}