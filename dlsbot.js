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
        message.channel.send('works')
    }

    if (message.content.substring(0,6) === '!recap')
    {
        var recapNum = Number(message.content.substring(7));
        var rCount = 0;
        console.log(recapNum);
        var messagesQueue = [];

        message.channel.fetchMessages({limit: 100})
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
            })

            if (messagesQueue.length > 0)
            {
                recapNum = (recapNum > messagesQueue.length) ? messagesQueue.length : recapNum;
                message.channel.send('Here are the last ' + recapNum.toString() + ' recaps I could find!')
                messagesQueue.reverse();
                messagesQueue.forEach(function(m)
                {
                    m.channel.send(m.url);
                })
            }
        });
    }

    if (message.author.username == "Pixstrad" && weedWords.some(word => message.content.includes(word)))
    {
        const qChannel = message.guild.channels.find(ch => ch.name === "reporters-only");
        var weedSince = Math.round((Date.now() - weedDate) / 1000);
        console.log(weedSince);
        qChannel.send("It's been " + weedSince.toString() + " seconds since Pixstrad has mentioned weed.");
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