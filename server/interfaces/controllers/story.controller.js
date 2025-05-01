import createStory from "../../application/use-cases/story/createStory.js";
import getUserStories from "../../application/use-cases/story/getUserStories.js";
import getFeedStories from "../../application/use-cases/story/getFeedStories.js";
import deleteStory from "../../application/use-cases/story/deleteStory.js";
import { getFriendStories, viewStory } from "./../application/use-cases/story/getFriendStories.js";

export const createStoryController = async (req, res) => {
  try {
    const newStory = await createStory(req.user.id, req.body);
    res.status(201).json(newStory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserStoriesController = async (req, res) => {
  try {
    const stories = await getUserStories(Number(req.params.userId));
    res.status(200).json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFeedStoriesController = async (req, res) => {
  try {
    const stories = await getFeedStories(req.user.id);
    res.status(200).json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteStoryController = async (req, res) => {
  try {
    await deleteStory(req.user.id, Number(req.params.storyId));
    res.status(200).json({ message: "Story deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStoriesOfFriends = async (req, res) => {
  try {
    const stories = await getFriendStories(req.user.id);
    res.status(200).json(stories);
  } catch (err) {
    res.status(500).json({ error: "Failed to get friend stories" });
  }
};

export const handleViewStory = async (req, res) => {
  const { storyId } = req.params;
  const userId = req.user.id;

  try {
    await viewStory(userId, storyId);
    res.status(200).json({ message: "Просмотр добавлен" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};