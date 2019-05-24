require('dotenv').config();
const fs = require('fs');

const Discord = require('discord.js');
const client = new Discord.Client();
const { Client, RichEmbed } = require('discord.js');

const MongoClient = require('mongodb').MongoClient;
const mongoUrl = process.env.MONGODB_CONN;
const mongoDbName = 'dls';

const permRoles = ['Reporter', 'Source', 'Editors', 'Editor-in-Chief', 'MEE6'];
const permRoles2 = ['Editors', 'Editor-in-Chief'];
const voteOptions = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯'];

client.once('ready', () => {
    console.log('Ready!');
    weedDate = Date.now();
});

client.login(process.env.API_CLIENT_TOKEN);

client.on('message', message => {
    if (message.content === '!testbot') {
        message.channel.send(`works`);
    } else if (message.content.substring(0, 11) === '!character ' && process.env.CHARACTERBOT == 'TRUE') {
        characterBot(message);
    } else if (message.content.substring(0, 16) === '!characterUpdate' && process.env.CHARACTERBOTUPDATE == 'TRUE') {
        characterBotUpdate(message);
    } else if (message.content.substring(0, 13) === '!characterAdd' && process.env.CHARACTERBOTADD == 'TRUE') {
        characterBotAdd(message);
    } else if (message.content.substring(0,6) === '!recap' && process.env.RECAPBOT == 'TRUE') {
        recapBot(message);
    } else if (message.content.substring(0, 6) === '!quote' &&
        message.content.indexOf('<') > 0 && 
        message.content.indexOf('>') > 0 && process.env.QUOTEBOT == 'TRUE') {
        quoteBot(message, process.env.QUOTE_CHANNEL_ID);
    } else if (message.content.substring(0, 8) === '!hitlist' && process.env.HITLISTBOT == 'TRUE') {
        if (message.content.indexOf('hitlistNew') >= 0)
            hitListBotNew(message);
        else if (message.content.indexOf('-') > 0)
            hitListBotKill(message);
        else if (message.content.indexOf('+') > 0)
            hitListBotAdd(message);
        else if (message.content.substring())
            hitListBot(message);
    } else if (message.content.substring(0, 5) === '!ship' && process.env.SHIPBOT == 'TRUE') {
        if (message.content.indexOf('<') > 0 &&
            message.content.indexOf('>') > 0 &&
            message.content.indexOf('(') > 0 &&
            message.content.indexOf(')') > 0)
            shipBotAdd(message);
        else
            shipBot(message);
    } else if (message.content.substring(0, 6) === '!crash' && process.env.CRASHBOT == 'TRUE') {
        crashBot(message);
    } else if (message.content.substring(0, 5) === '!jail') {
        jailBot(message);
    }
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
    if (message.channel.name != 'public-records') {
        message.channel.send(`Please visit ${message.guild.channels.get('581136851654541331').toString()}`);
        return;
    }
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
                message.channel.send(`Found ${items.length} characters! Please try again with on of the following characters: \n ${characters.join(', ')}`);
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
    if (message.channel.name != 'public-records') {
        message.channel.send(`Please visit ${message.guild.channels.get('581136851654541331').toString()}`);
        return;
    }

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
    if (message.channel.name != 'public-records') {
        message.channel.send(`Please visit ${message.guild.channels.get('581136851654541331').toString()}`);
        return;
    }
    
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

function hitListBotNew(message) {
    const cName = message.content.substring(11).trim();

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('nopixel_characters');

        col.find({ name: {'$regex': cName, '$options' : 'i' }}).toArray(function(err, items) {
            if (err) throw err;

            if (items.length == 0) {
                message.channel.send(`${cName} that character does not exist.`);
            }
            else if (items.length > 1) {
                message.channel.send(`Please be more specific. I found the following: ${items.map(x=>x.name).join(', ')}`);
            }
            else {
                const cFullName = items[0].name;
                const cObj = {};
                cObj["listname"] = cFullName;
                cObj["targets"] = [];

                col2 = client.db(mongoDbName).collection('nopixel_hitlist');
                col2.insertOne(cObj, function(err, item) {
                    if (err) throw err;

                    message.channel.send(`${cFullName} has started a list...`);
                    client.close();
                })
            }
        });

    });
}

function shipBot(message) {
    const sMembers = message.content.substring(6).trim().split('+').filter(function(x){ return x != ''});
    if (sMembers.length == 0) return;

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('nopixel_shiplist');
        var regex = [];
        
        sMembers.forEach(function(sMember){
            regex.push(new RegExp(sMember, "i"));
        });

        col.find({ captains: {'$all': regex}}, function (err, results){
            if (err)
                message.channel.send(`No ships found :(`);
            else {
                var cNum = 0;
                var sUsers;
                var sId = 0;
                var sNames = []; 
                var embed = new RichEmbed()
                .setTitle(`${sMembers[0]}'s Romances`)
                .setColor(0xFF25C0)
                .setDescription('Vote for your favorite ship by reacting with the designated emojis! You can only vote for 1 couple!')
                .setFooter('This poll ends in 3 minutes!');

                results.forEach(function(ship){
                    sNames.push(ship.name);
                    embed.addField(ship.name, `${voteOptions[cNum++]} (${ship.members.length}) members`, true);
                }, function() { 
                    if (embed.fields.length == 0) {
                        message.channel.send(`No ships found :(`);
                        return;
                    }
                    message.channel.send(embed).then((sMessage) => {
                        const filter = (reaction, user) => ({});
                        shipBotReact(sMessage, 0, sNames.length);
                        
                        sMessage.awaitReactions(filter, { time: 180000 })
                        .then((collected) => {
                            collected.array().forEach(function(react) {
                                sUsers = react.users.map(x=>x.username).filter(u => u != 'LosSantosFiles');
                                sId = voteOptions.indexOf(react.emoji.name);

                                if (sId > -1) {
                                    shipBotJoin(col, sNames[sId], sUsers);
                                }
                            });

                            setTimeout(function(){
                                col.aggregate([
                                    { $match : { "captains": {'$all': regex}}},
                                    { $unwind : "$members" },
                                    { $group : { 
                                        "_id": "$name",
                                        "len" : { $sum : 1 }}},
                                    { $sort : {len : -1 } },
                                    { $limit : 1 }])
                                    .toArray(function(err, result) {
                                        if (err) throw err;

                                        message.channel.send(`Poll is closed! ${result[0]._id} wins!`);
                                        client.close(); 
                                    });
                            }, 1000);
                        })
                        .catch(console.error);
                    });
                });
            }
        })
    });
}

async function shipBotReact(message, eCount, eMax) {
    while (eCount++ < eMax) {
        await message.react(`${voteOptions[eCount-1]}`);
    }
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

async function shipBotJoin(col, sName, sUsers) {
    MongoClient.connect(mongoUrl, function(err, client) {

        col.findOne({ name: sName }, function(err, result) {
            var sCaptains = result.captains;

            col.updateMany({ captains: { $in: sCaptains } }, { $pull: { members: { $in: sUsers } } }, { multi: true }, function(err, result) {
                col.updateOne({ name: sName }, { $push: { members: { $each: sUsers } } });
            });
        })
    });
}

function crashBot(message) {
    var cName = '';
    var cNum = 0;

    if (message.content.indexOf('(') > 0 && message.content.indexOf(')') > 0) {
        cName = message.content.substring(6).split('(')[0].trim();
        cNum = Number(message.content.split('(')[1].split(')')[0]);
    } else {
        cName = message.content.substring(6).trim();
    }

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('nopixel_characters');

        col.find({ name: {'$regex': cName, '$options' : 'i'}}).toArray(function(err, items) {
            if (err) throw err;

            if (items.length == 0)
            {
                message.channel.send(`${cName} has no record!`);
            }
            else if(items.length > 1)
            {
                var characters = items.map(x => x['name']);
                message.channel.send(`Which ${cName}? ${characters.join(', ')}`);
            }
            else
            {
                const foundCharacter = items[0];
                if (cNum > 0) {
                    message.channel.send(`${foundCharacter.name} has crashed ${++cNum} times!`);

                    col.updateOne({ _id: foundCharacter._id }, { $set: { crashCount: cNum }}, function(err, item) {
                        client.close();
                    })
                }
                else if (foundCharacter.crashCount == null) {
                    message.channel.send(`${foundCharacter.name} has had his first inicident!`);

                    col.updateOne({ _id: foundCharacter._id }, { $set: { crashCount: 1 }}, function(err, item) {
                        client.close();
                    })
                }
                else {
                    message.channel.send(`${foundCharacter.name} has crashed ${foundCharacter.crashCount + 1} times!`);

                    col.updateOne({ _id: foundCharacter._id }, { $inc: { crashCount: 1 }}, function(err, item) {
                        client.close();
                    })
                }
            }
        });
    });
}

function jailBot(message) {
    const hasPerm = permRoles2.filter(role => -1 !== message.member.roles.map(r => r.name).indexOf(role)).length > 0;
    if (!hasPerm) return;

    const mChannel = message.guild.channels.find(ch => ch.name === "moderation-log");
    const jName = message.content.substring(5).trim().split(' ')[0];
    const jMonths = Number(message.content.substring(5).trim().split(' ')[1]);
    const jUser = client.users.find("username", jName);
    message.guild.fetchMember(jUser).then((member) => {
        member.addRole(process.env.BOLINGBROOKID);
        member.removeRole(process.env.REPORTERID);
        mChannel.send(`${jUser.username} has been sent to Bolingbrook for ${jMonths} Months`);

        setTimeout(function(username) { 
            member.addRole(process.env.REPORTERID);
            member.removeRole(process.env.BOLINGBROOKID);
            mChannel.send(`${username} has been released`);
        }, 10000 * jMonths, jUser.username);
    })
}