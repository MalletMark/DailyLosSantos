const { Client, RichEmbed } = require('discord.js');
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = process.env.MONGODB_CONN;
const mongoDbName = 'dls';
const voteOptions = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺'];

module.exports = {
    poll: function (message) {
        shipBot(message);
    },
    add: function(message) {
        shipBotAdd(message);
    },
    remove: function(message) {
        shipBotRemove(message);
    }
};

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

function shipBotRemove(message) {
    const sName = message.content.split('<')[1].split('>')[0];

    MongoClient.connect(mongoUrl, function(err, client) {
        const col = client.db(mongoDbName).collection('nopixel_shiplist');

        col.deleteOne({ name: sName }, function (err, result){
            message.channel.send(`:ship:~${sName}~:ship: has sunk!`)    
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