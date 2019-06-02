const { Client, RichEmbed } = require('discord.js');
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = process.env.MONGODB_CONN;
const mongoDbName = 'dls';
const voteOptions = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺'];
const raceAnimals = ['🐎', '🐕', '🐅', '🐐'];
var eventDefault = 0;

module.exports = {
    roll: function (message) {
        rollBot(message);
    },
    initCash: function(id, username) {
        initializeCash(id, username);
    },
    getCash: function(message) {
        getCash(message);
    },
    gamble_dice: function(message) {
        gambleDice(message);
    },
    gamble_race: function(message) {
        gambleRace(message);
    },
    kick_broke: function(message) {
        debtList(message.channel, Number(message.content.split(' ')[1]));
    },
    start: function(message) {
        startEvent(message);
    },
    end: function(message) {
        endEvent(message);
    },
    give_all: function(message) {
        updateAllCash(Number(message.content.split(' ')[1]));
    },
    set_all: function(message) {
        setAllCash(Number(message.content.split(' ')[1]));
    }
};

function diceRoll(diceNum, diceType) {
    var diceStr = [];

    for (var i = 0; i < diceNum; i++) {
        diceStr.push(Math.floor(Math.random() * diceType) + 1);
    }

    return diceStr;
}

async function setRaceOptions(message, eCount, eMax) {
    while (eCount++ < eMax) {
        await message.react(`${raceAnimals[eCount-1]}`);
    }
}

function rollBot(message) {
    const dNum = Number(message.content.split(' ')[1]);
    const dType = Number(message.content.split(' ')[2]);

    if (isNaN(dNum) || isNaN(dType)) {
        message.channel.send(`Why are you being pepega?`);
        return;
    } else if (dNum > 10 || dType > 100) {
        message.channel.send(`It's too big even for me :(`);
        return;
    } else if (dNum < 1 || dType < 1) {
        message.channel.send(`It's too small even for me :(`);
        return;
    }

    diceStr = diceRoll(dNum, dType);

    message.channel.send(`You rolled a ${diceStr.join(', ')}`);
}

function gambleDice(message) {
    if (!channelCheck(message)) return;

    const pot = Number(message.content.trim().split(' ')[1]);
    if (isNaN(pot)) {
        message.channel.send(`Don't be pepega!`); return;
    } else if (pot > 10000) {
        message.channel.send(`$10000 Max!`); return;
    } else if (pot < 1) {
        message.channel.send(`We don't accept bus tokens...`); return;
    }

    message.channel.send(`Boom, Wool Dat Shit! \nHit that dice reaction to join and bet ${pot}\nRoll starts in 15 seconds!`).then((sMessage) => {
        sMessage.react('🎲');
        const filter = (reaction, user) => reaction.emoji.name == '🎲';
        
        sMessage.awaitReactions(filter, { time: 15000 })
        .then((collected) => {
            var sGamblers = [];
            
            collected.array().forEach(function(react) {
                var sUsers = react.users.filter(u => u.id != '575569539027304448');

                for (let user of sUsers) {
                    getBalance(user[1].id).then(balance => {
                        if (sGamblers.filter(x=>x.username == user[1].username).length == 0) {
                            if (balance == null) {
                                initializeCash(user[1].id, user[1].username);
                            }
                            else if (balance.bank >= pot) {
                                var gambler = {};
                                gambler['username'] = user[1].username;
                                gambler['id'] = user[1].id;
                                gambler['roll'] = diceRoll(1, 100)[0];
                                sGamblers.push(gambler);
                            }
                        }
                    })
                }
            });

            setTimeout(() => {
                if (sGamblers.length == 0) return;

                sGamblers.sort(function(a, b){ return b.roll >= a.roll });
                const highScore = sGamblers[0].roll;
                const numWinners = sGamblers.map(x=>x.roll).filter(x=>x == highScore).length;
                const potWinnings = ((pot * sGamblers.length) / numWinners);
                const winningTitle = (numWinners == 1) ? 
                    `${sGamblers[0].username} has won $${pot * sGamblers.length}` :
                    `${sGamblers.filter(x=>x.roll == highScore).map(x=>x.username).join(', ')} has won $${((pot * sGamblers.length) / numWinners)}`;
                updateGamblers(pot, potWinnings, highScore, numWinners, sGamblers);
                
                var embed = new RichEmbed()
                .setTitle(winningTitle)
                .setColor(0xFF25C0)
                .setDescription(sGamblers.reduce(function(rolls, gambler) {
                    return rolls += `\n${gambler.username} rolled a ${gambler.roll}`;
                }, ""))
                .setFooter('!cash to check you balance');
            
                sMessage.channel.send(embed).then((nMessage) => {
                    setTimeout(function(){
                        debtList(nMessage.channel, pot);
                    }, 2000);
                });
            }, 1000);
        })
        .catch(console.error);
    });
}

function gambleRace(message) {
    if (!channelCheck(message)) return;

    const pot = Number(message.content.trim().split(' ')[1]);
    if (isNaN(pot)) {
        message.channel.send(`Don't be pepega!`); return;
    } else if (pot > 10000) {
        message.channel.send(`$10000 Max!`); return;
    } else if (pot < 1) {
        message.channel.send(`We don't accept bus tokens...`); return;
    }

    message.channel.send(`Horses are at the ready! \nHit that react to choose your (1) racer to bet ${pot}\nRace starts in 30 seconds!`).then((sMessage) => {
        setRaceOptions(sMessage, 0, 4);
        const filter = (reaction, user) => ({});
        
        sMessage.awaitReactions(filter, { time: 10000 })
        .then((collected) => {
            var sGamblers = [];
            
            collected.array().forEach(function(react) {
                var sUsers = react.users.filter(u => u.id != '575569539027304448');
                var gambler = {};

                for (const user of sUsers) {
                    getBalance(user[1].id).then(balance => {
                        if (sGamblers.filter(x=>x.username == user[1].username).length == 0) {
                            if (balance == null) {
                                initializeCash(user[1].id, user[1].username);
                            }
                            else if (balance.bank >= pot) { 
                                var gambler = {};
                                gambler['username'] = user[1].username;
                                gambler['id'] = user[1].id;
                                gambler['horse'] = raceAnimals.indexOf(react.emoji.name);
                                sGamblers.push(gambler);
                            }
                        }
                    });
                }
            });

            var horseStatus = [0, 0, 0, 0];
            sMessage.channel.send('The Race has Started!').then((nMessage) => {
                setTimeout(function(){
                    updateHorseEmbed(sGamblers, pot, horseStatus, nMessage)
                }, 2000);
            });
        })
        .catch(console.error);
    });
}

function updateHorseEmbed(sGamblers, pot, horseStatus, message) {
    const wHorse = Math.floor(Math.random() * 4);
    horseStatus[wHorse]++;

    var field = [];
    var stretch = "";
    for (var i = 0; i < 4; i++)
    {
        stretch = "~.~.~.~.~.~.~.~.~.~.";
        stretch = stretch.substring(0, (horseStatus[i]*2)) + raceAnimals[i] + stretch.substring((horseStatus[i]*2)) + '🏳️';
        field.push(stretch);
    }

    var embed = new RichEmbed();

    if (horseStatus.every(h => h < 10)) {
        embed.setTitle('The Race is on!')
        embed.setColor(0xFF25C0);
        embed.setDescription(field.join('\n'));
        setTimeout(function() {
            message.edit(embed).then((nMessage) => {
                updateHorseEmbed(sGamblers, pot, horseStatus, nMessage)
            });
        }, 1300);
    } else {
        var winner = horseStatus.indexOf(10);
        var winnerCount = 0;
        embed.setTitle(`${raceAnimals[winner]} has won!`)
        embed.setColor(0xFF25C0);
        embed.setDescription(field.join('\n'));
        message.edit(embed);
        
        sGamblers.forEach(function(gambler, index) {
            if (gambler.horse === winner) {
                sGamblers[index].roll = 2;
                winnerCount++;
            } else {
                sGamblers[index].roll = 1;
            }
        })
        
        var potWinnings = (winnerCount > 0) ? Number((pot * sGamblers.length) / winnerCount) : Number(pot * sGamblers.length);
        updateGamblers(pot, potWinnings, 2, winnerCount, sGamblers);
        console.log(sGamblers);

        setTimeout(() => {
            const winningMsg = (winnerCount > 0) ? 
            `${sGamblers.filter(x=>x.roll == 2).map(z=>z.username).join(', ')} has won $${potWinnings}` :
            'No winners today :( \n!cash to check you balance';
            
            message.channel.send(winningMsg).then((nMessage) => {
                setTimeout(function(){
                    debtList(nMessage.channel, pot);
                }, 2000);
            });
        }, 1000);
    }
}

function updateGamblers(pot, potWinnings, highScore, numWinners, sGamblers) {
    for (let gambler of sGamblers) {
        if (gambler.roll == highScore && numWinners > 0) {
            updateCash(gambler.id, (potWinnings - pot));
        } else {
            updateCash(gambler.id, -pot);
        }
    }
}

function updateCash(dId, cash) {
    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_gambling').findOneAndUpdate(
        { discordId: dId }, 
        { 
            $inc: { bank: cash },
        }, 
        { upsert: true }, 
        function (err, result) {
            client.close();
        });
    });
}

function getCash(message) {
    getBalance(message.author.id).then(balance => {
        if (balance == null) {
            initializeCash(message.author.id, message.author.username);
            message.channel.send(`${message.author.username} has $${(eventDefault > 0) ? eventDefault : process.env.DEFAULT_CASH}`);
        }
        message.channel.send(`${balance.discordName} has $${balance.bank.toFixed(2)}`);
    })
}

async function getBalance(id) {
    let client = await MongoClient.connect(mongoUrl);
    let balance = await client.db(mongoDbName).collection('dls_gambling').findOne({ discordId: id });
    await client.close();
    return balance;
}

function initializeCash(jId, jName) {
    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_gambling').findOneAndUpdate(
        { discordId: jId, discordName: jName }, 
        { 
            $setOnInsert: { bank: (eventDefault > 0) ? eventDefault : Number(process.env.DEFAULT_CASH) },
        }, 
        { upsert: true }, 
        function (err, result) {
            client.close();
        });
    });
}

function setAllCash(cash) {
    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_gambling').updateMany({}, { $set: { bank: cash }}, function (err, result){
            client.close();
        })
    });
}

function updateAllCash(cash) {
    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_gambling').updateMany({}, { $inc: { bank: cash }}, function (err, result){
            client.close();
        })
    });
}

function startEvent(message) {
    if (!channelCheck(message)) return;

    const pot = Number(message.content.trim().split(' ')[1]);
    if (isNaN(pot)) {
        message.channel.send(`Don't be pepega!`); return;
    } else if (pot > 100000) {
        message.channel.send(`$100000 Max!`); return;
    } else if (pot < 1) {
        message.channel.send(`We don't accept bus tokens...`); return;
    }

    eventDefault = pot;
    setAllCash(eventDefault);
}

function endEvent(message) {
    if (!channelCheck(message)) return;

    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_gambling').find({}).sort({bank: -1}).limit(1).toArray(function (err, result) {
            delete result[0]._id;
            result[0].date_won = new Date();
            message.channel.send(`The event winner is <@${result[0].discordId}> with a total of $${result[0].bank}! See you all in the next event!`)
            
            client.db(mongoDbName).collection('dls_gambling_leaders').insertOne(result[0], function(err, res) {
                if (err) throw err;
                setAllCash((eventDefault > 0) ? eventDefault : Number(process.env.DEFAULT_CASH));
                client.close();
            });
        });
    });
}

function debtList(channel, minimum) {
    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_gambling').find({bank: { $lt: minimum }}).toArray(function (err, results){
            client.close();
            if (results.length > 0)
            {
                channel.send(`The following people cannot afford the pot and need to leave.\n${results.map(x=>x.discordName).join(', ')}`);
            }

            client.close();
        });
    });
}

function channelCheck(message) {
    if (message.channel.name != 'shaw-office-of-kevin-law') {
        message.channel.send(`Please visit <#${process.env.SHAW_OFFICE_ID}>`);
        return false;
    }

    return true;
}