/* eslint-disable no-param-reassign */

import * as yup from 'yup';
import axios from 'axios';
import _map from 'lodash/map.js';
import parseAndExtractData from './parser.js';

const yupSchema = (() => yup.object()
  .shape({
    url: yup.string()
      .required('requiredField')
      .url('invalidURL')
      .notOneOf([yup.ref('urls')], 'alreadyExists'),
    urls: yup.array(),
  })
)();

const tryDownloadContent = (contentUrl) => {
  const url = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(contentUrl)}`;
  return axios
    .get(url)
    .then((response) => response.data.contents)
    .catch((err) => {
      throw new Error('contentLoadingError', { cause: err });
    });
};

const tryAddNewFeedPosts = (url, watchedState) => tryDownloadContent(url)
  .then((content) => {
    const [feedData, postsData] = parseAndExtractData(content);
    const postIdOffset = watchedState.posts.length;
    const newFeedId = watchedState.feeds.length;
    const feed = { ...feedData, id: newFeedId, url };
    const feedPosts = postsData
      .map((post, index) => ({ ...post, feedId: newFeedId, id: postIdOffset + index }));
    watchedState.feeds.push(feed);
    watchedState.posts.push(...feedPosts);
  });

const tryUpdateFeedPosts = (feed, watchedState) => tryDownloadContent(feed.url)
  .then((content) => {
    const [, postsData] = parseAndExtractData(content);
    const postIdOffset = watchedState.posts.length;
    const oldFeedPosts = watchedState.posts
      .filter(({ feedId }) => feedId === feed.id);
    const newFeedPosts = postsData
      .filter((post) => {
        // All elements of an (feed's) item are optional,
        // however at least one of title or description must be present:
        if (post.title) return oldFeedPosts.every(({ title }) => title !== post.title);
        return oldFeedPosts.every(({ description }) => description !== post.description);
      })
      .map((post, index) => ({ ...post, feedId: feed.id, id: postIdOffset + index }));
    if (newFeedPosts.length) watchedState.posts.push(...newFeedPosts);
  });

export const setUpdateTimer = (watchedState, updateIntervalMs, startTime = Date.now()) => {
  const elapsedTime = Date.now() - startTime;
  const delayMs = updateIntervalMs - (elapsedTime % updateIntervalMs);
  // console.log('setUpdateTimer', elapsedTime / 1000, delayMs / 1000);

  setTimeout(() => {
    const promises = watchedState.feeds.map((feed) => tryUpdateFeedPosts(feed, watchedState));
    Promise.allSettled(promises)
      // .then((results) => results.forEach((result) => console.log(result)))
      .finally(() => { setUpdateTimer(watchedState, updateIntervalMs, startTime); });
  }, delayMs);
};

export const getFormSubmitCallback = (watchedState, i18n) => (e) => {
  e.preventDefault();
  const url = new FormData(e.target).get('url').trim();
  const { uiState } = watchedState;

  uiState.form = { state: 'processing', feedbackKey: 'pleaseWait' };
  // Как только в коде появляется асинхронность, код должен менять свою структуру,
  // в случае промисов весь код превращается в непрерывную цепочку промисов:
  const urls = _map(watchedState.feeds, 'url');
  yupSchema.validate({ url, urls }, { abortEarly: false })
    .then(() => tryAddNewFeedPosts(url, watchedState))
    .then(() => { uiState.form = { state: 'succeeded', feedbackKey: 'loadSuccess' }; })
    .catch((err) => {
      if (err.cause) console.error(err.cause);
      const feedbackKey = err.message;
      if (!i18n.exists(`feedback.${feedbackKey}`)) throw err;
      uiState.form = { state: 'failed', feedbackKey };
    })
    .finally(() => { uiState.form = { state: 'filling' }; });
};

export const getPostsClickCallback = (watchedState) => (e) => {
  const { target } = e;
  if (!target.hasAttribute('data-id')) return;
  const postId = Number(target.getAttribute('data-id'));
  const { clickedPostsIds } = watchedState.uiState;
  if (!clickedPostsIds.includes(postId)) clickedPostsIds.push(postId);
};

export const getModalShowCallback = (watchedState) => (e) => {
  const button = e.relatedTarget; // button that triggered the modal
  const postId = Number(button.getAttribute('data-id'));
  const post = watchedState.posts.find(({ id }) => id === postId);
  const { title, description, link } = post;
  watchedState.uiState.modalContent = { title, description, link };
};
