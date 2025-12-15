import axiosInstance from "./axiosInstance";

export type EventDTO = {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateEventPayload = {
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  allDay?: boolean;
  color?: string;
};

export type UpdateEventPayload = Partial<CreateEventPayload>;

export const eventsApi = {
  getRange: (from: string, to: string) =>
    axiosInstance.get<EventDTO[]>("/events", {
      params: { from, to },
    }),

  create: (payload: CreateEventPayload) =>
    axiosInstance.post<EventDTO>("/events", payload),

  update: (id: number, payload: UpdateEventPayload) =>
    axiosInstance.patch(`/events/${id}`, payload),

  remove: (id: number) =>
    axiosInstance.delete(`/events/${id}`),
};
