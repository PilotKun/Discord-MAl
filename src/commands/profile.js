const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const User = require('../models/user');
const fetch = require('node-fetch'); // Ensure node-fetch is imported correctly

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Show your AniList profile'),
    async execute(interaction) {
        const discordId = interaction.user.id;

        try {
            const user = await User.findOne({ discordId });
            if (!user || !user.anilistUsername) {
                return await interaction.reply('You need to link your AniList account first using /addprofile.');
            }

            const anilistUsername = user.anilistUsername;

            // Fetch AniList profile data
            const query = `
                query ($username: String) {
                    User(name: $username) {
                        id
                        name
                        about
                        avatar {
                            large
                        }
                        statistics {
                            anime {
                                count
                                meanScore
                                minutesWatched
                                episodesWatched
                            }
                            manga {
                                count
                                chaptersRead
                                volumesRead
                                meanScore
                            }
                        }
                    }
                }
            `;

            const variables = {
                username: anilistUsername
            };

            const response = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    variables: variables
                })
            });

            if (!response.ok) {
                throw new Error(`AniList API returned status code ${response.status}`);
            }

            const userData = await response.json();
            const userProfile = userData.data.User;

            // Create the profile embed
            const profileEmbed = new EmbedBuilder()
                .setTitle(`${userProfile.name}'s AniList Profile`)
                .setDescription(userProfile.about || 'No bio available.')
                .setThumbnail(userProfile.avatar.large)
                .addFields(
                    { name: 'Anime Stats', value: `Count: ${userProfile.statistics.anime.count}\nMean Score: ${userProfile.statistics.anime.meanScore}\nDays Watched: ${(userProfile.statistics.anime.minutesWatched / 1440).toFixed(2)}\nEpisodes Watched: ${userProfile.statistics.anime.episodesWatched}`, inline: true },
                    { name: 'Manga Stats', value: `Count: ${userProfile.statistics.manga.count}\nMean Score : ${userProfile.statistics.manga.meanScore}\nChapters Read: ${userProfile.statistics.manga.chaptersRead}\nVolumes Read: ${userProfile.statistics.manga.volumesRead}`, inline: true }
                );

            // Create the favorite anime and manga buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('favorite_anime')
                        .setLabel('Favorite Anime')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('favorite_manga')
                        .setLabel('Favorite Manga')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.reply({ embeds: [profileEmbed], components: [row] });

            // Handle button interaction
            const filter = i => (i.customId === 'favorite_anime' || i.customId === 'favorite_manga') && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                try {
                    await i.deferUpdate(); // Defer the interaction to give more time for processing

                    const isAnime = i.customId === 'favorite_anime';
                    const favoriteQuery = `
                        query ($username: String) {
                            User(name: $username) {
                                favourites {
                                    ${isAnime ? 'anime' : 'manga'} {
                                        nodes {
                                            id
                                            title {
                                                romaji
                                                english
                                            }
                                            mediaListEntry {
                                                score
                                            }
                                            coverImage {
                                                large
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    `;

                    const favoriteResponse = await fetch('https://graphql.anilist.co', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            query: favoriteQuery,
                            variables: { username: anilistUsername }
                        })
                    });

                    if (!favoriteResponse.ok) {
                        throw new Error(`AniList API returned status code ${favoriteResponse.status}`);
                    }

                    const favoriteData = await favoriteResponse.json();
                    if (favoriteData.errors) {
                        throw new Error(`AniList API errors: ${JSON.stringify(favoriteData.errors)}`);
                    }

                    const favoriteItems = favoriteData.data.User.favourites[isAnime ? 'anime' : 'manga'].nodes;

                    if (favoriteItems.length === 0) {
                        return await i.editReply({ content: `No favorite ${isAnime ? 'anime' : 'manga'} found.`, components: [] });
                    }

                    const favoriteEmbed = new EmbedBuilder()
                        .setTitle(`${user.username}'s Favorite ${isAnime ? 'Anime' : 'Manga'}`)
                        .setDescription(favoriteItems.map((item, index) => `${(index + 1).toString().padStart(2, ' ')}. [**${item.title.romaji || item.title.english}**](https://anilist.co/${isAnime ? 'anime' : 'manga'}/${item.id})`).join('\n'));

                    const buttons = favoriteItems.map((item, index) =>
                        new ButtonBuilder()
                            .setCustomId(`${isAnime ? 'anime' : 'manga'}_${item.id}`)
                            .setLabel(`${index + 1}`)
                            .setStyle(ButtonStyle.Secondary)
                    );

                    const buttonRows = [];
                    for (let i = 0; i < buttons.length; i += 5) {
                        buttonRows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
                    }

                    await i.editReply({ embeds: [favoriteEmbed], components: buttonRows });

                    const itemFilter = i => i.customId.startsWith(isAnime ? 'anime_' : 'manga_') && i.user.id === interaction.user.id;
                    const itemCollector = interaction.channel.createMessageComponentCollector({ filter: itemFilter, time: 60000 });

                    itemCollector.on('collect', async i => {
                        const itemId = i.customId.split('_')[1];
                        const selectedItem = favoriteItems.find(item => item.id == itemId);

                        const itemEmbed = new EmbedBuilder()
                            .setTitle(selectedItem.title.romaji || selectedItem.title.english)
                            .setURL(`https://anilist.co/${isAnime ? 'anime' : 'manga'}/${selectedItem.id}`)
                            .setDescription(`**Score**: ${selectedItem.mediaListEntry ? selectedItem.mediaListEntry.score : 'N/A'}`)
                            .setImage(selectedItem.coverImage.large);

                        await i.update({ embeds: [itemEmbed], components: [] });
                    });

                } catch (error) {
                    console.error(error);
                    await i.editReply({ content: `There was an error fetching your favorite ${isAnime ? 'anime' : 'manga'}: ${error.message}`, components: [] });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'No selection made.', components: [] });
                }
            });

        } catch (error) {
            console.error(error);
            await interaction.reply(`There was an error fetching your AniList profile: ${error.message}`);
        }
    }
};