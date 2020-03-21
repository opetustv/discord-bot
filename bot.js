
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
   * Do not add roles to members of the following groups
   */
  roleNamesToSkip: ['perustajat', 'modet', 'Opetus.tv bot', 'TeXit', 'kirjoitusoikeus'],

  /**
   * Name of the Discord role that allows users to talk and share their screen in audio channels
   */
  roleNamesToAssign: ['puheoikeus', 'kirjoitusoikeus'],

  /**
   * Keep track of who the bot has given the talkPermissionRoleName role already.
   *
   * This is so that the bot will only give the permissions once and if moderators revoke the role
   * from a given user, the bot should not give the role again.
   */
  rolesAssignedTo: []
}

/**
 * Variable for holding a list of Discord.js's Role objects that we want to assign to the user
 *
 * Get initialized in the Client's .on('ready', callback) handler once per execution session
 */
let rolesToAssign

/**
 * Assign roles to the desired member
 *
 * @param {GuildMember} member The GuildMember object to whom a permission to talk role should be assigned
 */
async function assignRoles (member) {
  // Skip if the member has already been given the talk permission role earlier
  if (CONFIG.rolesAssignedTo.includes(member.id)) {
    return null
  }

  const server = client.guilds.first()
  const userRoleNames = member.roles.map(role => role.name)

  /**
   * Handle errors caught from member.addRole(role)
   * @param {Error} error Error that was most likely caused by addRole request getting timed out
   */
  const handleErrorOnAddRole = error => {
    console.log(`Assigning roles to ${member.user.username} timed out. Attempting again in 5 seconds.`)
    setTimeout(() => {
      member.addRole(role).catch(handleErrorOnAddRole)
    }, 5000)
  }

  // ignore users that have at least one of the roles defined in roleNamesToSkip
  for (const r of userRoleNames) {
    if (CONFIG.roleNamesToSkip.includes(r)) {
      return null
    }
  }

  rolesToAssign.forEach(async role => {
    try {
      await member.addRole(role)
    } catch (error) {
      handleErrorOnAddRole(error)
    }
  })

  CONFIG.rolesAssignedTo.push(member.id)
  return member
}

/**
 * Assign roles to a member only once
 *
 * @param {GuildMember} member The member that was added to the guild
 */
async function doRoleAssignmentToMember (member) {
  if (CONFIG.rolesAssignedTo.includes(member.id)) {
    return
  }
  try {
    const m = await assignRoles(member)
    if (m) {
      console.log(`Member ${m.user.username} joined or came online and roles ${CONFIG.roleNamesToAssign} were assigned`)
      fs.writeFileSync(CONFIG.filename, JSON.stringify(CONFIG))
    }
  } catch (err) {
    console.error(err)
  }
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
 * Event listener for when a member is added to the server
 */
client.on('guildMemberAdd', doRoleAssignmentToMember)

/**
 * Event listener for when a user's status changes to "online"
 */
client.on('guildMemberAvailable', doRoleAssignmentToMember)

/**
 * Event listener for when bot has started running
 */
client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const server = client.guilds.first()
  rolesToAssign = server.roles.filter(role => CONFIG.roleNamesToAssign.includes(role.name))
  let counter = 0;

  server.members.forEach(async member => {
    setTimeout(async () => {
      try {
        const m = await assignRoles(member);
        if (m) {
          console.log(`Roles ${CONFIG.roleNamesToAssign} added to member: ${m.user.username}`)
          fs.writeFileSync(CONFIG.filename, JSON.stringify(CONFIG))
        }
      } catch (err) {
        console.error(err)
      }
    }, 100 * counter);
    counter += 1;
  })
})

/**
 * MAIN
 */
try {
  CONFIG.rolesAssignedTo = JSON.parse(fs.readFileSync('bot.config.json', 'utf8')).rolesAssignedTo
} catch (err) {
  CONFIG.rolesAssignedTo = []
}

// Initialize bot by connecting to the server
client.login(process.env.DISCORD_TOKEN);
