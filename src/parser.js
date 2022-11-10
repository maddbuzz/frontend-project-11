const tryParseXML = (xmlString) => {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(xmlString, 'application/xml');
  const errorNode = xmlDocument.querySelector('parsererror');
  if (errorNode) {
    const e = new Error('xmlParsingError', { cause: errorNode });
    e.name = 'ParseError';
    throw e;
  }
  return xmlDocument;
};

const parseAndExtractData = (content) => {
  const xmlDocument = tryParseXML(content);

  const feedData = {
    title: xmlDocument.querySelector('channel title').textContent,
    description: xmlDocument.querySelector('channel description').textContent,
  };

  const items = xmlDocument.querySelectorAll('item');
  // All elements of an item are optional,
  // however at least one of title or description must be present
  const postsData = [...items].map((item) => ({
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
  }));

  return [feedData, postsData];
};

export default parseAndExtractData;
