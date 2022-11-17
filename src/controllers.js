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

const downloadContent = async (contentUrl) => {
  try {
    const url = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(contentUrl)}`;
    const response = await axios.get(url);
    return response.data.contents;
  } catch (err) {
    throw new Error('contentLoadingError', { cause: err });
  }
};

const addNewFeedPosts = async (url, watchedState) => {
  const content = await downloadContent(url);
  const [feedData, postsData] = parseAndExtractData(content);
  const postIdOffset = watchedState.posts.length;
  const newFeedId = watchedState.feeds.length;
  const feed = { ...feedData, id: newFeedId, url };
  const feedPosts = postsData
    .map((post, index) => ({ ...post, feedId: newFeedId, id: postIdOffset + index }));
  watchedState.feeds.push(feed);
  watchedState.posts.push(...feedPosts);
};

const updateFeedPosts = async (feed, watchedState) => {
  const content = await downloadContent(feed.url);
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
};

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
  setTimeout(async () => {
    const promises = watchedState.feeds.map((feed) => updateFeedPosts(feed, watchedState));
    await Promise.allSettled(promises);
    setUpdateTimer(watchedState, updateIntervalMs);
  }, updateIntervalMs);
};

export const getFormSubmitCallback = (watchedState) => async (e) => {
  e.preventDefault();
  const url = new FormData(e.target).get('url').trim();
  const urls = _map(watchedState.feeds, 'url');

  watchedState.form = { state: 'validating' };
  try {
    await yupSchema.validate({ url, urls }, { abortEarly: false });
    watchedState.form = { state: 'validatingSucceeded' };
    watchedState.feedLoading = { state: 'loading' };
    await addNewFeedPosts(url, watchedState);
    watchedState.feedLoading = { state: 'loadingSucceeded' };
  } catch (err) {
    const errorKey = `feedback.${err.message}`;
    switch (err.name) {
      case 'ValidationError':
        watchedState.form = { state: 'validatingFailed', error: errorKey };
        break;
      case 'Error': // err.cause: 'AxiosError', 'ParseError', ...
        watchedState.feedLoading = { state: 'loadingFailed', error: errorKey };
        break;
      default:
        console.error(err);
    }
    // if (err.cause) console.error(err.cause);
  }
  watchedState.form = { state: 'filling' };
  watchedState.feedLoading = { state: 'idling' };
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
