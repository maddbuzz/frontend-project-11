const switchControlsDisabled = (elements, isDisabled) => {
  const { inputEl, submitEl } = elements;
  inputEl.disabled = isDisabled;
  submitEl.disabled = isDisabled;
};

const handleProcessFeedback = (elements, value) => {
  const { success, failure } = value;
  const { formEl, inputEl, feedbackEl } = elements;
  if (failure) {
    inputEl.classList.add('is-invalid');
    feedbackEl.classList.add('text-danger');
    feedbackEl.textContent = failure;
  } else {
    inputEl.classList.remove('is-invalid');
    feedbackEl.classList.remove('text-danger');
    feedbackEl.textContent = success;
    formEl.reset();
    // document.querySelector('.form-floating')
    // formEl.elements.url.click();
    // formEl.elements.url.focus();
    // formEl.querySelector('input').focus();
    // formEl.focus();
  }
};

const handleProcessState = (elements, value) => {
  switch (value) {
    case 'waitingForUrl':
      switchControlsDisabled(elements, false);
      break;
    case 'validatingUrl':
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
  // console.log(path, value);
  switch (path) {
    case 'form.processState':
      handleProcessState(elements, value);
      break;

    case 'form.processFeedback':
      handleProcessFeedback(elements, value);
      break;

    default:
      break;
  }
};

export default renderView;
