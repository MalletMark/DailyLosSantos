const { Client, RichEmbed } = require('discord.js');
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = process.env.MONGODB_CONN;
const mongoDbName = 'dls';

module.exports = {
    get: function (message) {
        staffBot(message);
    },
    updateBio: function (message) {
        staffBotUpdateBio(message);
    },
    updateQuote: function(message) {
        staffBotUpdateQuote(message);
    },
    updateChannel: function(message) {
        staffBotUpdateChannel(message);
    }
};

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