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
    .setName("review")
    .setDescription("Manage the review system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set up the review system")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to log reviews").setRequired(true))
        .addChannelOption((o) =>
          o.setName("panel").setDescription("Channel to post the review panel (optional)").setRequired(false)
        )
    )
    .addSubcommand((sub) => sub.setName("disable").setDescription("Disable the review system")),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "setup") {
      const logChannel = interaction.options.getChannel("channel", true);
      const panelChannel = interaction.options.getChannel("panel");
      db.set(guildId, { reviewChannelId: logChannel.id, reviewEnabled: true });

      if (panelChannel) {
        const embed = new EmbedBuilder()
          .setColor(0xfee75c)
          .setTitle("⭐ Leave a Review!")
          .setDescription("How would you rate your experience? Click a star below!")
          .setFooter({ text: interaction.guild!.name });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId("review_1").setLabel("⭐").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("review_2").setLabel("⭐⭐").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("review_3").setLabel("⭐⭐⭐").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("review_4").setLabel("⭐⭐⭐⭐").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("review_5").setLabel("⭐⭐⭐⭐⭐").setStyle(ButtonStyle.Success)
        );

        const pc = interaction.guild!.channels.cache.get(panelChannel.id) as TextChannel;
        await pc.send({ embeds: [embed], components: [row] });
      }

      await interaction.reply({
        content: `✅ Review system set up! Reviews will log in <#${logChannel.id}>.`,
        ephemeral: true,
      });
    } else if (sub === "disable") {
      db.set(guildId, { reviewEnabled: false });
      await interaction.reply({ content: "✅ Review system disabled.", ephemeral: true });
    }
  },
};
