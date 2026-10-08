import "dotenv/config";
import cors from "cors";
import express from "express";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { generateQuests, validatePreferences } from "./quests.js";

export const app = express();
const port = Number(process.env.PORT || 5001);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "TouchGrass API is running" });
});

app.get("/api/health", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "unavailable",
    database: databaseConnected ? "connected" : "disconnected",
  });
});

app.post("/api/quests", async (req, res) => {
  const validation = validatePreferences(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const result = await generateQuests(validation.value);
    return res.json(result);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`Ollama quest generation failed: ${reason}`);
    return res.status(503).json({
      error: "Ollama could not generate quests. Check that it is running and OLLAMA_MODEL names an installed model, then try again.",
    });
  }
});

export async function startServer() {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  await connectDB();

  const server = app.listen(port, () => {
    console.log(`TouchGrass API listening on  http://localhost:${port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received; closing server`);
    server.close(async (error) => {
      if (error) {
        console.error("Failed to close the HTTP server:", error.message);
        process.exitCode = 1;
      }

      try {
        await mongoose.disconnect();
      } catch (disconnectError) {
        console.error("Failed to disconnect from MongoDB:", disconnectError.message);
        process.exitCode = 1;
      }
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  startServer().catch((error) => {
    const safeMessage = error.message.replace(
      /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi,
      "[redacted MongoDB URI]",
    );
    console.error(`Backend startup failed (${error.name}): ${safeMessage}`);
    process.exitCode = 1;
  });
}