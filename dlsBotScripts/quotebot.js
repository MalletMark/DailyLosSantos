const { Client, RichEmbed } = require('discord.js');

module.exports = {
    send: function (message) {
        quoteSend(message);
    }
};

function quoteSend(message, channelId) {
    console.log(process.env.QUOTE_CHANNEL_ID);
    const qChannel = message.guild.channels.find(ch => ch.id === process.env.QUOTE_CHANNEL_ID);
    if (!qChannel) return;

    var fullmsg = message.content;
    var person = fullmsg.split('<')[1].split('>')[0];
    var body = fullmsg.substring(fullmsg.indexOf('>') + 2);

    const embed = new RichEmbed()
    .setFooter("- " + person)
    .setColor(0xFF0000)
    .setDescription(body);

    qChannel.send(embed);
}