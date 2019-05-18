require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const { Client, RichEmbed } = require('discord.js');

const MongoClient = require('mongodb').MongoClient;
const mongoUrl = process.env.MONGODB_CONN;
const mongoDbName = 'dls';

var weedDate = Date.now();
const weedWords = ['weed', 'smoke', 'bowl', 'kush', 'bong', 'drug', 'pot', 'dank', 'thc', 'blunt', 'joint', '420'];

client.once('ready', () => {
    console.log('Ready!');
    weedDate = Date.now();
});

client.login(process.env.API_CLIENT_TOKEN);

client.on('message', message => {
    if (message.content === '!testbot') {
        message.channel.send('works');
    } else if (message.content.substring(0, 11) === '!character ') {
        characterBot(message);
    } else if (message.content.substring(0, 16) === '!characterUpdate') {
        characterBotUpdate(message);
    } else if (message.content.substring(0, 13) === '!characterAdd') {
        characterBotAdd(message);
    } else if (message.content.substring(0,6) === '!recap') {
        recapBot(message);
    } else if (message.content.substring(0, 6) === '!quote' &&
        message.content.indexOf('<') > 0 && 
        message.content.indexOf('>') > 0) {
        quoteBot(message, process.env.QUOTE_CHANNEL_ID);
    }

    if (message.author.username == "Pixstrad" && weedWords.some(word => message.content.includes(word)))
    {
        pixBot(message);
    }
});

function characterBot(message) {
    const cName = message.content.substring(11);

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('nopixel_characters');

        col.find({ name: {'$regex': cName, '$options' : 'i'}}).toArray(function(err, items) {
            if (err) throw err;

            if (items.length == 0)
            {
                message.channel.send(`No Characters Found :(. To add a new character, type !characterAdd <${cName}>`);
            }
            else if(items.length > 1)
            {
                var characters = items.map(x => x['name']);
                message.channel.send(`Found ${items.length} characters! ${characters.join(', ')}`);
            }
            else
            {
                const foundCharacter = items[0];
                if (foundCharacter.description == null)
                    message.channel.send(`No info on ${foundCharacter.name}. Add a description by typing '!characterUpdate <${foundCharacter.name}> add your description here!'`);
                else
                {
                    const embed = new RichEmbed()
                    .setTitle(foundCharacter.name)
                    .setColor(0xFF0000)
                    .setDescription(foundCharacter.description);
                    message.channel.send(embed);   
                }
            }
        });

        client.close();
    });
}

function characterBotAdd(message) {
    const cName = message.content.split('<')[1].split('>')[0];
    const cDesc = message.content.split('>')[1].trim();

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('nopixel_characters');

        col.find({ name: {'$regex': cName, '$options' : 'i' }}).toArray(function(err, items) {
            if (err) throw err;

            if (items.length == 0)
            {
                col.insertOne({ name: cName }, function(err, item) {
                    if (err) throw err;

                    message.channel.send(`${cName} has now been filed!`);
                    client.close();
                })
            }
            else
            {
                message.channel.send("That character already exists!");

                client.close();
            }
        });

    });
}

function characterBotUpdate(message) {
    const cName = message.content.split('<')[1].split('>')[0];
    const cDesc = message.content.split('>')[1].trim();

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('nopixel_characters');

        col.find({ name: {'$regex': cName, '$options' : 'i' }}).toArray(function(err, items) {
            if (err) throw err;

            if (items.length == 1)
            {
                col.updateOne({ _id: items[0]._id }, { $set: { description: cDesc }}, function(err, item) {
                    if (err) throw err;

                    message.channel.send(`Thanks for updating ${items[0].name}'s file!`);
                    client.close();
                })
            }
            else 
            {
                if(items.length > 1)
                {
                    var characters = items.map(x => x['name']);
                    message.channel.send(`Found ${items.length} characters! Please select a single character`);
                }
                else
                {
                    message.channel.send("No Characters Found");
                }
                client.close();
            }
        });
    });
}

function recapBot(message) {
    const recapNum = 10;

    fetchRecaps(message.channel, recapNum)
    .then(messagesQueue => {
        if (messagesQueue.length > 0)
        {
            messagesQueue.reverse();
            const rc = (messagesQueue.length > 1) ? messagesQueue.length.toString() + ' recaps' : 'recap'
            const messagesFormatted = messagesQueue.map(m => `[${m.content.substring(0, 20)}...](${m.url})`);

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

function pixBot(message) {
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

function quoteBot(message, channelId) {
    const qChannel = message.guild.channels.find(ch => ch.id === channelId);
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