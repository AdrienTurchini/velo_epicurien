/* eslint-disable no-console, no-process-exit */
const trip = require('./tripadvisor')

trip_hp = 'https://www.tripadvisor.fr/Restaurants-g155033-Quebec_City_Quebec.html';

var fs = require('fs');

async function sandbox() {

  try {
    console.log(`🕵️‍♀️  browsing TripAdvisor source, please wait !`);

    // get number of pages for quebec's tripadvisor restaurants 
    const nbpage = await trip.scrapeFirstSearchPage(trip_hp);

    // get a list of the url of restaurants
    var linksRestau = [];
    for(var i = 0; i < 1; i++){ //nbpage
      const links = await trip.scrapeASearchPage('https://www.tripadvisor.fr/RestaurantSearch?Action=PAGE&ajax=1&availSearchEnabled=false&sortOrder=popularity&geo=155033&itags=10591&o=a' + String(i*30));
      links.forEach(element => linksRestau.push(element));
    }

    // get a list of informations for all  restaurants
    var listOfRestauDetails = [];  
    for(var i = 0; i < linksRestau.length ; i++){ // linksRestau.length
      var restaurant = await trip.scrapeRestaurant('https://www.tripadvisor.fr'+linksRestau[i]);
      restaurant = {name: restaurant.name, classement: restaurant.classement, type: restaurant.types, price: restaurant.price, address: restaurant.address, link: 'https://www.tripadvisor.fr'+linksRestau[i], geometry: restaurant.geo};
      listOfRestauDetails.push(restaurant);
      console.log(i);
    }

    // write data in a json file
    var fs = require('fs');
    fs.writeFileSync('./quebec_restaurants.json', JSON.stringify(listOfRestauDetails, null, 4), (err) => {
      if (err) {
        console.error(err);
        return;
      };
      console.log("File has been created");
    });

    console.log(nbpage, linksRestau.length, listOfRestauDetails.length);
    

    process.exit(0);
  } catch (e) {
    console.error(e); 
    process.exit(1);
  }
}
const [, , searchLink] = process.argv;
sandbox(searchLink);
