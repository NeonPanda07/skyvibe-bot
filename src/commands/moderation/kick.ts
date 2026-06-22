import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, GuildMember } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) => o.setName("user").setDescription("User to kick").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Reason for kick").setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember("user") as GuildMember;
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (!target) {
      await interaction.reply({ content: "❌ User not found in this server!", ephemeral: true });
      return;
    }
    if (!target.kickable) {
      await interaction.reply({ content: "❌ I cannot kick this user! They may have higher permissions.", ephemeral: true });
      return;
    }
    if (target.id === interaction.user.id) {
      await interaction.reply({ content: "❌ You can't kick yourself!", ephemeral: true });
      return;
    }

    try {
      await target.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle(`👢 Kicked from ${interaction.guild!.name}`)
            .addFields(
              { name: "Reason", value: reason },
              { name: "Moderator", value: interaction.user.tag }
            )
            .setTimestamp(),
        ],
      }).catch(() => {});

      await target.kick(reason);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle("👢 Member Kicked")
            .addFields(
              { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
              { name: "Moderator", value: interaction.user.tag, inline: true },
              { name: "Reason", value: reason }
            )
            .setTimestamp(),
        ],
      });
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to kick: ${(err as Error).message}`, ephemeral: true });
    }
  },
};
