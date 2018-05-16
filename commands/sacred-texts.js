import ytdl from 'ytdl-core';

module.exports = {
  name: 'sacred-texts',
  description: 'Play the sacred texts.',
  execute(message, args) {
    const { voiceChannel } = message.member;

    if (!voiceChannel) {
      return message.reply('Please join a voice channel first!');
    }

    voiceChannel.join().then((connection) => {
      const stream = ytdl('https://www.youtube.com/watch?v=4bMM7tGV9MI&list=PL1F39833581FDF350', { filter: 'audioonly' });
      const dispatcher = connection.playStream(stream);

      dispatcher.on('end', () => voiceChannel.leaver());
    });
  },
};

