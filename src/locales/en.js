export default {
  translation: {
    translationsLoaded: 'All translations were loaded',
    mainHeader: 'RSS aggregator',
    form: {
      labelForUrlInput: 'RSS link',
      button: 'Add',
      example: 'Example: https://ru.hexlet.io/lessons.rss',
    },
    feedback: {
      failure: {
        invalidURL: 'Link must be a valid URL',
        requiredField: 'You must fill in the RSS Feed URL',
        alreadyExists: 'RSS feed has already been added',
        contentLoadingError: 'Failed to load content',
        xmlParsingError: 'Failed to parse XML',
      },
      success: {
        loadSuccess: 'RSS feed added successfully',
      },
      neutral: {
        pleaseWait: 'Please wait...',
      },
    },
    feeds: 'Feeds',
    posts: 'Posts',
  },
};
