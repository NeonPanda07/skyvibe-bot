import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { db } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("antilink")
    .setDescription("Manage the anti-link system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Enable or disable anti-link")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable anti-link").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("whitelist")
        .setDescription("Add a domain to the whitelist (allowed)")
        .addStringOption((o) => o.setName("domain").setDescription("Domain to allow (e.g. youtube.com)").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("unwhitelist")
        .setDescription("Remove a domain from the whitelist")
        .addStringOption((o) => o.setName("domain").setDescription("Domain to remove").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("ignore")
        .setDescription("Ignore a channel from anti-link")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to ignore").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("info").setDescription("Show anti-link settings")),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "setup") {
      const enabled = interaction.options.getBoolean("enabled", true);
      db.set(guildId, { antilinkEnabled: enabled });
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(enabled ? 0x57f287 : 0xed4245)
            .setTitle(`🔗 Anti-Link ${enabled ? "Enabled" : "Disabled"}`)
            .setDescription(enabled ? "Links will be deleted from members without Administrator." : "Anti-link is now disabled."),
        ],
        ephemeral: true,
      });
    } else if (sub === "whitelist") {
      const domain = interaction.options.getString("domain", true).toLowerCase();
      const settings = db.get(guildId);
      const list = settings.antilinkWhitelist ?? [];
      if (!list.includes(domain)) {
        db.set(guildId, { antilinkWhitelist: [...list, domain] });
      }
      await interaction.reply({ content: `✅ **${domain}** added to whitelist!`, ephemeral: true });
    } else if (sub === "unwhitelist") {
      const domain = interaction.options.getString("domain", true).toLowerCase();
      const settings = db.get(guildId);
      db.set(guildId, { antilinkWhitelist: (settings.antilinkWhitelist ?? []).filter((d) => d !== domain) });
      await interaction.reply({ content: `✅ **${domain}** removed from whitelist!`, ephemeral: true });
    } else if (sub === "ignore") {
      const channel = interaction.options.getChannel("channel", true);
      const settings = db.get(guildId);
      const ignored = settings.antilinkIgnoredChannels ?? [];
      if (!ignored.includes(channel.id)) {
        db.set(guildId, { antilinkIgnoredChannels: [...ignored, channel.id] });
      }
      await interaction.reply({ content: `✅ <#${channel.id}> is now ignored by anti-link!`, ephemeral: true });
    } else if (sub === "info") {
      const settings = db.get(guildId);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🔗 Anti-Link Info")
        .addFields(
          { name: "Status", value: settings.antilinkEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Whitelisted Domains", value: (settings.antilinkWhitelist ?? []).join(", ") || "None" },
          { name: "Ignored Channels", value: (settings.antilinkIgnoredChannels ?? []).map((id) => `<#${id}>`).join(", ") || "None" }
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
