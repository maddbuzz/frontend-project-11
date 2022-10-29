import i18next from 'i18next';
import resources from './locales/index.js';
import initView from './view.js';

const defaultLanguage = 'ru';

const app = () => {
  // Модель ничего не знает о контроллерах и о представлении. В ней не хранятся DOM-элементы.
  const state = {
    aggregator: {
      feeds: [],
      posts: [],
      processState: 'waitingForInput',
      processFeedback: {
        success: undefined, failure: undefined, neutral: undefined,
      },
    },
  };

  // каждый запуск приложения создаёт свой собственный объект i18n
  // и работает с ним, не меняя глобальный объект
  const i18n = i18next.createInstance();

  // await i18n.init({
  //   lng: defaultLanguage,
  //   debug: false,
  //   resources,
  // });
  // initView(state, i18n)

  // ...в случае промисов весь код превращается в непрерывную цепочку промисов...
  i18n.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  }).then((t) => {
    console.log(t('translationsLoaded'));
    initView(state, i18n);
  });
};

export default app;
