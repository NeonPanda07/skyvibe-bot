import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, GuildMember } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove a timeout (unmute) from a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("user").setDescription("User to unmute").setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember("user") as GuildMember;

    if (!target) {
      await interaction.reply({ content: "❌ User not found!", ephemeral: true });
      return;
    }
    if (!target.isCommunicationDisabled()) {
      await interaction.reply({ content: "❌ This user is not muted!", ephemeral: true });
      return;
    }

    try {
      await target.timeout(null);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("🔊 Member Unmuted")
            .addFields(
              { name: "User", value: `${target.user.tag}`, inline: true },
              { name: "Moderator", value: interaction.user.tag, inline: true }
            )
            .setTimestamp(),
        ],
      });
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to unmute: ${(err as Error).message}`, ephemeral: true });
    }
  },
};
