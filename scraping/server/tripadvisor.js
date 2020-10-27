const axios = require('axios');
const cheerio = require('cheerio');
const { types } = require('util');


// return number of pages containing restaurants 
const firstPage = data => {
  const $ = cheerio.load(data);

  // num of restaurants
  var num_restau = $('#EATERY_LIST_CONTENTS > div.deckTools.btm > div > div > a:nth-child(8)').text();
  return num_restau;
}

// get links from search page
const searchPage = data => {
  const $ = cheerio.load(data);
  var links = [];
  // get all the restaurant links for one page
  $("#component_2 > div > div._1llCuDZj > span > div._1kNOY9zw > div._2Q7zqOgW > div._2kbTRHSI > div > span > a").each((i, elem) => {
    links.push($(elem).prop("href"));
  });
  return links;
}

/**
 * Parse webpage restaurant
 * @param  {String} data - html response
 * @return {Object} restaurant
 */
// return restaurants details
const restauDetails = data => {
  const $ = cheerio.load(data);

  // get name
  var name = $('._3a1XQ88S').text();

  // get classement
  var classement = $('.r2Cf69qf').text();
  classement = classement.substr(0,3);
 
  // get address
  var address = $('._2saB_OSe').first().text();

  // get coordinates
 var text =  $('#taplc_footer_js_globals_0 > script:nth-child(6)')[0].children[0].data;
 index_coords_false = text.indexOf("\"coords\":\"");
 index_coords = text.indexOf("\"coords\":\"",index_coords_false + 29);
 geo_normal = text.substr(index_coords+10, 19);
 geo_normal = geo_normal.replace(/[^0-9.,-]/g, "")
 long_lat = geo_normal.split(",");
 geo_inverted = [parseFloat(long_lat[1]),parseFloat(long_lat[0])];
 geo = {"type" : "Point", "coordinates":geo_inverted}

 // get type
 var infos = [];
 $('span._13OzAOXO._34GKdBMV > a').each((i, elem) => {
   infos.push($(elem).text())
 });

 var price = infos[0];
 is_a_price = /€/.test(price)
 var types = []

 if(is_a_price){
  for(i = 1;i < infos.length; i++){
    types.push(infos[i]);
  }
 }
 else {
   price = "NA";
   for(i = 0;i < infos.length; i++){
    types.push(infos[i]);
  }
 }
 
 return { name, classement, types, price, address, geo};
};

// return links of restaurants for one page
module.exports.scrapeASearchPage = async url => {
  const response = await axios(url);
  const { data, status } = response;
  if (status >= 200 && status < 300) {
    return searchPage(data);
  }
  console.error(status);
  return null;
};

// return number of pages to scrap
module.exports.scrapeFirstSearchPage = async url => {
  const response = await axios(url);
  const { data, status } = response;
  if (status >= 200 && status < 300) {
    return firstPage(data);
  }
  console.error(status);
  return null;
};

/**
 * Scrape a given restaurant url
 * @param  {String}  url
 * @return {Object} restaurant
 */
// return restaurants details
module.exports.scrapeRestaurant = async url => {
  const response = await axios(url);
  const { data, status } = response;
  if (status >= 200 && status < 300) {
    return restauDetails(data);
  }
  console.error(status);
  return null;
};

/**
 * Get all restaurants
 * @return {Array} restaurants
 */
module.exports.get = () => {
  return [];
};
