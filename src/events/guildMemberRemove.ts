import { GuildMember, PartialGuildMember, TextChannel, EmbedBuilder } from "discord.js";
import { db, resolveMessage } from "../database";

export default {
  name: "guildMemberRemove",
  once: false,
  async execute(member: GuildMember | PartialGuildMember) {
    if (!member.guild) return;
    const guildId = member.guild.id;
    const settings = db.get(guildId);

    if (settings.goodbyeEnabled && settings.goodbyeChannelId) {
      const channel = member.guild.channels.cache.get(settings.goodbyeChannelId) as TextChannel;
      if (channel) {
        const msg = resolveMessage(settings.goodbyeMessage ?? "**{username}** has left **{server}**. 👋 Goodbye!", {
          user: `<@${member.id}>`,
          username: member.user?.username ?? "Unknown",
          server: member.guild.name,
          membercount: member.guild.memberCount.toString(),
          tag: member.user?.tag ?? "Unknown",
        });
        const embed = new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle("👋 Goodbye!")
          .setDescription(msg)
          .setThumbnail(member.user?.displayAvatarURL() ?? null)
          .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() ?? undefined })
          .setTimestamp();
        await channel.send({ embeds: [embed] }).catch(console.error);
      }
    }
  },
};
