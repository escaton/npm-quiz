const rawData = require('./top');
const inquirer = require('inquirer');
const pickRandom = require('pick-random');
const _ = require('lodash');


class Game {
  constructor() {
    this.data = rawData.filter(({ description }) => description);
    this.rightAnswers = 0;
    this.iterations = 0;
  }

  prepareMessage(name, description) {
    return description.replace(new RegExp(`\\S*${name}\\S*`, 'ig'), '*');
  }

  createQuestion() {
    if (this.data.length < 4) {
      return {
        'finish': true
      };
    }
    const [correct, ...rest] = pickRandom(this.data, { count: 4 });

    const optionsNames = [correct, ...rest].map(opt => opt.name);

    this.data = this.data.filter((pkg) => !optionsNames.includes(pkg.name));

    return {
      question: {
        type: 'list',
        name: 'answer',
        message: this.prepareMessage(correct.name, correct.description),
        choices: _.shuffle([correct, ...rest]).map(x => x.name),
      },
      correct: correct.name,
      finish: false
    }
  }

  async run() {
    this.inProgress = true;
    while (this.inProgress) {
      const { question, correct, finish } = this.createQuestion();

      if (finish) {
        this.stop();
        break;
      }

      const { answer } = await inquirer.prompt(question);
      const rightAnswer = answer === correct;

      if (rightAnswer) {
        this.rightAnswers++;
      }

      this.iterations++;

      console.log(rightAnswer);
    }
  }

  stop() {
    this.inProgress = false;
    
    console.log('Right answers', this.rightAnswers);
    console.log('Iterations', this.iterations);

    console.log('GG');
  }
}

const game = new Game();

process.on('exit', (code) => {
  game.stop();
});

game.run();
