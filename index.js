import Discord from 'discord.js';
import { prefix, token } from './config.json';

const client = new Discord.Client();

client.on('ready', () => {
  console.log('Ready!');
});

client.on('message', (message) => {
  if (message.content.startsWith(`${prefix}ping`)) {
    message.channel.send('Pong.');
  } else if (message.content.startsWith(`${prefix}beep`)) {
    message.channel.send('Boop.');
  } else if (message.content.startsWith(`${prefix}server`)) {
    message.channel.send(`Server name: ${message.guild.name}\nTotal members: ${message.guild.memberCount}\nServer Created: ${message.guild.createdAt}`);
  } else if (message.content === `${prefix}user-info`) {
    message.channel.send(`Your username: ${message.author.username}\nYour ID: ${message.author.id}`);
  }
});

client.login(token);
