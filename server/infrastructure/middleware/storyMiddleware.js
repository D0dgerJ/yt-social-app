import prisma from "../database/prismaClient.js";

export const verifyStoryOwnership = async (req, res, next) => {
  const storyId = Number(req.params.storyId);
  const userId = req.user.id;

  try {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    if (story.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
