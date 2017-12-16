const got = require('got');
const cheerio = require('cheerio');
const ProgressBar = require('progress');
const Bluebird = require('bluebird');
const Url = require('url');
const fs = require('fs');

const isScopedPackage = name => name.indexOf('@') === 0;

const getGithubDescription = async url => {
  const parsedUrl = Url.parse(url);
  parsedUrl.protocol = 'https:';
  parsedUrl.auth = undefined;
  const githubUrl = Url.format(parsedUrl);
  const { body: html } = await got(githubUrl);
  const $ = cheerio.load(html)
  const $about = $('[itemprop="about"]');
  return $about.text().replace(/((^\s*)|(\s*$))/g, '');
}

const isGihubRepo = (url) => /^.+:\/\/(git@)?github\.com\//.exec(url);

const getPackageDescription = async packageName => {
  const response = await got(`https://registry.npmjs.org/${packageName}`);
  const packageJson = JSON.parse(response.body);
  const repo = packageJson.repository.url;
  let desc = packageJson.description;
  if (isGihubRepo(repo)) {
    const ghDescr = await getGithubDescription(repo);
    if (ghDescr.length > desc.length) {
      desc = ghDescr;
    }
  } else {
    console.log(`${packageName} invalid repo url ${repo}`);
  }
  return desc;
}

const scrapPage = async (offset) => {
  const { body: html } = await got(`https://www.npmjs.com/browse/depended?offset=${offset}`);
  const $ = cheerio.load(html)
  const $packages = $('.package-widget .package-details')

  const values = $packages
    //cheerio's map, not to confuse it with JS Array.map
    .toArray()
    .map((elem, index) => ({
      name: $(elem).find('.name').text(),
      position: (index) + offset
    }))
    .filter(({ name }) => !isScopedPackage(name))
  const bar = new ProgressBar(':bar', { total: values.length });
  const pageResults = await Bluebird.map(values, async (package) => {
    try {
      package.description = await getPackageDescription(package.name);
    } catch (e) {
      console.error(`Error while processing ${package.name}`, e.stack)
    }
    bar.tick();
    return package;
  }, { concurrency: 3 })
  .filter(x => x.description);

  return { offset: values.length, pageResults }
}

const LIMIT = 100;

const scrap = async () => {
  const results = [];
  let currentOffset = 0;
  while (results.length < LIMIT) {
    console.log(`scrap page with offset ${currentOffset}`);
    const { offset, pageResults } = await scrapPage(currentOffset);
    results.push.apply(results, pageResults);
    currentOffset += offset;
  };
  console.log(`Successfully scrapped ${results.length} items`);
  fs.writeFileSync(__dirname + '/top.json', JSON.stringify(results, null, 2));
}

scrap();
