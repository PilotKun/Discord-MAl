const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const User = require('../models/user');

const anilistAPI = 'https://graphql.anilist.co';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('watchlist')
        .setDescription('Display your watchlist'),
    async execute(interaction) {
        const userId = interaction.user.id;

        await interaction.deferReply(); // If fetching takes time

        const user = await User.findOne({ discordId: userId });
        if (!user || user.watchlist.length === 0) {
            await interaction.editReply('Your watchlist is empty.');
            return;
        }

        const animeIds = user.watchlist;
        const searchQuery = `
        query ($ids: [Int]) {
            Page(perPage: 10) {
                media(id_in: $ids, type: ANIME) {
                    id
                    title {
                        romaji
                        english
                    }
                    coverImage {
                        large
                    }
                }
            }
        }
        `;

        const variables = { ids: animeIds };

        try {
            const response = await axios.post(anilistAPI, {
                query: searchQuery,
                variables,
            });

            const animeList = response.data.data.Page.media;

            if (animeList.length === 0) {
                await interaction.editReply('No anime found in your watchlist.');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('Your Watchlist')
                .setDescription('Here are the anime in your watchlist:')
                .setColor(0x00AE86);

            animeList.forEach(anime => {
                embed.addFields({ name: anime.title.romaji || anime.title.english, value: `ID: ${anime.id}` });
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('AniList API Error:', error);
            await interaction.editReply('Failed to fetch your watchlist.');
        }
    },
};