require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_TOKEN;

const commands = [];
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    if (!command.data) {
      console.error(`Error: Command ${file} is missing a data property.`);
      continue;
    }
    const existingCommand = commands.find(c => c.name === command.data.name);
    if (existingCommand) {
      console.log(`Skipping command ${command.data.name} as it already exists.`);
      continue;
    }
    commands.push(command.data.toJSON());
  } catch (error) {
    console.error(`Error: Failed to load command ${file}.`, error);
  }
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error: Failed to register commands.', error);
  }
})();