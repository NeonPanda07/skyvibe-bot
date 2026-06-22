import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { db } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("antispam")
    .setDescription("Manage the anti-spam system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Configure anti-spam")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable anti-spam").setRequired(true))
        .addIntegerOption((o) =>
          o.setName("threshold").setDescription("Messages before triggering (default: 5)").setRequired(false).setMinValue(2).setMaxValue(20)
        )
        .addIntegerOption((o) =>
          o.setName("interval").setDescription("Time window in seconds (default: 5)").setRequired(false).setMinValue(1).setMaxValue(30)
        )
    )
    .addSubcommand((sub) => sub.setName("info").setDescription("Show anti-spam settings")),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "setup") {
      const enabled = interaction.options.getBoolean("enabled", true);
      const threshold = interaction.options.getInteger("threshold") ?? 5;
      const interval = interaction.options.getInteger("interval") ?? 5;
      db.set(guildId, { antispamEnabled: enabled, antispamThreshold: threshold, antispamInterval: interval });
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(enabled ? 0x57f287 : 0xed4245)
            .setTitle(`🚫 Anti-Spam ${enabled ? "Enabled" : "Disabled"}`)
            .addFields(
              { name: "Threshold", value: `${threshold} messages`, inline: true },
              { name: "Interval", value: `${interval} seconds`, inline: true }
            )
            .setDescription(enabled ? `Messages will be deleted if a user sends more than **${threshold}** in **${interval}s**.` : "Anti-spam is now disabled."),
        ],
        ephemeral: true,
      });
    } else if (sub === "info") {
      const settings = db.get(guildId);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🚫 Anti-Spam Info")
        .addFields(
          { name: "Status", value: settings.antispamEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Threshold", value: `${settings.antispamThreshold ?? 5} messages`, inline: true },
          { name: "Interval", value: `${settings.antispamInterval ?? 5} seconds`, inline: true }
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
