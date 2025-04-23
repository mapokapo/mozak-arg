import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { answers } from "./lib/config/answers";
import { serveStatic } from "@hono/node-server/serve-static";
import { v4 as uuid } from "uuid";

/**
 * This is an ephemeral lookup table which maps temporary UUIDs to task indexes.
 * This is used to track the progress of the user through the tasks, preventing the user from advancing to the next task by just changing the URL in their browser.
 */
const taskUuidTempMap: Record<string, number> = {};

/**
 * This is a list of winning codes that are generated when the user wins the game.
 */
const winningCodes: string[] = [];

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

      if (taskIndex > answers.length) {
        return c.json({ error: "Task index out of range" }, 400);
      }

      const nextTaskHtml = await Bun.file(
        `./private/${taskIndex + 1}.html`
      ).text();
      return c.html(nextTaskHtml, 200, {
        "Content-Type": "text/html",
      });
    }
  )
  .post(
    "/mozak",
    zValidator(
      "json",
      z.object({
        currentSum: z.number().int().min(0).max(100),
      })
    ),
    c => {
      const { currentSum } = c.req.valid("json");

      let mozakInput = Math.floor(Math.random() * 9) + 1;
      if ((currentSum % 11) - 1 != 0) {
        mozakInput = (12 - (currentSum % 11)) % 11;
      }

      if (100 - (currentSum + mozakInput) >= 10) {
        // korisnik je pobijedio
        const winningCode = uuid();
        winningCodes.push(winningCode);

        return c.json({
          mozakInput,
          winningCode: winningCode,
        });
      }

      return c.json({
        mozakInput,
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

      if (taskIndex === answers.length) {
        const hasWon = winningCodes.some(code => code === answer);
        if (hasWon) {
          return c.json({ correct: true, hasWon: true }, 200);
        }
        return c.json({ correct: false, hasWon: false }, 200);
      }

      const correctAnswers = answers[taskIndex];

      if (correctAnswers === undefined) {
        return c.json({ error: "Task index out of range" }, 400);
      }

      let isCorrect = false;
      if (Array.isArray(correctAnswers)) {
        isCorrect = correctAnswers.some(
          correctAnswer =>
            correctAnswer.trim().toLowerCase() === answer.trim().toLowerCase()
        );
      } else {
        isCorrect =
          correctAnswers.trim().toLowerCase() === answer.trim().toLowerCase();
      }

      if (isCorrect) {
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

console.log(`Mode: ${process.env["NODE_ENV"] ?? "development"}`);
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
