const TelegramBot = require('node-telegram-bot-api');
const token = require('./bot_token');
const bot = new TelegramBot(token, {polling: true});

const rawData = require('./top');
const pickRandom = require('pick-random');
const _ = require('lodash');
const data = rawData
  .filter(({ description }) => description)
  .map((x, index) => {
    x.index = index;
    return x;
  });

const prepareMessage = (name, description) => {
  return description.replace(new RegExp(`\\S*${name}\\S*`, 'ig'), '*');
}

const makeQuestion = () => {
  const [correct, ...rest] = pickRandom(data, { count: 4 });
  const question = prepareMessage(correct.name, correct.description);
  const variants = _.shuffle([correct, ...rest]).map(x => ({
    text: x.name,
    callback_data: `${correct.index}:${x.index}`
  }));

  return {
    question,
    keyboard: [...variants.map(x => [x])]
  }
}

const sendNewQuestion = (chatId) => {
  const { question, keyboard } = makeQuestion();
  bot.sendMessage(chatId, question, {
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
}

bot.onText(/.*/, (msg, match) => {
  const chatId = msg.chat.id;
  sendNewQuestion(chatId);
});

bot.on('callback_query', async ({ data: cbData, message }) => {
  const [correctIndex, currentIndex] = cbData.split(':')
  const correct = data[correctIndex];
  const current = data[currentIndex];
  const question = data.find(x => x.name === correct.name).description;
  const newText = question + '\n' + (correct.name === current.name ? '✅' : '❌') + ' ' + correct.name;

  await bot.editMessageText(newText, {
    chat_id: message.chat.id,
    message_id: message.message_id
  });

  sendNewQuestion(message.chat.id);
})