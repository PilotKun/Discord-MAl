const { SlashCommandBuilder } = require('@discordjs/builders');
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
                            }
                            manga {
                                count
                                chaptersRead
                                volumesRead
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

            const data = await response.json();
            console.log('AniList API response:', data); // Add logging to inspect the response

            if (!data || !data.data || !data.data.User) {
                return await interaction.reply('Could not fetch AniList profile.');
            }

            const profile = data.data.User;

            // Convert minutes watched to days watched
            const daysWatched = (profile.statistics.anime.minutesWatched / 1440).toFixed(1);

            const profileEmbed = {
                color: 0x0099ff,
                title: profile.name,
                description: profile.about || 'No description available.',
                thumbnail: {
                    url: profile.avatar.large,
                },
                fields: [
                    { name: 'Anime Count', value: profile.statistics.anime.count.toString(), inline: true },
                    { name: 'Mean Score', value: profile.statistics.anime.meanScore.toString(), inline: true },
                    { name: 'Days Watched', value: daysWatched.toString(), inline: true },
                    { name: 'Total Manga', value: profile.statistics.manga.count.toString(), inline: true },
                    { name: 'Chapters Read', value: profile.statistics.manga.chaptersRead.toString(), inline: true },
                    { name: 'Volumes Read', value: profile.statistics.manga.volumesRead.toString(), inline: true },
                ],
            };

            await interaction.reply({ embeds: [profileEmbed] });
        } catch (error) {
            console.error('Error fetching AniList profile:', error);
            await interaction.reply('There was an error fetching your AniList profile.');
        }
    },
};