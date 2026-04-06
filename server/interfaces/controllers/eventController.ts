import { Request, Response } from "express";
import {
  createEventSchema,
  getEventsQuerySchema,
  updateEventSchema,
} from "../../validation/eventSchemas.js";
import { createEvent } from "../../application/use-cases/event/createEvent.js";
import { getEvents } from "../../application/use-cases/event/getEvents.js";
import { updateEvent } from "../../application/use-cases/event/updateEvent.js";
import { deleteEvent } from "../../application/use-cases/event/deleteEvent.js";

export const create = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const data = createEventSchema.parse(req.body);

  const event = await createEvent({ userId, ...data });

  res.status(201).json(event);
};

export const getAll = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const query = getEventsQuerySchema.parse(req.query);

  const events = await getEvents({ userId, ...query });

  res.json(events);
};

export const update = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const eventId = Number(req.params.id);

  const data = updateEventSchema.parse(req.body);

  await updateEvent({ userId, eventId, data });

  res.sendStatus(204);
};

export const remove = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const eventId = Number(req.params.id);

  await deleteEvent(userId, eventId);

  res.sendStatus(204);
};
