import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make the bot say something in a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((o) =>
      o
        .setName("message")
        .setDescription("Message to send (supports animated emojis like <a:name:id>)")
        .setRequired(true)
    )
    .addChannelOption((o) =>
      o.setName("channel").setDescription("Channel to send to (defaults to current)").setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString("message", true);
    const target = interaction.options.getChannel("channel") ?? interaction.channel;
    const channel = interaction.guild!.channels.cache.get(target!.id) as TextChannel;

    if (!channel?.isTextBased()) {
      await interaction.reply({ content: "❌ That's not a text channel!", ephemeral: true });
      return;
    }

    await channel.send({ content: message });
    await interaction.reply({ content: `✅ Message sent to <#${channel.id}>!`, ephemeral: true });
  },
};
