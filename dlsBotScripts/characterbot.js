require('dotenv').config();

const { Client, RichEmbed } = require('discord.js');
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = process.env.MONGODB_CONN;
const mongoDbName = 'dls';

module.exports = {
    characterGet: function (message) {
        characterGet(message);
    },
    characterAdd: function (message) {
        characterAdd(message);
    },
    characterUpdate: function(message) {
        characterUpdate(message);
    }
};

function characterGet(message) {
    if (!channelCheck(message)) return;

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

function characterAdd(message) {
    if (!channelCheck(message)) return;

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

function characterUpdate(message) {
    if (!channelCheck(message)) return;
    
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

function channelCheck(message) {
    if (message.channel.name != 'public-records') {
        message.channel.send(`Please visit <#${process.env.PUBLIC_RECORD_CHANNEL_ID}>`);
        return false;
    }

    return true;
}

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