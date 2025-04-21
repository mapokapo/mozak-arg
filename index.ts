import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { answers } from "./lib/config/answers";
import { randomUUIDv7 as uuid } from "bun";
import { serveStatic } from "hono/bun";

/**
 * This is an ephemeral lookup table which maps temporary UUIDs to task indexes.
 * This is used to track the progress of the user through the tasks, preventing the user from advancing to the next task by just changing the URL in their browser.
 */
const taskUuidTempMap: Record<string, number> = {};

const app = new Hono()
  .get(
    "/task/:uuid",
    zValidator(
      "param",
      z.object({
        uuid: z.string().uuid(),
      })
    ),
    async c => {
      const { uuid } = c.req.valid("param");

      const taskIndex = taskUuidTempMap[uuid];

      if (taskIndex === undefined) {
        return c.json({ error: "Task not found" }, 404);
      }

      if (taskIndex >= answers.length) {
        return c.json({ error: "Task index out of range" }, 400);
      }

      const nextTaskHtml = await Bun.file(`./private/${taskIndex}.html`).text();
      return c.html(nextTaskHtml, 200, {
        "Content-Type": "text/html",
      });
    }
  )
  .post(
    "/solve",
    zValidator(
      "json",
      z.object({
        taskIndex: z.number().int().min(0),
        answer: z.string().min(1),
      })
    ),
    c => {
      const { taskIndex, answer } = c.req.valid("json");

      const correctAnswer = answers[taskIndex];

      if (correctAnswer === undefined) {
        return c.json({ error: "Task index out of range" }, 400);
      }

      if (correctAnswer.trim().toLowerCase() === answer.trim().toLowerCase()) {
        const nextTaskTempUuid = uuid();
        taskUuidTempMap[nextTaskTempUuid] = taskIndex + 1;

        return c.json({ correct: true, nextTaskUrl: nextTaskTempUuid }, 200);
      }

      return c.json({ correct: false }, 200);
    }
  );

app.use(
  serveStatic({
    root: "./public",
  })
);

if (process.env["NODE_ENV"] !== "production") {
  app.use(
    serveStatic({
      root: "./private",
    })
  );
}

export default {
  fetch: app.fetch,
  port: process.env["PORT"] ?? 5000,
};
