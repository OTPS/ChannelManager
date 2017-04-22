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

function handleVoiceStateUpdate(oldMember, newMember, auth) {

    if (oldMember.voiceChannel) {
        if (!config["ignoreChannelsVoice"].includes(oldMember.voiceChannel.id)) {
            if (oldMember.voiceChannel) broadcast(`User: ${oldMember} left: ${oldMember.voiceChannel.name}`, auth);
        };
    };

    if (newMember.voiceChannel) {
        if (!config["ignoreChannelsVoice"].includes(newMember.voiceChannel.id)) {
            if (newMember.voiceChannel) broadcast(`User: ${newMember} joined: ${newMember.voiceChannel.name}`, auth);
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
    if (connected) { discordClient.channels.get(auth.logChannel).sendMessage(eventMessage).then(() => { console.log(eventMessage) }).catch(console.log) }
};

//discordClient.on("debug", (info) => { broadcast(info, auth) });
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

