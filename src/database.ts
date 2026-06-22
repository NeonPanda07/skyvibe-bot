import fs from "fs";
import path from "path";
import { GuildSettings } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const GUILDS_FILE = path.join(DATA_DIR, "guilds.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Database {
  private data: Record<string, GuildSettings> = {};

  constructor() {
    this.load();
  }

  private load() {
    if (fs.existsSync(GUILDS_FILE)) {
      try {
        this.data = JSON.parse(fs.readFileSync(GUILDS_FILE, "utf-8"));
      } catch {
        this.data = {};
      }
    }
  }

  private save() {
    try {
      fs.writeFileSync(GUILDS_FILE, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error("DB save error:", err);
    }
  }

  get(guildId: string): GuildSettings {
    return this.data[guildId] ?? {};
  }

  set(guildId: string, settings: Partial<GuildSettings>): GuildSettings {
    this.data[guildId] = { ...this.get(guildId), ...settings };
    this.save();
    return this.data[guildId];
  }

  update(guildId: string, updater: (s: GuildSettings) => GuildSettings): GuildSettings {
    this.data[guildId] = updater(this.get(guildId));
    this.save();
    return this.data[guildId];
  }
}

export const db = new Database();

export const spamTracker = new Map<string, number[]>();

export const nukeTracker = new Map<
  string,
  { bans: number[]; kicks: number[]; channelDeletes: number[]; roleDeletes: number[] }
>();

export function getNukeEntry(userId: string) {
  if (!nukeTracker.has(userId)) {
    nukeTracker.set(userId, { bans: [], kicks: [], channelDeletes: [], roleDeletes: [] });
  }
  return nukeTracker.get(userId)!;
}

export function resolveMessage(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}
