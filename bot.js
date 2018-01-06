var Discord = require("discord.js");
var dateFormat = require('dateformat');
var bot = new Discord.Client();

try {
    //---Configs---//
    var AuthDetails = require('./config/auth.json');
    var config = require("./config/config.json");
    var emoji = require("./config/emoji.json");
    var badges = require("./config/badges.json");
    var shop = require("./config/shop.json");
    //---Database---//
    var fs = require('fs');
    var fileName = __dirname + '/data/db.json';
    var db = require(fileName);
	//---Log---//
    var logFile = __dirname + '/data/transaction.log';
}catch (e) {
    console.log("Missing file " + e.stack);
    process.exit();
}

var prefix = config.prefix;

var users = db.users;
var raining = false;
var rainCount = 0;
var rainMax = 0;
var rainStock = [];
var rainStats = {}

/*
     Bot is ready
*/
bot.on("ready", function () {
    console.log("Ready! Serving in " + bot.guilds.array().length + " Server(s)");
    bot.user.setGame("+help");
    setTime();
    setInterval(setTime, 60000);
});

bot.on('disconnected', function() {
    console.log("disconnected re-logging in");
    bot.login(AuthDetails.bot_token);
});

function setTime() {
    db.curHour = new Date().getHours();
    //if (db.curHour >= 24) {
    //    db.curHour = 0;
    //} else db.curHour++;
    saveJSON();

    var nextEvent = 0;

    if (!db.event1) nextEvent = db.event1Time;
    if (!db.event2) nextEvent = db.event2Time;
    if (!db.event3) nextEvent = db.event3Time;

    console.log(`Time: ${db.curHour} Next Event: ${nextEvent}`);
    if (db.curHour == db.event1Time) {
        if (!db.event1) {
            eRain();
            log(dateFormat(new Date(), "dd/mm/yyyy, h:MM:ss TT") + " | 1-07 Rupee rain Event start");
            db.event1 = true;
            db.event2 = false;
            db.event2Time = Math.floor(Math.random() * (15 - 9 + 1) + 9);
            saveJSON();
            console.log(`1-07 Event: ${db.event1}`);
        }
    } else if (db.curHour == db.event2Time) {
        if (!db.event2) {
            eRain();
            log(dateFormat(new Date(), "dd/mm/yyyy, h:MM:ss TT") + " | 09-15 Rupee rain Event start");
            db.event2 = true;
            db.event3 = false;
            db.event3Time = Math.floor(Math.random() * (23 - 17 + 1) + 17);
            saveJSON();
            console.log(`09-15 Event: ${db.event2}`);
        }
    } else if (db.curHour == db.event3Time) {
        if (!db.event3) {
            eRain();
            log(dateFormat(new Date(), "dd/mm/yyyy, h:MM:ss TT") + " | 17-23 Rupee rain Event start");
            db.event3 = true;
            db.event1 = false;
            db.event1Time = Math.floor(Math.random() * (7 - 1 + 1) + 1);
            saveJSON();
            console.log(`17-23 Event: ${db.event2}`);
        }
    }
}

function cleanArray(actual) {
    var newArray = new Array();
    for (var i = 0; i < actual.length; i++) {
        if (actual[i]) {
            newArray.push(actual[i]);
        }
    }
    return newArray;
}

/*
     Welcome new users
*/
bot.on("guildMemberAdd", member => {
    let welChannel = member.guild.channels.find("name", config.SpamChannel);
    welChannel.sendMessage(`Welcome to the Hylian Community, ${member.user}! Please read the #rules, while waiting for the Countdown! Have Fun with us! ^^`);
});

/*
     Log function
*/
function log(d) {
    fs.appendFile(logFile, d + '\n', function (err) {
        if (err) return console.log(err);
    });
};

function readlog(message) {
    

    fs.readFile(logFile, 'utf8', function (err, data) {
        var logtext = "";
        if (err) throw err;
        console.log('OK: ' + "log");
        var array = data.toString().split("\n");
        for (var i = array.length-20; i <= array.length-1; i++) {
            logtext = logtext + "\n" + array[i];
        }
        message.reply(logtext);
    });
    
}

/*
     Save database function
*/
function saveJSON() {
    fs.writeFile(fileName, JSON.stringify(db, null, 2), function (err) {
        if (err) return console.log(err);
    });
};

/*
     Add amt of ruppes to user function
*/
function add(userid, amt) {
    var money = amt;
    if (users[userid] == null) {
        users[userid] = {
            "money": money
        }
    } else {
        money = Math.round((money + users[userid].money) * 100) / 100;
        users[userid].money = money;
    }
    saveJSON();
};

/*
     Take away amt of rupees from user function
*/
function sub(userid, amt) {
    var money = amt * -1;
    money = Math.round((money + users[userid].money) * 100) / 100;
    if (money <= 0) {
        users[userid].money = 0;
        saveJSON();
        return;
    }
    users[userid].money = money;
    saveJSON();
};

/*
     Add badge to user function
*/
function badgeAdd(userid, badge, amt) {
    if (users[userid].badges == null) {
        users[userid].badges = {};
    }

    if (users[userid].badges[badge] == null) {
        users[userid].badges[badge] = amt;
    } else {
        users[userid].badges[badge] += amt;
    }

    saveJSON();
    console.log(`added ${badges[badge]} to ${userid}`);
}; 

/*
     Take away badge from user function
*/
function badgeSub(userid, badge, amt) {
    if (users[userid].badges[badge] == null) {
        console.log(`${userid} does not have ${badges[badge]}`);
    } else {
        if (users[userid].badges[badge] <= amt)
        {
            users[userid].badges[badge] = null;
        }else {
            users[userid].badges[badge] -= amt;
        }
    }
    saveJSON();
    console.log(`take ${badges[badge]} from ${userid}`);
};

/*
     Convert number to rupees (emoji)
*/

function numToRup(number) {
    var output = "";
    for (; number >= 200; number = number - 200) {
        console.log("loop");
        output = output + emoji.rupees.r200.emoji;
    }
    for (; number >= 100; number = number - 100) {
        console.log("loop");
        output = output + emoji.rupees.r100.emoji;
    }
    for (; number >= 50; number = number - 50) {
        console.log("loop");
        output = output + emoji.rupees.r50.emoji;
    }
    for (; number >= 20; number = number - 20) {
        console.log("loop");
        output = output + emoji.rupees.r20.emoji;
    }
    for (; number >= 10; number = number - 10) {
        console.log("loop");
        output = output + emoji.rupees.r10.emoji;
    }
    for (; number >= 5; number = number - 5) {
        console.log("loop");
        output = output + emoji.rupees.r5.emoji;
    }
    for (; number > 0; number = number - 1) {
        if (number < 1) {
            output = output + emoji.rupees.r0.emoji;
            break;
        }
        output = output + emoji.rupees.r1.emoji;
    }
    return output;
}

/*   __  _  _   __
    |   | \/ | |  \
    |__ |    | |__/
*/
/*
    help
*/
function help(message) {
    let theModRole = message.guild.roles.find("name", config.modRole);
    var commandsString = "";
    var modCommandsString = "";
    for (var c in config.commands) {
        if (config.commands.hasOwnProperty(c)) {
            if (config.commands.hasOwnProperty(c)) {
                if (config.commands[c].cmd != undefined) {
                    var syntax = config.commands[c].syntax;
                    for (var i = syntax.length; i < 25; i++) {
                        syntax = syntax + "\xa0"
                    }
                    syntax = "`" + syntax + "-`";
                } else syntax = config.commands[c].syntax;
                commandsString = commandsString + syntax + config.commands[c].about + "\n";
            }
        } 
    }

    let hasRole = message.guild.roles.find("name", config.modRole);
    if (message.member.roles.has(hasRole.id)) {
        for (var c in config.modCommands) {
            if (config.modCommands.hasOwnProperty(c)) {
                if (config.modCommands[c].cmd != undefined) {
                    var syntax = config.modCommands[c].syntax;
                    for (var i = syntax.length; i < 25; i++) {
                        syntax = syntax + "\xa0"
                    }
                    syntax = "`" + syntax + "-`";
                } else syntax = config.modCommands[c].syntax;
                modCommandsString = modCommandsString + syntax + config.modCommands[c].about + "\n"
            }
        }
    } else {
        modCommandsString = `You need to be "${hasRole}" to use this Command.`;
    }

    message.reply("", {
        embed: {
            color: 1930808,
            fields: [
                {
                    name: "Prefix",
                    value: prefix,
                    inline: true

                },
                {
                    name: "Trusted Role",
                    value: config.trustRole,
                    inline: true
                },
                {
                    name: "Admin Role",
                    value: theModRole.name,
                    inline: true
                },
                {
                    name: "Commands",
                    value: commandsString
                },
                {
                    name: theModRole.name +" Commands",
                    value: modCommandsString
                }
            ],
            footer: {
                text: "Work in Progress!"
            }
        }
    });
};

/*
    time
*/
function bank(message) {
}
/*
    bank
*/
function bank(message) {
    if (users[message.author.id] == null) {
        message.reply("You don't have a Bank Account yet.");
    } else {
        message.reply("I have sent you a Direct Message of your Bank Balance.");
        var walletType = "";
        switch(users[message.author.id].cap) {
            case 25:
                walletType = emoji.wallets.w1.emoji + bot.users.get(message.author.id).username + "'s " + emoji.wallets.w1.name;
                break;
            case 50:
                walletType = emoji.wallets.w2.emoji + bot.users.get(message.author.id).username + "'s " + emoji.wallets.w2.name;
                break;
            case 99:
                walletType = emoji.wallets.w3.emoji + bot.users.get(message.author.id).username + "'s " + emoji.wallets.w3.name;
                break;
            default:
                walletType = emoji.wallets.w0.emoji + bot.users.get(message.author.id).username + "'s " + emoji.wallets.w0.name;
        } 
        var moneys = numToRup(users[message.author.id].money);
        var cap = "(" + users[message.author.id].money + "/" + users[message.author.id].cap + ")";

        if (users[message.author.id].capMax) {
            cap = cap + `\n\nYou have reached your ${users[message.author.id].cap}Rupee capacity, You will no longer get Activity Rupees.\nYou can buy a new Wallet from the +shop to increase your Activity Rupee Capacity \nYou will still receive Rupees sent/given to you.`
        }

        message.author.sendMessage("", {
            embed: {
                color: 1930808,
                title: walletType,
                fields: [
                    {
                        name: moneys,
                        value: cap
                    }
                ],
                timestamp: new Date(),
                footer: {
                }
            }
        });
    }
};

/*
    send
*/
function send(message) {
    let args = message.content.split(" ").slice(1);
    args = cleanArray(args);

    var amount = 0;
    var hasAmt = false;

    //user checks
    if (args[0] === undefined) {
        message.reply(`User is not defined, use: "${config.commands.send.syntax}"`);
        return;
    } else {
        var user = bot.users.get(args[0].split(/(?:@|>)+/)[1]);
    }
    if (user === undefined) {
        message.reply(`"${args[0]}" is not a User, use: "${config.commands.send.syntax}"`);
        return;
    }
    let hasTrust = message.guild.roles.find("name", config.trustRole);
    let hasMod = message.guild.roles.find("name", config.modRole);
    if (!message.member.roles.has(hasMod.id)) {
        if (!message.member.roles.has(hasTrust.id)) {
            if (!message.guild.members.find("user", user).roles.has(hasMod.id)) {
                message.reply(`You can only send Rupee(s) to ${hasMod}`);
                return;
            }
        } else {
            if (!message.guild.members.find("user", user).roles.has(hasTrust.id)) {
                message.reply(`You can only send Rupee(s) to ${hasTrust}+`);
                return;
            }
        }
    }

    //amount checks
    if (!isNaN(parseFloat(args[1]))) {
        amount = parseFloat(args[1]);
    }
    else if (args[1] === undefined) {
        message.reply(`An Amount to be added is required "${config.commands.send.syntax}"`);
        return;
    }
    else {
        message.reply(`"${args[1]}" Is not a Number!`);
        return;
    }
    if (amount == 0) {
        message.reply(`Can't send nothing`);
        return;
    }
    if (users[message.author.id] == null) {
        message.reply("You don't have any Rupees to send");
        return;
    } else {
        if (users[message.author.id].money >= amount) {
            hasAmt = true;
        }
    }

    if (hasAmt) {
        message.reply(`Sent ${amount} Rupee(s) to ${user}'s Bank Balance.`);
        log(dateFormat(new Date(), "dd/mm/yyyy, h:MM:ss TT") + " | <@" + message.author.id + "> is sending " + amount + " to <@" + user.id + ">");
        sub(message.author.id, amount);
        add(user.id, amount);
    } else {
        message.reply(`You don't have ${amount} Rupee(s) to send`);
    }
};

/*
    take Rupees
*/
function take(message) {
    let args = message.content.split(" ").slice(1);
    var amount = 0;

    //user checks
    if (args[0] === undefined) {
        message.reply(`User is not defined, use: "${config.modCommands.take.syntax}"`);
        return;
    } else {
        var user = bot.users.get(args[0].replace(/[<@!>]/g, ''));
    }
    if (user === undefined) {
        message.reply(`"${args[0]}" is not a User, use: "${config.modCommands.take.syntax}"`);
        return;
    }

    //amount checks
    if (!isNaN(parseFloat(args[1]))) {
        amount = parseFloat(args[1]);
    }
    else if (args[1] === undefined) {
        message.reply(`An Amount to be added is required "${config.modCommands.take.syntax}"`);
        return;
    }
    else {
        message.reply(`"${args[1]}" Is not a Number!`);
        return;
    }
    message.reply(`Taking ${amount} Rupee(s) from ${user}'s Bank Balance.`);
    log(dateFormat(new Date(), "dd/mm/yyyy, h:MM:ss TT") + " | <@" + message.author.id + "> is taking " + amount + " from <@" + user.id + ">");
    sub(user.id, amount);
};

/*
    give Rupees
*/
function give(message) {
    let args = message.content.split(" ").slice(1);
    var amount = 0;
    if (args[0] === undefined) {
        message.reply(`User is not defined, use: "+give <@user> <amt>"`);
        return;
    } else {
        var user = bot.users.get(args[0].replace(/[<@!>]/g, ''));
    }
    if (user === undefined) {
        message.reply(`"${args[0]}" is not a User, use: "+give <@user> <amt>"`);
        return;
    }
    if (!isNaN(parseFloat(args[1]))) {
        amount = parseFloat(args[1]);
    }
    else if (args[1] === undefined) {
        message.reply(`An Amount to be added is required "+give <@user> <amt>"`);
        return;
    }
    else {
        message.reply(`"${args[1]}" Is not a Number!`);
        return;
    }
    message.reply(`Added ${amount} Rupee(s) to ${user}'s Bank Balance.`);
    log(dateFormat(new Date(), "dd/mm/yyyy, h:MM:ss TT") + " | <@" + message.author.id + "> gives " + amount + " to <@" + user.id + ">");
    add(user.id, amount);
};

/*
    list
*/
function list(message) {
    let args = message.content.split(" ").slice(1);
    var input = args[0];

    if (input == undefined) {
        var page = 0;
    } else if (!isNaN(parseInt(input))) {
        var page = parseInt(input) -1;
    } else {
        message.reply(`"${input}" is not a Number, use "+list <page number>"`);
        return;
    }

    var list = [];
    
    var total = 0;
    var listSorted = "";
    try {
        for (var key in users) {
            if (users[key] != null) {
                try {
                    list.push({ name: bot.users.get(key).username, money: users[key].money, cap: users[key].cap });
                } catch (e) {
                    console.log(e);
                }
                total = total + users[key].money;
            }
        }
    } catch (e) {
        console.log(e);
        message.reply("No Users");
        return;
    }
    console.log(list);
    list.sort(function (a, b) {
        return parseFloat(a.money) - parseFloat(b.money);
    });
    list.reverse();
    console.log(list);

    var perPage = 20;
    var pages = Math.ceil(list.length / perPage);
    
    if ((page +1) > pages) {
        message.reply(`Page "${(page + 1)}" is greater than the Number of pages: ${pages}"`);
        return;
    }

    var padgedList = list.slice(page * perPage, (page * perPage) + perPage);

    for (var i = 0; i < padgedList.length; i++) {
        try {
            listSorted = listSorted + "\n" + padgedList[i].name + " - " + padgedList[i].money + "/" + padgedList[i].cap;
        } catch (e) {
            console.log(e);
        }
    }

    console.log(total);

    var avg = Math.round((total / list.length) * 100) / 100;

    total = Math.round(total * 100) / 100;

    message.channel.sendMessage("", {
        embed: {
            color: 1930808,
            fields: [
                {
                    name: "Rupees" + " Page: " + (parseInt(page) + 1) + "/" + pages,
                    value: listSorted
                },
                {
                    name: "Total - (avg)",
                    value: total.toString() + " - (" + avg.toString() + ")"
                }
            ]
        }
    });
};

/*
    rupees
*/
function rupees(message) {
    let args = message.content.split(" ").slice(1);
    var rupeeList = "";
    var name = "Rupees";
    var input = args[0];

    if (input == undefined) {
        try {
            for (var i in emoji.rupees) {
                rupeeList = rupeeList + "\n" + emoji.rupees[i].emoji + "= " + emoji.rupees[i].value
            }
        } catch (e) {
            console.log(e);
            message.reply("No Rupees");
            return;
        }
    } else if (!isNaN(parseFloat(input))) {
        try {
            var number = parseFloat(input);
            name = number + " " + name
            rupeeList = numToRup(number);
        } catch (e) {
            console.log(e);
            return;
        }
    } else {
        message.reply(`"${input}" is not a Number, use "+rupees <number>"`);
    }

    message.channel.sendMessage("", {
        embed: {
            color: 1930808,
            fields: [
                {
                    name: name,
                    value: rupeeList
                }
            ]
        }
    });
};

/*
    shop old
*/
//function shopList(message) {
//    let args = message.content.split(" ").slice(1);
//    console.log(args);
//    var shopelist = "", prices = "";
//    if (args[0] == "buy") {
//        for (var i = 0; i < shop.length; i++) {
//            if (parseInt(args[1]) == shop[i].id) {
//                if (users[message.author.id].money >= shop[i].price) {
//                    switch(shop[i].id) 
//                    {
//                        case 1:
//                        case 2:
//                        case 3:
//                            if (users[message.author.id].cap >= shop[i].cap) {
//                                message.reply("You already have this wallet or better!");
//                                return;
//                            }
//                            break;
//                        case 4:
//                            break;
//                        case 5:
//                        case 6:
//                        case 7:
//                        case 8:
//                        case 9:
//                        case 10:
//                        case 12:
//                        case 13:
//                        case 14:
//                        case 15:
//                        case 16:
//                        case 17:
//                        case 18:
//                            if (users[message.author.id].sendbadge != null) {
//                                message.reply("You already have a valentine to send!");
//                                return;
//                            }
//                            break;
//                    }
//                    message.reply(shop[i].response);
//                    sub(message.author.id, shop[i].price);
//                    eval(shop[i].run + "message.author)");
//                    log(new Date() + " | <@" + message.author.id + "> Purchased a " + shop[i].itemname + " for " + shop[i].price );
//                    return;
//                } else {
//                    message.reply("You don't have enough rupees to purchase this item.");
//                    return;
//                }
//            }
//        }
//        message.reply("+shop buy <item id> Required!");
//        return;
//    }
//    var id = "";
//    for (var i = 0; i < shop.length; i++) {
//        if (shop[i].id < 10) id = "0" + shop[i].id
//        else id = shop[i].id
//        shopelist = shopelist + "\n`" + id + "` | " + shop[i].icon + shop[i].itemname;
//        prices = prices + "\n|" + emoji.rupees.r1.emoji + shop[i].price
//    }
//    message.channel.sendMessage("", {
//        embed: {
//            color: 1930808,
//            author: {
//            },
//            fields: [
//                {
//                    name: "" + " ID. | Item",
//                    value: shopelist,
//                    inline: true
//                },
//                {
//                    name: "| Price",
//                    value: prices,
//                    inline: true
//                }
//            ],
//            footer: {
//                text: `\n\nUse "+shop buy <ID>" to purchase an item.`
//            }
//        }
//    });
//};

/*
    shop
*/
function shopList(message) {
    let args = message.content.split(" ").slice(1);
    console.log(args);
    var shopelist = "";

    if (args[0] == "buy") {
        for (var i = 0; i < shop.length; i++) {
            if (parseInt(args[1]) == shop[i].id) {
                if (users[message.author.id].money >= shop[i].price) {
                    switch (shop[i].id) {
                        case 1:
                        case 2:
                        case 3:
                            if (users[message.author.id].cap >= shop[i].cap) {
                                message.reply("You already have this Wallet or a better one!");
                                return;
                            }
                            break;
                        case 4:
                            break;
                        case 5:
                        case 6:
                        case 7:
                        case 8:
                        case 9:
                        case 10:
                        case 12:
                        case 13:
                        case 14:
                        case 15:
                        case 16:
                        case 17:
                        case 18:
                            if (users[message.author.id].sendbadge != null) {
                                message.reply("You already have a valentine to send!");
                                return;
                            }
                            break;
                    }
                    message.reply(shop[i].response);
                    sub(message.author.id, shop[i].price);
                    eval(shop[i].run + "message.author)");
                    log(dateFormat(new Date(), "dd/mm/yyyy, h:MM:ss TT") + " | <@" + message.author.id + "> purchased a " + shop[i].itemname + " for " + shop[i].price);
                    return;
                } else {
                    message.reply("You don't have enough Rupees to purchase this Item.");
                    return;
                }
            }
        }
        message.reply("+shop buy <item id> required!");
        return;
    }

    var id = "", price = "";

    for (var i = 0; i < shop.length; i++) {
        if (shop[i].id < 10) id = "0" + shop[i].id
        else id = shop[i].id

        if (shop[i].price < 10) price = shop[i].price + `\xa0\xa0\xa0`;
        else if (shop[i].price < 100) price = shop[i].price + `\xa0\xa0`;
        else if (shop[i].price < 1000) price = shop[i].price + `\xa0`;
        else price = shop[i].price;
        
        shopelist = shopelist + "\n`" + id + "` |" + emoji.rupees.r1.emoji + "`" + price + "\xa0|` " + shop[i].icon + shop[i].itemname;
    }
	//shopelist = shopelist + "\n`..` |" + emoji.rupees.r1.emoji + "`1\xa0\xa0\xa0\xa0|` " + " 05" + shop[4].icon + " 06" + shop[5].icon + " 07" + shop[6].icon + " 08" + shop[7].icon + " 09" + shop[8].icon + " 10" + shop[9].icon + " 11" + shop[10].icon + " 12" + shop[11].icon + " 13" + shop[12].icon + " 14" + shop[13].icon + " 15" + shop[14].icon + " 16" + shop[15].icon + " 17" + shop[16].icon + " 18" + shop[17].icon;

    message.channel.sendMessage("", {
        embed: {
            color: 1930808,
            author: {
            },
            fields: [
                {
                    name: "" + " ID\xa0\xa0 | \xa0Price\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0 | Item",
                    value: shopelist,
                    inline: true
                }
            ],
            footer: {
                text: `\n\nUse "+shop buy <ID>" to purchase an Item.`
            }
        }
    });
};

/*
    wallet
*/
function wallet(amt, user) {
    users[user.id].cap = amt;
    users[user.id].capMax = false;
    saveJSON();
}

/*
    wallets
*/
function wallets(message) {
    console.log("Wallets");
    var walletList = "";
    var holds = "";
    try{
        for (var i in emoji.wallets) {
            try{
                walletList = walletList + "\n" + emoji.wallets[i].emoji + emoji.wallets[i].name;
                holds = holds + "\n|" + emoji.rupees.r1.emoji + emoji.wallets[i].value;
            } catch (e) {
                console.log(e);
            }
    }
    } catch (e) {
        console.log(e);
    }

    try{
        message.channel.sendMessage("", {
            embed: {
                color: 1930808,
                fields: [
                    {
                        name: "Wallets",
                        value: walletList,
                        inline: true
                    },
                    {
                        name: "| Holds",
                        value: holds,
                        inline: true
                    }
                ]
            }
        });
    } catch (e) {
        console.log(e);
    }
}
/*
    badges
*/
function badgeslist(message) {
    console.log("badges go!");
    let args = message.content.split(" ").slice(1);
    var input = args[0];

    if (input == undefined) {
        if (users[message.author.id] != null) {
            user = message.author.id;
        }
    } else if (input.toUpperCase() == "ALL") {
        input = args[1];

        if (input == undefined) {
            var page = 0;
        } else if (!isNaN(parseInt(input))) {
            var page = parseInt(input) - 1;
        } else {
            message.reply(`"${input}" is not a number, Use "+badges <page number>"`);
            return;
        }

        var badgeList = [];

        var listSorted = "";
        try {
            for (var key in badges) {
                if (badges[key] != null) {
                    try {
                        badgeList.push({ id: badges[key].id, name: badges[key].name, emoji: badges[key].emoji });
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        } catch (e) {
            console.log(e);
            message.reply("No Badges");
            return;
        }

        var perPage = 20;
        var pages = Math.ceil(badgeList.length / perPage);

        if ((page + 1) > pages) {
            message.reply(`Page "${(page + 1)}" is greater than number of pages: ${pages}"`);
            return;
        }

        var padgedList = badgeList.slice(page * perPage, (page * perPage) + perPage);

        for (var i = 0; i < padgedList.length; i++) {
            try {
                listSorted = listSorted + "\n" + padgedList[i].id + padgedList[i].emoji + padgedList[i].name;
            } catch (e) {
                console.log(e);
            }
        }

        message.channel.sendMessage("", {
            embed: {
                color: 1930808,
                fields: [
                    {
                        name: "Badges" + " page: " + (parseInt(page) + 1) + "/" + pages,
                        value: listSorted
                    }
                ]
            }
        });
        return;
    } else if (users[args[0].replace(/[<@!>]/g, '')] != null) {
        user = args[0].replace(/[<@!>]/g, '');
    }

    if (user != null) {
        var badgeList = "";
        var badgeNum = 0;

        try {
            for (var key in users[user].badges) {
                try {
                    if (users[user].badges[key] != null) {
                        badgeList = badgeList + users[user].badges[key] + badges[key].emoji;
                        badgeNum++;
                    }
                } catch (e) {
                    console.log(e);
                    message.reply("No Badges");
                }
            }

            if (badgeList == "") {
                message.reply("No Badges");
                return;
            }

            message.channel.sendMessage("", {
                embed: {
                    color: 1930808,
                    fields: [
                        {
                            name: `${bot.users.get(user).username}'s Badges ${badgeNum}/${Object.keys(badges).length}`,
                            value: badgeList
                        }
                    ]
                }
            });

        } catch (e) {
            console.log(e);
            message.reply("No Badges");
            return;
        }
    } 
};

/*
    badge
*/
function badge(message) {
    let args = message.content.split(" ").slice(1);
    console.log(args.join(' '));
    var input = args.join(' ');
    console.log(input);

    if (input == undefined) {
        message.reply("+badge <id/name> required!");
        return;
    }

    if (!isNaN(parseInt(input))) {
        try {
            input = badges[Object.keys(badges)[parseInt(input) -1]].name;
        } catch (err) {
            message.reply(`"${parseInt(args[0])}" is not a valid ID, use +badge <id/name>!`);
            return;
        }
    }

    input = input.toUpperCase()

    if (badges[input]) {
        message.channel.sendMessage("", {
            embed: {
                color: 1930808,
                title: badges[input].emoji + badges[input].name,
                description: badges[input].desc,
                thumbnail: {
                    url: badges[input].img
                },
                footer: {
                    text: "Id: " + badges[input].id + " | " + badges[input].date.start + " – " + badges[input].date.end
                }
            }
        });
        return;
    } else {
        message.reply(`No Badge found with the Name "${input}" `);
        return;
    }
};

/*
    badge Reward
*/
function badgeReward(message) {
    let args = message.content.split(" ").slice(1);
    var user = args[0];
    var input = args.slice(1).join(' ');
    console.log(user);
    console.log(input);

    if (user === undefined) {
        message.reply(`User is not defined, use: "+reward <@user> <badge id/name>"`);
        return;
    } else {
        user = bot.users.get(user.replace(/[<@!>]/g, ''));
    }
    if (user === undefined) {
        message.reply(`"${args[0]}" is not a User, use: "${config.commands.send.syntax}"`);
        return;
    }

    if (input == undefined) {
        message.reply("+reward <@user> <badge id/name>");
        return;
    }
    if (!isNaN(parseInt(input))) {
        try {
            input = badges[Object.keys(badges)[parseInt(input) - 1]].name;
        } catch (err) {
            message.reply(`"${parseInt(args[0])}" is not a valid ID, use "+reward <@user> <badge id/name>"`);
            return;
        }
    }

    input = input.toUpperCase()

    if (badges[input]) {
        badgeAdd(user.id, input, 1);

        log(dateFormat(new Date(), "dd/mm/yyyy, h:MM:ss TT") + " | <@" + message.author.id + "> rewarded Badge: " + input + " to <@" + user.id + ">");
    } else {
        message.reply(`No Badge found with the name "${input}" `);
        return;
    }
};

/*
    badge Remove
*/
function badgeRemove(message) {
    let args = message.content.split(" ").slice(1);
    var user = args[0];
    var input = args.slice(1).join(' ');
    console.log(user);
    console.log(input);

    if (user === undefined) {
        message.reply(`User is not defined, use: "+remove <@user> <badge id/name>"`);
        return;
    } else {
        user = bot.users.get(user.replace(/[<@!>]/g, ''));
    }
    if (user === undefined) {
        message.reply(`"${args[0]}" is not a user use: "${config.commands.send.syntax}"`);
        return;
    }

    if (input == undefined) {
        message.reply("+remove <@user> <badge id/name>");
        return;
    }
    if (!isNaN(parseInt(input))) {
        try {
            input = badges[Object.keys(badges)[parseInt(input) - 1]].name;
        } catch (err) {
            message.reply(`"${parseInt(args[0])}" is not a valid ID, use "+remove <@user> <badge id/name>"`);
            return;
        }
    }

    input = input.toUpperCase()

    if (badges[input]) {
        badgeSub(user.id, input, 1);

        log(dateFormat(new Date(), "dd/mm/yyyy, h:MM:ss TT") + " | <@" + message.author.id + "> removed Badge: " + input + " from <@" + user.id + ">");

    } else {
        message.reply(`No Badge found with the Name "${input}" `);
        return;
    }
};

/*
    badge List
*/
function badgeList(message) {
    let args = message.content.split(" ").slice(1);
    var input = args[0];

    if (input == undefined) {
        var page = 0;
    } else if (!isNaN(parseInt(input))) {
        var page = parseInt(input) - 1;
    } else {
        message.reply(`"${input}" is not a Number, use "+badge-list <page number>"`);
        return;
    }

    var list = [];

    var total = 0;
    var listSorted = "";
    try {
        for (var key in users) {
            if (users[key].badges != null) {
                var badgetot = 0;
                try {
                    for (var badge in users[key].badges) {
                        badgetot = badgetot + users[key].badges[badge]
                    }

                    list.push({ name: bot.users.get(key).username, badges: badgetot });
                } catch (e) {
                    console.log(e);
                }
                total = total + badgetot;
            }
        }
    } catch (e) {
        console.log(e);
        message.reply("No users");
        return;
    }
    console.log(list);
    list.sort(function (a, b) {
        return parseFloat(a.badges) - parseFloat(b.badges);
    });
    list.reverse();
    console.log(list);

    var perPage = 20;
    var pages = Math.ceil(list.length / perPage);

    if ((page + 1) > pages) {
        message.reply(`Page "${(page + 1)}" is greater than number of pages: ${pages}"`);
        return;
    }

    var padgedList = list.slice(page * perPage, (page * perPage) + perPage);

    for (var i = 0; i < padgedList.length; i++) {
        try {
            listSorted = listSorted + "\n" + padgedList[i].name + " - " + padgedList[i].badges
        } catch (e) {
            console.log(e);
        }
    }

    console.log(total);

    var avg = Math.round((total / list.length) * 100) / 100;

    total = Math.round(total * 100) / 100;

    message.channel.sendMessage("", {
        embed: {
            color: 1930808,
            fields: [
                {
                    name: "Badges" + " page: " + (parseInt(page) + 1) + "/" + pages,
                    value: listSorted
                },
                {
                    name: "Total - (avg)",
                    value: total.toString() + " - (" + avg.toString() + ")"
                }
            ]
        }
    });
};
/*
    Time
*/
function time(message) {
    setTime();

    var nextEvent = 0;

    if (!db.event1) nextEvent = db.event1Time;
    if (!db.event2) nextEvent = db.event2Time;
    if (!db.event3) nextEvent = db.event3Time;

    message.reply("", {
        embed: {
            color: 1930808,
            title: "Time",
            description: `Time: ${db.curHour}\nNext Event: ${nextEvent}`,
        }
    });
}
/*
    dev say
*/
function say(message) {
    toSay = message.content.split(" ").slice(1).join(' ');
    let welChannel = message.member.guild.channels.find("name", config.WelcomeChannel);
    welChannel.sendMessage(`${toSay}`);
};

/*
    dev rain
*/
function rain(message) {
    let args = message.content.split(" ").slice(1);
    console.log(args);
    var input = args[0];
	eRain();
    log(dateFormat(new Date(), "dd/mm/yyyy, h:MM:ss TT") + " | Rupee Rain Event start");    
};
/*  / __  _  _   __
   / |   | \/ | |  \
  /  |__ |    | |__/
*/


/*
    Event rain
*/
function eRain() {
    if (raining) {
        rainCount = 0;
        rainMax = 0;
        raining = false;
    }

    rainMax = 20;
    rainStock = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 1, 1, 1, 1, 5]
    raining = true;

    let welChannel = bot.guilds.find("name", config.guild).channels.find("name", config.WelcomeChannel);
    welChannel.sendMessage("@here", {
        embed: {
            color: 1930808,
            fields: [
                {
                    name: "Tingle's Balloon is flying over the Village!",
                    value: "*Rupees rain from the sky.*\n" +
                    "\n" + emoji.rupees.r5.emoji + emoji.rupees.r1.emoji + emoji.rupees.r1.emoji + emoji.rupees.r1.emoji + emoji.rupees.r1.emoji + emoji.rupees.r0.emoji + emoji.rupees.r0.emoji + emoji.rupees.r0.emoji + emoji.rupees.r0.emoji + emoji.rupees.r0.emoji +
                    "\n\n" + emoji.rupees.r0.emoji + emoji.rupees.r0.emoji + emoji.rupees.r0.emoji + emoji.rupees.r0.emoji + emoji.rupees.r0.emoji + emoji.rupees.r0.emoji + emoji.rupees.r0.emoji + emoji.rupees.r0.emoji + emoji.rupees.r0.emoji + emoji.rupees.r0.emoji
                }
            ],
            footer: {
                text: "Say something to catch some Rupees"
            }
        }
    });
};

/*
    On Message
*/
bot.on('message', (message) => {
    if (message.author.bot) return;
	if (message.channel.name == config.SpamChannel) return;
    if (message.content.startsWith("Tingle, Tingle! Kooloo-Limpah!")) {
        message.reply("These are the magic Words that Tingle created himself!");
        return;
    }
    else if (message.content.startsWith(prefix)) {
        var input = message.content.slice(1);
        try { input = input.split(" ")[0]; }
        catch (err) {
            console.log("error with: " + input);
        } 
        try {
            if (config.commands[input].cmd) {
                var s = "" + config.commands[input].cmd + "(message);";
                eval(s);
                return;
            }
        } catch (err) {
            try {
                if (config.modCommands[input].cmd) {
                    let hasRole = message.guild.roles.find("name", config.modRole);
                    if (message.member.roles.has(hasRole.id)) {
                        var s = "" + config.modCommands[input].cmd + "(message);";
                        eval(s);
                    } else {
                        message.reply(`You need to be "${hasRole}" to use this Command.`);
                        return;
                    }
                }
            } catch (err) {
                try {
                    console.log(message.author.id);
                    if (message.author.id == 119475266601877504) {
                        if (config.devCommands[input].cmd) {
                            var s = "" + config.devCommands[input].cmd + "(message);";
                            eval(s);
                        } else {
                            throw "Not a Dev Command";
                        }
                    } else {
                        throw "Not a Dev";
                    }
                } catch (err) {
                    console.log(err);
                }
            }
        }
    } else {
        if (users[message.author.id] == null) {
            users[message.author.id] = {
                "money": null,
                "lastMsg": message.createdTimestamp
            }
            saveJSON();
            add(message.author.id, config.amtPerMsg);
            
        } else if (users[message.author.id].lastMsg + config.cooldown < message.createdTimestamp) {
            users[message.author.id].lastMsg = message.createdTimestamp;
            saveJSON();
            if (users[message.author.id].capMax) {
                console.log("user hit max Rupees")
                return;
            } else {
                if (users[message.author.id].cap) {
                    if (users[message.author.id].money >= users[message.author.id].cap) {
                        message.author.sendMessage(`You have reached your ${users[message.author.id].cap}Rupee Capacity, You will no longer get Activity Rupees.\nYou can buy a new Wallet from the +shop to increase your Activity Rupee Capacity \nYou will still receive Rupees sent/given to you.`);
                        users[message.author.id].capMax = true;
                        saveJSON();
                        return;
                    }
                }else {
                    users[message.author.id].cap = 10;
                    saveJSON();
                    if (users[message.author.id].money >= users[message.author.id].cap) {
                        message.author.sendMessage(`You have reached your ${users[message.author.id].cap}Rupee Capacity, You will no longer get Activity Rupees.\nYou can buy a new Wallet from the +shop to increase your Activity Rupee Capacity \nYou will still receive Rupees sent/given to you.`);
                        users[message.author.id].capMax = true;
                        saveJSON();
                    }
                    return;
                }
            }

            if (raining) {
                if (rainCount >= rainMax) {
                    rainCount = 0;
                    rainMax = 0;
                    raining = false;
                    var stats = "";
                    for(var i in rainStats){
                        stats = stats + `\n<@${i}> Caught${numToRup(Math.round((rainStats[i].win) * 100) / 100)}(${Math.round((rainStats[i].win) * 100) / 100}) `;
                    }
                    log(dateFormat(new Date(), "dd/mm/yyyy, h:MM:ss TT") + " | " + stats);
                    console.log(stats);
                    rainStats = {};
                    let welChannel = message.member.guild.channels.find("name", config.WelcomeChannel);
                    try{
                        welChannel.sendMessage("", {
                            embed: {
                                color: 1930808,
                                fields: [
                                    {
                                        name: "Tingle's Balloon has flown away",
                                        value: "All Rupees have been caught"
                                    },
                                    {
                                        name: "Stats",
                                        value: stats
                                    }
                                ]
                            }
                        });
                    } catch (e) {
                        console.log(e);
                    }
                } else {
                    rainCount++;
                    var rand = parseInt(Math.random() * rainStock.length)
                    var win = rainStock[rand];
                    rainStock.splice(rand, 1);
                    rainStats[message.author.id]
                    if (rainStats[message.author.id] == null) {
                        rainStats[message.author.id] = {
                            "win": 0
                        }
                    }
                    rainStats[message.author.id] = {
                        "win": rainStats[message.author.id].win + win
                    }
                    console.log(rainStats[message.author.id].win);
                    add(message.author.id, win);
                    switch(win){
                        case 0.1:
                            message.reply("", {
                                embed: {
                                    color: 1930808,
                                    title:`Caught${emoji.rupees.r0.emoji}!`
                                }
                            });
                            break;
                        case 1:
                            message.reply("", {
                                embed: {
                                    color: 1930808,
                                    title: `Caught${emoji.rupees.r1.emoji}!`
                                }
                            });
                            break;
                        case 5:
                            message.reply("", {
                                embed: {
                                    color: 1930808,
                                    title: `Caught${emoji.rupees.r5.emoji}!`
                                }
                            });
                            break;
                    }
                    
                }

            } else {
                add(message.author.id, config.amtPerMsg);
            }
            
        } else {

            //cooldown message only for testing spams chat
            //message.reply("temp cooldown message " + Math.floor(((users[message.author.id].lastMsg + 12000 - message.createdTimestamp) / 1000) % 60) + "Seconds");
        }

        if (users[message.author.id].badges == null) {
            users[message.author.id].badges = {};
        }

        if (users[message.author.id].badges["FIRST SWORD"] == null) {
            users[message.author.id].badges["FIRST SWORD"] = 1;
            message.reply("",
            {
                embed: {
                    color: 1930808,
                    title: badges["FIRST SWORD"].emoji + badges["FIRST SWORD"].name,
                    description: badges["FIRST SWORD"].desc,
                    thumbnail: {
                        url: badges["FIRST SWORD"].img
                    },
                    footer: {
                        text: "Id: " + badges["FIRST SWORD"].id + " | " + badges["FIRST SWORD"].date.start + " – " + badges["FIRST SWORD"].date.end
                    }
                }
            });
            return;
        }
    }
});

client.login/process.env.B0T_T0KEN);
