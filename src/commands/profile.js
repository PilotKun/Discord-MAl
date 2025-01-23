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
                    { name: 'Anime Stats', value: `Count: ${userProfile.statistics.anime.count}\nMean Score: ${userProfile.statistics.anime.meanScore}\nMinutes Watched: ${userProfile.statistics.anime.minutesWatched}\nEpisodes Watched: ${userProfile.statistics.anime.episodesWatched}`, inline: true },
                    { name: 'Manga Stats', value: `Count: ${userProfile.statistics.manga.count}\nChapters Read: ${userProfile.statistics.manga.chaptersRead}\nVolumes Read: ${userProfile.statistics.manga.volumesRead}\nMean Score: ${userProfile.statistics.manga.meanScore}`, inline: true }
                );

            // Create the favorite anime button
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('favorite_anime')
                        .setLabel('Favorite Anime')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.reply({ embeds: [profileEmbed], components: [row] });

            // Handle button interaction
            const filter = i => i.customId === 'favorite_anime' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                try {
                    await i.deferUpdate(); // Defer the interaction to give more time for processing

                    // Fetch favorite anime data
                    const favoriteQuery = `
                        query ($username: String) {
                            User(name: $username) {
                                favourites {
                                    anime {
                                        nodes {
                                            id
                                            title {
                                                romaji
                                                english
                                            }
                                            mediaListEntry {
                                                score
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
                    console.log(favoriteData); // Log the response to check the structure
                    
                    if (favoriteData.errors) {
                        throw new Error(`AniList API errors: ${JSON.stringify(favoriteData.errors)}`);
                    }
                    
                    const favoriteAnime = favoriteData.data.User.favourites.anime.nodes;
                    favoriteAnime.forEach(anime => {
                        console.log(anime.title.romaji || anime.title.english, anime.mediaListEntry); // Log each anime's title and mediaListEntry
                    });
                    
                    if (favoriteAnime.length === 0) {
                        return await i.editReply({ content: 'No favorite anime found.', components: [] });
                    }
                    
                    // Create an embed with the list of favorite anime titles
                    const favoriteEmbed = new EmbedBuilder()
                        .setTitle(`${user.username}'s Favorite Anime`)
                        .setDescription(favoriteAnime.map((anime, index) => `${(index + 1).toString().padStart(2, ' ')}. **${anime.title.romaji || anime.title.english}**`).join('\n'));
                    
                    // Create buttons for each favorite anime
                    const buttons = favoriteAnime.map((anime, index) => 
                        new ButtonBuilder()
                            .setCustomId(`anime_${anime.id}`)
                            .setLabel(`${index + 1}`)
                            .setStyle(ButtonStyle.Secondary)
                    );
                    
                    // Split buttons into rows of 5
                    const buttonRows = [];
                    for (let i = 0; i < buttons.length; i += 5) {
                        buttonRows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
                    }
                    
                    await i.editReply({ embeds: [favoriteEmbed], components: buttonRows });
                    
                    // Handle button interactions for each anime
                    const animeFilter = i => i.customId.startsWith('anime_') && i.user.id === interaction.user.id;
                    const animeCollector = interaction.channel.createMessageComponentCollector({ filter: animeFilter, time: 60000 });
                    
                    animeCollector.on('collect', async i => {
                        const animeId = i.customId.split('_')[1];
                        const selectedAnime = favoriteAnime.find(anime => anime.id == animeId);
                        console.log(selectedAnime.mediaListEntry); // Log the mediaListEntry to check if it contains the score
                    
                        const animeEmbed = new EmbedBuilder()
                            .setTitle(selectedAnime.title.romaji || selectedAnime.title.english)
                            .setURL(`https://anilist.co/anime/${selectedAnime.id}`)
                            .setDescription(`**Score**: ${selectedAnime.mediaListEntry ? selectedAnime.mediaListEntry.score : 'N/A'}`);
                    
                        await i.update({ embeds: [animeEmbed], components: [] });
                    });

                } catch (error) {
                    console.error(error);
                    await i.editReply({ content: `There was an error fetching your favorite anime: ${error.message}`, components: [] });
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