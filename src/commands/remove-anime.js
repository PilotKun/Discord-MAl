const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const User = require('../models/user');

const anilistAPI = 'https://graphql.anilist.co';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove an anime from your watchlist')
        .addStringOption(option =>
            option.setName('anime_name')
                .setDescription('The name of the anime to remove')
                .setRequired(true)),
    async execute(interaction) {
        const animeName = interaction.options.getString('anime_name');
        const userId = interaction.user.id;

        await interaction.deferReply(); // If fetching takes time

        const user = await User.findOne({ discordId: userId });
        if (!user || user.watchlist.length === 0) {
            await interaction.editReply('Your watchlist is empty.');
            return;
        }

        const animeIds = user.watchlist;
        const searchQuery = `
        query ($search: String, $ids: [Int]) {
            Page(perPage: 10) {
                media(search: $search, id_in: $ids, type: ANIME) {
                    id
                    title {
                        romaji
                        english
                    }
                }
            }
        }
        `;

        const variables = { search: animeName, ids: animeIds };

        try {
            const response = await axios.post(anilistAPI, {
                query: searchQuery,
                variables,
            });

            const animeList = response.data.data.Page.media;

            if (animeList.length === 0) {
                await interaction.editReply('No anime found with that name in your watchlist.');
                return;
            }

            const buttons = animeList.map(anime => new ButtonBuilder()
                .setCustomId(`remove_${anime.id}`)
                .setLabel(anime.title.romaji || anime.title.english)
                .setStyle(ButtonStyle.Danger)
            );

            const rows = [];
            for (let i = 0; i < buttons.length; i += 5) {
                rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
            }

            await interaction.editReply({ content: 'Select the anime to remove from your watchlist:', components: rows });

            const filter = i => i.customId.startsWith('remove_') && i.user.id === userId;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                const animeId = i.customId.split('_')[1];

                user.watchlist = user.watchlist.filter(id => id !== animeId);
                await user.save();
                await i.update({ content: `Anime with ID ${animeId} has been removed from your watchlist.`, components: [] });
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'No anime selected.', components: [] });
                }
            });
        } catch (error) {
            console.error('AniList API Error:', error);
            await interaction.editReply('Failed to search for anime.');
        }
    },
};