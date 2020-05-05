require('dotenv').config()
const Discord = require('discord.js'),
  discordClient = new Discord.Client(),
  messageList = require('./message-list'),
  Message = require('./message')

const redis = require('redis'),
  redisClient = redis.createClient({
    db: process.env.REDIS_DB,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }),
  { promisify } = require('util'),
  redisGet = promisify(redisClient.get).bind(redisClient),
  redisSetEx = promisify(redisClient.setex).bind(redisClient),
  redisSet = promisify(redisClient.set).bind(redisClient),
  redisDel = promisify(redisClient.del).bind(redisClient)

const reminderMins = parseInt(process.env.REMINDER_MINUTES),
  startHour = parseInt(process.env.START_HOUR),
  endHour = parseInt(process.env.END_HOUR),
  reminderSecs = reminderMins * 60 * 1000,
  lastChatKey = 'last_chat_ts'

discordClient.on('ready', () => {
  const d = new Date()
  console.log('Sudah siap bersabda ' + d.toLocaleString())
  const channel = discordClient.channels.cache.get(process.env.CHANNEL_BCD_ID)
  setInterval(() => {
    sendMessageByInterval(channel)
  }, 5*1000)
});

async function sendMessageByInterval(channel) {
  const d = new Date(),
    dailyKey = 'daily@' + d.getFullYear() + (d.getMonth() + 1) + d.getDate(),
    dailyCache = await redisGet(dailyKey)
  currHour = d.getHours()

  if (currHour < startHour || currHour >= endHour) return

  let answer = null
  if (currHour === startHour) {
    if (dailyCache === null) {
      answer = pickAnswer(messageList.dailyMessages)
      await redisSetEx(dailyKey, 3600 * 24, JSON.stringify(answer))
    }
  } else {
    let lastTs = await redisGet(lastChatKey)
    if (lastTs !== null) {
      lastTs = parseInt(lastTs)
      console.log(reminderMins, reminderSecs, lastTs, d.getTime(), lastTs + reminderSecs)
      if (d.getTime() < lastTs + reminderSecs) return
    }
    answer = pickAnswer(messageList.idleMessages)
  }

  if (answer !== null) {
    send(channel, answer)
  }
}

async function send(channel, message) {
  try {
    if (message.type === 'attach') {
      const attach = new Discord.MessageAttachment(message.content)
      await channel.send(attach)
    } else {
      await channel.send(message.content)
    }
  } catch (ex) {}
  const d = new Date()
  await redisSet(lastChatKey, d.getTime())
}

discordClient.on('message', (message) => {
  if (message.author === discordClient.user) return
  replyMessage(message)
});

async function replyMessage(message) {
  const channel = message.channel,
    msgText = message.content.trim().toLowerCase(),
    zepizMessages = ['zpz', 'zepiz', 'mzz', 'woy', 'woi', 'mzm', 'mzzm'],
    qerjaMessages = ['kerja', 'qerja'],
    gamesMessages = ['main', 'mabar', 'maen'],
    replyKey = 'reply:' + message.author.id,
    replyCtx = await redisGet(replyKey),
    botId = `<@!${discordClient.user.id}>`
  let answer = null

  if (msgText.includes(botId)) {
    if (msgText === botId + ' help') {
      const answers = []
      answers.push(new Message('https://media.discordapp.net/attachments/646276322225553408/646280337067999232/help.jpg', 'attach'))
      answers.push(new Message('Command list:\n >>> **Sabda hari ini**:\n1. ' + botId + ' sabda\n2. ' +
        botId + ' berikanlah hambamu arahan\n\n**Puja BC**:\n1. puja ' + botId + '\n2. puja bc'))
      setTimeout(function () {
        answers.forEach(function (ans) {
          send(channel, ans)
        })
      }, 1000);
      return
    } else if(msgText === botId + ' sabda' || msgText === botId + ' berikanlah hambamu arahan') {
      answer = pickAnswer(messageList.dailyMessages)
    } else if(msgText === 'puja ' + botId) {
      answer = pickAnswer(messageList.praiseMessages)
    } else {
      const tmp = pickAnswer(messageList.tagMessages)
      answer = new Message(tmp.content + ` <@!${message.author.id}>`, tmp.type)
    }
  } else if(replyCtx !== null) {
    if(replyCtx === 'zepiz') {
      if(msgText.includes('zepiz')) {
        answer = pickAnswer(messageList.proudMessages)
        try {
          await message.react('💯')
        } catch(ex) {}
      } else {
        try {
          await message.react('😢')
        } catch(ex) {}
        answer = new Message('zdz')
      }
    }
    await redisDel(replyKey)
  } else {
    const pattern = new RegExp('ze*p[^i]z+')
    if (msgText === 'puja bc') {
      answer = pickAnswer(messageList.praiseMessages)
    } else if (msgText === 'rip') {
      answer = new Message('https://cdn.discordapp.com/attachments/353098986678386708/701676651565547571/stamp-20190801214304.png', 'attach')
    } else if (msgText === 'bcd bc') {
      answer = new Message(`bcd bc anjg <@!${process.env.BC_USER_ID}>`)
    } else if (hasWord(msgText, zepizMessages)) {
      const answers = [
        'bcd anjg',
        'qerja gblg',
        'bcd'
      ]
      answer = new Message(pickAnswer(answers) + ` <@!${message.author.id}>`)
    } else if (hasWord(msgText, qerjaMessages)) {
      answer = new Message('https://media.discordapp.net/attachments/353098986678386708/639405055061131266/unknown.png', 'attach')
    } else if (hasWord(msgText, gamesMessages)) {
      answer = new Message('https://cdn.discordapp.com/attachments/353098986678386708/599874632212021249/unknown.png', 'attach')
    } else if (hasWord(msgText, ['gezecc', 'gezek', 'gesek', 'beli', 'khilaf', 'gas', 'gaz'])) {
      answer = pickAnswer(messageList.khilafMessages)
    } else if (pattern.test(msgText)) {
      const answers = [
        'zepiznya mana',
        'zepiznya dong',
        'zepiznya jgn lupa mz'
      ]
      answer = new Message(pickAnswer(answers) + ` <@!${message.author.id}>`)
      await redisSetEx(replyKey, 60*10, 'zepiz')
    }
  }
  
  if (answer !== null) {
    send(channel, answer)
  }
}

function hasWord(text, haystack) {
  for (i = 0, c = haystack.length; i < c; i++) {
    if (text.includes(haystack[i])) return true
  }
  return false
}

function pickAnswer(answers) {
  return answers[Math.floor(Math.random() * answers.length)]
}

discordClient.login(process.env.DISCORD_TOKEN)