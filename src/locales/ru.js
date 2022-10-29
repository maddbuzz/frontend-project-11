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
        invalidURL: 'Ссылка должна быть действительным URL',
        requiredField: 'Вы должны заполнить URL RSS-канала',
        alreadyExists: 'RSS-канал уже был добавлен',
        contentLoadingError: 'Не удалось загрузить контент',
        xmlParsingError: 'Не удалось разобрать XML',
      },
      success: {
        loadSuccess: 'RSS-канал успешно добавлен',
      },
      neutral: {
        pleaseWait: 'Пожалуйста, подождите...',
      },
    },
    feeds: 'Фиды',
    posts: 'Посты',
  },
};
