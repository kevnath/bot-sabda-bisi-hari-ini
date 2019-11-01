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
  const diffSecs = 60 * 60 * 1000;
  setInterval(async () => {
    let lastTs = await redisClient.getAsync('lastTs')
    if (lastTs !== null) {
      lastTs = parseInt(lastTs)
      const now = (new Date()).getTime()
      if (now > lastTs + diffSecs) {
        let ch = client.channels.get(process.env.CHANNEL_BCD_ID)
        let answers = [
          'zpz',
          'zpz amat',
          'zpz ya',
          'zepaz zepiz',
          'MZZZZZZZZZ',
          'MZZMZMZMMZMZMZZMZMZ',
          'WOY WOY WOY WOY WOY WOY WOY WOY WOY WOY WOY WOY WOY WOY WOY'
        ]
        ch.send(answers[Math.floor(Math.random()*answers.length)]) 
      }
    }
  }, 5000)
})

client.on('message', (message) => {
  redisClient.set('lastTs', (new Date()).getTime())
  if(message.author === client.user) return

  if(message.content.includes(client.user.toString())) {
    message.channel.send('apa lu ngetag" anjg ' + message.author.toString())
    return
  }
  
  const msgText = message.content.toLowerCase()
  const zepizMessages = ['zpz', 'zepiz', 'sepiz', 'mzz', 'woy']
  const qerjaMessages = ['kerja', 'qerja']
  const gamesMessages = ['monhun', 'opor', 'apex', 'monster hunter']
  if(hasWord(msgText, zepizMessages)) {
    const answers = [
      'bcd anjg',
      'qerja gblg'
    ]
    message.channel.send(answers[Math.floor(Math.random()*answers.length)] + ' ' + + message.author.toString())
  } else if(hasWord(msgText, qerjaMessages)) {
    const imgAttach = new Discord.Attachment('https://media.discordapp.net/attachments/353098986678386708/639405055061131266/unknown.png')
    message.channel.send(imgAttach)
  } else if(hasWord(msgText, gamesMessages)) {
    const imgAttach = new Discord.Attachment('https://cdn.discordapp.com/attachments/353098986678386708/599874632212021249/unknown.png')
    message.channel.send(imgAttach)
  }
})

function hasWord(text, haystack) {
  for(i = 0, c = haystack.length; i < c; i++) {
    if(text.includes(haystack[i])) return true
  }
  return false
}

client.login(process.env.DISCORD_TOKEN)