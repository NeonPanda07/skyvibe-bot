import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, TextChannel } from "discord.js";
import { db, resolveMessage } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("boost")
    .setDescription("Manage the boost message system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set up boost messages")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel for boost messages").setRequired(true))
        .addStringOption((o) =>
          o.setName("message").setDescription("Boost message. Use {user}, {username}, {server}").setRequired(false)
        )
    )
    .addSubcommand((sub) => sub.setName("disable").setDescription("Disable boost messages"))
    .addSubcommand((sub) => sub.setName("test").setDescription("Send a test boost message")),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel", true);
      const message =
        interaction.options.getString("message") ??
        "🚀 {user} just boosted **{server}**! Thank you so much! 💖";
      db.set(guildId, { boostChannelId: channel.id, boostMessage: message, boostEnabled: true });
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff73fa)
            .setTitle("✅ Boost Setup Complete!")
            .addFields(
              { name: "Channel", value: `<#${channel.id}>`, inline: true },
              { name: "Message", value: message.substring(0, 500) }
            )
            .setFooter({ text: "Variables: {user} {username} {server}" }),
        ],
        ephemeral: true,
      });
    } else if (sub === "disable") {
      db.set(guildId, { boostEnabled: false });
      await interaction.reply({ content: "✅ Boost messages disabled.", ephemeral: true });
    } else if (sub === "test") {
      const settings = db.get(guildId);
      if (!settings.boostChannelId) {
        await interaction.reply({ content: "❌ Boost not set up yet! Use `/boost setup` first.", ephemeral: true });
        return;
      }
      const channel = interaction.guild!.channels.cache.get(settings.boostChannelId) as TextChannel;
      const msg = resolveMessage(settings.boostMessage ?? "🚀 {user} just boosted **{server}**! 💖", {
        user: `<@${interaction.user.id}>`,
        username: interaction.user.username,
        server: interaction.guild!.name,
        membercount: interaction.guild!.memberCount.toString(),
      });
      const embed = new EmbedBuilder()
        .setColor(0xff73fa)
        .setTitle("🚀 Server Boosted!")
        .setDescription(msg)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: `${interaction.guild!.name} • Test`, iconURL: interaction.guild!.iconURL() ?? undefined })
        .setTimestamp();
      await channel.send({ embeds: [embed] });
      await interaction.reply({ content: `✅ Test boost sent to <#${settings.boostChannelId}>!`, ephemeral: true });
    }
  },
};
