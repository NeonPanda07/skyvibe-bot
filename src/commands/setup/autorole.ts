import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { db } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Manage the auto-role system (give role on join)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set up auto-role")
        .addRoleOption((o) => o.setName("role").setDescription("Role to auto-assign to new members").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("disable").setDescription("Disable auto-role"))
    .addSubcommand((sub) => sub.setName("info").setDescription("Show current auto-role")),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "setup") {
      const role = interaction.options.getRole("role", true);
      db.set(guildId, { autoRoleId: role.id, autoRoleEnabled: true });
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("✅ Auto-Role Setup!")
            .setDescription(`New members will automatically receive <@&${role.id}> when they join.`),
        ],
        ephemeral: true,
      });
    } else if (sub === "disable") {
      db.set(guildId, { autoRoleEnabled: false });
      await interaction.reply({ content: "✅ Auto-role disabled.", ephemeral: true });
    } else if (sub === "info") {
      const settings = db.get(guildId);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎭 Auto-Role Info")
        .addFields(
          { name: "Status", value: settings.autoRoleEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Role", value: settings.autoRoleId ? `<@&${settings.autoRoleId}>` : "Not set", inline: true }
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
