require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
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
});

client.login(process.env.DISCORD_TOKEN);