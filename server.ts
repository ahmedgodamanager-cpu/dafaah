import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export const DRIVE_PRESETS = {
  MAIN_FOLDER: "https://drive.google.com/drive/folders/1SSvYU_96whB2JDDocMYL0jVWR_QUrw5V?usp=drive_link",
  FOLDER_2025: "https://drive.google.com/drive/folders/1SSvYU_96whB2JDDocMYL0jVWR_QUrw5V?usp=drive_link",
  FOLDER_2026: "https://drive.google.com/drive/folders/1SSvYU_96whB2JDDocMYL0jVWR_QUrw5V?usp=drive_link",
};

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
