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
  };

  // Модель ничего не знает о контроллерах и о представлении. В ней не хранятся DOM-элементы.
  const state = {
    form: {
      feedsURLs: [],
      processState: 'waitingForUrl',
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
    watchState.form.processState = 'validatingUrl';
    validate({ url })
      .then((validationErrors) => {
        if (!_isEmpty(validationErrors)) {
          watchState.form.processFeedback = { failure: 'Ссылка должна быть валидным URL' };
          return;
        }
        if (watchState.form.feedsURLs.includes(url)) {
          watchState.form.processFeedback = { failure: 'RSS уже существует' };
          return;
        }
        watchState.form.feedsURLs.push(url);
        watchState.form.processState = 'loadingFeed';
        watchState.form.processFeedback = { success: 'RSS успешно загружен' };
      })
      .then(() => { watchState.form.processState = 'waitingForUrl'; })
      .catch((err) => { throw err; });
  });
};

export default app;
