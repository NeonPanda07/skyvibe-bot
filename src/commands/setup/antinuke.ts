import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { db } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription("Manage the anti-nuke protection system")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Enable/configure anti-nuke")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable anti-nuke").setRequired(true))
        .addIntegerOption((o) =>
          o.setName("threshold").setDescription("Number of actions in 10s to trigger (default: 3)").setRequired(false).setMinValue(2).setMaxValue(10)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("addowner")
        .setDescription("Add an extra trusted owner (bypasses anti-nuke)")
        .addUserOption((o) => o.setName("user").setDescription("User to trust").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("removeowner")
        .setDescription("Remove a trusted owner")
        .addUserOption((o) => o.setName("user").setDescription("User to remove from trusted list").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("info").setDescription("Show anti-nuke settings")),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;
    const ownerId = interaction.guild!.ownerId;

    if (interaction.user.id !== ownerId) {
      const settings = db.get(guildId);
      const extraOwners = settings.antinukeExtraOwners ?? [];
      if (!extraOwners.includes(interaction.user.id)) {
        await interaction.reply({ content: "❌ Only the server owner or trusted owners can manage anti-nuke!", ephemeral: true });
        return;
      }
    }

    if (sub === "setup") {
      const enabled = interaction.options.getBoolean("enabled", true);
      const threshold = interaction.options.getInteger("threshold") ?? 3;
      db.set(guildId, { antinukeEnabled: enabled, antinukeThreshold: threshold });
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(enabled ? 0x57f287 : 0xed4245)
            .setTitle(`🛡️ Anti-Nuke ${enabled ? "Enabled" : "Disabled"}`)
            .setDescription(enabled ? `Anti-nuke is now active. Threshold: **${threshold} actions in 10 seconds**.` : "Anti-nuke protection is now disabled.")
            .setFooter({ text: "Protects against mass bans, kicks, channel/role deletions" }),
        ],
        ephemeral: true,
      });
    } else if (sub === "addowner") {
      const user = interaction.options.getUser("user", true);
      const settings = db.get(guildId);
      const extra = settings.antinukeExtraOwners ?? [];
      if (extra.includes(user.id)) {
        await interaction.reply({ content: `✅ <@${user.id}> is already a trusted owner!`, ephemeral: true });
        return;
      }
      if (extra.length >= 5) {
        await interaction.reply({ content: "❌ Maximum 5 extra owners allowed!", ephemeral: true });
        return;
      }
      db.set(guildId, { antinukeExtraOwners: [...extra, user.id] });
      await interaction.reply({ content: `✅ Added <@${user.id}> as a trusted anti-nuke owner!`, ephemeral: true });
    } else if (sub === "removeowner") {
      const user = interaction.options.getUser("user", true);
      const settings = db.get(guildId);
      db.set(guildId, { antinukeExtraOwners: (settings.antinukeExtraOwners ?? []).filter((id) => id !== user.id) });
      await interaction.reply({ content: `✅ Removed <@${user.id}> from trusted owners.`, ephemeral: true });
    } else if (sub === "info") {
      const settings = db.get(guildId);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🛡️ Anti-Nuke Info")
        .addFields(
          { name: "Status", value: settings.antinukeEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Threshold", value: `${settings.antinukeThreshold ?? 3} actions / 10s`, inline: true },
          { name: "Trusted Owners", value: (settings.antinukeExtraOwners ?? []).map((id) => `<@${id}>`).join(", ") || "None" }
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
