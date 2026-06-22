import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, GuildMember } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName("user").setDescription("User to ban").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Reason for ban").setRequired(false))
    .addIntegerOption((o) =>
      o.setName("days").setDescription("Days of messages to delete (0-7)").setRequired(false).setMinValue(0).setMaxValue(7)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember("user") as GuildMember | null;
    const userId = interaction.options.getUser("user", true).id;
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const days = interaction.options.getInteger("days") ?? 0;

    if (target && !target.bannable) {
      await interaction.reply({ content: "❌ I cannot ban this user!", ephemeral: true });
      return;
    }
    if (userId === interaction.user.id) {
      await interaction.reply({ content: "❌ You can't ban yourself!", ephemeral: true });
      return;
    }

    try {
      if (target) {
        await target.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xed4245)
              .setTitle(`🔨 Banned from ${interaction.guild!.name}`)
              .addFields({ name: "Reason", value: reason })
              .setTimestamp(),
          ],
        }).catch(() => {});
      }

      await interaction.guild!.members.ban(userId, { deleteMessageSeconds: days * 86400, reason });

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle("🔨 Member Banned")
            .addFields(
              { name: "User", value: `<@${userId}> (${userId})`, inline: true },
              { name: "Moderator", value: interaction.user.tag, inline: true },
              { name: "Reason", value: reason }
            )
            .setTimestamp(),
        ],
      });
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to ban: ${(err as Error).message}`, ephemeral: true });
    }
  },
};
