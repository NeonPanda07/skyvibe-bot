import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, TextChannel } from "discord.js";
import { db, resolveMessage } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Manage the welcome system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set up the welcome message")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to send welcome messages").setRequired(true))
        .addStringOption((o) =>
          o
            .setName("message")
            .setDescription("Welcome message. Use {user}, {username}, {server}, {membercount}")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) => sub.setName("disable").setDescription("Disable welcome messages"))
    .addSubcommand((sub) => sub.setName("test").setDescription("Send a test welcome message")),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel", true);
      const message =
        interaction.options.getString("message") ??
        "Welcome {user} to **{server}**! 🎉 You are member #{membercount}!";
      db.set(guildId, { welcomeChannelId: channel.id, welcomeMessage: message, welcomeEnabled: true });
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("✅ Welcome Setup Complete!")
            .addFields(
              { name: "Channel", value: `<#${channel.id}>`, inline: true },
              { name: "Message Preview", value: message.substring(0, 500) }
            )
            .setFooter({ text: "Variables: {user} {username} {server} {membercount}" }),
        ],
        ephemeral: true,
      });
    } else if (sub === "disable") {
      db.set(guildId, { welcomeEnabled: false });
      await interaction.reply({ content: "✅ Welcome messages disabled.", ephemeral: true });
    } else if (sub === "test") {
      const settings = db.get(guildId);
      if (!settings.welcomeChannelId) {
        await interaction.reply({ content: "❌ Welcome not set up yet! Use `/welcome setup` first.", ephemeral: true });
        return;
      }
      const channel = interaction.guild!.channels.cache.get(settings.welcomeChannelId) as TextChannel;
      const msg = resolveMessage(settings.welcomeMessage ?? "Welcome {user} to **{server}**! 🎉", {
        user: `<@${interaction.user.id}>`,
        username: interaction.user.username,
        server: interaction.guild!.name,
        membercount: interaction.guild!.memberCount.toString(),
        tag: interaction.user.tag,
      });
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("👋 Welcome!")
        .setDescription(msg)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: `${interaction.guild!.name} • Test`, iconURL: interaction.guild!.iconURL() ?? undefined })
        .setTimestamp();
      await channel.send({ embeds: [embed] });
      await interaction.reply({ content: `✅ Test welcome sent to <#${settings.welcomeChannelId}>!`, ephemeral: true });
    }
  },
};
