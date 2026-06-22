import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { db } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("autoreacter")
    .setDescription("Manage auto-reactions in a specific channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set up auto-reactions")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to auto-react in").setRequired(true))
        .addStringOption((o) =>
          o.setName("emojis").setDescription("Emojis to react with, space-separated (e.g. 👍 ❤️ 🔥)").setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName("disable").setDescription("Disable auto-reactions"))
    .addSubcommand((sub) => sub.setName("info").setDescription("Show current auto-reacter settings")),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel", true);
      const emojiStr = interaction.options.getString("emojis", true);
      const emojis = emojiStr.split(/\s+/).filter((e) => e.length > 0).slice(0, 10);
      db.set(guildId, { autoreacterChannelId: channel.id, autoreacterEmojis: emojis, autoreacterEnabled: true });
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("✅ Auto-Reacter Setup!")
            .addFields(
              { name: "Channel", value: `<#${channel.id}>`, inline: true },
              { name: "Emojis", value: emojis.join(" "), inline: true }
            )
            .setFooter({ text: "Bot will react to every message in this channel" }),
        ],
        ephemeral: true,
      });
    } else if (sub === "disable") {
      db.set(guildId, { autoreacterEnabled: false });
      await interaction.reply({ content: "✅ Auto-reacter disabled.", ephemeral: true });
    } else if (sub === "info") {
      const settings = db.get(guildId);
      if (!settings.autoreacterChannelId) {
        await interaction.reply({ content: "❌ Auto-reacter not set up!", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🔄 Auto-Reacter Info")
        .addFields(
          { name: "Status", value: settings.autoreacterEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Channel", value: `<#${settings.autoreacterChannelId}>`, inline: true },
          { name: "Emojis", value: (settings.autoreacterEmojis ?? []).join(" ") || "None" }
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
