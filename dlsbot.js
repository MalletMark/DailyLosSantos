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
const StaffBot = require('./dlsBotScripts/staffbot.js');
const GambleBot = require('./dlsBotScripts/gamblebot.js');

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
    } else if (message.content === '!bot') {
        botHelp(message);
    } else if (message.content.substring(0, 11) === '!character ' && process.env.CHARACTERBOT == 'TRUE') {
        CharacterBot.get(message); //characterBot(message);
    } else if (message.content.substring(0, 16) === '!characterUpdate' && process.env.CHARACTERBOTUPDATE == 'TRUE') {
        CharacterBot.update(message);//characterBotUpdate(message);
    } else if (message.content.substring(0, 13) === '!characterAdd' && process.env.CHARACTERBOTADD == 'TRUE') {
        CharacterBot.add(message);//characterBotAdd(message);
    } else if (message.content.substring(0, 16) === '!characterRename' && hasPerm(message) && process.env.CHARACTERBOTADD == 'TRUE') {
        CharacterBot.rename(message);//characterBotAdd(message);
    } else if (message.content.substring(0, 16) === '!characterRemove' && hasPerm(message) && process.env.CHARACTERBOTADD == 'TRUE') {
        CharacterBot.remove(message);//characterBotAdd(message);
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
        else if (message.content.substring(0, 9) === '!shipSink' && hasPerm(message))
            ShipBot.remove(message);
        else
            ShipBot.poll(message);
    } else if (message.content.substring(0, 6) === '!crash' && process.env.CRASHBOT == 'TRUE') {
        crashBot(message);
    } else if (message.content.substring(0, 5) === '!jail') {
        jailBot(message);
    } else if (message.content.substring(0, 6) === '!staff' && process.env.STAFFBOT == 'TRUE') {
        if (message.content.substring(0,7) === '!staffU' && hasPerm(message))
            StaffBot.updateBio(message);
        else if (message.content.substring(0,7) === '!staffQ' && hasPerm(message))
            StaffBot.updateQuote(message);
        else if (message.content.substring(0,7) === '!staffC' && hasPerm(message))
            StaffBot.updateChannel(message);
        else
            StaffBot.get(message);
    } else if (message.content.substring(0, 7) === '!record' && hasPerm(message) && process.env.RECORDBOT == 'TRUE') {
        recordBot(message);
    } else if (message.content.substring(0, 5) === '!roll') {
        GambleBot.roll(message);
    } else if (message.content.substring(0, 12) === '!gamble_dice' && process.env.GAMBLEBOT == 'TRUE') {
        GambleBot.gamble_dice(message);
    } else if (message.content.substring(0, 12) === '!gamble_race' && process.env.GAMBLEBOT == 'TRUE') {
        GambleBot.gamble_race(message);
    } else if (message.content.substring(0, 11) === '!gamble_end' && hasPerm(message) && process.env.GAMBLEBOT == 'TRUE') {
        GambleBot.end(message);
    } else if (message.content.substring(0, 13) === '!gamble_start' && hasPerm(message) && process.env.GAMBLEBOT == 'TRUE') {
        GambleBot.start(message);
    } else if (message.content.substring(0, 12) === '!gamble_kick' && hasPerm(message) && process.env.GAMBLEBOT == 'TRUE') {
        GambleBot.kick_broke(message);
    } else if (message.content.substring(0, 12) === '!gamble_live' && hasPerm(message) && process.env.GAMBLEBOT == 'TRUE') {
        GambleBot.liveGame();
    } else if (message.content.substring(0, 9) === '!giveCash' && process.env.GAMBLEBOT == 'TRUE') {
        GambleBot.giveCash(client, message);
    } else if (message.content.substring(0, 5) === '!cash' && process.env.GAMBLEBOT == 'TRUE') {
        GambleBot.getCash(message);
    } else if (message.content.substring(0, 15) === '!gamble_leaders' && process.env.GAMBLEBOT == 'TRUE') {
        GambleBot.leader_board(message);
    } else {
        if (recorders.includes(message.author.id) && process.env.RECORDBOT == 'TRUE') {
            recordBot(message);
        } 
    }
});

client.on('messageReactionAdd', (reaction, user) => {
    if (reaction.emoji.name === '🎲') {
        GambleBot.initCash(user.id, user.username);
    }
});

function getRecorders() {
    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('dls_staff');
        recorders = col.find({recording: { $gt: 0}}).toArray(function(err, items) {
            recorders = items.map(x => x.discordId);
            client.close();
        })
    });
}

function hasPerm(message) {
    return permRoles2.filter(role => -1 !== message.member.roles.map(r => r.name).indexOf(role)).length > 0;
}

function botHelp(message) {
    const embed = new RichEmbed()
    .setTitle('Public Bot Commands')
    .setColor(0xFF0000)
    .addField('RecapBot', `[All Channels](https://discordapp.com/channels/571762021716983857/571916072639397888/578424038385254431)`, true)
    .addField('QuoteBot', `[All Channels](https://discordapp.com/channels/571762021716983857/571916072639397888/576996545266712596)`, true)
    .addField('HitlistBot', `[All Channels](https://discordapp.com/channels/571762021716983857/579761871247114283/581287232254509056)`, true)
    .addField('CrashBot', `[All Channels](https://discordapp.com/channels/571762021716983857/571916072639397888/581208722609799198)`, true)
    .addField('CharacterBot', `[Public-Records Only](https://discordapp.com/channels/571762021716983857/571916072639397888/579450336301940777)`, true)
    .addField('StaffBot', `[Public-Records Only](https://discordapp.com/channels/571762021716983857/581136851654541331/582369780938440715)`, true)
    .addField('ShipBot', `[Relationships-And-Romance Only](https://discordapp.com/channels/571762021716983857/576212143863627806/580626662807437332)`, true)
    .setFooter('If you need more help, please contact an Editor or Reporter!');
    message.channel.send(embed);   
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
    if (!hasPerm(message)) return;

    const mChannel = message.guild.channels.find(ch => ch.name === "moderation-log");
    const jOfficer = message.author.username;
    const jName = message.content.substring(5).split('<@')[1].split('>')[0].replace('!','');
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

function recordBot(message) {
    const rUserId = message.author.id;
    
    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('dls_staff');
        const fileName = `${rUserId}.txt`;

        if (message.content == '!recordStart') {
            col.updateOne({ discordId: rUserId }, { $set: { recording: 0 }}, function(err, item) {
                if (err) throw err;
    
                recorders.push(rUserId);
                message.author.sendMessage(`We are now recording all your message!`);
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
    
                    if (messageCount >= 20 && messageCount % 20 == 0) {
                        message.author.sendMessage(`You have recorded ${messageCount} messages!`);
                    }
    
                    client.close();
                });
            });
        }
    });
}