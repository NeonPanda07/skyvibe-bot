import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, GuildMember } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("softban")
    .setDescription("Softban a member (ban + instant unban to delete their messages)")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName("user").setDescription("User to softban").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Reason for softban").setRequired(false))
    .addIntegerOption((o) =>
      o.setName("days").setDescription("Days of messages to delete (0-7, default: 1)").setRequired(false).setMinValue(0).setMaxValue(7)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember("user") as GuildMember;
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const days = interaction.options.getInteger("days") ?? 1;

    if (!target) {
      await interaction.reply({ content: "❌ User not found!", ephemeral: true });
      return;
    }
    if (!target.bannable) {
      await interaction.reply({ content: "❌ I cannot ban this user!", ephemeral: true });
      return;
    }

    try {
      await target.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff6600)
            .setTitle(`🔨 Softbanned from ${interaction.guild!.name}`)
            .setDescription("You were softbanned — this means your recent messages were deleted. You may rejoin.")
            .addFields({ name: "Reason", value: reason })
            .setTimestamp(),
        ],
      }).catch(() => {});

      await interaction.guild!.members.ban(target.id, { deleteMessageSeconds: days * 86400, reason: `Softban: ${reason}` });
      await interaction.guild!.members.unban(target.id, "Softban — instant unban");

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff6600)
            .setTitle("🔨 Member Softbanned")
            .addFields(
              { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
              { name: "Moderator", value: interaction.user.tag, inline: true },
              { name: "Messages Deleted", value: `${days} day(s)`, inline: true },
              { name: "Reason", value: reason }
            )
            .setTimestamp(),
        ],
      });
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to softban: ${(err as Error).message}`, ephemeral: true });
    }
  },
};
