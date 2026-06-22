import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clone")
    .setDescription("Clone an emoji from another server to this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
    .addStringOption((o) =>
      o
        .setName("emoji")
        .setDescription("The emoji to clone (paste it here, e.g. <:name:id> or <a:name:id>)")
        .setRequired(true)
    )
    .addStringOption((o) => o.setName("name").setDescription("New name for the emoji (optional)").setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const input = interaction.options.getString("emoji", true);
    const customName = interaction.options.getString("name");

    const match = input.match(/<(a?):(\w+):(\d+)>/);
    if (!match) {
      await interaction.reply({
        content: "❌ Please paste a valid custom emoji (e.g. `<:name:id>` or `<a:name:id>`).",
        ephemeral: true,
      });
      return;
    }

    const animated = match[1] === "a";
    const name = customName ?? match[2];
    const id = match[3];
    const ext = animated ? "gif" : "png";
    const url = `https://cdn.discordapp.com/emojis/${id}.${ext}?size=96`;

    await interaction.deferReply({ ephemeral: true });

    try {
      const emoji = await interaction.guild!.emojis.create({ attachment: url, name });
      const tag = animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
      await interaction.editReply({
        content: `✅ Cloned emoji **${emoji.name}** → ${tag}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await interaction.editReply({ content: `❌ Failed to clone emoji: ${msg}` });
    }
  },
};
