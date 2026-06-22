import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Create and send a custom embed")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((o) => o.setName("title").setDescription("Embed title (supports animated emojis)").setRequired(true))
    .addStringOption((o) => o.setName("description").setDescription("Embed description (supports animated emojis)").setRequired(true))
    .addStringOption((o) =>
      o
        .setName("color")
        .setDescription("Hex color (e.g. #5865F2) — defaults to blurple")
        .setRequired(false)
    )
    .addStringOption((o) => o.setName("footer").setDescription("Footer text").setRequired(false))
    .addStringOption((o) => o.setName("image").setDescription("Image URL").setRequired(false))
    .addStringOption((o) => o.setName("thumbnail").setDescription("Thumbnail URL").setRequired(false))
    .addChannelOption((o) => o.setName("channel").setDescription("Channel to send to (defaults to current)").setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const title = interaction.options.getString("title", true);
    const description = interaction.options.getString("description", true);
    const colorInput = interaction.options.getString("color");
    const footer = interaction.options.getString("footer");
    const image = interaction.options.getString("image");
    const thumbnail = interaction.options.getString("thumbnail");
    const target = interaction.options.getChannel("channel") ?? interaction.channel;
    const channel = interaction.guild!.channels.cache.get(target!.id) as TextChannel;

    let color: number = 0x5865f2;
    if (colorInput) {
      const parsed = parseInt(colorInput.replace("#", ""), 16);
      if (!isNaN(parsed)) color = parsed;
    }

    const embed = new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setTimestamp();
    if (footer) embed.setFooter({ text: footer });
    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);

    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ Embed sent to <#${channel.id}>!`, ephemeral: true });
  },
};
