import { GuildBan } from "discord.js";
import { db, getNukeEntry } from "../database";

const WINDOW_MS = 10_000;

function pruneOld(arr: number[]) {
  return arr.filter((t) => Date.now() - t < WINDOW_MS);
}

async function punishNuker(userId: string, guild: import("discord.js").Guild, guildId: string) {
  const settings = db.get(guildId);
  if (userId === guild.ownerId || (settings.antinukeExtraOwners ?? []).includes(userId)) return;
  const member = await guild.members.fetch(userId).catch(() => null);
  if (member) {
    await member.roles.set([], "Anti-Nuke: suspicious ban activity").catch(() => {});
    await member.timeout(24 * 60 * 60 * 1000, "Anti-Nuke: suspicious ban activity").catch(() => {});
  }
  console.log(`[AntiNuke] Punished ${userId} for mass banning in ${guildId}`);
}

export default {
  name: "guildBanAdd",
  once: false,
  async execute(ban: GuildBan) {
    const guildId = ban.guild.id;
    const settings = db.get(guildId);
    if (!settings.antinukeEnabled) return;
    const threshold = settings.antinukeThreshold ?? 3;
    const logs = await ban.guild.fetchAuditLogs({ type: 22 as import("discord.js").AuditLogEvent, limit: 1 }).catch(() => null);
    const executor = logs?.entries.first()?.executor;
    if (!executor || executor.bot) return;
    const entry = getNukeEntry(executor.id);
    entry.bans = [...pruneOld(entry.bans), Date.now()];
    if (entry.bans.length >= threshold) {
      await punishNuker(executor.id, ban.guild, guildId);
      entry.bans = [];
    }
  },
};
