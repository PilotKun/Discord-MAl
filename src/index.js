require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        await interaction.editReply(`Pong! Latency is ${latency}ms. API Latency is ${apiLatency}ms.`);
    }

    if (interaction.commandName === 'anilist-user') {
        const command = require('./commands/anilist-profile');
        await command.execute(interaction);
    }

    if (interaction.commandName === 'search') {
        const command = require('./commands/search-anime');
        await command.execute(interaction);
    }

    if (interaction.commandName === 'add') {
        const command = require('./commands/add-anime');
        await command.execute(interaction);
    }

    if (interaction.commandName === 'remove') {
        const command = require('./commands/remove-anime');
        await command.execute(interaction);
    }

    if (interaction.commandName === 'watchlist') {
        const command = require('./commands/watchlist');
        await command.execute(interaction);
    }

    if (interaction.commandName === 'addprofile') {
        const command = require('./commands/addProfile');
        await command.execute(interaction);
    }

    if (interaction.commandName === 'profile') {
        const command = require('./commands/profile');
        await command.execute(interaction);
    }
});

client.login(process.env.DISCORD_TOKEN);