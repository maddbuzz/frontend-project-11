// View (Представление) пользуется Model (Состоянием) для отрисовки
// (добавление, изменение или удаление элементов DOM),
// а также добавляет новые Controllers (Обработчики) в DOM.

import * as yup from 'yup';
import onChange from 'on-change';
import _keyBy from 'lodash/keyBy.js';
import _isEmpty from 'lodash/isEmpty.js';

const yupInit = () => {
  yup.setLocale({
    string: {
      url: 'invalidURL',
    },
    mixed: {
      required: 'requiredField',
    },
  });
  // now use Yup schemas AFTER you defined your custom dictionary
  const schema = yup.object().shape({
    url: yup.string().required().url(),
  });
  return schema;
};

const yupValidate = (schema, fields) => {
  const promise = schema.validate(fields, { abortEarly: false })
    .then(() => ({}))
    .catch((e) => _keyBy(e.inner, 'path'));
  return promise;
};

const switchElementsDisabled = (elements, needDisable) => {
  Object.values(elements).forEach((el) => {
    if (needDisable) el.setAttribute('disabled', '');
    else el.removeAttribute('disabled');
  });
};

const handleProcessFeedback = (elements, value) => {
  const {
    posts, feeds, form, input, feedback,
  } = elements;
  const { success, failure } = value;

  if (failure) {
    input.classList.add('is-invalid');
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    feedback.textContent = failure;
  }
  if (success) {
    input.classList.remove('is-invalid');
    feedback.classList.remove('text-danger');
    feedback.classList.add('text-success');
    feedback.textContent = success;
    form.reset();
    feeds.removeAttribute('hidden');
    posts.removeAttribute('hidden');
  }
};

const handleProcessState = (elements, value) => {
  const { input, button } = elements;

  switch (value) {
    case 'waitingForInput':
      switchElementsDisabled({ input, button }, false);
      input.focus();
      break;

    case 'validatingInput':
      switchElementsDisabled({ input, button }, true);
      break;

    case 'loadingFeed':
      break;

    default:
      throw new Error(`Unknown process state ${value}`);
  }
};

// Представление не меняет модель
// В представлении происходит отображение модели на страницу
// Для оптимизации рендер происходит точечно в зависимости от того, какая часть модели изменилась
const renderView = (elements) => (path, value) => {
  switch (path) {
    case 'aggregator.processState':
      handleProcessState(elements, value);
      break;

    case 'aggregator.processFeedback':
      handleProcessFeedback(elements, value);
      break;

    case 'aggregator.feedsURLs': {
      const li = document.createElement('li');
      li.textContent = value.at(-1);
      elements.feeds.querySelector('ul').append(li);
      break;
    }

    default:
      // console.log(path, value);
      break;
  }
};

const setStaticTexts = (mainElements, i18n) => {
  const elements = mainElements;
  elements.main.querySelector('h1').textContent = i18n.t('mainHeader');
  elements.form.querySelector('label[for="url-input"]').textContent = i18n.t('form.labelForUrlInput');
  elements.button.textContent = i18n.t('form.button');
  elements.main.querySelector('#url-example').textContent = i18n.t('form.example');
  elements.feeds.querySelector('h2').textContent = i18n.t('feeds');
  elements.posts.querySelector('h2').textContent = i18n.t('posts');
};

const getSubmitCallback = (yupSchema, watchState, i18n) => (e) => {
  e.preventDefault();
  const { aggregator } = watchState;
  const formData = new FormData(e.target);
  const url = formData.get('url').trim();
  aggregator.processState = 'validatingInput';
  // Как только в коде появляется асинхронность, код должен менять свою структуру:
  // в случае промисов весь код превращается в непрерывную цепочку промисов.
  yupValidate(yupSchema, { url })
    .then((validationErrors) => {
      if (!_isEmpty(validationErrors)) {
        const key = validationErrors.url?.message ?? 'unknownValidationError';
        aggregator.processFeedback = { failure: i18n.t(`feedback.${key}`) };
        return;
      }
      if (aggregator.feedsURLs.includes(url)) {
        aggregator.processFeedback = { failure: i18n.t('feedback.alreadyExists') };
        return;
      }
      aggregator.processState = 'loadingFeed';
      aggregator.feedsURLs.push(url);
      aggregator.processFeedback = { success: i18n.t('feedback.loadSuccess') };
    })
    .then(() => { aggregator.processState = 'waitingForInput'; })
    .catch((err) => { throw err; });
};

const initView = (state, i18n) => {
  const yupSchema = yupInit();

  const main = document.querySelector('main');
  const mainElements = {
    main,
    form: main.querySelector('.rss-form'),
    input: main.querySelector('#url-input'),
    button: main.querySelector('.rss-form button'),
    feedback: main.querySelector('.feedback'),
    feeds: main.querySelector('.feeds'),
    posts: main.querySelector('.posts'),
  };

  setStaticTexts(mainElements, i18n);

  // Контроллеры не должны менять DOM напрямую, минуя представление.
  // Контроллеры меняют модель, тем самым вызывая рендеринг:
  const watchState = onChange(state, renderView(mainElements));

  mainElements.form.addEventListener('submit', getSubmitCallback(yupSchema, watchState, i18n));
};

export default initView;
