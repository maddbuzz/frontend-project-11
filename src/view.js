// View (Представление) пользуется Model (Состоянием) для отрисовки
// (добавление, изменение или удаление элементов DOM),
// а также добавляет новые Controllers (Обработчики) в DOM.

import * as yup from 'yup';
import onChange from 'on-change';
import _keyBy from 'lodash/keyBy.js';
import _isEmpty from 'lodash/isEmpty.js';

const schema = yup.object().shape({
  url: yup.string().required().url(),
});

// Как только в коде появляется асинхронность, код должен менять свою структуру:
// в случае промисов весь код превращается в непрерывную цепочку промисов.
const validate = (fields) => {
  const promise = schema.validate(fields, { abortEarly: false })
    .then(() => ({}))
    .catch((e) => _keyBy(e.inner, 'path'));
  return promise;
};

const switchElementsDisabled = (elements, needDisable) => {
  Object.values(elements).forEach((el) => {
    if (needDisable) el.setAttribute('disabled', '');
    else el.removeAttribute('disabled');
  });
};

const handleProcessFeedback = (elements, value) => {
  const {
    feedsEl, formEl, inputEl, feedbackEl,
  } = elements;
  const { success, failure } = value;

  if (failure) {
    inputEl.classList.add('is-invalid');
    feedbackEl.classList.remove('text-success');
    feedbackEl.classList.add('text-danger');
    feedbackEl.textContent = failure;
  }
  if (success) {
    inputEl.classList.remove('is-invalid');
    feedbackEl.classList.remove('text-danger');
    feedbackEl.classList.add('text-success');
    feedbackEl.textContent = success;
    formEl.reset();
    feedsEl.removeAttribute('hidden');
  }
};

const handleProcessState = (elements, value) => {
  const { inputEl, submitEl } = elements;

  switch (value) {
    case 'waitingForInput':
      switchElementsDisabled({ inputEl, submitEl }, false);
      inputEl.focus();
      break;

    case 'validatingInput':
      switchElementsDisabled({ inputEl, submitEl }, true);
      break;

    case 'loadingFeed':
      break;

    default:
      throw new Error(`Unknown process state ${value}`);
  }
};

// Представление не меняет модель.
// По сути, в представлении происходит отображение модели на страницу
// Для оптимизации рендер происходит точечно в зависимости от того, какая часть модели изменилась
const renderView = (elements) => (path, value) => {
  switch (path) {
    case 'aggregator.processState':
      handleProcessState(elements, value);
      break;

    case 'aggregator.processFeedback':
      handleProcessFeedback(elements, value);
      break;

    case 'aggregator.feedsURLs': {
      const li = document.createElement('li');
      li.textContent = value.at(-1);
      elements.feedsListEl.append(li);
      break;
    }

    default:
      // console.log(path, value);
      break;
  }
};

const initView = (elements, state) => {
  // Контроллеры не должны менять DOM напрямую, минуя представление.
  // Контроллеры меняют модель, тем самым вызывая рендеринг:
  const watchState = onChange(state, renderView(elements));

  elements.formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url').trim();
    watchState.aggregator.processState = 'validatingInput';
    // ...в случае промисов весь код превращается в непрерывную цепочку промисов:
    validate({ url })
      .then((validationErrors) => {
        if (!_isEmpty(validationErrors)) {
          watchState.aggregator.processFeedback = { failure: 'Ссылка должна быть валидным URL' };
          return;
        }
        if (watchState.aggregator.feedsURLs.includes(url)) {
          watchState.aggregator.processFeedback = { failure: 'RSS уже существует' };
          return;
        }
        watchState.aggregator.processState = 'loadingFeed';
        watchState.aggregator.feedsURLs.push(url);
        watchState.aggregator.processFeedback = { success: 'RSS успешно загружен' };
      })
      .then(() => { watchState.aggregator.processState = 'waitingForInput'; })
      .catch((err) => { throw err; });
  });
};

export default initView;
