import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  TextChannel,
} from "discord.js";
import { db } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Manage the verification system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set up the verification system")
        .addChannelOption((o) => o.setName("channel").setDescription("Verification channel").setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Role to give on verification").setRequired(true))
        .addStringOption((o) => o.setName("title").setDescription("Embed title").setRequired(false))
        .addStringOption((o) => o.setName("description").setDescription("Embed description").setRequired(false))
    )
    .addSubcommand((sub) => sub.setName("disable").setDescription("Disable verification")),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel", true);
      const role = interaction.options.getRole("role", true);
      const title = interaction.options.getString("title") ?? "✅ Verify Yourself";
      const description =
        interaction.options.getString("description") ??
        "Click the button below to verify and gain access to the server! 🔓";

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: interaction.guild!.name, iconURL: interaction.guild!.iconURL() ?? undefined })
        .setTimestamp();

      const button = new ButtonBuilder()
        .setCustomId("verify_button")
        .setLabel("✅ Verify")
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

      const textChannel = interaction.guild!.channels.cache.get(channel.id) as TextChannel;
      const sent = await textChannel.send({ embeds: [embed], components: [row] });

      db.set(guildId, {
        verifyChannelId: channel.id,
        verifyRoleId: role.id,
        verifyMessageId: sent.id,
        verifyEnabled: true,
      });

      await interaction.reply({
        content: `✅ Verification set up in <#${channel.id}>! Role: <@&${role.id}>`,
        ephemeral: true,
      });
    } else if (sub === "disable") {
      db.set(guildId, { verifyEnabled: false });
      await interaction.reply({ content: "✅ Verification disabled.", ephemeral: true });
    }
  },
};
