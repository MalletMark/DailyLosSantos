const { Client, RichEmbed } = require('discord.js');
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = process.env.MONGODB_CONN;
const mongoDbName = 'dls';

module.exports = {
    roll: function (message) {
        rollBot(message);
    },
    initCash: function(message) {
        initializeCash(message);
    },
    getCash: function(message) {
        getCash(message);
    },
    gamble_dice: function(message) {
        gambleDice(message);
    }
};

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

function diceRoll(diceNum, diceType) {
    var diceStr = [];

    for (var i = 0; i < diceNum; i++) {
        diceStr.push(Math.floor(Math.random() * diceType) + 1);
    }

    return diceStr;
}

function gambleDice(message) {
    if (!channelCheck(message)) return;

    const pot = Number(message.content.trim().split(' ')[1]);
    if (isNaN(pot)) {
        message.channel.send(`Don't be pepega!`); return;
    } else if (pot > 1000) {
        message.channel.send(`$1000 Max!`); return;
    } else if (pot < 1) {
        message.channel.send(`We don't accept bus tokens...`); return;
    }

    message.channel.send(`Boom, Wool Dat Shit! \nHit that dice reaction to join and bet ${pot}\nRoll starts in 15 seconds!`).then((sMessage) => {
        sMessage.react('🎲');
        const filter = (reaction, user) => ({});
        
        sMessage.awaitReactions(filter, { time: 15000 })
        .then((collected) => {
            var sGamblers = [];
            
            collected.array().forEach(function(react) {
                var sUsers = react.users.filter(u => u.id != '575569539027304448');

                sUsers.forEach(function(user) {
                    if (sGamblers.filter(x=>x.username == user.username).length == 0) {
                        var gambler = {};
                        gambler['username'] = user.username;
                        gambler['id'] = user.id;
                        gambler['roll'] = diceRoll(1, 100)[0];
                        sGamblers.push(gambler);
                    }
                });
            });

            sGamblers.sort(function(a, b){ return b.roll >= a.roll });
            const highScore = sGamblers[0].roll;
            const numWinners = sGamblers.map(x=>x.roll).filter(x=>x == highScore).length;
            const winningTitle = (numWinners == 1) ? 
                `${sGamblers[0].username} has won $${pot * (sGamblers.length - 1)}` :
                `${sGamblers.filter(x=>x.roll == highScore).map(x=>x.username).join(', ')} has won $${((pot * sGamblers.length) / numWinners)}`;
            updateGamblers(pot, highScore, numWinners, sGamblers);
            
            var embed = new RichEmbed()
            .setTitle(winningTitle)
            .setColor(0xFF25C0)
            .setDescription(sGamblers.reduce(function(rolls, gambler) {
                return rolls += `\n${gambler.username} rolled a ${gambler.roll}`;
            }, ""))
            .setFooter('!cash @username to get your balance');
           
            sMessage.channel.send(embed);
        })
        .catch(console.error);
    });
}

function updateGamblers(pot, highScore, numWinners, sGamblers) {
    var index = 0;

    for (const gambler of sGamblers) {
        if (gambler.roll == highScore) {
            updateCash(sGamblers[0].id, ((pot * sGamblers.length) / numWinners) - pot);
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
    const jId = message.content.substring(5).split('<@')[1].split('>')[0].replace('!','');

    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_gambling').findOneAndUpdate(
            { discordId: jId }, 
            {
                $setOnInsert: { bank: 10000 }
            },
            { 
                projection: { bank: 1 },
                new: true,
                upsert: true,
                returnOriginal: false 
            },
            function (err, result){
            message.channel.send(`You have $${result.value.bank}`);
            client.close();
        })
    });
}

function initializeCash(jId) {
    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_gambling').findOneAndUpdate(
        { discordId: jId }, 
        { 
            $setOnInsert: { bank: 10000 },
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

function debtList(message) {
    MongoClient.connect(mongoUrl, function(err, client) {
        client.db(mongoDbName).collection('dls_gambling').find({bank: { $lt: 0 }}, function (err, result){
            message.channel.send(``)
        })
    });
}

function channelCheck(message) {
    if (message.channel.name != 'office-of-kevin-shaw') {
        message.channel.send(`Please visit <#${process.env.SHAW_OFFICE_ID}>`);
        return false;
    }

    return true;
}