/* Copyright (C) 2022 Sourav KL11.
Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.
Raganork MD - Sourav KL11
*/
function checkLinks(links, allowedWords) {
    let testArray = []
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      let isAllowed = true;
      for (let j = 0; j < allowedWords.length; j++) {
        const allowedWord = allowedWords[j];
        if (link.includes(allowedWord)) {
          isAllowed = true; // Word is allowed
          break;
        }
        isAllowed = false; // Word is not allowed
      }
      
        testArray.push(isAllowed)
      }
    return testArray.includes(false)
  }
let {Module} = require('../main');
let {ADMIN_ACCESS,WARN,ANTILINK_WARN} = require('../config');
let {getString} = require('./misc/lang');
const {Fancy} = require('raganork-bot')
let {isAdmin} = require('./misc/misc');
let Lang = getString('group');
let {setWarn,resetWarn,mentionjid} = require('./misc/misc');
Module({pattern: 'warn ?(.*)', fromMe: false,use: 'group', desc:Lang.WARN_DESC}, (async (m, mat) => { 
let adminAccesValidated = ADMIN_ACCESS ? await isAdmin(m,m.sender) : false;
if (m.fromOwner || adminAccesValidated) {
if (mat[1] === "reset") return await m.sendReply("*Wrong command! Use _.reset warn_*")
if (m.message.includes(Lang.REMAINING)) return;
var user = m.mention[0] || m.reply_message.jid
if (!user) return await m.sendReply(Lang.NEED_USER)
if (!m.jid.endsWith('@g.us')) return await m.sendReply(Lang.GROUP_COMMAND)
var warn = await setWarn(m.jid,user,parseInt(WARN))
var ms = 'Replied message';
if (m.mention[0]) ms = 'Not defined'
if (m.reply_message.audio) ms = 'Audio'
if (m.reply_message.sticker) ms = 'Sticker'
if (m.reply_message.text) ms = m.reply_message.text.length > 40 ? 'Replied message' : m.reply_message.text
if (m.reply_message.video) ms = 'Video'
if (m.reply_message.image) ms = 'Image'
var reason = mat[1] ? mat[1].replace(mentionjid(user),"") : ms
var msg = Lang.WARNING + '\n' +
    Lang.USER.format(mentionjid(user))+ '\n' +
    Lang.REASON.format(reason)+ '\n' +
    Lang.REMAINING.format(warn) + '\n' 
if (warn !== 0) {
    return await m.client.sendMessage(m.jid, { text:msg,mentions:[user]},{ quoted: m.quoted || m.data })
} else {
    await m.client.sendMessage(m.jid,{text: Lang.WARN_OVER.format(mentionjid(user)), mentions: [user] })
    await m.client.groupParticipantsUpdate(m.jid, [user], "remove")
 }
}}));
Module({pattern: 'reset warn',use: 'group',fromMe: false, desc:'Resets the warn count of the user'}, (async (m, mat) => { 
let adminAccesValidated = ADMIN_ACCESS ? await isAdmin(m,m.sender) : false;
if (m.fromOwner || adminAccesValidated) {
var user = m.mention[0] || m.reply_message.jid
if (!user) return await m.sendReply(Lang.NEED_USER)
if (!m.jid.endsWith('@g.us')) return await m.sendReply(Lang.GROUP_COMMAND)
try { await resetWarn(m.jid,user) } catch { return await m.sendReply("error")}
return await m.client.sendMessage(m.jid,{text:Lang.WARN_RESET.format(mentionjid(user)), mentions: [user] })
}}));
Module({on: 'text', fromMe: false}, (async (m, mat) => { 
    if (!ANTILINK_WARN.split(",").includes(m.jid)) return;
    let allowed = (process.env.ALLOWED_LINKS || "gist,instagram,youtu").split(",");
    let linksInMsg = m.message.match(/\bhttps?:\/\/\S+/gi)
    if (checkLinks(linksInMsg,allowed)) {
    await m.client.sendMessage(m.jid, { delete: m.data.key })
    var user = m.sender
    var admin = await isAdmin(m,m.sender);
    if (admin) return;
    if (!user) return await m.sendReply(Lang.NEED_USER)
    if (!m.jid.endsWith('@g.us')) return await m.sendReply(Lang.GROUP_COMMAND)
    var warn = await setWarn(m.jid,user,parseInt(WARN))
    var reason = linksInMsg.join(", ");
    var msg = "Antilink "+Lang.WARNING + '\n' +
    Lang.USER+mentionjid(user)+ '\n' +
    Lang.REASON+ reason+ '\n' +
    Lang.REMAINING+ warn + '\n' 
    if (warn !== 0) {
        return await m.client.sendMessage(m.jid, { text: msg ,mentions:[user]},{ quoted: m.data })
    } else {
        var admin = await isAdmin(m,m.sender);
        await m.sendMessage(Lang.WARN_OVER.format(WARN,mentionjid(user).replace("@","")))
        await m.client.sendMessage(m.jid,{text: mentionjid(user)+Lang.KICKED, mentions: [user] })
        await m.client.groupParticipantsUpdate(m.jid, [user], "remove")
     }
    }
    }));
