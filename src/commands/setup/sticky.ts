import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, TextChannel } from "discord.js";
import { db } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("sticky")
    .setDescription("Manage sticky messages in a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Set a sticky message in this channel")
        .addStringOption((o) => o.setName("message").setDescription("The sticky message content").setRequired(true))
        .addChannelOption((o) => o.setName("channel").setDescription("Channel (defaults to current)").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove the sticky message from a channel")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel (defaults to current)").setRequired(false))
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("List all sticky messages")),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;
    const target = interaction.options.getChannel("channel") ?? interaction.channel;
    const channelId = target!.id;

    if (sub === "set") {
      const content = interaction.options.getString("message", true);
      const channel = interaction.guild!.channels.cache.get(channelId) as TextChannel;

      const settings = db.get(guildId);
      const existing = settings.stickyMessages?.[channelId];
      if (existing?.lastMessageId) {
        await channel.messages.delete(existing.lastMessageId).catch(() => {});
      }

      const sent = await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffd700)
            .setDescription(`📌 **Sticky Message**\n\n${content}`)
            .setFooter({ text: "📌 Pinned" }),
        ],
      });

      db.update(guildId, (s) => ({
        ...s,
        stickyMessages: { ...(s.stickyMessages ?? {}), [channelId]: { content, lastMessageId: sent.id } },
      }));

      await interaction.reply({ content: `✅ Sticky message set in <#${channelId}>!`, ephemeral: true });
    } else if (sub === "remove") {
      const settings = db.get(guildId);
      const existing = settings.stickyMessages?.[channelId];
      if (existing?.lastMessageId) {
        const channel = interaction.guild!.channels.cache.get(channelId) as TextChannel;
        await channel.messages.delete(existing.lastMessageId).catch(() => {});
      }
      db.update(guildId, (s) => {
        const stickies = { ...(s.stickyMessages ?? {}) };
        delete stickies[channelId];
        return { ...s, stickyMessages: stickies };
      });
      await interaction.reply({ content: `✅ Sticky message removed from <#${channelId}>!`, ephemeral: true });
    } else if (sub === "list") {
      const settings = db.get(guildId);
      const stickies = settings.stickyMessages ?? {};
      const entries = Object.entries(stickies);
      if (!entries.length) {
        await interaction.reply({ content: "❌ No sticky messages set!", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("📌 Sticky Messages")
        .setDescription(entries.map(([cId, s]) => `<#${cId}>: ${s.content.substring(0, 100)}`).join("\n"));
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
