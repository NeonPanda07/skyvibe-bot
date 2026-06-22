import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete a number of messages from this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) =>
      o
        .setName("amount")
        .setDescription("Number of messages to delete (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption((o) => o.setName("user").setDescription("Only delete messages from this user").setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger("amount", true);
    const filterUser = interaction.options.getUser("user");
    const channel = interaction.channel as TextChannel;

    await interaction.deferReply({ ephemeral: true });

    const messages = await channel.messages.fetch({ limit: 100 });
    let toDelete = [...messages.values()].slice(0, amount);

    if (filterUser) {
      toDelete = toDelete.filter((m) => m.author.id === filterUser.id).slice(0, amount);
    }

    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recent = toDelete.filter((m) => m.createdTimestamp > twoWeeksAgo);

    if (recent.length === 0) {
      await interaction.editReply({ content: "❌ No recent messages found to delete (messages older than 14 days cannot be bulk deleted)." });
      return;
    }

    const deleted = await channel.bulkDelete(recent, true);
    await interaction.editReply({
      content: `✅ Deleted **${deleted.size}** message${deleted.size !== 1 ? "s" : ""}${filterUser ? ` from <@${filterUser.id}>` : ""}.`,
    });
  },
};
