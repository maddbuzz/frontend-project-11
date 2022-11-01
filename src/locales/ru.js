export default {
  translation: {
    translationsLoaded: 'Все переводы были загружены',
    mainHeader: 'RSS-агрегатор',
    form: {
      labelForUrlInput: 'RSS-ссылка',
      button: 'Добавить',
      example: 'Пример: https://ru.hexlet.io/lessons.rss',
    },
    feedback: {
      failure: {
        invalidURL: 'Ссылка должна быть валидным URL',
        requiredField: 'Не должно быть пустым',
        alreadyExists: 'RSS уже существует',
        contentLoadingError: 'Ошибка сети',
        xmlParsingError: 'Ресурс не содержит валидный RSS',
      },
      success: {
        loadSuccess: 'RSS успешно загружен',
      },
      neutral: {
        pleaseWait: 'Пожалуйста, подождите...',
      },
    },
    feeds: 'Фиды',
    posts: 'Посты',
    modal: {
      buttons: {
        readMore: 'Читать полностью', view: 'Просмотр', close: 'Закрыть',
      },
    },
  },
};
