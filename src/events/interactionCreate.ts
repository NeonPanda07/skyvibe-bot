import { Interaction, GuildMember, EmbedBuilder } from "discord.js";
import { BotClient } from "../types";
import { db } from "../database";

export default {
  name: "interactionCreate",
  once: false,
  async execute(interaction: Interaction, client: BotClient) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`Command error [${interaction.commandName}]:`, err);
        const msg = { content: "❌ An error occurred while executing this command.", ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton()) {
      const guildId = interaction.guild?.id;
      if (!guildId) return;

      if (interaction.customId === "verify_button") {
        const settings = db.get(guildId);
        if (!settings.verifyRoleId) return;
        const member = interaction.member as GuildMember;
        const role = interaction.guild?.roles.cache.get(settings.verifyRoleId);
        if (!role) {
          await interaction.reply({ content: "❌ Verify role not found!", ephemeral: true });
          return;
        }
        if (member.roles.cache.has(role.id)) {
          await interaction.reply({ content: "✅ You are already verified!", ephemeral: true });
          return;
        }
        await member.roles.add(role).catch(console.error);
        await interaction.reply({ content: `✅ You've been verified and given the **${role.name}** role!`, ephemeral: true });
        return;
      }

      if (interaction.customId.startsWith("selfrole_")) {
        const roleId = interaction.customId.replace("selfrole_", "");
        const member = interaction.member as GuildMember;
        const role = interaction.guild?.roles.cache.get(roleId);
        if (!role) {
          await interaction.reply({ content: "❌ Role not found!", ephemeral: true });
          return;
        }
        if (member.roles.cache.has(role.id)) {
          await member.roles.remove(role).catch(console.error);
          await interaction.reply({ content: `✅ Removed the **${role.name}** role!`, ephemeral: true });
        } else {
          await member.roles.add(role).catch(console.error);
          await interaction.reply({ content: `✅ Given you the **${role.name}** role!`, ephemeral: true });
        }
        return;
      }

      if (interaction.customId.startsWith("review_")) {
        const [, ratingStr, , ...rest] = interaction.customId.split("_");
        const rating = parseInt(ratingStr ?? "5");
        const settings = db.get(guildId);
        if (!settings.reviewChannelId) return;
        const channel = interaction.guild?.channels.cache.get(settings.reviewChannelId);
        if (!channel?.isTextBased()) return;
        const stars = "⭐".repeat(rating) + "🌑".repeat(5 - rating);
        const embed = new EmbedBuilder()
          .setColor(rating >= 4 ? 0x57f287 : rating >= 3 ? 0xfee75c : 0xed4245)
          .setTitle("📝 New Review")
          .addFields(
            { name: "User", value: `<@${interaction.user.id}>`, inline: true },
            { name: "Rating", value: stars, inline: true }
          )
          .setTimestamp();
        await channel.send({ embeds: [embed] });
        await interaction.reply({ content: `✅ Review submitted! Rating: ${stars}`, ephemeral: true });
        return;
      }

      if (interaction.customId.startsWith("giveaway_enter_")) {
        const messageId = interaction.customId.replace("giveaway_enter_", "");
        const settings = db.get(guildId);
        const giveaway = settings.activeGiveaway;
        if (!giveaway || giveaway.messageId !== messageId || giveaway.ended) {
          await interaction.reply({ content: "❌ This giveaway has ended or is no longer active!", ephemeral: true });
          return;
        }
        if (giveaway.entries.includes(interaction.user.id)) {
          const entries = giveaway.entries.filter((e) => e !== interaction.user.id);
          db.set(guildId, { activeGiveaway: { ...giveaway, entries } });
          await interaction.reply({ content: "✅ You have left the giveaway!", ephemeral: true });
        } else {
          const entries = [...giveaway.entries, interaction.user.id];
          db.set(guildId, { activeGiveaway: { ...giveaway, entries } });
          await interaction.reply({ content: `✅ You've entered the giveaway! **${entries.length}** entries total.`, ephemeral: true });
        }
        return;
      }
    }
  },
};
