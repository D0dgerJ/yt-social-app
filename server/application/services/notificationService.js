import { createNotification } from "../use-cases/notification/createNotification.js";

/**
 * Централизованная функция создания уведомлений
 * @param {Object} options
 * @param {number} options.fromUserId - ID пользователя, который инициировал действие
 * @param {number} options.toUserId - ID пользователя, которому отправляется уведомление
 * @param {string} options.type - Тип уведомления (например, "like", "comment", "follow")
 * @param {string} options.content - Текст уведомления
 */
export const notify = async ({ fromUserId, toUserId, type, content }) => {
  if (fromUserId === toUserId) return; // не уведомляем самого себя
  try {
    await createNotification(fromUserId, toUserId, type, content);
  } catch (err) {
    console.error("Failed to create notification:", err.message);
    // лог можно записывать через winston/pino
  }
};