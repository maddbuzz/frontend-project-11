import initView from './view.js';

const app = () => {
  const elements = {
    formEl: document.querySelector('.rss-form'),
    inputEl: document.getElementById('url-input'),
    submitEl: document.querySelector('button[type="submit"]'),
    feedbackEl: document.querySelector('.feedback'),
    feedsEl: document.querySelector('.feeds'),
    feedsListEl: document.querySelector('.feeds ul'),
  };

  // Модель ничего не знает о контроллерах и о представлении. В ней не хранятся DOM-элементы.
  const state = {
    aggregator: {
      feedsURLs: [],
      processState: 'waitingForInput',
      processFeedback: { success: undefined, failure: undefined },
    },
  };

  initView(elements, state);
};

export default app;
