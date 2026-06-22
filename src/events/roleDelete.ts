import { Role } from "discord.js";
import { db, getNukeEntry } from "../database";

const WINDOW_MS = 10_000;
function pruneOld(arr: number[]) {
  return arr.filter((t) => Date.now() - t < WINDOW_MS);
}

export default {
  name: "roleDelete",
  once: false,
  async execute(role: Role) {
    const guild = role.guild;
    const guildId = guild.id;
    const settings = db.get(guildId);
    if (!settings.antinukeEnabled) return;
    const threshold = settings.antinukeThreshold ?? 3;
    const logs = await guild.fetchAuditLogs({ type: 32 as import("discord.js").AuditLogEvent, limit: 1 }).catch(() => null);
    const executor = logs?.entries.first()?.executor;
    if (!executor || executor.bot) return;
    if (executor.id === guild.ownerId) return;
    const extra = settings.antinukeExtraOwners ?? [];
    if (extra.includes(executor.id)) return;
    const entry = getNukeEntry(executor.id);
    entry.roleDeletes = [...pruneOld(entry.roleDeletes), Date.now()];
    if (entry.roleDeletes.length >= threshold) {
      const member = await guild.members.fetch(executor.id).catch(() => null);
      if (member) {
        await member.roles.set([], "Anti-Nuke: mass role deletion").catch(() => {});
        await member.timeout(24 * 60 * 60 * 1000, "Anti-Nuke: mass role deletion").catch(() => {});
      }
      entry.roleDeletes = [];
    }
  },
};
