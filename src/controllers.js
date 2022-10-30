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
    guid: item.querySelector('guid').textContent,
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
    pubDate: item.querySelector('pubDate').textContent,
  }));
};

const findFeedWithUrl = (feeds, url) => feeds.find((feed) => feed.url === url);

const tryDownloadThenProcess = (url, aggregator, isNewFeed = true) => tryDownloadContent(url)
  .then((content) => {
    const xmlDocument = tryParseXML(content);
    if (isNewFeed) {
      const feedId = aggregator.feeds.length;
      const feed = getFeed(xmlDocument, feedId, url);
      const feedPosts = getFeedPosts(xmlDocument, feedId);
      aggregator.feeds.push(feed);
      aggregator.posts.push(...feedPosts);
    } else {
      const feed = findFeedWithUrl(aggregator.feeds, url);
      const feedPosts = getFeedPosts(xmlDocument, feed.id);
      const newFeedPosts = feedPosts
        .filter((post) => {
          const postTime = Date.parse(post.pubDate);
          return postTime > feed.updateTime;
        });
      // console.log((Date.now() - feed.updateTime) / 1000, newFeedPosts.length);
      feed.updateTime = Date.now();
      aggregator.posts.push(...newFeedPosts);
    }
  });

const setUpdateTimer = (updateTimeMs, url, aggregator) => {
  setTimeout(() => {
    tryDownloadThenProcess(url, aggregator, false)
      .finally(() => setUpdateTimer(updateTimeMs, url, aggregator));
  }, updateTimeMs);
};

const getSubmitCallback = (watchedState, i18n) => (e) => {
  e.preventDefault();
  const url = new FormData(e.target).get('url').trim();
  const { aggregator } = watchedState;

  aggregator.processState = 'loadingFeed';
  aggregator.processFeedback = { neutral: i18n.t('feedback.neutral.pleaseWait') };
  // Как только в коде появляется асинхронность, код должен менять свою структуру:
  // в случае промисов весь код превращается в непрерывную цепочку промисов:
  yupSchema.validate({ url }, { abortEarly: false })
    .then(() => { if (findFeedWithUrl(aggregator.feeds, url)) throw Error('alreadyExists'); })
    .then(() => tryDownloadThenProcess(url, aggregator, true))
    .then(() => {
      aggregator.processFeedback = { success: i18n.t('feedback.success.loadSuccess') };
      setUpdateTimer(postsUpdateTimeMs, url, aggregator);
    })
    .catch((err) => {
      const key = `feedback.failure.${err.message}`;
      if (i18n.exists(key)) {
        aggregator.processFeedback = { failure: i18n.t(key) };
        return;
      }
      console.error(err);
      aggregator.processFeedback = { failure: err.message };
    })
    .finally(() => { aggregator.processState = 'waitingForInput'; });
};

export default getSubmitCallback;
