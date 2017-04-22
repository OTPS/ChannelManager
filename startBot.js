"use strict";

const unhandledRejections = new Map();
process.on('unhandledRejection', (reason, p) => { unhandledRejections.set(p, reason); broadcast(`Unhandled Rejection at: Promise ${p}\nreason: ${reason}`, auth) });
process.on('rejectionHandled', (p) => { unhandledRejections.delete(p) });
process.on('uncaughtException', (err) => { broadcast("[" + new Date() + "] Uncaught exception Error: \n" + err.stack, auth) });
process.on('warning', (warning) => { broadcast(warning.stack, auth) });

const auth = require("./auth.json");
var config = require("./config.json");
const Discord = require("discord.js");
var discordClient = new Discord.Client();
var connected = false;

function channelJoin(member, auth) {

    try {
        var textChannel = member.guild.channels.filter(c => c.type == 'text').find('name', member.voiceChannel.name.toLowerCase().replace(/\W/g, "-"));

        if (textChannel === null || textChannel === undefined || textChannel === "") {
            broadcast(`channel: ${member.voiceChannel.name.toLowerCase()} not found.`, auth);
            textChannel = member.guild.createChannel(member.voiceChannel.name.toLowerCase().replace(/\W/g, "-"), "text")
            textChannel.then(c => {
                c.overwritePermissions(member.roles.first(), { READ_MESSAGES: false }).catch(console.log)
            }).catch(err => {
                broadcast(`there was an error creating a channel\n\n${err}.`, auth);
            })
        };
        textChannel.overwritePermissions(member, { READ_MESSAGES: true }).then(c => {
            textChannel.sendMessage(`User: ${member} joined`).catch(console.log)
        }).catch(console.log)

    } catch (error) {
        broadcast(error, auth)
    };
};

function channelLeave(member, auth) {

    try {
        var textChannel = member.guild.channels.filter(c => c.type == 'text').find('name', member.voiceChannel.name.toLowerCase().replace(/\W/g, "-")).then
        textChannel.overwritePermissions(member, { READ_MESSAGES: false }).then(c => {
            textChannel.sendMessage(`User: ${member} left`).catch(console.log)
        }).catch(console.log)
    } catch (error) {
        broadcast(error, auth)
    };
};

function handleVoiceStateUpdate(oldMember, newMember, auth) {

    if (oldMember.voiceChannel) {
        if (!config["ignoreChannelsVoice"].includes(oldMember.voiceChannel.id)) {
            if (oldMember.voiceChannel) channelLeave(oldMember, auth);
        };
    };

    if (newMember.voiceChannel) {
        if (!config["ignoreChannelsVoice"].includes(newMember.voiceChannel.id)) {
            if (newMember.voiceChannel) channelJoin(newMember, auth);
        };
    };

    console.log(":::" + oldMember + " : " + newMember);
    console.log(`:: ${oldMember.voiceChannel} -> ${newMember.voiceChannel} ::`);
};

function handleMessage(message, auth) {

    if (message.channel.type == "dm" || message.channel.type == "group") return;
    if (message.guild.id != auth.guildID) return;

    console.log(`Server: ${message.channel.guild.name} | Channel Name: ${message.channel.name} | Author: ${message.author.username} | Messsage: ${message.content}`);
};

function broadcast(eventMessage, auth) {
    if (eventMessage == "") return;
    if (connected) { discordClient.channels.get(auth.logChannel).sendMessage(`❗ ${eventMessage}`).then(() => { console.log(eventMessage) }).catch(console.log) }
};

//discordClient.on("debug", (info) => { broadcast(info, auth) }); // Enable for spammy debug messages....
discordClient.on("disconnect", (event) => { broadcast(event, auth) });
discordClient.on("error", (error) => { broadcast(error, auth) });
discordClient.on("guildUnavailable", (guild) => { broadcast(guild, auth) });
discordClient.on("message", (message) => { handleMessage(message, auth) });
discordClient.on("ready", () => { connected = true; broadcast("Connected", auth) });
discordClient.on("reconnecting", () => { broadcast("reconnecting", auth) });
discordClient.on("warn", (info) => { broadcast(info, auth) });
discordClient.on("voiceStateUpdate", (oldMember, newMember) => { handleVoiceStateUpdate(oldMember, newMember, auth) });

discordClient.login(auth["botToken"]).then(() => {
    console.log(`Logged in 👌 bot invite URL: https://discordapp.com/oauth2/authorize?client_id=${discordClient.user.id}&scope=bot&permissions=8`)
}).catch(err => {
    console.log(`Login error: ${err}`);
    process.exit(0);
});

