import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, GuildMember } from "discord.js";
import { db } from "../../database";
import { UserWarning } from "../../types";

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a warning to a member")
        .addUserOption((o) => o.setName("user").setDescription("User to warn").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason for warning").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("View warnings for a member")
        .addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("clear")
        .setDescription("Clear all warnings for a member")
        .addUserOption((o) => o.setName("user").setDescription("User to clear").setRequired(true))
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;
    const target = interaction.options.getUser("user", true);

    if (sub === "add") {
      const reason = interaction.options.getString("reason", true);
      const warning: UserWarning = { reason, moderatorId: interaction.user.id, timestamp: Date.now() };
      db.update(guildId, (s) => ({
        ...s,
        warnings: {
          ...(s.warnings ?? {}),
          [target.id]: [...(s.warnings?.[target.id] ?? []), warning],
        },
      }));
      const settings = db.get(guildId);
      const count = (settings.warnings?.[target.id] ?? []).length;

      try {
        const member = interaction.options.getMember("user") as GuildMember;
        await member?.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xfee75c)
              .setTitle(`⚠️ Warning in ${interaction.guild!.name}`)
              .addFields({ name: "Reason", value: reason })
              .setFooter({ text: `Total warnings: ${count}` })
              .setTimestamp(),
          ],
        }).catch(() => {});
      } catch { /* user has DMs closed */ }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xfee75c)
            .setTitle("⚠️ Warning Issued")
            .addFields(
              { name: "User", value: `<@${target.id}>`, inline: true },
              { name: "Total Warnings", value: `${count}`, inline: true },
              { name: "Reason", value: reason }
            )
            .setTimestamp(),
        ],
      });
    } else if (sub === "list") {
      const settings = db.get(guildId);
      const warnings = settings.warnings?.[target.id] ?? [];
      if (!warnings.length) {
        await interaction.reply({ content: `✅ <@${target.id}> has no warnings!`, ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle(`⚠️ Warnings for ${target.username}`)
        .setDescription(
          warnings.map((w, i) => `**${i + 1}.** ${w.reason} — <@${w.moderatorId}> — <t:${Math.floor(w.timestamp / 1000)}:R>`).join("\n")
        )
        .setFooter({ text: `Total: ${warnings.length}` });
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (sub === "clear") {
      db.update(guildId, (s) => ({
        ...s,
        warnings: { ...(s.warnings ?? {}), [target.id]: [] },
      }));
      await interaction.reply({ content: `✅ Cleared all warnings for <@${target.id}>!`, ephemeral: true });
    }
  },
};
