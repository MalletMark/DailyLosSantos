require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const { Client, RichEmbed } = require('discord.js');

var weedDate = Date.now();
const weedWords = ['weed', 'smoke', 'bowl', 'kush', 'bong', 'drug', 'pot', 'dank', 'thc', 'blunt', 'joint', '420'];

client.once('ready', () => {
    console.log('Ready!');
    weedDate = Date.now();
});

client.login(process.env.API_CLIENT_TOKEN);

function hasReaction(reactions, emojiName)
{
    if (reactions.length > 0) {
        return reactions.some(function(r) {
            return r._emoji.name == emojiName;
        });
    }
    return false;
}

client.on('message', message => {
    if (message.content === '!testbot'){
        message.channel.send('works');
    }

    if (message.content.toLowerCase().indexOf.indexOf('uchiha'))
    {
        message.channel.send('Fucko!');
    }

    if (message.content.substring(0,6) === '!recap')
    {
        var recapNum = Number(message.content.substring(7)) || 1;
        var rCount = 0;
        console.log(recapNum);
        var messagesQueue = [];

        message.channel.fetchMessages()
        .then(messages => {
            messages.array().every(function(m)
            {
                if (hasReaction(m.reactions.array(), 'recap'))
                {
                    if (++rCount > recapNum) return false;
                    messagesQueue.push(m);
                    return true;
                }
                return true;
            });
        }).then(messages => {
            if (messagesQueue.length > 0)
            {
                var rc = (messagesQueue.length > 1) ? messagesQueue.length.toString() + ' recaps' : 'recap'
                message.channel.send(`Here are the last ${rc} I could find!`)
                messagesQueue.reverse();
                messagesQueue.forEach(function(m)
                {
                    m.channel.send(m.url);
                })
            }
            else
            {
                message.channel.send('No recaps found in the last 100 messages :(');
            }
        });
    }

    if (message.author.username == "Pixstrad" && weedWords.some(word => message.content.includes(word)))
    {
        const qChannel = message.guild.channels.find(ch => ch.name === "reporters-only");
        var wSeconds = Math.round((Date.now() - weedDate) / 1000);
        var wDays = Math.floor(wSeconds / 86400);
        wSeconds -= wDays*86400;
        var wHours = Math.floor(wSeconds / 3600);
        wSeconds -= wHours*3600;
        var wMinutes = Math.floor(wSeconds / 60);
        wSeconds -= wMinutes * 60;

        var wSince = [];
        if (wDays > 0) wSince.push(`${wDays} days`);
        if (wHours > 0) wSince.push(`${wHours} hours`);
        if (wMinutes > 0) wSince.push(`${wMinutes} minutes`);
        if (wSeconds > 0) wSince.push(`${wSeconds} seconds`);

        qChannel.send("It's been " + wSince.join(' ') + " since Pixstrad has mentioned weed.");
        weedDate = Date.now();
    }

    if (message.content.substring(0, 6) === '!quote' &&
       (message.content.match(/@/g) || []).length == 2)
    {
        const qChannel = message.guild.channels.find(ch => ch.id === process.env.QUOTE_CHANNEL_ID);
        if (!qChannel) return;

        var fullmsg = message.content;
        var person = fullmsg.split('@')[1];
        var body = fullmsg.substring(fullmsg.lastIndexOf('@') + 2);

        const embed = new RichEmbed()
        .setFooter("- " + person)
        .setColor(0xFF0000)
        .setDescription(body);

        qChannel.send(embed);
    }
});