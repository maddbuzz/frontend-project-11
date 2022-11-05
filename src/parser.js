const tryParseXML = (xmlString) => {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(xmlString, 'application/xml');
  const errorNode = xmlDocument.querySelector('parsererror');
  if (errorNode) {
    console.error(errorNode);
    throw Error('xmlParsingError');
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
  const postsData = [...items].map((item) => ({
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
    pubDate: item.querySelector('pubDate').textContent,
  }));
  return [feedData, postsData];
};

export default parseAndExtractData;
