/* eslint-disable no-param-reassign */

const switchElementsDisabled = (elements, needDisable) => elements
  .forEach((el) => el.toggleAttribute('disabled', needDisable));

const renderInputValidity = ({ input }, isValid = true) => {
  input.classList.toggle('is-invalid', !isValid);
};

const renderFeedback = ({ feedback }, text, isSucceeded = false, isFailed = false) => {
  feedback.classList.toggle('text-danger', isFailed);
  feedback.classList.toggle('text-success', isSucceeded);
  feedback.textContent = text;
};

const renderForm = (elements, { state, error }, i18n) => {
  const elementsToSwitch = [elements.input, elements.button];
  switch (state) {
    case 'filling':
      switchElementsDisabled(elementsToSwitch, false);
      elements.input.focus();
      break;

    case 'validating':
      switchElementsDisabled(elementsToSwitch, true);
      break;

    case 'validatingFailed':
      renderInputValidity(elements, false);
      renderFeedback(elements, i18n.t(error), false, true);
      break;

    case 'validatingSucceeded':
      renderInputValidity(elements, true);
      break;

    default:
      throw Error(`Unknown form state <${state}>`);
  }
};

const renderFeedLoading = (elements, { state, error }, i18n) => {
  switch (state) {
    case 'idling':
      break;

    case 'loading':
      renderFeedback(elements, i18n.t('feedback.pleaseWait'), false, false);
      break;

    case 'loadingFailed':
      renderFeedback(elements, i18n.t(error), false, true);
      break;

    case 'loadingSucceeded':
      renderFeedback(elements, i18n.t('feedback.loadSuccess'), true, false);
      elements.form.reset();
      break;

    default:
      throw Error(`Unknown feed loading state <${state}>`);
  }
};

const renderFeeds = (elements, feeds) => {
  elements.feeds.removeAttribute('hidden');
  const feed = feeds.at(-1);
  const ul = elements.feeds.querySelector('ul');
  const li = document.createElement('li');
  li.className = 'list-group-item border-0 border-end-0';
  const h3 = document.createElement('h3');
  h3.className = 'h6 m-0';
  h3.textContent = feed.title;
  const p = document.createElement('p');
  p.className = 'm-0 small text-black-50';
  p.textContent = feed.description;
  li.append(h3, p);
  ul.prepend(li);
};

const renderPosts = (elements, posts, previousPosts, i18n) => {
  elements.posts.removeAttribute('hidden');
  const startIndex = previousPosts.length;
  const ul = elements.posts.querySelector('ul');
  posts
    .filter((post, index) => index >= startIndex)
    .forEach((post) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-start border-0 border-end-0';
      const a = document.createElement('a');
      a.className = 'fw-bold';
      a.textContent = post.title;
      [['target', '_blank'], ['rel', 'noopener noreferrer'], ['href', post.link], ['data-id', String(post.id)]]
        .forEach(([name, value]) => a.setAttribute(name, value));
      const button = document.createElement('button');
      button.className = 'btn btn-outline-primary btn-sm';
      button.textContent = i18n.t('modal.buttons.view');
      [['type', 'button'], ['data-bs-toggle', 'modal'], ['data-bs-target', '#modal'], ['data-id', String(post.id)]]
        .forEach(([name, value]) => button.setAttribute(name, value));
      li.append(a, button);
      ul.prepend(li);
    });
};

const renderViewedPost = (elements, viewedPostsIds) => {
  const id = viewedPostsIds.at(-1);
  const ul = elements.posts.querySelector('ul');
  const a = ul.querySelector(`a[data-id="${id}"]`);
  a.classList.remove('fw-bold');
  a.classList.add('fw-normal', 'link-secondary');
};

const renderModalContent = ({ modal }, content) => {
  const modalTitle = modal.querySelector('.modal-title');
  const modalBody = modal.querySelector('.modal-body');
  const modalFooter = modal.querySelector('.modal-footer');
  modalTitle.textContent = content.title;
  modalBody.textContent = content.description;
  modalFooter.querySelector('a').setAttribute('href', content.link);
};

export const getRenderView = (elements, i18n) => (path, value, previousValue) => {
  switch (path) {
    case 'form':
      renderForm(elements, value, i18n);
      break;

    case 'feedLoading':
      renderFeedLoading(elements, value, i18n);
      break;

    case 'feeds':
      renderFeeds(elements, value);
      break;

    case 'posts':
      renderPosts(elements, value, previousValue, i18n);
      break;

    case 'viewedPostsIds':
      renderViewedPost(elements, value);
      break;

    case 'modalContent':
      renderModalContent(elements, value);
      break;

    default:
      // console.log('Unhandled:', path, previousValue, value); break;
      throw Error(`Unhandled watchedState path <${path}>`);
  }
};

export const setStaticTexts = (elements, i18n) => {
  elements.main.querySelector('h1').textContent = i18n.t('mainHeader');
  elements.form.querySelector('label[for="url-input"]').textContent = i18n.t('form.labelForUrlInput');
  elements.button.textContent = i18n.t('form.button');
  elements.main.querySelector('#url-example').textContent = i18n.t('form.example');
  elements.feeds.querySelector('h2').textContent = i18n.t('feeds');
  elements.posts.querySelector('h2').textContent = i18n.t('posts');
  elements.modal.querySelector('.modal-footer a').textContent = i18n.t('modal.buttons.readMore');
  elements.modal.querySelector('.modal-footer button').textContent = i18n.t('modal.buttons.close');
};
