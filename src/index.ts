import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import fs from "fs";
import path from "path";
import http from "http";
import { BotClient, Command } from "./types";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildWebhooks,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember],
}) as BotClient;

client.commands = new Collection<string, Command>();

const commandsPath = path.join(__dirname, "commands");

function loadCommandsFromDir(dir: string) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      loadCommandsFromDir(path.join(dir, item.name));
    } else if (item.name.endsWith(".ts") || item.name.endsWith(".js")) {
      const filePath = path.join(dir, item.name);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(filePath);
      const command: Command = mod.default ?? mod;
      if (command?.data && typeof command.execute === "function") {
        client.commands.set(command.data.name, command);
      }
    }
  }
}

if (fs.existsSync(commandsPath)) {
  loadCommandsFromDir(commandsPath);
}

const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
  for (const file of eventFiles) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(path.join(eventsPath, file));
    const handler = mod.default ?? mod;
    if (handler?.name && typeof handler.execute === "function") {
      if (handler.once) {
        client.once(handler.name, (...args: unknown[]) => handler.execute(...args, client));
      } else {
        client.on(handler.name, (...args: unknown[]) => handler.execute(...args, client));
      }
    }
  }
}

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("SkyVibe is alive! 🌊✨");
});
server.listen(PORT, () => {
  console.log(`🌐 Keep-alive server running on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN).catch(console.error);
