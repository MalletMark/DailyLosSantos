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
    } 

    if (dNum > 100 || dType > 100) {
        message.channel.send(`It's too big even for me :(`);
        return;
    }

    if (dNum < 1 || dType < 1) {
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
    const pot = Number(message.content.trim().split(' ')[1]);
    if (isNaN(pot)) {
        message.channel.send(`Don't be pepega!`); return;
    } else if (pot > 500) {
        message.channel.send(`Don't be greedy!`); return;
    } else if (pot < 1) {
        message.channel.send(`Don't be pepega!`); return;
    }

    message.channel.send(`Let's Wool Dat Shit! \nHit that dice reaction to join and bet ${pot}\nRoll starts in 15 seconds!`).then((sMessage) => {
        sMessage.react('🎲');
        const filter = (reaction, user) => ({});
        
        sMessage.awaitReactions(filter, { time: 15000 })
        .then((collected) => {
            var sGamblers = [];
            
            collected.array().forEach(function(react) {
                var sUsers = react.users.filter(u => u.id != '575569539027304448');

                sUsers.forEach(function(user) {
                    var gambler = {};
                    gambler['username'] = user.username;
                    gambler['id'] = user.id;
                    gambler['roll'] = diceRoll(1, 100)[0];
                    sGamblers.push(gambler);
                });
            });

            sGamblers.sort(function(a, b){ return b.roll >= a.roll });
            updateGamblers(pot, sGamblers);
            
            var embed = new RichEmbed()
            .setTitle( `${sGamblers[0].username} has won $${pot * (sGamblers.length - 1)}`)
            .setColor(0xFF25C0)
            .setDescription(sGamblers.reduce(function(rolls, gambler) {
                return rolls += `\n${gambler.username} rolled a ${gambler.roll}`;
            }, ""))
            .setFooter('!cash <@username> to get your balance');
           
            sMessage.channel.send(embed);
        })
        .catch(console.error);
    });
}

function updateGamblers(pot, sGamblers) {
    var index = 0;
    for (const gambler of sGamblers) {
        if (index++ == 0) {
            updateCash(sGamblers[0].id, pot * (sGamblers.length - 1));
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
                $setOnInsert: { bank: 5000 }
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
            $setOnInsert: { bank: 5000 },
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