const { Client, RichEmbed } = require('discord.js');
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = process.env.MONGODB_CONN;
const mongoDbName = 'dls';
const fs = require('fs');

const xpostKVP = [
    { emoji: 'ballasvagosgrove', channel: 572159949673594891},
    { emoji: 'bondi', channel: 580795436785467392},
    { emoji: 'brotherhood', channel: 571775949260193813},
    { emoji: 'chang', channel: 571773421911015425},
    { emoji: 'copkillarecords', channel: 576789860497489930},
    { emoji: 'emsdoctors', channel: 571773574549995521},
    { emoji: 'leo', channel: 571773491599114251},
    { emoji: 'koreans', channel: 571774887581057033},
    { emoji: 'lawyersjudges', channel: 571773643491901440},
    { emoji: 'leanboys', channel: 571774187769692170},
    { emoji: 'prune', channel: 571773156629413889},
    { emoji: 'sahara', channel: 574511711919407106},
    { emoji: 'winery', channel: 583824089848741901},
    { emoji: 'unaffiliated', channel: 571775836659908629}
]

module.exports = {
    emojis: xpostKVP,
    get: function (message) {
        recapGet2(message);
    },
    getAll: function(client) {
        recapGetAll(client);
    },
    add: function(reaction) {
        addRecap(reaction);
    },
    remove: function(reaction) {
        removeRecap(reaction);
    },
    addXPost: function(reaction) {
        addXPost(reaction);
    },
    removeXPost: function(reaction) {
        removeXPost(reaction);
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

function removeRecap(reaction) {
    const query = { discordId: reaction.message.channel.id, url: reaction.message.url };

    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_recaps').deleteOne(query,  function (err, result) {
            client.close();
        });
    });
}

function addRecap(reaction) {
    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_recaps').findOneAndUpdate(
            { discordId: reaction.message.channel.id, url: reaction.message.url },
            { 
                $setOnInsert: {
                    discordId: reaction.message.channel.id,
                    created_on: reaction.message.createdAt.toISOString(),
                    author: reaction.message.author.username,
                    url: reaction.message.url,
                    peek: reaction.message.content.substring(0, 20)
                }
            },  
            { upsert: true }, 
            function (err, result) {
                client.close();
            }
        );
    });
}

function addXPost(reaction) {
    const channelId = xpostKVP.filter(x=>x.emoji == reaction._emoji.name)[0].channel || 0;

    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_recaps').findOneAndUpdate(
            { discordId: reaction.message.channel.id, url: reaction.message.url },
            { 
                $setOnInsert: {
                    discordId: channelId,
                    created_on: reaction.message.createdAt.toISOString(),
                    author: reaction.message.author.username,
                    url: reaction.message.url,
                    peek: reaction.message.content.substring(0, 20),
                    xpost: true
                }
            },  
            { upsert: true }, 
            function (err, result) {
                client.close();
            }
        );
    });
}

function removeXPost(reaction) {
    const channelId = xpostKVP.filter(x=>x.emoji == reaction._emoji.name)[0].channel || 0;
    const query = { discordId: channelId, url: reaction.message.url };

    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_recaps').deleteOne(query,  function (err, result) {
            client.close();
        });
    });
}

function recapGet2(message) {
    const channelId = message.channel.id;

    getRecapEmbed(channelId, 0).then((results) => {
        if (results.recaps.length > 0) {
            const rc = (results.recaps.length > 1) ? results.recaps.length.toString() + ' recaps' : 'recap'
            const messagesFormatted = results.recaps.map((m, i) => `[${i+(results.pageNum * 10)+1}. ${m.peek}... by ${m.author} (${m.created_on.substr(5, 2)}/${m.created_on.substr(8, 2)})${(m.xpost ? '(X-Post)': '')}](${m.url})`);

            const embed = new RichEmbed()
            .setTitle(`Here are the most recent ${rc} I could find!`)
            .setColor(0x0008FF)
            .setDescription(messagesFormatted.join('\n'))
            .setFooter(`Page ${results.pageNum + 1} of ${results.totalPages}`);

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
}

async function addIteratorReaction(message) {
    message.react('👈').then(() => message.react('👉'));
}

function recapIterate(react) {
    const channelId = react.message.channel.id;
    var pageNum = Number(react.message.embeds[0].footer.text.split(' ')[1]) - 1;
    var inc = 0;

    if (react._emoji.name == '👈')
        inc = -1;
    else if (react._emoji.name == '👉')
        inc = 1;

    pageNum = ((pageNum + inc) < 0) ? 0 : pageNum + inc;

    getRecapEmbed(channelId, pageNum).then((results) => {
        if (results.recaps.length > 0) {
            const rc = (results.recaps.length > 1) ? results.recaps.length.toString() + ' recaps' : 'recap'
            const messagesFormatted = results.recaps.map((m, i) => `[${i+(results.pageNum * 10)+1}. ${m.peek}... by ${m.author} (${m.created_on.substr(5, 2)}/${m.created_on.substr(8, 2)})${(m.xpost ? '(X-Post)': '')}](${m.url})`);

            const embed = new RichEmbed()
            .setTitle(`Here are the most recent ${rc} I could find!`)
            .setColor(0x0008FF)
            .setDescription(messagesFormatted.join('\n'))
            .setFooter(`Page ${results.pageNum + 1} of ${results.totalPages}`);

            react.message.edit(embed);
        }
    });
}

async function getRecapEmbed(channelId, pageNum) {
    let db = await MongoClient.connect(mongoUrl);
    let totalPages = await db.db(mongoDbName).collection('dls_recaps').find({discordId: channelId}).toArray();
    let recapsFound = await db.db(mongoDbName).collection('dls_recaps').find({discordId: channelId}).sort({created_on: -1}).skip(10*pageNum).limit(10).toArray();
    await db.close();
    return { recaps: recapsFound, pageNum: pageNum, totalPages: Math.ceil(totalPages.length/10) };
}