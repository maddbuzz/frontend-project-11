/* eslint-disable no-param-reassign */

// View (Представление) пользуется Model (Состоянием) для отрисовки
// (добавление, изменение или удаление элементов DOM),
// а также добавляет новые Controllers (Обработчики) в DOM.

import onChange from 'on-change';
import getSubmitCallback from './controllers.js';

const switchElementsDisabled = (elements, needDisable) => elements
  .forEach((el) => el.toggleAttribute('disabled', needDisable));

const handleFormFeedback = (elements, formFeedback) => {
  const { success, failure, neutral } = formFeedback;
  const {
    posts, feeds, form, input, feedback,
  } = elements;

  input.classList.toggle('is-invalid', Boolean(failure));
  feedback.classList.toggle('text-danger', Boolean(failure));
  feedback.classList.toggle('text-success', Boolean(success));
  feedback.textContent = failure || neutral || success;

  if (success) {
    form.reset();
    feeds.removeAttribute('hidden');
    posts.removeAttribute('hidden');
  }
};

const handleFormState = (elements, formState) => {
  const elementsToSwitch = [elements.input, elements.button];

  switch (formState) {
    case 'waitingForInput':
      switchElementsDisabled(elementsToSwitch, false);
      elements.input.focus();
      break;

    case 'processingInput':
      switchElementsDisabled(elementsToSwitch, true);
      break;

    default:
      throw Error(`Unknown form state ${formState}`);
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
  ul.prepend(li);
};

const handlePosts = (elements, posts, previousPosts) => {
  const startIndex = previousPosts.length;
  const ul = elements.posts.querySelector('ul');
  posts
    .filter((post, index) => index >= startIndex)
    .forEach((post) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      li.innerHTML = `
        <a href="${post.link}" class="fw-bold" data-id="${post.id}" target="_blank" rel="noopener noreferrer">${post.title}</a>
        <button type="button" class="btn btn-outline-primary btn-sm" data-id="${post.id}" data-bs-toggle="modal" data-bs-target="#modal">Просмотр</button>
      `;
      ul.prepend(li);
    });
};

// Представление не меняет модель
// В представлении происходит отображение модели на страницу
// Для оптимизации рендер происходит точечно в зависимости от того, какая часть модели изменилась
const renderView = (elements) => (path, value, previousValue) => {
  switch (path) {
    case 'uiState.form.state':
      handleFormState(elements, value);
      break;

    case 'uiState.form.feedback':
      handleFormFeedback(elements, value);
      break;

    case 'feeds':
      handleFeeds(elements, value);
      break;

    case 'posts':
      handlePosts(elements, value, previousValue);
      break;

    default:
      // throw Error(`Unexpected renderView path ${path}`);
      // console.log(path, value, previousValue);
      break;
  }
};

const setStaticTexts = (elements, i18n) => {
  elements.main.querySelector('h1').textContent = i18n.t('mainHeader');
  elements.form.querySelector('label[for="url-input"]').textContent = i18n.t('form.labelForUrlInput');
  elements.button.textContent = i18n.t('form.button');
  elements.main.querySelector('#url-example').textContent = i18n.t('form.example');
  elements.feeds.querySelector('h2').textContent = i18n.t('feeds');
  elements.posts.querySelector('h2').textContent = i18n.t('posts');
};

const initView = (state, i18n) => {
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

  state.uiState = {
    form: {
      state: 'waitingForInput',
      feedback: {
        neutral: '', success: undefined, failure: undefined,
      },
    },
  };
  // Контроллеры не должны менять DOM напрямую, минуя представление.
  // Контроллеры меняют модель, тем самым вызывая рендеринг:
  const watchedState = onChange(state, renderView(mainElements));
  mainElements.form.addEventListener('submit', getSubmitCallback(watchedState, i18n));
};

export default initView;
