import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

// For storing messages to be used for context in the bot

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
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  addMessage(role, content) {
    const message = new Message(role, content);
    const currentList = this.getMessages();
    currentList.push(message);
    localStorage.setItem(this.storageKey, JSON.stringify(currentList));
  }

  removeMessage(index) {
    const currentList = this.getMessages();
    if (index >= 0 && index < currentList.length) {
      currentList.splice(index, 1);
      localStorage.setItem(this.storageKey, JSON.stringify(currentList));
    } else {
      console.error('Invalid index');
    }
  }

  getMessages() {
    return JSON.parse(localStorage.getItem(this.storageKey));
  }

  resetStorage() {
    localStorage.removeItem(this.storageKey);
    this.initStorage();
  }
}

const messageList = new PersistentMessageList('messageList');
//messageList.resetStorage();

let loadInterval;

function loader(element){
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if (element.textContent === '....') {
      element.textContent = '';
    }

  }, 300)
}

function typeText(element, text){
  let index = 0;
  element.innerHTML = '';

  let interval = setInterval(() => {
    if(index < text.length){
      element.innerHTML += text.charAt(index);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20)

}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe (isAi, value, uniqueId) {

  return (
    `
      <div class="wrapper ${isAi && 'ai'}">
        <div class="chat">
          <div class="profile">
            <img
              src="${isAi ? bot : user}"
              alt="${isAi ? 'bot' : 'user'}"
            />
          </div>
          <div class="message" id=${uniqueId}>${value}</div>
        </div> 
      </div>
    `
  )

}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  //user's chatstripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

  if(data.get('prompt').trim() === 'New Chat'){
    messageList.resetStorage();
    console.log(messageList.getMessages());
  } else {
      // store user prompt in local storage
    messageList.addMessage('user', data.get('prompt'));
    console.log(messageList.getMessages()); 
  }

  form.reset();

  //bot's chatstripe
  const uniqueId = generateUniqueId();

  chatContainer.innerHTML += chatStripe(true, " ", uniqueId);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv);

  const messages = messageList.getMessages();
  const promptMessages = messages.map((message) => {
    return {role: message.role, content: message.content};
  });
  console.log(promptMessages);

  // fetch data from server
  //const response = await fetch('https://codeguru-q6df.onrender.com', {
  const response = await fetch('http://localhost:5000', {
    method: 'POST', 
    headers: {
      'Content-Type' : 'application/json'
    },
    body: JSON.stringify({
      //prompt: data.get('prompt')      
      prompt: promptMessages
    })
  })

  clearInterval(loadInterval);
  messageDiv.innerHTML = " ";

  if(response.ok) {
    const data = await response.json();
    const parsedData = data.bot.trim();
    messageList.addMessage('assistant', parsedData);
    console.log(messageList.getMessages()); 

    typeText(messageDiv, parsedData);
  } else {
    const err = await response.text();
    messageDiv.innerHTML = "Something went wrong";
    alert(err);
  }
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
})
