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
import { ActiveGiveaway } from "../../types";

function scheduleGiveawayEnd(client: import("discord.js").Client, guildId: string, giveaway: ActiveGiveaway) {
  const delay = giveaway.endTime - Date.now();
  if (delay <= 0) return;
  setTimeout(async () => {
    try {
      const settings = db.get(guildId);
      const g = settings.activeGiveaway;
      if (!g || g.messageId !== giveaway.messageId || g.ended) return;
      const guild = client.guilds.cache.get(guildId);
      const channel = guild?.channels.cache.get(g.channelId) as TextChannel | undefined;
      if (!channel) return;
      const msg = await channel.messages.fetch(g.messageId).catch(() => null);
      const entries = g.entries;
      if (entries.length === 0) {
        await channel.send({ content: `🎉 **${g.prize}** giveaway ended with no entries!` });
      } else {
        const winners: string[] = [];
        const pool = [...entries];
        for (let i = 0; i < Math.min(g.winnerCount, pool.length); i++) {
          const idx = Math.floor(Math.random() * pool.length);
          winners.push(pool.splice(idx, 1)[0]);
        }
        const winnerMentions = winners.map((w) => `<@${w}>`).join(", ");
        await channel.send({
          content: `🎉 Congratulations ${winnerMentions}! You won **${g.prize}**! 🎊`,
          embeds: [
            new EmbedBuilder()
              .setColor(g.color)
              .setTitle(`🎊 Giveaway Ended — ${g.prize}`)
              .addFields(
                { name: "Winners", value: winnerMentions, inline: true },
                { name: "Total Entries", value: `${entries.length}`, inline: true },
                { name: "Hosted by", value: `<@${g.hostId}>`, inline: true }
              )
              .setTimestamp(),
          ],
        });
        if (msg) await msg.edit({ components: [] }).catch(() => {});
      }
      db.set(guildId, { activeGiveaway: { ...g, ended: true } });
    } catch (err) {
      console.error("Giveaway end error:", err);
    }
  }, delay);
}

export default {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Manage giveaways")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("One-time setup for giveaway defaults (reuses each time)")
        .addStringOption((o) => o.setName("emoji").setDescription("Entry button emoji (e.g. 🎉)").setRequired(false))
        .addIntegerOption((o) =>
          o.setName("color").setDescription("Embed color as decimal (default: 5793266 = gold)").setRequired(false)
        )
        .addIntegerOption((o) =>
          o.setName("winners").setDescription("Default number of winners (default: 1)").setRequired(false).setMinValue(1).setMaxValue(20)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Start a giveaway")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to host the giveaway").setRequired(true))
        .addStringOption((o) => o.setName("prize").setDescription("What's being given away?").setRequired(true))
        .addIntegerOption((o) =>
          o.setName("duration").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(10080)
        )
        .addIntegerOption((o) =>
          o.setName("winners").setDescription("Number of winners (overrides default)").setRequired(false).setMinValue(1).setMaxValue(20)
        )
    )
    .addSubcommand((sub) => sub.setName("end").setDescription("End the current giveaway early"))
    .addSubcommand((sub) => sub.setName("reroll").setDescription("Reroll giveaway winners")),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "setup") {
      const emoji = interaction.options.getString("emoji") ?? "🎉";
      const color = interaction.options.getInteger("color") ?? 0x57f287;
      const winners = interaction.options.getInteger("winners") ?? 1;
      db.set(guildId, {
        giveawayConfig: { emoji, color, winnerCount: winners, prize: "", duration: 60 },
      });
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(color)
            .setTitle("🎉 Giveaway Defaults Saved!")
            .addFields(
              { name: "Entry Emoji", value: emoji, inline: true },
              { name: "Default Winners", value: `${winners}`, inline: true }
            )
            .setDescription("These defaults will be used each time you start a giveaway with `/giveaway start`."),
        ],
        ephemeral: true,
      });
    } else if (sub === "start") {
      const channel = interaction.options.getChannel("channel", true);
      const prize = interaction.options.getString("prize", true);
      const duration = interaction.options.getInteger("duration", true);
      const settings = db.get(guildId);
      const config = settings.giveawayConfig ?? { emoji: "🎉", color: 0x57f287, winnerCount: 1, prize: "", duration: 60 };
      const winners = interaction.options.getInteger("winners") ?? config.winnerCount;
      const endTime = Date.now() + duration * 60 * 1000;
      const endTs = Math.floor(endTime / 1000);

      const embed = new EmbedBuilder()
        .setColor(config.color)
        .setTitle(`${config.emoji} GIVEAWAY — ${prize}`)
        .addFields(
          { name: "🏆 Prize", value: prize, inline: true },
          { name: "🥇 Winners", value: `${winners}`, inline: true },
          { name: "⏰ Ends", value: `<t:${endTs}:R> (<t:${endTs}:f>)`, inline: true },
          { name: "🎟️ Entries", value: "0", inline: true },
          { name: "👑 Hosted by", value: `<@${interaction.user.id}>`, inline: true }
        )
        .setFooter({ text: "Click the button to enter!" })
        .setTimestamp();

      const btn = new ButtonBuilder()
        .setCustomId("giveaway_enter_PLACEHOLDER")
        .setLabel("Enter Giveaway")
        .setEmoji(config.emoji)
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);
      const tc = interaction.guild!.channels.cache.get(channel.id) as TextChannel;
      const sent = await tc.send({ embeds: [embed], components: [row] });

      const realBtn = new ButtonBuilder()
        .setCustomId(`giveaway_enter_${sent.id}`)
        .setLabel("Enter Giveaway")
        .setEmoji(config.emoji)
        .setStyle(ButtonStyle.Primary);
      await sent.edit({ components: [new ActionRowBuilder<ButtonBuilder>().addComponents(realBtn)] });

      const activeGiveaway: ActiveGiveaway = {
        channelId: channel.id,
        messageId: sent.id,
        endTime,
        hostId: interaction.user.id,
        prize,
        winnerCount: winners,
        emoji: config.emoji,
        color: config.color,
        entries: [],
        ended: false,
      };
      db.set(guildId, { activeGiveaway });

      scheduleGiveawayEnd(interaction.client, guildId, activeGiveaway);

      await interaction.reply({ content: `✅ Giveaway started in <#${channel.id}>! 🎉`, ephemeral: true });
    } else if (sub === "end") {
      const settings = db.get(guildId);
      const g = settings.activeGiveaway;
      if (!g || g.ended) {
        await interaction.reply({ content: "❌ No active giveaway to end!", ephemeral: true });
        return;
      }
      db.set(guildId, { activeGiveaway: { ...g, endTime: Date.now(), ended: true } });
      scheduleGiveawayEnd(interaction.client, guildId, { ...g, endTime: Date.now() + 100 });
      await interaction.reply({ content: "✅ Giveaway ended early!", ephemeral: true });
    } else if (sub === "reroll") {
      const settings = db.get(guildId);
      const g = settings.activeGiveaway;
      if (!g || !g.ended) {
        await interaction.reply({ content: "❌ No ended giveaway to reroll!", ephemeral: true });
        return;
      }
      if (!g.entries.length) {
        await interaction.reply({ content: "❌ No entries to reroll!", ephemeral: true });
        return;
      }
      const pool = [...g.entries];
      const winners: string[] = [];
      for (let i = 0; i < Math.min(g.winnerCount, pool.length); i++) {
        const idx = Math.floor(Math.random() * pool.length);
        winners.push(pool.splice(idx, 1)[0]);
      }
      await interaction.reply({
        content: `🎉 **Reroll!** New winners: ${winners.map((w) => `<@${w}>`).join(", ")} — Congratulations! 🎊`,
      });
    }
  },
};
