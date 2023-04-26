import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import {Configuration, OpenAIApi} from 'openai';

dotenv.config();

const openaiapikey = process.env.OPENAI_API_KEY;

const configuration = new Configuration({
    apiKey: openaiapikey,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    res.status(200).send({
        message: 'Hello from CodeGuru',
    })
})

app.post('/', async (req, res) => {
    try {
        const prompt = req.body.prompt;

        //const response = await openai.createCompletion({
        //    model: "text-davinci-003",
        //     prompt: `${prompt}`,
        //     temperature: 0,
        //     max_tokens: 3000,
        //     top_p: 1,
        //     frequency_penalty: 0.5,
        //     presence_penalty: 0,
        // });

        // res.status(200).send({
        //     bot: response.data.choices[0].text
        // });

        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{role: "user", content: `${prompt}`}],
        });

        res.status(200).send({
            bot: response.data.choices[0].message.content
        });

    } catch (error){
        console.error(error);
        res.status(500).send(error || 'Something went wrong');
    }
})

app.listen(5000, () => console.log('Server is running on port http://localhost:5000'));

const fs = require('fs');

class Message {
  constructor(role, content) {
    this.role = role;
    this.content = content;
  }
}

class PersistentMessageList {
  constructor(storageKey) {
    this.storageKey = storageKey;
    this.initStorage();
  }

  initStorage() {
    if (!fs.existsSync(this.storageKey)) {
      fs.writeFileSync(this.storageKey, JSON.stringify([]));
    }
  }

  addMessage(role, content) {
    const message = new Message(role, content);
    const currentList = this.getMessages();
    currentList.push(message);
    fs.writeFileSync(this.storageKey, JSON.stringify(currentList));
  }

  removeMessage(index) {
    const currentList = this.getMessages();
    if (index >= 0 && index < currentList.length) {
      currentList.splice(index, 1);
      fs.writeFileSync(this.storageKey, JSON.stringify(currentList));
    } else {
      console.error('Invalid index');
    }
  }

  getMessages() {
    return JSON.parse(fs.readFileSync(this.storageKey, 'utf8'));
  }
}

// Usage
const messageList = new PersistentMessageList('messageList.json');
messageList.addMessage('user', 'Hello, world!');
messageList.addMessage('bot', 'Hi there!');
console.log(messageList.getMessages());
messageList.removeMessage(0);
console.log(messageList.getMessages());
