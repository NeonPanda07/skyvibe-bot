import { GuildMember, TextChannel, EmbedBuilder } from "discord.js";
import { db, resolveMessage } from "../database";

export default {
  name: "guildMemberAdd",
  once: false,
  async execute(member: GuildMember) {
    const guildId = member.guild.id;
    const settings = db.get(guildId);

    if (settings.welcomeEnabled && settings.welcomeChannelId) {
      const channel = member.guild.channels.cache.get(settings.welcomeChannelId) as TextChannel;
      if (channel) {
        const msg = resolveMessage(settings.welcomeMessage ?? "Welcome {user} to **{server}**! 🎉 You are member #{membercount}!", {
          user: `<@${member.id}>`,
          username: member.user.username,
          server: member.guild.name,
          membercount: member.guild.memberCount.toString(),
          tag: member.user.tag,
        });
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("👋 Welcome!")
          .setDescription(msg)
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() ?? undefined })
          .setTimestamp();
        await channel.send({ embeds: [embed] }).catch(console.error);
      }
    }

    if (settings.autoRoleEnabled && settings.autoRoleId) {
      const role = member.guild.roles.cache.get(settings.autoRoleId);
      if (role) {
        await member.roles.add(role).catch(console.error);
      }
    }
  },
};
