import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user by their ID")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((o) => o.setName("userid").setDescription("User ID to unban").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Reason for unban").setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString("userid", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    try {
      await interaction.guild!.members.unban(userId, reason);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("✅ User Unbanned")
            .addFields(
              { name: "User ID", value: userId, inline: true },
              { name: "Moderator", value: interaction.user.tag, inline: true },
              { name: "Reason", value: reason }
            )
            .setTimestamp(),
        ],
      });
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to unban: ${(err as Error).message}`, ephemeral: true });
    }
  },
};
