import { DMChannel, NonThreadGuildBasedChannel } from "discord.js";
import { db, getNukeEntry } from "../database";

const WINDOW_MS = 10_000;
function pruneOld(arr: number[]) {
  return arr.filter((t) => Date.now() - t < WINDOW_MS);
}

export default {
  name: "channelDelete",
  once: false,
  async execute(channel: DMChannel | NonThreadGuildBasedChannel) {
    if (!("guild" in channel) || !channel.guild) return;
    const guild = channel.guild;
    const guildId = guild.id;
    const settings = db.get(guildId);
    if (!settings.antinukeEnabled) return;
    const threshold = settings.antinukeThreshold ?? 3;
    const logs = await guild.fetchAuditLogs({ type: 12 as import("discord.js").AuditLogEvent, limit: 1 }).catch(() => null);
    const executor = logs?.entries.first()?.executor;
    if (!executor || executor.bot) return;
    if (executor.id === guild.ownerId) return;
    const extra = settings.antinukeExtraOwners ?? [];
    if (extra.includes(executor.id)) return;
    const entry = getNukeEntry(executor.id);
    entry.channelDeletes = [...pruneOld(entry.channelDeletes), Date.now()];
    if (entry.channelDeletes.length >= threshold) {
      const member = await guild.members.fetch(executor.id).catch(() => null);
      if (member) {
        await member.roles.set([], "Anti-Nuke: mass channel deletion").catch(() => {});
        await member.timeout(24 * 60 * 60 * 1000, "Anti-Nuke: mass channel deletion").catch(() => {});
      }
      entry.channelDeletes = [];
    }
  },
};
