require('dotenv').config()
const Discord = require('discord.js'),
  client = new Discord.Client()
const redis = require('redis'),
  redisClient = redis.createClient({
    db: process.env.REDIS_DB,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  })
const messageList = require('./message-list')
const Message = require('./message')
const Promise = require('bluebird')
Promise.promisifyAll(redisClient)

client.on('ready', () => {
  console.log('Sudah siap bersabda')
  const minutes = 120
  const diffSecs = minutes * 60 * 1000,
    startHour = 10,
    endHour = 21,
    channel = client.channels.get(process.env.CHANNEL_BCD_ID)
  setInterval(async () => {
    const d = new Date(),
      now = d.getTime(),
      currHour = d.getHours()
    if (currHour < startHour || currHour >= endHour) return

    const dailyKey = 'daily@' + getDateStr(),
          cache = await redisClient.getAsync(dailyKey)
    let answer = null
    if(cache === null && currHour === startHour) {
      answer = await getDailyQuote()
    } else {
      let lastTs = await redisClient.getAsync('lastTs')
      if (lastTs !== null) {
        lastTs = parseInt(lastTs)
        if (now < lastTs + diffSecs) return
      }
      answer = pickAnswer(messageList.idleMessages)
    }
    send(channel, answer)
    redisClient.set('lastTs', d.getTime())
  }, 5000)
})

client.on('message', async (message) => {
  if (message.author === client.user) return

  const msgText = message.content.toLowerCase().trim()
  const zepizMessages = ['zpz', 'zepiz', 'mzz', 'woy', 'woi', 'mzm', 'mzzm']
  const qerjaMessages = ['kerja', 'qerja']
  const gamesMessages = ['main', 'mabar', 'maen']

  const botId = client.user.toString()
  let answer = null
  if (msgText.includes(botId)) {
    if(msgText === botId + ' help') {
      answer = new Message('https://media.discordapp.net/attachments/641081733122490398/641166742483107841/bc_help.jpg', 'attach')
    } else if(msgText === botId + ' sabda') {
      answer = await getDailyQuote()
    } else {
      answer = pickAnswer(messageList.tagMessages)
      answer = new Message(answer.content + ' ' + message.author.toString(), answer.type)
    }
  } else {
    if (msgText === 'bc' || msgText === 'bisi') {
      answer = pickAnswer(messageList.praiseMessages)
    } else if (msgText === 'rip') {
      answer = new Message('rip')
    } else if (msgText === 'bcd bc') {
      answer = new Message('bcd bc <@' + process.env.BC_USER_ID + '>')
    } else if (hasWord(msgText, zepizMessages)) {
      const answers = [
        'bcd anjg',
        'qerja gblg',
        'bcd',
        'sssssttt'
      ]
      answer = new Message(pickAnswer(answers) + ' ' + message.author.toString())
    } else if (hasWord(msgText, qerjaMessages)) {
      answer = new Message('https://media.discordapp.net/attachments/353098986678386708/639405055061131266/unknown.png', 'attach')
    } else if (hasWord(msgText, gamesMessages)) {
      answer = new Message('https://cdn.discordapp.com/attachments/353098986678386708/599874632212021249/unknown.png', 'attach')
    }
  }
  if(answer !== null) send(message.channel, answer)
  redisClient.set('lastTs', (new Date()).getTime())
})

function send(channel, message) {
  if(message.type === 'attach') {
    const attach = new Discord.Attachment(message.content)
    channel.send(attach)
  } else {
    channel.send(message.content)
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

function getDateStr(date = new Date()) {
  return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
}

async function getDailyQuote() {
  const dailyKey = 'daily@' + getDateStr(),
    cache = await redisClient.getAsync(dailyKey)
  let answer = null
  if (cache !== null) {
    answer = JSON.parse(cache)
  } else {
    answer = pickAnswer(messageList.dailyMessages)
    redisClient.setex(dailyKey, 3600 * 24, JSON.stringify(answer))
  }
  answer = new Message('**SABDA BC HARI INI**\n' + answer.content, answer.type)
  return answer
}

client.login(process.env.DISCORD_TOKEN)