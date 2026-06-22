import { GuildMember, PartialGuildMember, TextChannel, EmbedBuilder } from "discord.js";
import { db, resolveMessage } from "../database";

export default {
  name: "guildMemberUpdate",
  once: false,
  async execute(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
    const wasBoosting = oldMember.premiumSince !== null;
    const isBoosting = newMember.premiumSince !== null;

    if (!wasBoosting && isBoosting) {
      const guildId = newMember.guild.id;
      const settings = db.get(guildId);

      if (settings.boostEnabled && settings.boostChannelId) {
        const channel = newMember.guild.channels.cache.get(settings.boostChannelId) as TextChannel;
        if (channel) {
          const msg = resolveMessage(
            settings.boostMessage ?? "🚀 {user} just boosted **{server}**! Thank you so much! 💖",
            {
              user: `<@${newMember.id}>`,
              username: newMember.user.username,
              server: newMember.guild.name,
              membercount: newMember.guild.memberCount.toString(),
            }
          );
          const embed = new EmbedBuilder()
            .setColor(0xff73fa)
            .setTitle("🚀 Server Boosted!")
            .setDescription(msg)
            .setThumbnail(newMember.user.displayAvatarURL())
            .setFooter({ text: newMember.guild.name, iconURL: newMember.guild.iconURL() ?? undefined })
            .setTimestamp();
          await channel.send({ embeds: [embed] }).catch(console.error);
        }
      }
    }
  },
};
