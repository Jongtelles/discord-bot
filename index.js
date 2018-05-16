// import fs from 'fs';
import Discord from 'discord.js';
import yt from 'ytdl-core';
import { prefix, token } from './config.json';

const client = new Discord.Client();
// client.commands = new Discord.Collection();

// const commandFiles = fs.readdirSync('./commands');

/* eslint-disable */
// for (const file of commandFiles) {
//   const command = require(`./commands/${file}`);
//   client.commands.set(command.name, command);
// }
/* eslint-enable */

client.on('ready', () => {
  console.log('Ready!');
});

// client.on('message', (message) => {
//   if (!message.content.startsWith(prefix) || message.author.bot) return;

//   const args = message.content.slice(prefix.length).split(/ +/);
//   const command = args.shift().toLowerCase();

//   if (!client.commands.has(command)) return;

//   try {
//     client.commands.get(command).execute(message, args);
//   } catch (error) {
//     console.log(error);
//     message.reply('There was an error trying to execute that command!');
//   }
// });
const queue = {};
const commands = {
  play: (msg) => {
    if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Add some songs to the queue first with ${prefix}add`);
    if (!msg.guild.voiceConnection) return commands.join(msg).then(() => commands.play(msg));
    if (queue[msg.guild.id].playing) return msg.channel.sendMessage('Already Playing');
    let dispatcher;
    queue[msg.guild.id].playing = true;

    console.log(queue);
    (function play(song) {
      console.log(song);
      if (song === undefined) {
        return msg.channel.sendMessage('Queue is empty').then(() => {
          queue[msg.guild.id].playing = false;
          msg.member.voiceChannel.leave();
        });
      }
      msg.channel.sendMessage(`Playing: **${song.title}** as requested by: **${song.requester}**`);
      dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, { audioonly: true }), { passes: token.passes });
      const collector = msg.channel.createCollector(m => m);
      collector.on('message', (m) => {
        if (m.content.startsWith(`${prefix}pause`)) {
          msg.channel.sendMessage('paused').then(() => { dispatcher.pause(); });
        } else if (m.content.startsWith(`${prefix}resume`)) {
          msg.channel.sendMessage('resumed').then(() => { dispatcher.resume(); });
        } else if (m.content.startsWith(`${prefix}skip`)) {
          msg.channel.sendMessage('skipped').then(() => { dispatcher.end(); });
        } else if (m.content.startsWith('volume+')) {
          if (Math.round(dispatcher.volume * 50) >= 100) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume * 50)}%`);
          dispatcher.setVolume(Math.min((dispatcher.volume * 50 + (2 * (m.content.split('+').length - 1))) / 50, 2));
          msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume * 50)}%`);
        } else if (m.content.startsWith('volume-')) {
          if (Math.round(dispatcher.volume * 50) <= 0) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume * 50)}%`);
          dispatcher.setVolume(Math.max((dispatcher.volume * 50 - (2 * (m.content.split('-').length - 1))) / 50, 0));
          msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume * 50)}%`);
        } else if (m.content.startsWith(`${prefix}time`)) {
          msg.channel.sendMessage(`time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000) / 1000) < 10 ? `0${Math.floor((dispatcher.time % 60000) / 1000)}` : Math.floor((dispatcher.time % 60000) / 1000)}`);
        }
      });
      dispatcher.on('end', () => {
        collector.stop();
        play(queue[msg.guild.id].songs.shift());
      });
      dispatcher.on('error', err => msg.channel.sendMessage(`error: ${err}`).then(() => {
        collector.stop();
        play(queue[msg.guild.id].songs.shift());
      }));
    }(queue[msg.guild.id].songs.shift()));
  },
  join: msg => new Promise((resolve, reject) => {
    const voiceChannel = msg.member.voiceChannel;
    if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('I couldn\'t connect to your voice channel...');
    voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
  }),
  add: (msg) => {
    const url = msg.content.split(' ')[1];
    if (url == '' || url === undefined) return msg.channel.sendMessage(`You must add a YouTube video url, or id after ${prefix}add`);
    yt.getInfo(url, (err, info) => {
      if (err) return msg.channel.sendMessage(`Invalid YouTube Link: ${err}`);
      if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
      queue[msg.guild.id].songs.push({ url, title: info.title, requester: msg.author.username });
      msg.channel.sendMessage(`added **${info.title}** to the queue`);
    });
  },
  queue: (msg) => {
    if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Add some songs to the queue first with ${prefix}add`);
    const tosend = [];
    queue[msg.guild.id].songs.forEach((song, i) => { tosend.push(`${i + 1}. ${song.title} - Requested by: ${song.requester}`); });
    msg.channel.sendMessage(`__**${msg.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n\`\`\`${tosend.slice(0, 15).join('\n')}\`\`\``);
  },
  help: (msg) => {
    const tosend = ['```xl', `${prefix}join : "Join Voice channel of msg sender"`,	`${prefix}add : "Add a valid youtube link to the queue"`, `${prefix}queue : "Shows the current queue, up to 15 songs shown."`, `${prefix}play : "Play the music queue if already joined to a voice channel"`, '', 'the following commands only function while the play command is running:'.toUpperCase(), `${prefix}pause : "pauses the music"`,	`${prefix}resume : "resumes the music"`, `${prefix}skip : "skips the playing song"`, `${prefix}time : "Shows the playtime of the song."`,	'volume+(+++) : "increases volume by 2%/+"',	'volume-(---) : "decreases volume by 2%/-"',	'```'];
    msg.channel.sendMessage(tosend.join('\n'));
  },
};

client.on('message', (msg) => {
  if (!msg.content.startsWith(prefix)) return;
  if (commands.hasOwnProperty(msg.content.toLowerCase().slice(prefix.length).split(' ')[0])) commands[msg.content.toLowerCase().slice(prefix.length).split(' ')[0]](msg);
});

client.login(token);
