/* eslint-disable no-param-reassign */

// import _isEqual from 'lodash/isEqual.js';

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

const handlePosts = (elements, posts, previousPosts, i18n) => {
  const startIndex = previousPosts.length;
  // console.log('handlePosts', posts.length, startIndex);
  const ul = elements.posts.querySelector('ul');
  posts
    .filter((post, index) => index >= startIndex)
    .forEach((post) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      li.innerHTML = `
        <a href="${post.link}" class="fw-bold" data-id="${post.id}" target="_blank" rel="noopener noreferrer">${post.title}</a>
        <button type="button" class="btn btn-outline-primary btn-sm" data-id="${post.id}" data-bs-toggle="modal" data-bs-target="#modal">${i18n.t('modal.buttons.view')}</button>
      `;
      ul.prepend(li);
    });
};

// const handleClickedPostsIds = (elements, value, previousValue) => {
//   const startIndex = previousValue.length;
//   const ul = elements.posts.querySelector('ul');
//   value
//     .filter((id, index) => index >= startIndex)
//     .forEach((id) => {
//       const a = ul.querySelector(`a[data-id="${id}"]`);
//       a.classList.remove('fw-bold');
//       a.classList.add('fw-normal', 'link-secondary');
//     });
// };
const handleClickedPostsIds = (elements, clickedPostsIds) => {
  const id = clickedPostsIds.at(-1);
  const ul = elements.posts.querySelector('ul');
  const a = ul.querySelector(`a[data-id="${id}"]`);
  a.classList.remove('fw-bold');
  a.classList.add('fw-normal', 'link-secondary');
};

const handleDataForModal = ({ modal }, data) => {
  const modalTitle = modal.querySelector('.modal-title');
  const modalBody = modal.querySelector('.modal-body');
  const modalFooter = modal.querySelector('.modal-footer');
  modalTitle.textContent = `${data.title}`;
  modalBody.textContent = `${data.description}`;
  modalFooter.querySelector('a').setAttribute('href', `${data.link}`);
};

export const getRenderView = (elements, i18n) => (path, value, previousValue) => {
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
      handlePosts(elements, value, previousValue, i18n);
      break;

    case 'uiState.clickedPostsIds':
      handleClickedPostsIds(elements, value);
      break;

    case 'uiState.dataForModal':
      handleDataForModal(elements, value);
      break;

    default:
      // console.log('Unhandled:', path, _isEqual(value, previousValue), value, previousValue); //
      break;
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
