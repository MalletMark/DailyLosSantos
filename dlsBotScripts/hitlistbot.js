const { Client, RichEmbed } = require('discord.js');
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = process.env.MONGODB_CONN;
const mongoDbName = 'dls';

module.exports = {
    get: function (message) {
        hitListBot(message);
    },
    kill: function(message) {
        hitListBotKill(message);
    },
    add: function(message) {
        hitListBotAdd(message);
    },
    create: function(message) {
        hitListBotNew(message);
    }
};

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