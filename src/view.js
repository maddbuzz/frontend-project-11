const switchControlsDisabled = (elements, isDisabled) => {
  const { inputEl, submitEl } = elements;
  inputEl.disabled = isDisabled;
  submitEl.disabled = isDisabled;
};

const handleProcessFeedback = (elements, value) => {
  const { success, failure } = value;
  const {
    feedsEl, formEl, inputEl, feedbackEl,
  } = elements;
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
  switch (value) {
    case 'waitingForInput':
      switchControlsDisabled(elements, false);
      elements.inputEl.focus();
      break;

    case 'validatingInput':
      switchControlsDisabled(elements, true);
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

export default renderView;
