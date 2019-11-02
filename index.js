require('dotenv').config()
const Discord = require('discord.js'),
      client = new Discord.Client()
const redis = require('redis'),
      redisClient = redis.createClient({
        db: process.env.REDIS_DB,
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      })
const Promise = require('bluebird')
Promise.promisifyAll(redisClient)

client.on('ready', () => {
  console.log('Sudah siap bersabda')
  const diffSecs = 60 * 60 * 1000; // 60 minutes
  setInterval(async () => {
    const d = new Date(),
          now = d.getTime(),
          currHour = d.getHours()
    if(currHour < 10 || currHour > 22) return
    let lastTs = await redisClient.getAsync('lastTs')
    if (lastTs !== null) {
      lastTs = parseInt(lastTs)
      if (now > lastTs + diffSecs) {
         sendBcd()
      }
    } else {
      sendBcd()
    }
  }, 5000)
})

function sendBcd() {
  let ch = client.channels.get(process.env.CHANNEL_BCD_ID)
  let answers = [
    'zpz',
    'zpz amat',
    'zpz ya',
    'zepaz zepiz',
    'zepiz',
    'THOM',
    'MZZZZZZZZZ',
    'MZZMZMZMMZMZMZZMZMZ',
    'WOY WOY WOY WOY WOY WOY WOY WOY WOY WOY WOY WOY WOY WOY WOY'
  ]
  ch.send(pickAnswer(answers))
  redisClient.set('lastTs', (new Date()).getTime())
}

client.on('message', (message) => {
  if(message.author === client.user) return

  if(message.content.includes(client.user.toString())) {
    const answers = [
      'apa lu ngetag" anjg',
      'bcd',
      'bcd anjg'
    ]
    message.channel.send(pickAnswer(answers) + ' ' + message.author.toString())
    return
  }
  
  const msgText = message.content.toLowerCase().trim()
  const zepizMessages = ['zpz', 'zepiz', 'sepi', 'mzz', 'woy', 'woi', 'mzm', 'mzzm']
  const qerjaMessages = ['kerja', 'qerja']
  const gamesMessages = ['monhun', 'opor', 'apex', 'monster hunter', 'main', 'mabar', 'maen']
  if(msgText === 'bc' || msgText === 'bisi') {
    const answers = [
      'PUJI DAN SYUKUR',
      'TERPUJILAH TUHAN'
    ]
    message.channel.send(pickAnswer(answers))
  } else if(msgText === 'rip') {
    message.channel.send('rip')
  } else if(hasWord(msgText, zepizMessages)) {
    const answers = [
      'bcd anjg',
      'qerja gblg'
    ]
    message.channel.send(pickAnswer(answers) + ' ' + message.author.toString())
  } else if(hasWord(msgText, qerjaMessages)) {
    const imgAttach = new Discord.Attachment('https://media.discordapp.net/attachments/353098986678386708/639405055061131266/unknown.png')
    message.channel.send(imgAttach)
  } else if(hasWord(msgText, gamesMessages)) {
    const imgAttach = new Discord.Attachment('https://cdn.discordapp.com/attachments/353098986678386708/599874632212021249/unknown.png')
    message.channel.send(imgAttach)
  }
  redisClient.set('lastTs', (new Date()).getTime())
})

function hasWord(text, haystack) {
  for(i = 0, c = haystack.length; i < c; i++) {
    if(text.includes(haystack[i])) return true
  }
  return false
}

function pickAnswer(answers) {
  return answers[Math.floor(Math.random()*answers.length)]
}

client.login(process.env.DISCORD_TOKEN)