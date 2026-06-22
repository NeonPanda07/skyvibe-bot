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
import { SelfRole } from "../../types";

async function refreshSelfRolesMessage(interaction: ChatInputCommandInteraction, guildId: string) {
  const settings = db.get(guildId);
  if (!settings.selfRolesChannelId || !settings.selfRoles?.length) return;
  const channel = interaction.guild!.channels.cache.get(settings.selfRolesChannelId) as TextChannel;
  if (!channel) return;

  if (settings.selfRolesMessageId) {
    await channel.messages.delete(settings.selfRolesMessageId).catch(() => {});
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🎭 Self Roles")
    .setDescription("Click a button below to add or remove a role!")
    .addFields(settings.selfRoles.map((r) => ({ name: `${r.emoji} ${r.label}`, value: `<@&${r.roleId}>`, inline: true })))
    .setFooter({ text: "Click again to remove the role" });

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let row = new ActionRowBuilder<ButtonBuilder>();
  let count = 0;
  for (const role of settings.selfRoles) {
    if (count > 0 && count % 5 === 0) {
      rows.push(row);
      row = new ActionRowBuilder<ButtonBuilder>();
    }
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`selfrole_${role.roleId}`)
        .setLabel(`${role.label}`)
        .setEmoji(role.emoji)
        .setStyle(ButtonStyle.Secondary)
    );
    count++;
  }
  if (count % 5 !== 0 || count === 0) rows.push(row);

  const sent = await channel.send({ embeds: [embed], components: rows.slice(0, 5) });
  db.set(guildId, { selfRolesMessageId: sent.id });
}

export default {
  data: new SlashCommandBuilder()
    .setName("selfroles")
    .setDescription("Manage the self-roles system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set up the self-roles channel")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel for self-roles message").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a self role")
        .addRoleOption((o) => o.setName("role").setDescription("Role to add").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji for this role").setRequired(true))
        .addStringOption((o) => o.setName("label").setDescription("Label for the button").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a self role")
        .addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("List all self roles"))
    .addSubcommand((sub) => sub.setName("refresh").setDescription("Refresh the self-roles message")),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel", true);
      db.set(guildId, { selfRolesChannelId: channel.id, selfRoles: db.get(guildId).selfRoles ?? [] });
      await interaction.reply({ content: `✅ Self-roles channel set to <#${channel.id}>! Use \`/selfroles add\` to add roles.`, ephemeral: true });
    } else if (sub === "add") {
      const role = interaction.options.getRole("role", true);
      const emoji = interaction.options.getString("emoji", true);
      const label = interaction.options.getString("label", true);
      const settings = db.get(guildId);
      const existing = settings.selfRoles ?? [];
      if (existing.length >= 20) {
        await interaction.reply({ content: "❌ Maximum 20 self roles allowed!", ephemeral: true });
        return;
      }
      const newRole: SelfRole = { roleId: role.id, emoji, label };
      db.set(guildId, { selfRoles: [...existing.filter((r) => r.roleId !== role.id), newRole] });
      await interaction.deferReply({ ephemeral: true });
      await refreshSelfRolesMessage(interaction, guildId);
      await interaction.editReply({ content: `✅ Added **${label}** ${emoji} <@&${role.id}> as a self role!` });
    } else if (sub === "remove") {
      const role = interaction.options.getRole("role", true);
      const settings = db.get(guildId);
      db.set(guildId, { selfRoles: (settings.selfRoles ?? []).filter((r) => r.roleId !== role.id) });
      await interaction.deferReply({ ephemeral: true });
      await refreshSelfRolesMessage(interaction, guildId);
      await interaction.editReply({ content: `✅ Removed <@&${role.id}> from self roles!` });
    } else if (sub === "list") {
      const settings = db.get(guildId);
      const roles = settings.selfRoles ?? [];
      if (!roles.length) {
        await interaction.reply({ content: "❌ No self roles set up yet!", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎭 Self Roles")
        .setDescription(roles.map((r) => `${r.emoji} **${r.label}** — <@&${r.roleId}>`).join("\n"));
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (sub === "refresh") {
      await interaction.deferReply({ ephemeral: true });
      await refreshSelfRolesMessage(interaction, guildId);
      await interaction.editReply({ content: "✅ Self-roles message refreshed!" });
    }
  },
};
