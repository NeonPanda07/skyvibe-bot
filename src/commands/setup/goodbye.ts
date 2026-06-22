import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, TextChannel } from "discord.js";
import { db, resolveMessage } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("goodbye")
    .setDescription("Manage the goodbye/leave message system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set up goodbye messages")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to send goodbye messages").setRequired(true))
        .addStringOption((o) =>
          o
            .setName("message")
            .setDescription("Goodbye message. Use {user}, {username}, {server}, {membercount}")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) => sub.setName("disable").setDescription("Disable goodbye messages"))
    .addSubcommand((sub) => sub.setName("test").setDescription("Send a test goodbye message")),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel", true);
      const message =
        interaction.options.getString("message") ??
        "**{username}** has left **{server}**. 👋 Goodbye!";
      db.set(guildId, { goodbyeChannelId: channel.id, goodbyeMessage: message, goodbyeEnabled: true });
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("✅ Goodbye Setup Complete!")
            .addFields(
              { name: "Channel", value: `<#${channel.id}>`, inline: true },
              { name: "Message Preview", value: message.substring(0, 500) }
            )
            .setFooter({ text: "Variables: {user} {username} {server} {membercount}" }),
        ],
        ephemeral: true,
      });
    } else if (sub === "disable") {
      db.set(guildId, { goodbyeEnabled: false });
      await interaction.reply({ content: "✅ Goodbye messages disabled.", ephemeral: true });
    } else if (sub === "test") {
      const settings = db.get(guildId);
      if (!settings.goodbyeChannelId) {
        await interaction.reply({ content: "❌ Goodbye not set up yet! Use `/goodbye setup` first.", ephemeral: true });
        return;
      }
      const channel = interaction.guild!.channels.cache.get(settings.goodbyeChannelId) as TextChannel;
      const msg = resolveMessage(settings.goodbyeMessage ?? "**{username}** has left **{server}**. 👋", {
        user: `<@${interaction.user.id}>`,
        username: interaction.user.username,
        server: interaction.guild!.name,
        membercount: interaction.guild!.memberCount.toString(),
        tag: interaction.user.tag,
      });
      const embed = new EmbedBuilder()
        .setColor(0xff4444)
        .setTitle("👋 Goodbye!")
        .setDescription(msg)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: `${interaction.guild!.name} • Test`, iconURL: interaction.guild!.iconURL() ?? undefined })
        .setTimestamp();
      await channel.send({ embeds: [embed] });
      await interaction.reply({ content: `✅ Test goodbye sent to <#${settings.goodbyeChannelId}>!`, ephemeral: true });
    }
  },
};
