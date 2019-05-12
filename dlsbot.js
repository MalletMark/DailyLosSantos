const Discord = require('discord.js');
const client = new Discord.Client();
const { Client, RichEmbed } = require('discord.js');

client.once('ready', () => {
	console.log('Ready!');
});

client.login('NTc1NTY5NTM5MDI3MzA0NDQ4.XNcnQQ.t8Yf9DBR_trSConpYsRvqBkAP9A');

client.on('message', message => {
    if (message.content === '!testbot'){
        message.channel.send('works')
    }

    if (message.content.substring(0, 6) === '!quote' &&
       (message.content.match(/@/g) || []).length == 2)
    {
        const qChannel = message.guild.channels.find(ch => ch.name === 'quote-test');
        if (!qChannel) return;

        var fullmsg = message.content;
        var person = fullmsg.split('@')[1];
        var body = fullmsg.substring(fullmsg.lastIndexOf('@') + 2);

        const embed = new RichEmbed()
        .setFooter("- " + person)
        .setColor(0xFF0000)
        .setDescription(body)

        qChannel.send(embed);
    }
});