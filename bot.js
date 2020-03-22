
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
   * Names of the Discord roles that should be added to users by default
   *
   * Please notice that if you add to this list after bot has already been running, you need
   * to delete bot.config.json for changes to be applied. Also please notice that removing
   * a role name from this list WILL NOT cause that role to be revoked from users!
   */
  roleNamesToAssign: ['puheoikeus', 'kirjoitusoikeus'],

  /**
   * Keep track of who the bot has given the roles defined in roleNamesToAssign to already.
   *
   * This is so that the bot will only assign the desired roles once; if moderators then revoke
   * (some of) the role(s), the bot should not assign the role(s) again.
   */
  rolesAssignedTo: []
}

/**
 * Variable for holding a list of Discord.js's Role objects that we want to assign to the user
 *
 * Gets initialized in the Client's .on('ready', callback) handler once per execution session
 */
let rolesToAssign

/**
 * Assign roles to the desired member
 *
 * @param {GuildMember} member The GuildMember object to whom roles should be assigned to
 */
async function assignRoles (member) {
  // Skip if the member has already been assigned the roles defined in `roleNamesToAssign`.
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
 * Callback used on Client objects .on('eventName', callback) for assigning to members
 *
 * Will keep track of the users roles have already been assigned to and will
 * do assigments only once per user
 *
 * @param {GuildMember} member The member that was added to the guild
 */
async function roleAssignmentToMemberHandler (member) {
  if (CONFIG.rolesAssignedTo.includes(member.id)) {
    return
  }
  try {
    const m = await assignRoles(member)
    if (m) {
      console.log(`The following member joined or came online and roles ${CONFIG.roleNamesToAssign} were assigned: ${m.user.username}`)
      fs.writeFileSync(CONFIG.filename, JSON.stringify(CONFIG))
    }
  } catch (err) {
    console.error(err)
  }
}

/**
 * Event handler for when the Client object triggers its `ready` event
 */
async function clientReadyEventHandler () {
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
          // fs.writeFileSync would be much smarter to do after the forEach loop completes BUT
          // the writeFileSync call it cannot simply be moved after the loop due to async function calls
          // inside the loop...didn't wanna start figuring out how to use Promise.all(callback)
          // or some similar right now since it's a nice day out :D maybe improve this later
          fs.writeFileSync(CONFIG.filename, JSON.stringify(CONFIG)) // @todo
        }
      } catch (err) {
        console.error(err)
      }
    }, 100 * counter);
    counter += 1;
  })
}

/**
 * Event listener for messages
 *
 * Currently only responds to a `ping` message with `pong`.
 * This can interactively be used to check that the bot is still running.
 */
client.on('message', msg => {
  // We check the message content and looks for the word "ping", so we can have the bot respond "pong"

  if (msg.content === 'ping') {
    msg.reply('pong');
  }
});

/**
 * Event listener for when a member is added to the server
 */
client.on('guildMemberAdd', roleAssignmentToMemberHandler)

/**
 * Event listener for when a user's status changes to "online"
 */
client.on('guildMemberAvailable', roleAssignmentToMemberHandler)

/**
 * Event listener for when bot has started running
 */
client.on('ready', clientReadyEventHandler)

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
