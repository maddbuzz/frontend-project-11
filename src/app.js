import * as yup from 'yup';
import onChange from 'on-change';
import _keyBy from 'lodash/keyBy.js';
import _isEmpty from 'lodash/isEmpty.js';
import renderView from './view.js';

const schema = yup.object().shape({
  url: yup.string().required().url(),
});

const validate = (fields) => {
  // Как только в коде появляется асинхронность, код должен менять свою структуру.
  // В случае колбеков он становится вложенным,
  // в случае промисов весь код превращается в непрерывную цепочку промисов.
  // https://ru.hexlet.io/courses/js-asynchronous-programming/lessons/promises/theory_unit
  const promise = schema.validate(fields, { abortEarly: false })
    .then(() => ({}))
    .catch((e) => _keyBy(e.inner, 'path'));
  return promise;
};

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

  // Контроллеры меняют модель, тем самым вызывая рендеринг.
  const watchState = onChange(state, renderView(elements));

  // Контроллеры не должны менять DOM напрямую, минуя представление.
  elements.formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url').trim();
    watchState.aggregator.processState = 'validatingInput';
    // ...в случае промисов весь код превращается в непрерывную цепочку промисов:
    validate({ url })
      .then((validationErrors) => {
        if (!_isEmpty(validationErrors)) {
          watchState.aggregator.processFeedback = { failure: 'Ссылка должна быть валидным URL' };
          return;
        }
        if (watchState.aggregator.feedsURLs.includes(url)) {
          watchState.aggregator.processFeedback = { failure: 'RSS уже существует' };
          return;
        }
        watchState.aggregator.processState = 'loadingFeed';
        watchState.aggregator.feedsURLs.push(url);
        watchState.aggregator.processFeedback = { success: 'RSS успешно загружен' };
      })
      .then(() => { watchState.aggregator.processState = 'waitingForInput'; })
      .catch((err) => { throw err; });
  });
};

export default app;
