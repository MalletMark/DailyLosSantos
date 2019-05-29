const Discord = require('discord.js');

// testbot.js
// ========
module.exports = {
    foo: function (message) {
        message.channel.send('Foo!')
    },
    bar: function (message) {
        message.channel.send('Bar!')
    }
};