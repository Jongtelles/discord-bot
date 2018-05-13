module.exports = {
  name: 'boop',
  description: 'Boop!',
  execute(message, args) {
    message.channel.send('Boop.');
  },
};
