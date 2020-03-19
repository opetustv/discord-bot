
const Discord = require('discord.js');
const client = new Discord.Client();
require('dotenv').config();
const fs = require('fs');

const CONFIG = {
  /**
   * Bot configuration file name
   */
  filename: 'bot.config.json',

  /**
   * Keep track of who the bot has given the talkPermissionRoleName role already.
   *
   * This is so that the bot will only give the permissions once and if moderators revoke the role
   * from a given user, the bot should not give the role again.
   */
  memberIdsThatReceivedTalkPermissionRole: [],

  /**
   * Do not add puheoikeus role to members of the following groups
   */
  roleNamesToSkip: ['perustajat', 'modet', 'Opetus.tv bot', 'TeXit', 'puheoikeus', 'mykistys'],

  /**
   * Name of the Discord role that allows users to talk and share their screen in audio channels
   */
  talkPermissionRoleName: 'puheoikeus'
}

/**
 * Assign the talkPermissionRoleName to the desired member
 *
 * @param {GuildMember} member The GuildMember object to whom a permission to talk role should be assigned
 */
async function addTalkPermission (member) {
  // Skip if the member has already been given the talk permission role earlier
  if (CONFIG.memberIdsThatReceivedTalkPermissionRole.includes(member.id)) {
    return null
  }

  const otv = client.guilds.first()
  const roleTalkPermission = otv.roles.find(role => role.name === CONFIG.talkPermissionRoleName)
  const userRoleNames = member.roles.map(role => role.name)

  // ignore users that have at least one of the roles defined in roleNamesToSkip
  for (const r of userRoleNames) {
    if (CONFIG.roleNamesToSkip.includes(r)) {
      return null
    }
  }


  const m = await member.addRole(roleTalkPermission)
  CONFIG.memberIdsThatReceivedTalkPermissionRole.push(member.id)
  return m
}

/**
 * Event listener for messages
 */
client.on('message', msg => {
  // We check the message content and looks for the word "ping", so we can have the bot respond "pong"
  if (msg.content === 'ping') {
    msg.reply('pong');
  }
  if (msg.content.indexOf('kerro vitsi') > -1) {
    msg.reply(vitsit[Math.floor(Math.random() * vitsit.length)])
  }
});

/**
 * Event listener for when a user's status changes to "online"
 */
client.on('guildMemberAvailable', async member => {
  if (CONFIG.memberIdsThatReceivedTalkPermissionRole.includes(member.id)) {
    return
  }
  try {
    const m = await addTalkPermission(member)
    CONFIG.memberIdsThatReceivedTalkPermissionRole.push(m.id)
    console.log(`Member ${m.user.username} came online and talk permission was added`)
    fs.writeFileSync(CONFIG.filename, JSON.stringify(CONFIG))
  } catch (err) {
    console.error(err)
  }
})


/**
 * Event listener for when bot has started running
 */
client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const otv = client.guilds.first()
  let counter = 0;

  otv.members.forEach(async (member, id) => {
    setTimeout(async () => {
      try {
        const m = await addTalkPermission(member);
        if (m) {
          CONFIG.memberIdsThatReceivedTalkPermissionRole.push(m.id)
          console.log(`Talk permission role added to member: ${m.user.username}`)
        }
      } catch (err) {
        console.error(err)
      }
    }, 500 * counter);
    counter += 1;
  })

  // Persist configuration, especially the member ids that have already received talk permission
  fs.writeFileSync(CONFIG.filename, JSON.stringify(CONFIG))
})


/**
 * MAIN
 */
try {
  CONFIG.memberIdsThatReceivedTalkPermissionRole = JSON.parse(fs.readFileSync('bot.config.json', 'utf8')).memberIdsThatReceivedTalkPermissionRole
} catch (err) {
  CONFIG.memberIdsThatReceivedTalkPermissionRole = []
}

// Initialize bot by connecting to the server
client.login(process.env.DISCORD_TOKEN);
