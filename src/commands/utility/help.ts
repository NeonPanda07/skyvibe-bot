import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all SkyVibe commands"),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🌊 SkyVibe — Command List")
      .setThumbnail(interaction.client.user?.displayAvatarURL() ?? null)
      .addFields(
        {
          name: "👋 Welcome & Goodbye",
          value: "`/welcome setup` `/welcome test` `/goodbye setup` `/goodbye test`",
        },
        {
          name: "✅ Verification",
          value: "`/verify setup` `/verify disable`",
        },
        {
          name: "🚀 Boost",
          value: "`/boost setup` `/boost test` `/boost disable`",
        },
        {
          name: "🎭 Self Roles",
          value: "`/selfroles setup` `/selfroles add` `/selfroles remove` `/selfroles refresh`",
        },
        {
          name: "⭐ Review",
          value: "`/review setup` `/review disable`",
        },
        {
          name: "🔄 Auto Reacter",
          value: "`/autoreacter setup` `/autoreacter disable` `/autoreacter info`",
        },
        {
          name: "🎭 Auto Role",
          value: "`/autorole setup` `/autorole disable`",
        },
        {
          name: "🎉 Giveaway",
          value: "`/giveaway setup` `/giveaway start` `/giveaway end` `/giveaway reroll`",
        },
        {
          name: "📌 Sticky",
          value: "`/sticky set` `/sticky remove` `/sticky list`",
        },
        {
          name: "🛡️ Security",
          value: "`/antinuke setup` `/antinuke addowner` `/antispam setup` `/antilink setup`",
        },
        {
          name: "🔧 Utility",
          value: "`/say` `/embed` `/clone` `/purge` `/help`",
        },
        {
          name: "🔨 Moderation",
          value: "`/kick` `/ban` `/unban` `/softban` `/mute` `/unmute` `/warn add` `/warn list` `/warn clear`",
        },
        {
          name: "🤖 AI",
          value: "Type `+<your question>` in any channel for an instant AI response!",
        }
      )
      .setFooter({ text: "SkyVibe • Made with ❤️", iconURL: interaction.client.user?.displayAvatarURL() });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
