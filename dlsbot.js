require('dotenv').config();
const fs = require('fs');

const Discord = require('discord.js');
const client = new Discord.Client();
const { Client, RichEmbed } = require('discord.js');

const MongoClient = require('mongodb').MongoClient;
const mongoUrl = process.env.MONGODB_CONN;
const mongoDbName = 'dls';

const permRoles = ['Reporter', 'Source', 'Editors', 'Editor-in-Chief', 'MEE6']

client.once('ready', () => {
    console.log('Ready!');
    weedDate = Date.now();
});

client.login(process.env.API_CLIENT_TOKEN);

client.on('message', message => {
    const hasPerm = permRoles.some(role => message.member.roles.map(r => r.name).indexOf(role) > -1);

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
    } else if (message.content.substring(0, 8) === '!hitlist') {
        if (message.content.indexOf('-') > 0)
            hitListBotKill(message);
        else if (message.content.indexOf('+') > 0)
            hitListBotAdd(message);
        else
            hitListBot(message)
    } else if (message.content.substring(0, 12) === '!hitlistKill') {
        hitListBotKill(message);
    } else if (message.content.substring(0, 5) === '!ship') {
        if (message.content.indexOf('<') > 0 &&
            message.content.indexOf('>') > 0 &&
            message.content.indexOf('(') > 0 &&
            message.content.indexOf(')') > 0)
            shipBotAdd(message);
        else
            shipBot(message);
    }
});

client.on('messageReactionAdd', (reaction, user) => {
    if (reaction.message.author.username === 'LosSantosFiles' &&
        reaction.message.content.split('').reverse().join('').substring(0, 6) === '!su pi')
	    shipBotJoin(reaction);
});

async function getCharacters(message)
{
    let last_id;
    const channel = message.channel;

    var c_log = fs.createWriteStream('c_log.txt', { flags: 'a' });

    while (true)
    {
        const options = { limit : 100 };
        if (last_id) {
            options.before = last_id;
        }

        const mQueue = await channel.fetchMessages(options);
        mQueue.array().every(function(m)
        {
            if (m.content.substring(0, 10) == '!character')
            {
                c_log.write(m.content + '\r\n');
            }
            return true;
        });

        last_id = mQueue.last().id;

        if (mQueue.size != 100) {
            break;
        }
    }

    c_log.end();
}

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
                const cObj = {};
                cObj["name"] = cName;
                if (cDesc.length > 0) cObj["description"] = cDesc

                col.insertOne(cObj, function(err, item) {
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

function hitListBot(message) {
    const cName = message.content.substring(9);

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('nopixel_hitlist');

        col.findOne({ listname: {'$regex': cName, '$options' : 'i'}}, function (err, result){
            if (result == null)
                message.channel.send(`${cName}'s list not found.`);
            else {
                var targets = result.targets.map(x => (x.status) ? `~~${x.name}~~` : x.name);
                const embed = new RichEmbed()
                .setTitle(`${result.listname}'s List`)
                .setColor(0xFF0000)
                .setDescription(targets.join('\n'));
                message.channel.send(embed);   
            }
    
            client.close();
        })
    });
}

function hitListBotKill(message)
{
    const cName = message.content.substring(8).split('-')[0].trim();
    const tName = message.content.split('-')[1].trim();

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('nopixel_hitlist');

        col.updateOne(
            { listname: {'$regex': cName, '$options' : 'i'}, 'targets.name' : {'$regex': tName, '$options' : 'i'}}, 
            { $set: { 'targets.$.status': true }}, function (err, result) {
            if (result.matchedCount == 0)
                message.channel.send(`${tName} was not a target`);
            else
                message.channel.send(`Good bye ${tName}`);
    
            client.close();
        })
    });
}

function hitListBotAdd(message)
{
    const cName = message.content.substring(8).split('+')[0].trim();
    const tName = message.content.split('+')[1].trim();

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('nopixel_hitlist');

        col.updateOne(
            { listname: {'$regex': cName, '$options' : 'i'}}, 
            { $push: { targets: { name: tName, status: false }}}, function (err, result) {
                message.channel.send(`${cName} will see you soon ${tName}`);
    
            client.close();
        })
    });
}

function shipBot(message) {
    const sMembers = message.content.substring(6).trim().split('+');

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('nopixel_shiplist');
        var regex = [];
        
        sMembers.forEach(function(sMember){
            regex.push(new RegExp(sMember, "i"));
        });

        col.find({ captains: {'$all': regex}}, function (err, results){
            if (results == null)
                message.channel.send(`${cName}'s list not found.`);
            else {
                results.forEach(function(ship){
                    message.channel.send(`:ship:~${ship.name}~:ship: has ${ship.members.length} members! React to me if you ship us!`)
                });
            }
    
            client.close();
        })
    });
}

function shipBotAdd(message) {
    const sName = message.content.split('<')[1].split('>')[0];
    const sCaptains = message.content.split('(')[1].split(')')[0].split(',').map(c => c.trim());

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('nopixel_shiplist');
        var shipObj = {
            "name" : sName,
            "captains" : sCaptains,
            "members" : []
        }

        col.insertOne(shipObj, function (err, result){
            message.channel.send(`:ship:~${sName}~:ship: has sailed!`)    
            client.close();
        })
    });
}

function shipBotJoin(reaction) {
    const sUser = reaction.users.first().username;
    const sName = reaction.message.content.split('~')[1]

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('nopixel_shiplist');

        col.findOne({ name: sName }, function(err, result) {
            var sCaptains = result.captains;

            col.update({ captains: { $in: sCaptains } }, { $pull: { members: sUser } }, { multi: true }, function(err, result) {
                col.updateOne({ name: sName }, { $push: { members: sUser }});
                client.close();
            });
        })
    });
}