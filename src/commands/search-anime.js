const { SlashCommandBuilder } = require('discord.js');
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

            const results = animeList.map(anime => ({
                title: anime.title.romaji || anime.title.english,
                url: `https://anilist.co/anime/${anime.id}`,
                description: `**Score**: ${anime.averageScore}\n**Description**: ${anime.description ? anime.description.slice(0, 200) + '...' : 'No description available.'}`,
                image: { url: anime.coverImage.large }
            }));

            const embeds = results.map(result => ({
                title: result.title,
                url: result.url,
                description: result.description,
                image: result.image,
            }));

            await interaction.editReply({ embeds });
        } catch (error) {
            console.error('AniList API Error:', error);
            await interaction.editReply('Failed to search for anime. Please try again later.');
        }
    },
};