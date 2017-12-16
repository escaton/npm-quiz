const rawData = require('./top');
const inquirer = require('inquirer');
const pickRandom = require('pick-random');
const _ = require('lodash');

const data = rawData.filter(({ description }) => description);

const prepareMessage = (name, description) => {
  return description.replace(new RegExp(`\\w*${name}\\w*`, 'ig'), '*');
}

const createQuestion = () => {
  const [correct, ...rest] = pickRandom(data, { count: 4 });
  return {
    question: {
      type: 'list',
      name: 'answer',
      message: prepareMessage(correct.name, correct.description),
      choices: _.shuffle([correct, ...rest]).map(x => x.name)
    },
    correct: correct.name
  }
}

const cycle = async () => {
  while (true) {
    const { question, correct } = createQuestion();
    const { answer } = await inquirer.prompt(question);
    console.log(answer === correct);
  }
}

cycle();