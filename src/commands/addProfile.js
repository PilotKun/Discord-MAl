const { SlashCommandBuilder } = require('@discordjs/builders');
const User = require('../models/user');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addprofile')
        .setDescription('Link your AniList account')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Your AniList username')
                .setRequired(true)),
    async execute(interaction) {
        console.log('addprofile command triggered'); // Add logging
        const discordId = interaction.user.id;
        const anilistUsername = interaction.options.getString('username');

        try {
            let user = await User.findOne({ discordId });
            if (user) {
                user.anilistUsername = anilistUsername;
            } else {
                user = new User({ discordId, anilistUsername });
            }
            await user.save();
            await interaction.reply(`AniList account linked: ${anilistUsername}`);
        } catch (error) {
            console.error(error);
            await interaction.reply('There was an error linking your AniList account.');
        }
    },
};