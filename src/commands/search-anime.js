const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const anilistAPI = 'https://graphql.anilist.co';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for anime on AniList')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Search query')
                .setRequired(true)),
    async execute(interaction) {
        const query = interaction.options.getString('query');

        await interaction.deferReply(); // If fetching takes time

        const searchQuery = `
            query ($search: String) {
              Page(perPage: 5) {
                media(search: $search, type: ANIME) {
                  id
                  title {
                    romaji
                    english
                  }
                  description
                  averageScore
                  coverImage {
                    large
                  }
                }
              }
            }
        `;

        const variables = { search: query };

        try {
            const response = await axios.post(anilistAPI, {
                query: searchQuery,
                variables,
            });

            const animeList = response.data.data.Page.media;

            if (animeList.length === 0) {
                await interaction.editReply('No results found.');
                return;
            }

            const buttons = animeList.map(anime => new ButtonBuilder()
                .setCustomId(`anime_${anime.id}`)
                .setLabel(anime.title.romaji || anime.title.english)
                .setStyle(ButtonStyle.Primary)
            );

            const rows = [];
            for (let i = 0; i < buttons.length; i += 5) {
                rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
            }

            await interaction.editReply({ content: 'Select an anime to view details:', components: rows });

            const filter = i => i.customId.startsWith('anime_') && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                const animeId = i.customId.split('_')[1];
                const selectedAnime = animeList.find(anime => anime.id == animeId);

                const embed = new EmbedBuilder()
                    .setTitle(selectedAnime.title.romaji || selectedAnime.title.english)
                    .setURL(`https://anilist.co/anime/${selectedAnime.id}`)
                    .setDescription(`**Score**: ${selectedAnime.averageScore}\n**Description**: ${selectedAnime.description ? selectedAnime.description.slice(0, 200) + '...' : 'No description available.'}`)
                    .setImage(selectedAnime.coverImage.large);

                await i.update({ embeds: [embed], components: [] });
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'No selection made.', components: [] });
                }
            });
        } catch (error) {
            console.error('AniList API Error:', error);
            await interaction.editReply('Failed to search for anime. Please try again later.');
        }
    },
};