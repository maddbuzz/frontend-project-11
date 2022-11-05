/* eslint-disable no-param-reassign */

import * as yup from 'yup';
import axios from 'axios';
import _map from 'lodash/map.js';
import parseAndExtractData from './parser.js';

const postsUpdateTimeMs = 5000;

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
      console.error(err);
      throw Error('contentLoadingError');
    });
};

const findFeedWithUrl = (feeds, url) => feeds.find((feed) => feed.url === url);

const tryDownloadAndExtractData = (url, watchedState, isNewFeed = true) => tryDownloadContent(url)
  .then((content) => {
    const [feedData, postsData] = parseAndExtractData(content);

    const postIdOffset = watchedState.posts.length;
    if (isNewFeed) {
      const newFeedId = watchedState.feeds.length;
      const feed = {
        ...feedData, id: newFeedId, url, updateTime: Date.now(),
      };
      const feedPosts = postsData
        .map((post, index) => ({ ...post, feedId: newFeedId, id: postIdOffset + index }));
      watchedState.feeds.push(feed);
      watchedState.posts.push(...feedPosts);
    } else {
      const feed = findFeedWithUrl(watchedState.feeds, url);
      const prevUpdateTime = feed.updateTime;
      feed.updateTime = Date.now();
      const newFeedPosts = postsData
        .filter((post) => Date.parse(post.pubDate) > prevUpdateTime)
        .map((post, index) => ({ ...post, feedId: feed.id, id: postIdOffset + index }));
      if (newFeedPosts.length) watchedState.posts.push(...newFeedPosts);
    }
  });

const setUpdateTimer = (updateTimeMs, url, watchedState) => {
  setTimeout(() => {
    tryDownloadAndExtractData(url, watchedState, false)
      .finally(() => setUpdateTimer(updateTimeMs, url, watchedState));
  }, updateTimeMs);
};

export const getFormSubmitCallback = (watchedState, i18n) => (e) => {
  e.preventDefault();
  const url = new FormData(e.target).get('url').trim();
  const { form } = watchedState.uiState;

  form.state = 'processingInput';
  form.feedback = { neutral: i18n.t('feedback.neutral.pleaseWait') };
  // Как только в коде появляется асинхронность, код должен менять свою структуру,
  // в случае промисов весь код превращается в непрерывную цепочку промисов:
  const urls = _map(watchedState.feeds, 'url');
  yupSchema.validate({ url, urls }, { abortEarly: false })
    .then(() => tryDownloadAndExtractData(url, watchedState, true))
    .then(() => {
      form.feedback = { success: i18n.t('feedback.success.loadSuccess') };
      setUpdateTimer(postsUpdateTimeMs, url, watchedState);
    })
    .catch((err) => {
      const key = `feedback.failure.${err.message}`;
      if (i18n.exists(key)) {
        form.feedback = { failure: i18n.t(key) };
        return;
      }
      console.error(err);
      form.feedback = { failure: err.message };
    })
    .finally(() => { form.state = 'waitingForInput'; });
};

export const getPostsClickCallback = (watchedState) => (e) => {
  const { target } = e;
  // if (target.tagName !== 'A' && target.tagName !== 'BUTTON') return;
  const postId = Number(target.getAttribute('data-id'));
  if (!postId) return;
  const { clickedPostsIds } = watchedState.uiState;
  if (!clickedPostsIds.find((id) => id === postId)) clickedPostsIds.push(postId);
};

export const getModalShowCallback = (watchedState) => (e) => {
  const button = e.relatedTarget; // button that triggered the modal
  const postId = Number(button.getAttribute('data-id'));
  const post = watchedState.posts.find((p) => p.id === postId);
  const { title, description, link } = post;
  watchedState.uiState.dataForModal = { title, description, link };
};
