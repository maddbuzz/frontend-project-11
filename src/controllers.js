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

const downloadContent = (contentUrl) => {
  const url = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(contentUrl)}`;
  return axios
    .get(url)
    .then((response) => response.data.contents)
    .catch((err) => {
      const e = new Error('contentLoadingError', { cause: err });
      e.name = err.name;
      throw e;
    });
};

const addNewFeedPosts = (url, watchedState) => downloadContent(url)
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

const updateFeedPosts = (feed, watchedState) => downloadContent(feed.url)
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

/*
export const setUpdateTimer = (watchedState, updateIntervalMs, startTime = Date.now()) => {
  const elapsedTime = Date.now() - startTime;
  const delayMs = updateIntervalMs - (elapsedTime % updateIntervalMs);
  // console.log('setUpdateTimer', elapsedTime / 1000, delayMs / 1000);
  setTimeout(() => {
    const promises = watchedState.feeds.map((feed) => updateFeedPosts(feed, watchedState));
    Promise.allSettled(promises)
      // .then((results) => results.forEach((result) => console.log(result)))
      .finally(() => { setUpdateTimer(watchedState, updateIntervalMs, startTime); });
  }, delayMs);
};
*/

export const setUpdateTimer = (watchedState, updateIntervalMs) => {
  setTimeout(() => {
    const promises = watchedState.feeds.map((feed) => updateFeedPosts(feed, watchedState));
    Promise.allSettled(promises)
      .finally(() => { setUpdateTimer(watchedState, updateIntervalMs); });
  }, updateIntervalMs);
};

export const getFormSubmitCallback = (watchedState, i18n) => (e) => {
  e.preventDefault();
  const url = new FormData(e.target).get('url').trim();
  const urls = _map(watchedState.feeds, 'url');

  watchedState.form = { state: 'validating' };
  yupSchema.validate({ url, urls }, { abortEarly: false })
    .then(() => {
      watchedState.form = { state: 'validatingSucceeded' };
      watchedState.feedLoading = { state: 'loading' };
      return addNewFeedPosts(url, watchedState);
    })
    .then(() => { watchedState.feedLoading = { state: 'loadingSucceeded' }; })
    .catch((err) => {
      const errorKey = `feedback.${err.message}`;
      if (!i18n.exists(errorKey)) throw err;
      // if (err.cause) console.error(err.cause);
      switch (err.name) {
        case 'ValidationError':
          watchedState.form = { state: 'validatingFailed', error: errorKey };
          break;
        case 'AxiosError':
        case 'ParseError':
          watchedState.feedLoading = { state: 'loadingFailed', error: errorKey };
          break;
        default:
          throw Error(`Unexpected error name <${err.name}>`);
      }
    })
    .finally(() => {
      watchedState.form = { state: 'filling' };
      watchedState.feedLoading = { state: 'idling' };
    });
};

export const getPostsClickCallback = (watchedState) => (e) => {
  const { target } = e;
  if (!target.hasAttribute('data-id')) return;
  const postId = Number(target.getAttribute('data-id'));
  const { viewedPostsIds } = watchedState;
  if (!viewedPostsIds.includes(postId)) viewedPostsIds.push(postId);
};

export const getModalShowCallback = (watchedState) => (e) => {
  const button = e.relatedTarget; // button that triggered the modal
  const postId = Number(button.getAttribute('data-id'));
  const post = watchedState.posts.find(({ id }) => id === postId);
  const { title, description, link } = post;
  watchedState.modalContent = { title, description, link };
};
