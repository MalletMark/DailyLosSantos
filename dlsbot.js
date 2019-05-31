require('dotenv').config();
const fs = require('fs');

const Discord = require('discord.js');
const client = new Discord.Client();
const { Client, RichEmbed } = require('discord.js');

const MongoClient = require('mongodb').MongoClient;
const mongoUrl = process.env.MONGODB_CONN;
const mongoDbName = 'dls';

// Bot Libraries
const FooBar = require('./dlsBotScripts/testbot.js');
const CharacterBot = require('./dlsBotScripts/characterbot.js');
const RecapBot = require('./dlsBotScripts/recapbot.js');
const QuoteBot = require('./dlsBotScripts/quotebot.js');
const HitlistBot = require('./dlsBotScripts/hitlistbot.js');
const ShipBot = require('./dlsBotScripts/shipbot.js');

const permRoles = ['Reporter', 'Source', 'Editors', 'Editor-in-Chief', 'MEE6'];
const permRoles2 = process.env.JAILPERMS.split(',');
const detentionList = process.env.DEADIDS.split(',');
var recorders = [];

client.once('ready', () => {
    console.log('Ready!');
    getRecorders();
});

client.login(process.env.API_CLIENT_TOKEN);

client.on('message', message => {
    if (message.content.substring(0, 1) === '!' && detentionList.indexOf(message.author.id) > -1) {
        message.channel.send(`I do not listen to you anymore ;)`);
        return;
    }

    if (message.content === '!testbot') {
        FooBar.foo(message);
    } else if (message.content.substring(0, 11) === '!character ' && process.env.CHARACTERBOT == 'TRUE') {
        CharacterBot.get(message); //characterBot(message);
    } else if (message.content.substring(0, 16) === '!characterUpdate' && process.env.CHARACTERBOTUPDATE == 'TRUE') {
        CharacterBot.update(message);//characterBotUpdate(message);
    } else if (message.content.substring(0, 13) === '!characterAdd' && process.env.CHARACTERBOTADD == 'TRUE') {
        CharacterBot.add(message);//characterBotAdd(message);
    } else if (message.content.substring(0,6) === '!recap' && process.env.RECAPBOT == 'TRUE') {
        RecapBot.get(message);
    } else if (message.content.substring(0, 6) === '!quote' &&
        message.content.indexOf('<') > 0 && 
        message.content.indexOf('>') > 0 && process.env.QUOTEBOT == 'TRUE') {
        QuoteBot.send(message);
    } else if (message.content.substring(0, 8) === '!hitlist' && process.env.HITLISTBOT == 'TRUE') {
        if (message.content.indexOf('hitlistNew') >= 0)
            HitlistBot.create(message);
        else if (message.content.indexOf('-') > 0)
            HitlistBot.kill(message);
        else if (message.content.indexOf('+') > 0)
            HitlistBot.add(message);
        else if (message.content.substring())
            HitlistBot.get(message);
    } else if (message.content.substring(0, 5) === '!ship' && process.env.SHIPBOT == 'TRUE') {
        if (message.content.indexOf('<') > 0 &&
            message.content.indexOf('>') > 0 &&
            message.content.indexOf('(') > 0 &&
            message.content.indexOf(')') > 0)
            ShipBot.add(message);
        else
            ShipBot.poll(message);
    } else if (message.content.substring(0, 6) === '!crash' && process.env.CRASHBOT == 'TRUE') {
        crashBot(message);
    } else if (message.content.substring(0, 5) === '!jail') {
        jailBot(message);
    } else if (message.content.substring(0, 6) === '!staff' && process.env.STAFFBOT == 'TRUE') {
        if (message.content.substring(0,7) === '!staffU')
            staffBotUpdateBio(message);
        else if (message.content.substring(0,7) === '!staffQ')
            staffBotUpdateQuote(message);
        else if (message.content.substring(0,7) === '!staffC')
            staffBotUpdateChannel(message);
        else
            staffBot(message);
    } else if (message.content.substring(0, 7) === '!record' && process.env.RECORDBOT == 'TRUE') {
        recordBot(message);
    } else if (message.content.substring(0, 5) === '!roll') {
        rollBot(message);
    } else if (recorders.includes(message.author.id) && process.env.RECORDBOT == 'TRUE') {
        recordBot(message);
    } 
});

function getRecorders(){
    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('dls_staff');
        recorders = col.find({recording: { $gt: 0}}).toArray(function(err, items) {
            recorders = items.map(x => x.discordId);
            client.close();
        })
    });
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
    const jOfficer = message.author.username;
    const jName = message.content.substring(5).split('<@')[1].split('>')[0];
    const jMonths = Number(message.content.substring(5).trim().split('-')[0].split(' ')[1]);
    const jReason = message.content.substring(5).trim().split('-')[1];
    const jUser = client.users.find("id", jName);
    message.guild.fetchMember(jUser).then((member) => {
        member.addRole(process.env.BOLINGBROOKID);
        member.removeRole(process.env.INTERVIEWERID);
        if (jReason != null) {
            console.log(jReason.trim());
            mChannel.send(`${jUser.username} has been sent to Bolingbrook by ${jOfficer} for ${jMonths} Months. Reason: ${jReason.trim()}`);
            member.sendMessage(`You have been timed out from posting for ${jMonths} minutes for the reason of: \n${jReason.trim()}`);
        } else {
            mChannel.send(`${jUser.username} has been sent to Bolingbrook for ${jMonths} Months`);
        }

        setTimeout(function(username) { 
            member.addRole(process.env.INTERVIEWERID);
            member.removeRole(process.env.BOLINGBROOKID);
            mChannel.send(`${username} has been released`);
        }, 60000 * jMonths, jUser.username);
    })
}

function staffBot(message) {
    if (message.channel.name != 'public-records') {
        message.channel.send(`Please visit ${message.guild.channels.get('581136851654541331').toString()}`);
        return;
    }

    const cName = message.content.substring(6).trim();

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('dls_staff');

        col.find({ name: {'$regex': cName, '$options' : 'i'}}).toArray(function(err, items) {
            if (err) throw err;

            if (items.length == 0)
            {
                message.channel.send(`${cName} is not a staff member.`);
            }
            else if(items.length > 1)
            {
                var characters = items.map(x => x['name']);
                message.channel.send(`Found ${items.length} staff members! Please try again with on of the following characters: \n ${characters.join(', ')}`);
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
                    .addField('Role', foundCharacter.role)
                    .addField('Bio', foundCharacter.description)
                    .addField('Favorite Channel', (foundCharacter.channel) ? foundCharacter.channel.join(', ') : "n/a")
                    .addField('Quote', (foundCharacter.quote) ? foundCharacter.quote : "n/a");
                    message.channel.send(embed);
                }
            }
        });

        client.close();
    });
}

function staffBotUpdateBio(message) {
    if (message.channel.name != 'public-records') {
        message.channel.send(`Please visit ${message.guild.channels.get('581136851654541331').toString()}`);
        return;
    }
    
    const cName = message.content.split('<')[1].split('>')[0];
    const cDesc = message.content.split('>')[1].trim();

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('dls_staff');

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
                    message.channel.send(`Found ${items.length} characters! Please select a single staff member`);
                }
                else
                {
                    message.channel.send("No staff member found");
                }
                client.close();
            }
        });
    });
}

function staffBotUpdateQuote(message) {
    if (message.channel.name != 'public-records') {
        message.channel.send(`Please visit ${message.guild.channels.get('581136851654541331').toString()}`);
        return;
    }
    
    const cName = message.content.split('<')[1].split('>')[0];
    const cQuote = message.content.split('>')[1].trim();

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('dls_staff');

        col.find({ name: {'$regex': cName, '$options' : 'i' }}).toArray(function(err, items) {
            if (err) throw err;

            if (items.length == 1)
            {
                col.updateOne({ _id: items[0]._id }, { $set: { quote: cQuote }}, function(err, item) {
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
                    message.channel.send(`Found ${items.length} characters! Please select a single staff member`);
                }
                else
                {
                    message.channel.send("No staff member found");
                }
                client.close();
            }
        });
    });
}

function staffBotUpdateChannel(message) {
    if (message.channel.name != 'public-records') {
        message.channel.send(`Please visit ${message.guild.channels.get('581136851654541331').toString()}`);
        return;
    }
    
    const cName = message.content.split('<')[1].split('>')[0];
    var cChannels = message.content.substring(message.content.indexOf('>')+1).trim().split(',').map(x => x.trim());

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('dls_staff');

        col.find({ name: {'$regex': cName, '$options' : 'i' }}).toArray(function(err, items) {
            if (err) throw err;

            if (items.length == 1)
            {
                col.updateOne({ _id: items[0]._id }, { $set: { channel: cChannels }}, function(err, item) {
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
                    message.channel.send(`Found ${items.length} characters! Please select a single staff member`);
                }
                else
                {
                    message.channel.send("No staff member found");
                }
                client.close();
            }
        });
    });
}

function recordBot(message) {
    const rUserId = message.author.id;
    
    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('dls_staff');
        const fileName = `${rUserId}.txt`;

        if (message.content == '!recordStart') {
            col.updateOne({ discordId: rUserId }, { $set: { recording: 0 }}, function(err, item) {
                if (err) throw err;
    
                recorders.push(rUserId);
                message.channel.send(`We are now recording all your message!`);
                fs.writeFile(fileName, 'Start of Recording. \r\n', function(err) {
                    if (err) throw err;
                    console.log('Saved!');
                });

                client.close();
            });
        } 
        else if (message.content == '!recordEnd') {        
            col.updateOne({ discordId: rUserId }, { $set: { recording: 0 }}, function(err, item) {
                if (err) throw err;
    
                recorders = recorders.filter(function(val, ind, arr){ return val == rUserId });
                fs.readFile(fileName, function read(err, data) {
                    if (err) throw err;
                    
                    var messages = data.toString().split("\r\n");
                    var posts = [''];
                    var pCount = 0;

                    messages.forEach(function(m) {
                        if (posts[pCount].length + m.length < 2000) {
                            posts[pCount] += m + "\r\n";
                        } else {
                            posts[++pCount] = m;
                        }
                    })
                    
                    posts.forEach(function(p) {
                        message.author.sendMessage(p);
                    });
                });

                client.close();
            });
        }
        else {
            fs.appendFile(fileName, `${message.content} \r\n`, function(err) {
                if (err) throw err;

                col.updateOne({ discordId: rUserId }, { $inc: { recording: 1 }}, function(err, item) {
                    if (err) throw err;
    
                    var messageCount = Number(item['recording']);
    
                    if (messageCount >= 50 && messageCount % 50 == 0) {
                        message.channel.send(`You have recorded ${messageCount} messages!`);
                    }
    
                    client.close();
                });
            });
        }
    });
}

function rollBot(message) {
    const dNum = Number(message.content.split(' ')[1]);
    const dType = Number(message.content.split(' ')[2]);

    if (dNum > 100 || dType > 100) {
        message.channel.send(`It's too big even for me :(`);
        return;
    }

    var diceStr = [];

    for (var i = 0; i < dNum; i++) {
        diceStr.push(Math.floor(Math.random() * dType) + 1);
    }

    message.channel.send(`You rolled a ${diceStr.join(', ')}`);
}