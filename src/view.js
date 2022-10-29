// View (Представление) пользуется Model (Состоянием) для отрисовки
// (добавление, изменение или удаление элементов DOM),
// а также добавляет новые Controllers (Обработчики) в DOM.

import * as yup from 'yup';
import onChange from 'on-change';
// import _keyBy from 'lodash/keyBy.js';
// import _isEmpty from 'lodash/isEmpty.js';
import axios from 'axios';

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

// const yupValidate = async (schema, fields) => {
//   try {
//     await schema.validate(fields, { abortEarly: false });
//     return {};
//   } catch (e) {
//     return _keyBy(e.inner, 'path');
//   }
// };

const switchElementsDisabled = (elements, needDisable) => {
  elements.forEach((el) => {
    if (needDisable) el.setAttribute('disabled', '');
    else el.removeAttribute('disabled');
  });
};

const handleProcessFeedback = (elements, processFeedback) => {
  const {
    posts, feeds, form, input, feedback,
  } = elements;
  const { success, failure, neutral } = processFeedback;

  if (failure) {
    input.classList.add('is-invalid');
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    feedback.textContent = failure;
  }
  if (neutral) {
    input.classList.remove('is-invalid');
    feedback.classList.remove('text-success');
    feedback.classList.remove('text-danger');
    feedback.textContent = neutral;
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

const handleProcessState = (elements, processState) => {
  const elementsToSwitch = [elements.input, elements.button];

  switch (processState) {
    case 'waitingForInput':
      switchElementsDisabled(elementsToSwitch, false);
      elements.input.focus();
      break;

    case 'loadingFeed':
      switchElementsDisabled(elementsToSwitch, true);
      break;

    default:
      throw Error(`Unknown process state ${processState}`);
  }
};

const handleFeeds = (elements, feeds) => {
  const feed = feeds.at(-1);
  const ul = elements.feeds.querySelector('ul');
  const li = document.createElement('li');
  li.classList.add('list-group-item', 'border-0', 'border-end-0');
  li.innerHTML = `
    <h3 class="h6 m-0">${feed.title}</h3>
    <p class="m-0 small text-black-50">${feed.description}</p>
  `;
  ul.append(li);
};

const handlePosts = (elements, posts) => {
  const { feedId } = posts.at(-1);
  const ul = elements.posts.querySelector('ul');
  posts
    .filter((post) => post.feedId === feedId)
    .forEach((post) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      li.innerHTML = `
        <a href="${post.link}" class="fw-bold" data-id="${post.guid}" target="_blank" rel="noopener noreferrer">${post.title}</a>
        <button type="button" class="btn btn-outline-primary btn-sm" data-id="${post.guid}" data-bs-toggle="modal" data-bs-target="#modal">Просмотр</button>
      `;
      ul.append(li);
    });
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

    case 'aggregator.feeds':
      handleFeeds(elements, value);
      break;

    case 'aggregator.posts':
      handlePosts(elements, value);
      break;

    default:
      // console.log(path, value, previousValue);
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

const parseXML = (xmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    console.error(errorNode);
    throw Error('xmlParsingError');
  }
  return doc;
};

const tryDownloadContent = (contentUrl) => {
  const url = `https://allorigins.hexlet.app/get?disableCache=true&url=${contentUrl}`;
  return axios
    .get(url)
    .then((response) => response.data.contents)
    .catch((err) => {
      console.error(err);
      throw Error('contentLoadingError');
    });
};

const getSubmitCallback = (yupSchema, watchedState, i18n) => (e) => {
  e.preventDefault();
  const { aggregator } = watchedState;
  const formData = new FormData(e.target);
  const url = formData.get('url').trim();

  aggregator.processFeedback = { neutral: i18n.t('feedback.neutral.pleaseWait') };
  aggregator.processState = 'loadingFeed';
  // Как только в коде появляется асинхронность, код должен менять свою структуру:
  // в случае промисов весь код превращается в непрерывную цепочку промисов.
  yupSchema.validate({ url }, { abortEarly: false })
    .then(() => {
      if (aggregator.feeds.find((feed) => feed.url === url)) {
        throw Error('alreadyExists');
      }
    })
    .then(() => tryDownloadContent(url))
    .then((content) => {
      const doc = parseXML(content);
      const feed = {
        id: aggregator.feeds.length,
        title: doc.querySelector('channel title').textContent,
        description: doc.querySelector('channel description').textContent,
        url,
      };
      const items = doc.querySelectorAll('item');
      const feedPosts = [...items].map((item) => ({
        feedId: feed.id,
        guid: item.querySelector('guid').textContent,
        title: item.querySelector('title').textContent,
        description: item.querySelector('description').textContent,
        link: item.querySelector('link').textContent,
      }));
      aggregator.feeds.push(feed);
      aggregator.posts.push(...feedPosts);
      aggregator.processFeedback = { success: i18n.t('feedback.success.loadSuccess') };
    })
    .catch((err) => {
      const key = `feedback.failure.${err.message}`;
      let text;
      if (i18n.exists(key)) {
        text = i18n.t(key);
      } else {
        text = err.message;
        console.error(err);
      }
      aggregator.processFeedback = { failure: text };
    })
    .finally(() => { aggregator.processState = 'waitingForInput'; });
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
  const watchedState = onChange(state, renderView(mainElements));

  mainElements.form.addEventListener('submit', getSubmitCallback(yupSchema, watchedState, i18n));
};

export default initView;
