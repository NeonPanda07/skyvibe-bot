import "dotenv/config";
import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;

const commands: unknown[] = [];

function loadFromDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      loadFromDir(path.join(dir, item.name));
    } else if (item.name.endsWith(".ts") || item.name.endsWith(".js")) {
      const cmd = require(path.join(dir, item.name));
      const handler = cmd.default ?? cmd;
      if (handler?.data) commands.push(handler.data.toJSON());
    }
  }
}

loadFromDir(path.join(__dirname, "commands"));

const rest = new REST().setToken(token);

(async () => {
  console.log(`📤 Registering ${commands.length} slash commands globally...`);
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log("✅ Slash commands registered successfully!");
})().catch(console.error);
