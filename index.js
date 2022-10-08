const axios = require("axios")
const clc = require("cli-color")
const fs = require("fs")
const noblox = require("noblox.js")
const config = require("./config.json")
const done = require("./done.json")
const sleep = require("sleep-promise")
const httpsProxyAgent = require("https-proxy-agent")
const Discord = require("discord.js")
const { Client, GatewayIntentBits, embedLength } = require('discord.js');
const client = new Discord.Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ]
})

var proxiesEnabled = false
var pauseTime = parseInt(config.pauseBetweenRequests)
var proxy = toString(config.proxies)

var channel
var acceptedChannel
var memberChannel
var groupImageURL = "https://tr.rbxcdn.com/2482695fa8b3052d1c30b46e70e6806d/420/420/Image/Png"
var token = ""
var myUserId = 0

async function checkAccepts() {
    var newAccepts = 0
    var res = await axios.get("https://groups.roblox.com/v1/groups/"+config.groupId+"/relationships/allies?model.startRowIndex=0&model.maxRows=999999999").catch((err) => {})
    var groups = res.data.relatedGroups
    var currentGroups = fs.readFileSync("accepts.json", "utf-8")
    currentGroups = JSON.parse(currentGroups)
    //console.log(currentGroups)
    for (let i = 0; i < groups.length; i++) {
        var group = groups[i]
        if (currentGroups.includes(group.id)) {
        } else {
            console.log(clc.green(group.name+" accepted ally request."))
            newAccepts = newAccepts + 1
            currentGroups.push(group.id)
            fs.writeFileSync("./accepts.json", JSON.stringify(currentGroups))
            var embed = new Discord.EmbedBuilder()
            var info = await axios("https://groups.roblox.com/v1/groups/"+group.id, {method: "GET"}).catch((err) => {console.log(err.status)})
            info = info.data        
            embed.setColor(65374)
            embed.setTitle(group.name+" accepted alliance request!")
            embed.setDescription("Ally Request Was Accepted!")
            embed.addFields(
                { name:"#️⃣ Group ID:", value:"```"+JSON.stringify(info.id)+"```" },
                { name:"👨‍👩‍👧 Members:", value:"```"+JSON.stringify(info.memberCount)+"```" },
            )
            if (info.shout) {
                var string = info.shout.body
                string.replace("\n", "")
                embed.addFields({ name:"📢 Group Shout:", value:"```"+string+"```"})
                var string = info.description
                if (string) {
                    string.replace("\n", "")
                    embed.addFields({ name:"🖊 Description:", value:"```"+info.description+"```" })
                } else {
                    embed.addFields({ name:"🖊 Description:", value:"```No description.```" })
                }
            } else {
                embed.addFields({ name:"📢 Group Shout:", value:"```"+"No shout."+"```"})
                var string = info.description
                if (string) {
                    string.replace("\n", "")
                    embed.addFields({ name:"🖊 Description:", value:"```"+info.description+"```" })
                } else {
                    embed.addFields({ name:"🖊 Description:", value:"```No description.```" })
                }
            }
            embed.setTimestamp()
            if (config.pingOnAccept == true) {
                acceptedChannel.send({ content:"<@"+config.discordId+">",embeds:[embed] })
            } else {
                acceptedChannel.send({ embeds:[embed] })
            }
        }
    }

    return
}

async function checkMembers() {
    var info = await axios("https://groups.roblox.com/v1/groups/"+config.groupId, {method: "GET"}).catch((err) => {console.log(err.status)})
    var infoFile = fs.readFileSync("./info.json", "utf-8")
    infoFile = JSON.parse(infoFile)
    if (info) {
        info = info.data
        var embed = new Discord.EmbedBuilder()
        if (infoFile.Members < info.memberCount) {
            // gained members
            embed.setColor(65374)
            embed.setTitle("Group member count increased!")
            embed.setDescription(info.memberCount-infoFile.Members+" members gained, group now has "+info.memberCount+" members.")
            console.log(clc.green(info.memberCount-infoFile.Members+" members gained, group now has "+info.memberCount+" members."))
            infoFile.Members = info.memberCount
            memberChannel.send({ embeds:[embed] })
            fs.writeFileSync("./info.json", JSON.stringify(infoFile))
        } else if (infoFile.Members > info.memberCount) {
            // lost members
            embed.setColor(15158332)
            embed.setTitle("Group member count decreased!")
            embed.setDescription(infoFile.Members-info.memberCount+" members lost, group now has "+info.memberCount+" members.")
            console.log(clc.red(infoFile.Members-info.memberCount+" members lost, group now has "+info.memberCount+" members."))
            infoFile.Members = info.memberCount
            memberChannel.send({ embeds:[embed] })
            fs.writeFileSync("./info.json", JSON.stringify(infoFile))
        }
    }
    return
}

client.on("ready", () => {
    channel = client.channels.cache.find(channel => channel.id === config.discordNotificationChannelId)
    acceptedChannel = client.channels.cache.find(channel => channel.id === config.discordAcceptedChannelId)
    memberChannel = client.channels.cache.find(channel => channel.id === config.discordMemberCountChannelId)
    console.log(clc.green("Discord bot ready."))
    checkAccepts()
    console.log(clc.magenta("Checking group member count..."))
    checkMembers()
})

axios("https://thumbnails.roblox.com/v1/groups/icons?groupIds="+config.groupId+"&size=420x420&format=Png&isCircular=false", {method: "GET"}).then((data) => {
    if (data.status==200) {
        groupImageURL = data.data.imageUrl
    }
})

async function sendEmbed(groupId) {
    var info = await axios("https://groups.roblox.com/v1/groups/"+groupId, {method: "GET"}).catch((err) => {console.log(err.status)})
    if (info) {
        info = info.data
        //console.log(info.data)
        //console.log(info.data)
        var embed = new Discord.EmbedBuilder()
        embed.setColor(65374)
        embed.setTitle("Ally Request sent to "+info.name)
        embed.setDescription("Successfully sent ally request.")
        embed.setThumbnail(groupImageURL)
        embed.setTimestamp()
        embed.addFields(
            { name:"#️⃣ Group ID:", value:"```"+JSON.stringify(info.id)+"```" },
            { name:"👨‍👩‍👧 Members:", value:"```"+JSON.stringify(info.memberCount)+"```" },
        )
        if (info.shout) {
            var string = info.shout.body
            embed.addFields({ name:"📢 Group Shout:", value:"```"+string+"```"},)
            var string = info.description
            if (string) {
                string.replace("\n", "")
                embed.addFields({ name:"🖊 Description:", value:"```"+info.description+"```" })
            } else {
                embed.addFields({ name:"🖊 Description:", value:"```No description.```" })
            }
        } else {
            embed.addFields({ name:"📢 Group Shout:", value:"```"+"No shout."+"```"},)
            var string = info.description
            if (string) {
                string.replace("\n", "")
                embed.addFields({ name:"🖊 Description:", value:"```"+info.description+"```" })
            } else {
                embed.addFields({ name:"🖊 Description:", value:"```No description.```" })
            }
        }

        channel.send({ embeds:[embed] })
    }
}

async function sendWithProxy(id) {
    console.log(clc.magenta("Sending to "+id))
    var url = "https://groups.roblox.com/v1/groups/"+config.groupId+"/relationships/allies/"+id

    var status = 0
    var res = await axios(url, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token, cookie: '.ROBLOSECURITY=' + config.ownerCookie + ';' },
        proxy: false,
        httpsAgent: new httpsProxyAgent.HttpsProxyAgent(config.proxy)
    }).catch((err) => {
        //console.log(clc.red(err.response.status))
        if (err.response) {
            status = err.response.status
            if (status == 403) {
                token = err.response.headers['x-csrf-token']
                acceptInboundRequests()
            }
        } else {
            status = 400
            console.log(err)
        }
    })

    if (res) {
        if (res.status == 200) {
            console.log(clc.green("Successfully sent ally request to "+id))
            sendEmbed(id)
            //console.log(token)
        }
    } else if (status > 0) {
        if (status == 429) {
            console.log(clc.red("Error 429, too many requests... (You're being ratelimited!)"))
        } else if (status == 403) {
            console.log(clc.red("Error 403."))
        } else if (status==400) {
            console.log(clc.red(status+", bad request; likely group doesn't exist or an issue with proxies."))
            //console.log(token)
        } else {
            console.log(clc.red(status))
        }
    }
}

async function sendWithoutProxy(id) {
    console.log(clc.magenta("Sending to "+id))
    var url = "https://groups.roblox.com/v1/groups/"+config.groupId+"/relationships/allies/"+id

    var status = 0
    var res = await axios(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token, cookie: '.ROBLOSECURITY=' + config.ownerCookie + ';' }
    }).catch((err) => {
        if (err.response) {
            status = err.response.status
            if (status == 403) {
                token = err.response.headers['x-csrf-token']
            }
        } else {
            status = 400
        }
    })
    if (res) {
        if (res.status == 200) {
            console.log(clc.green("Successfully sent ally request to "+id))
            sendEmbed(id)
        }
    } else if (status > 0) {
        if (status == 429) {
            console.log(clc.red("Error 429, too many requests... (You're being ratelimited!)"))
        } else if (status == 403) {
            console.log(clc.red(status+", bad request; likely group doesn't exist or an issue with proxies."))
        } else {
            console.log(clc.red(status))
        }
    }
}

async function acceptInboundRequests() {
    var url = "https://groups.roblox.com/v1/groups/"+config.groupId+"/relationships/allies/requests?model.startRowIndex=0&model.maxRows=999999"
    //console.log(url)
    var inb = await axios(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token, cookie: '.ROBLOSECURITY=' + config.ownerCookie + ';' }
    }).catch((err) => {
        console.log(clc.red("Error getting inbound ally requests: "+err))
    })
    if (inb) {
        inb = inb.data
        console.log(clc.magenta(inb.totalGroupCount+" ally requests inbound, accepting..."))
        var ids = []
        for (i in inb.relatedGroups) {
            var group = inb.relatedGroups[i]
            var id = group.id
            ids.push(id)
            var res = await axios("https://groups.roblox.com/v1/groups/"+config.groupId+"/relationships/allies/requests/"+id, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token, cookie: '.ROBLOSECURITY=' + config.ownerCookie + ';' },
            }).catch((err) => {
                console.log(clc.red("Error accepting inbound ally requests: "+err))
            })
            if (res) {
                if (res.status == 200) {
                    console.log(clc.green("Successfully accepted ally request from "+id+"."))
                } else {
                    console.log(clc.red("Error "+res.status+" while attempting to accept ally requests."))
                }
            }
        }
        //console.log(ids)
        

        return
    } else {
        return
    }
}

async function main() {
    console.log(clc.green("Squidingz Ally Bot Started."))

    client.login(config.discordBotToken)
    
    if (config.useProxies == true) {
        console.log(clc.green("Proxies enabled!"))
        proxiesEnabled = true
    } else {
        console.log(clc.yellow("Proxies not enabled, expect to be hard ratelimited."))
    }

    for (let i = parseInt(config.startGroupId); i < parseInt(config.endGroupId); i++) {
        var sent = await JSON.parse(fs.readFileSync("done.json", "utf8"));
        if (sent.includes(i)) {
            //console.log(clc.yellow("Already sent to this group, skipping..."))
        } else {
            //console.log(i)
            sent.push(i)
            var data = JSON.stringify(sent);
            var res = await fs.writeFileSync("done.json", data);


            //console.log(url)
            if (proxiesEnabled == true) {
                sendWithProxy(i)
            } else {
                sendWithoutProxy(i)
            }            

            // group scraping

            url = "https://groups.roblox.com/v1/groups/"+i+"/relationships/allies?model.startRowIndex=0&model.maxRows=100"

            //console.log(clc.magenta("Scraping group allies..."))

            if (proxiesEnabled == true) {
                //console.log(url)
                var res = await axios(url, {
                    method: "GET",
                    proxy: false,
                    httpsAgent: new httpsProxyAgent.HttpsProxyAgent(config.proxy)
                }).catch((err) => {
                    if (err.response) {
                        console.log(clc.red(err.response.status))
                        status = err.response.status    
                    } else {
                        console.log(clc.red(err))
                    }
                })

                if (res) {
                    if (res.data.totalGroupCount > 0) {
                        console.log(clc.green(res.data.totalGroupCount+" groups are allies with "+i+", sending alliance requests to them."))
                        for (e in res.data.relatedGroups) {
                            var group = res.data.relatedGroups[e]
                            sendWithProxy(group.id)
                            await sleep(parseInt(config.pauseBetweenRequests*1000))
                        }
                    } else {
                        console.log(clc.yellow("The group has no allies."))
                        //console.log(res)
                    }
                }
            } else {
                //console.log(url)
                var res = await axios(url, {
                    method: "GET",
                }).catch((err) => {
                    if (err.response) {
                        console.log(clc.red(err.response.status))
                        status = err.response.status    
                    } else {
                        console.log(clc.red(err))
                    }
                })

                if (res.data.totalGroupCount > 0) {
                    console.log(clc.green(res.data.totalGroupCount+" groups found, sending alliance requests to them."))
                    for (e in res.data.relatedGroups) {
                        var group = res.data.relatedGroups[e]
                        sendWithoutProxy(group.id)
                        await sleep(parseInt(config.pauseBetweenRequests*1000))
                    }
                } else {
                    //console.log(clc.yellow("The group has no allies."))
                    //console.log(res)
                }
            }

            await sleep(parseInt(config.pauseBetweenRequests*1000))
            if (i/10 == Math.floor(i/10)) {
                console.log(clc.blueBright("Checking for accepts..."))
                await checkAccepts()
                console.log(clc.blueBright("Checking for new members..."))
                await checkMembers()
                console.log(clc.blueBright("Checking for inbound requests..."))
                await acceptInboundRequests()
            }
        }
    }
}

main()

process.on("uncaughtException", (reason, pr) => {
    console.log(reason)
})

process.on("unhandledRejection", (reason, pr) => {
    console.log(reason)
})
