/* eslint-disable no-param-reassign */

import * as yup from 'yup';
import axios from 'axios';
// import _isEmpty from 'lodash/isEmpty.js';

const postsUpdateTimeMs = 5000;

const yupSchema = (() => {
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
})();

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

const tryParseXML = (xmlString) => {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(xmlString, 'application/xml');
  const errorNode = xmlDocument.querySelector('parsererror');
  if (errorNode) {
    console.error(errorNode);
    throw Error('xmlParsingError');
  }
  return xmlDocument;
};

const getFeed = (xmlDocument, feedId, feedUrl) => ({
  id: feedId,
  title: xmlDocument.querySelector('channel title').textContent,
  description: xmlDocument.querySelector('channel description').textContent,
  url: feedUrl,
  updateTime: Date.now(),
});

const getFeedPosts = (xmlDocument, feedId) => {
  const items = xmlDocument.querySelectorAll('item');
  return [...items].map((item) => ({
    feedId,
    // guid: item.querySelector('guid').textContent,
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
    pubDate: item.querySelector('pubDate').textContent,
  }));
};

const findFeedWithUrl = (feeds, url) => feeds.find((feed) => feed.url === url);

const tryDownloadAndExtractData = (url, watchedState, isNewFeed = true) => tryDownloadContent(url)
  .then((content) => {
    const xmlDocument = tryParseXML(content);
    const postIdOffset = watchedState.posts.length;

    if (isNewFeed) {
      const newFeedId = watchedState.feeds.length;
      const feed = getFeed(xmlDocument, newFeedId, url);
      const feedPosts = getFeedPosts(xmlDocument, newFeedId)
        .map((post, index) => ({ ...post, id: postIdOffset + index }));
      watchedState.feeds.push(feed);
      watchedState.posts.push(...feedPosts);
    } else {
      const feed = findFeedWithUrl(watchedState.feeds, url);
      const prevUpdateTime = feed.updateTime;
      feed.updateTime = Date.now();
      const feedPosts = getFeedPosts(xmlDocument, feed.id);
      const newFeedPosts = feedPosts
        .filter((post) => {
          const postTime = Date.parse(post.pubDate);
          return postTime > prevUpdateTime;
        })
        .map((post, index) => ({ ...post, id: postIdOffset + index }));
      // console.log((Date.now() - feed.updateTime) / 1000, newFeedPosts.length);
      watchedState.posts.push(...newFeedPosts);
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
  // Как только в коде появляется асинхронность, код должен менять свою структуру:
  // в случае промисов весь код превращается в непрерывную цепочку промисов:
  yupSchema.validate({ url }, { abortEarly: false })
    .then(() => { if (findFeedWithUrl(watchedState.feeds, url)) throw Error('alreadyExists'); })
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
  if (target.tagName !== 'A' && target.tagName !== 'BUTTON') return;

  const postId = Number(target.getAttribute('data-id'));
  const { clickedPostsIds } = watchedState.uiState;
  if (!clickedPostsIds.find((id) => id === postId)) clickedPostsIds.push(postId);
};

export const getModalShowCallback = (watchedState) => (e) => {
  // Button that triggered the modal
  const button = e.relatedTarget;

  const postId = Number(button.getAttribute('data-id'));
  const post = watchedState.posts.find((p) => p.id === postId);
  const { title, description, link } = post;
  watchedState.uiState.dataForModal = { title, description, link };
};
