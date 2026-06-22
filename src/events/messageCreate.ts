import { Message, TextChannel, EmbedBuilder } from "discord.js";
import { db, spamTracker } from "../database";
import { getAIResponse } from "../ai";

const LINK_REGEX = /(https?:\/\/[^\s]+|discord\.gg\/[^\s]+|discord\.com\/invite\/[^\s]+)/gi;

export default {
  name: "messageCreate",
  once: false,
  async execute(message: Message) {
    if (!message.guild || message.author.bot) return;

    const guildId = message.guild.id;
    const settings = db.get(guildId);
    const content = message.content;
    const channel = message.channel;

    if (/^\+\S/.test(content)) {
      const query = content.slice(1).trim();
      if (query.length > 0) {
        try {
          if ("sendTyping" in channel) await (channel as TextChannel).sendTyping();
          const reply = await getAIResponse(query);
          await message.reply({ content: reply });
        } catch (err) {
          console.error("AI respond error:", err);
        }
        return;
      }
    }

    const member = message.member;
    if (!member) return;
    const isAdmin = member.permissions.has("Administrator");

    if (settings.antispamEnabled && !isAdmin) {
      const threshold = settings.antispamThreshold ?? 5;
      const interval = (settings.antispamInterval ?? 5) * 1000;
      const key = `${guildId}:${message.author.id}`;
      const now = Date.now();
      const times = spamTracker.get(key) ?? [];
      const recent = times.filter((t) => now - t < interval);
      recent.push(now);
      spamTracker.set(key, recent);
      if (recent.length >= threshold) {
        await message.delete().catch(() => {});
        if ("send" in channel) {
          const warn = await (channel as TextChannel).send({
            content: `⚠️ <@${message.author.id}> Slow down! You're sending messages too fast.`,
          });
          setTimeout(() => warn.delete().catch(() => {}), 5000);
        }
        spamTracker.set(key, []);
        return;
      }
    }

    if (settings.antilinkEnabled && !isAdmin) {
      const ignoredChannels = settings.antilinkIgnoredChannels ?? [];
      if (!ignoredChannels.includes(channel.id)) {
        const whitelist = settings.antilinkWhitelist ?? [];
        const links = content.match(LINK_REGEX);
        if (links) {
          const hasBlocked = links.some((link) => !whitelist.some((w) => link.includes(w)));
          if (hasBlocked) {
            await message.delete().catch(() => {});
            if ("send" in channel) {
              const warn = await (channel as TextChannel).send({
                content: `🔗 <@${message.author.id}> Links are not allowed here!`,
              });
              setTimeout(() => warn.delete().catch(() => {}), 5000);
            }
            return;
          }
        }
      }
    }

    if (settings.autoreacterEnabled && settings.autoreacterChannelId === channel.id) {
      const emojis = settings.autoreacterEmojis ?? [];
      for (const emoji of emojis) {
        await message.react(emoji).catch(() => {});
      }
    }

    if (settings.stickyMessages) {
      const sticky = settings.stickyMessages[channel.id];
      if (sticky && "send" in channel) {
        const tc = channel as TextChannel;
        if (sticky.lastMessageId) {
          await tc.messages.delete(sticky.lastMessageId).catch(() => {});
        }
        const sent = await tc.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xffd700)
              .setDescription(`📌 **Sticky Message**\n\n${sticky.content}`)
              .setFooter({ text: "📌 Pinned" }),
          ],
        });
        db.update(guildId, (s) => ({
          ...s,
          stickyMessages: {
            ...(s.stickyMessages ?? {}),
            [channel.id]: { content: sticky.content, lastMessageId: sent.id },
          },
        }));
      }
    }
  },
};
