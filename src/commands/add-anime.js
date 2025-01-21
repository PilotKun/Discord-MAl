const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const User = require('../models/user');

const anilistAPI = 'https://graphql.anilist.co';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add an anime to your watchlist')
        .addStringOption(option =>
            option.setName('anime_name')
                .setDescription('The name of the anime to add')
                .setRequired(true)),
    async execute(interaction) {
        const animeName = interaction.options.getString('anime_name');
        const userId = interaction.user.id;

        await interaction.deferReply(); // If fetching takes time

        const searchQuery = `
        query ($search: String) {
            Page(perPage: 10) {
                media(search: $search, type: ANIME) {
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

        const variables = { search: animeName };

        try {
            const response = await axios.post(anilistAPI, {
                query: searchQuery,
                variables,
            });

            const animeList = response.data.data.Page.media;

            if (animeList.length === 0) {
                await interaction.editReply('No anime found with that name.');
                return;
            }

            const buttons = animeList.map(anime => new ButtonBuilder()
                .setCustomId(`add_${anime.id}`)
                .setLabel(anime.title.romaji || anime.title.english)
                .setStyle(ButtonStyle.Primary)
            );

            const rows = [];
            for (let i = 0; i < buttons.length; i += 5) {
                rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
            }

            await interaction.editReply({ content: 'Select the anime to add to your watchlist:', components: rows });

            const filter = i => i.customId.startsWith('add_') && i.user.id === userId;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                const animeId = i.customId.split('_')[1];

                let user = await User.findOne({ discordId: userId });
                if (!user) {
                    user = new User({ discordId: userId, watchlist: [] });
                }

                if (!user.watchlist.includes(animeId)) {
                    user.watchlist.push(animeId);
                    await user.save();
                    await i.update({ content: `Anime with ID ${animeId} has been added to your watchlist.`, components: [] });
                } else {
                    await i.update({ content: `Anime with ID ${animeId} is already in your watchlist.`, components: [] });
                }
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