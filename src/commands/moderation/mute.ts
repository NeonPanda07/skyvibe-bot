import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, GuildMember } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Timeout (mute) a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("user").setDescription("User to mute").setRequired(true))
    .addIntegerOption((o) =>
      o.setName("duration").setDescription("Duration in minutes (default: 10)").setRequired(false).setMinValue(1).setMaxValue(40320)
    )
    .addStringOption((o) => o.setName("reason").setDescription("Reason for mute").setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember("user") as GuildMember;
    const duration = (interaction.options.getInteger("duration") ?? 10) * 60 * 1000;
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (!target) {
      await interaction.reply({ content: "❌ User not found!", ephemeral: true });
      return;
    }
    if (!target.moderatable) {
      await interaction.reply({ content: "❌ I cannot mute this user!", ephemeral: true });
      return;
    }

    try {
      await target.timeout(duration, reason);
      const unmuteAt = Math.floor((Date.now() + duration) / 1000);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xfee75c)
            .setTitle("🔇 Member Muted")
            .addFields(
              { name: "User", value: `${target.user.tag}`, inline: true },
              { name: "Moderator", value: interaction.user.tag, inline: true },
              { name: "Unmuted", value: `<t:${unmuteAt}:R>`, inline: true },
              { name: "Reason", value: reason }
            )
            .setTimestamp(),
        ],
      });
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to mute: ${(err as Error).message}`, ephemeral: true });
    }
  },
};
