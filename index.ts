import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { answers } from "./lib/config/answers";
import { randomUUIDv7 as uuid } from "bun";
import { serveStatic } from "hono/bun";

const app = new Hono()
  .get("/test", (c) => {
    return c.json({ message: "Hello World" });
  })
  .post(
    "/solve",
    zValidator(
      "json",
      z.object({
        questionIndex: z.number().int().min(0),
        answer: z.string().min(1),
      })
    ),
    (c) => {
      const { questionIndex, answer } = c.req.valid("json");

      const correctAnswer = answers[questionIndex];

      if (correctAnswer === undefined) {
        return c.json({ error: "Question index out of range" }, 400);
      }

      if (correctAnswer.trim().toLowerCase() === answer.trim().toLowerCase()) {
        return c.json({ correct: true, nextTaskUrl: uuid() }, 200);
      }

      return c.json({ correct: false }, 400);
    }
  );

app.use(
  serveStatic({
    root: "./public",
  })
);

export default {
  fetch: app.fetch,
  port: process.env.PORT ?? 5000,
};
