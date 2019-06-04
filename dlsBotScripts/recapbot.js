const { Client, RichEmbed } = require('discord.js');
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = process.env.MONGODB_CONN;
const mongoDbName = 'dls';
const fs = require('fs');

module.exports = {
    get: function (message) {
        recapGet2(message);
    },
    getAll: function(client) {
        recapGetAll(client);
    },
    add: function(reaction, user) {
        addRecap(reaction, user);
    },
    remove: function(reaction, user) {
        removeRecap(reaction, user);
    },
    iterate: function(react) {
        recapIterate(react);
    }
};

function recapGet(message) {
    const recapNum = 10;

    fetchRecaps(message.channel, recapNum)
    .then(messagesQueue => {
        if (messagesQueue.length > 0)
        {
            messagesQueue.reverse();
            const rc = (messagesQueue.length > 1) ? messagesQueue.length.toString() + ' recaps' : 'recap'
            const messagesFormatted = messagesQueue.map(m => `[${m.content.substring(0, 20)}... by ${m.author.username}](${m.url})`);

            const embed = new RichEmbed()
            .setTitle(`Here are the last ${rc} I could find!`)
            .setColor(0x0008FF)
            .setDescription(messagesFormatted.join('\n'));

            message.channel.send(embed);
        }
        else
        {
            message.channel.send('No recaps found :(');
        }
    });
}

function recapGetAll(client) {
    const approvedChannels = []

    client.channels.forEach((channel) => {
        console.log(channel);
        fetchRecapLinks(channel)
        .then(messagesQueue => {
            message.channel.send('Complete!');
        });
    })
}

function hasReaction(reactions, emojiName)
{
    if (reactions.length > 0) {
        return reactions.some(function(r) {
            return r._emoji.name == emojiName;
        });
    }
    return false;
}

async function fetchRecaps(channel, recapNum) {
    const messagesQueue = [];
    let last_id;
    let rCount = 0;

    while (rCount < recapNum)
    {
        const options = { limit : 100 };
        if (last_id) {
            options.before = last_id;
        }

        const messages = await channel.fetchMessages(options);
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
        last_id = messages.last().id;

        if (messages.size != 100 || rCount > recapNum) {
            break;
        }
    }

    return messagesQueue;
}

async function fetchRecapLinks(channel) {
    let last_id;

    while (true)
    {
        if (channel.parent == null) break;
        if (channel.parent.name != "Event Discussions" && channel.parent.name != "Faction Recaps") break;

        const options = { limit : 100 };
        if (last_id) {
            options.before = last_id;
        }

        const messages = await channel.fetchMessages(options);
        messages.array().every(function(m)
        {
            if (hasReaction(m.reactions.array(), 'recap')) {
                fs.appendFile(`all_recaps.txt`, `${channel.id + '|' + m.createdAt.toISOString() + '|' + m.author.username + '|' + m.url + '|' + m.content.substring(0, 20)} \r\n`);
            }
            return true;
        });
        last_id = messages.last().id;

        if (messages.size != 100) {
            break;
        }
    }
}

function removeRecap(reaction, user) {
    const query = { discordId: reaction.message.channel.id ,created_on: reaction.message.createdAt.toISOString() };

    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_recaps').deleteOne(query,  function (err, result) {
            client.close();
        });
    });
}

function addRecap(reaction, user) {
    const newRecap = {
        discordId: reaction.message.channel.id,
        created_on: reaction.message.createdAt.toISOString(),
        author: user.username,
        url: reaction.message.url,
        messagePeek: reaction.message.content.substring(0, 20)
    };

    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_recaps').insertOne(newRecap,  function (err, result) {
            client.close();
        });
    });
}

function recapGet2(message) {
    const channelId = message.channel.id;

    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_recaps').find({discordId: channelId}).sort({date_won: -1}).limit(10).toArray(function (err, results) {
            if (results.length > 0)
            {
                const rc = (results.length > 1) ? results.length.toString() + ' recaps' : 'recap'
                const messagesFormatted = results.map(m => `[${m.peek}... by ${m.author}](${m.url})`);
                
                const embed = new RichEmbed()
                .setTitle(`Here are the last ${rc} I could find! (starting from most recent)`)
                .setColor(0x0008FF)
                .setDescription(messagesFormatted.join('\n'))
                .setFooter("1");

                message.channel.send(embed).then((nMessage) => {
                    addIteratorReaction(nMessage);
                }).catch({});
            }
            else
            {
                message.channel.send('No recaps found :(')
                .then((nMessage) => {
                    addIteratorReaction(nMessage);
                });
            }
        });
    });
}

async function addIteratorReaction(message) {
    message.react('👈').then(() => message.react('👉'));
}

function recapIterate(react) {
    const channelId = react.message.channel.id;
    let pageNum = Number(react.message.embeds[0].footer);
    var inc = 0;

    if (react._emoji.name == '')
        inc = 1;
    else if (react._emoji.name == '')
        inc = -1;

    pageNum += inc;
    pageNum = (pageNum < 0) ? 0 : pageNum;
    const pNum = pageNum;

    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_recaps').find({discordId: channelId}).sort({date_won: -1}).skip(10*pNum).limit(10).toArray(function (err, results) {
            if (results.length > 0)
            {
                const rc = (results.length > 1) ? results.length.toString() + ' recaps' : 'recap'
                const messagesFormatted = results.map(m => `[${m.peek}... by ${m.author}](${m.url})`);

                const embed = new RichEmbed()
                .setTitle(`Here are the most recent ${rc} I could find!`)
                .setColor(0x0008FF)
                .setDescription(messagesFormatted.join('\n'))
                .setFooter(pNum);

                react.message.edit(embed);
            }
        });
    });
}