import i18next from 'i18next';
import onChange from 'on-change';

import resources from './locales/index.js';
import { getRenderView, setStaticTexts } from './view.js';
import {
  getFormSubmitCallback, getPostsClickCallback, getModalShowCallback, setUpdateTimer,
} from './controllers.js';

const defaultLanguage = 'ru';
const updateIntervalMs = 5000;

const app = async () => {
  const state = {
    feeds: [],
    posts: [],
    form: {
      state: 'filling', // filling, validating, validatingSucceeded, validatingFailed
      error: null,
    },
    feedLoading: {
      state: 'idling', // idling, loading, loadingSucceeded, loadingFailed
      error: null,
    },
    viewedPostsIds: [],
    modalContent: {},
  };

  const main = document.querySelector('main');
  const elements = {
    main,
    form: main.querySelector('.rss-form'),
    input: main.querySelector('#url-input'),
    button: main.querySelector('.rss-form button'),
    feedback: main.querySelector('.feedback'),
    feeds: main.querySelector('.feeds'),
    posts: main.querySelector('.posts'),
    modal: document.getElementById('modal'),
  };

  const i18n = i18next.createInstance();
  await i18n.init({ lng: defaultLanguage, debug: false, resources });
  console.log(i18n.t('translationsLoaded'));

  setStaticTexts(elements, i18n);
  const watchedState = onChange(state, getRenderView(elements, i18n));
  elements.form.addEventListener('submit', getFormSubmitCallback(watchedState));
  elements.posts.addEventListener('click', getPostsClickCallback(watchedState));
  elements.modal.addEventListener('show.bs.modal', getModalShowCallback(watchedState));
  setUpdateTimer(watchedState, updateIntervalMs);
};

export default app;
