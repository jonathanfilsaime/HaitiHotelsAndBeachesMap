//data
var pinsData = [
    {name: "Auberge du Rayon Vert",region: "Port-Salut",  lat: 18.138666, lng: -73.933084, id: 0, visible: ko.observable(true)},
    {name: "Labadie",region: "Cap-Haïtien", lat: 19.773106, lng: -72.243910, id: 1, visible: ko.observable(true)},
    {name: "Royal Decameron",region: "Saint-Marc", lat: 18.956698, lng: -72.726644, id: 2, visible: ko.observable(true)},
    {name: "Cyvadier",region: "Jacmel", lat: 18.225262, lng: -72.467165, id: 3, visible: ko.observable(true)},
    {name: "Port Morgan",region: "Île-à-Vache", lat: 18.106392, lng: -73.687218, id: 4, visible: ko.observable(true)}
];

var dropPinArray = [];
var wikiCard = null;
var foursquareCard = null;
var count = 0;


// Init the map
function initMap() {

    wikiCard = new google.maps.InfoWindow();
    foursquareCard = new google.maps.InfoWindow();

    //map centered on Haiti
    var haiti = {lat:19.591259, lng: -72.243452};

    //the map
    map = new google.maps.Map(document.getElementById('map'), {zoom: 8, center: haiti});


    /*jshint loopfunc: true */
    pinsData.forEach(function(element) {

        let dropPin = new google.maps.Marker({
            position: {lat: element.lat, lng: element.lng},
            animation: google.maps.Animation.DROP,
            map: map,
            id: element.id
        });

        dropPin.addListener('click', function() {api_call(dropPin, element.region, element.name, element.lat, element.lng);});
        dropPinArray.push(dropPin);

    });
}


var api_call = function(dropPin, region, name, lat, lng)
{
    //call the appropriate function based on the
    //radio button selected
    if(count % 2 == 0)
    {
        populateFoursquareCard(dropPin, name, lat, lng);
    }
    else
    {
        populateWikiCard(dropPin, region, name);
    }
}

//Wikipedia API to populate the info card
var populateWikiCard = function(dropPin, region, name){
    if (wikiCard.marker != dropPin) {

        //building the API call
        var wikipediaURL = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + region + '&format=json&callback=wikiCallback';

        //parsing the result from the API call
        var wikiInfo = '<h4 style="font-family: monospace;">' + name + '</h4>' + '' +
            '<p style="font-family: monospace;"> Wikipedia Information: </p>';

        wikiInfo += '<ul style="list-style-type: none; font-family: monospace;">';
        jQuery.ajax({url: wikipediaURL, dataType: 'jsonp',}).done(function (response)
        {
            if(response)
            {
                for(var i = 0; i < 1; i++)
                {
                    wikiInfo += '<li>' + response[2][i] + '<li><br>';
                }
                var link = response[3][0];
                wikiInfo += '<li><a style="color: dodgerblue" href=' + link + '>' + response[3][0] + '</a><li>';
            }
            wikiInfo += '</ul>'

            wikiCard.marker = dropPin;
            wikiCard.setContent(wikiInfo);
            wikiCard.open(map, dropPin);
            wikiCard.addListener('closeclick', function() {foursquareCard.setMarker = null;});

        }).fail(function() {alert('no wikipedia article found for this region');});
    }
}

//Foursqaure API to populate the info card
var populateFoursquareCard = function(dropPin, name, lat, lng) {
    if (foursquareCard.marker != dropPin) {

        // Foursquare API call
        var url = 'https://api.foursquare.com/v2/venues/search?client_id=' + getFourSquareClientID() +
            '&client_secret=' + getFourSquareClientSecret() + '&v=20130815&ll=' + lat +
            ',' + lng + '&query=hotel';

        // Display returned data from Foursquare API call
        $.get(url, function(data)
        {
            var hotels = data.response.venues;
            var ListOfHotelsNearBy = '<h4 style="font-family: monospace;">' + name + '</h4>' + '' +
                '<p style="font-family: monospace;"> Nearby Hotels: </p>';

            ListOfHotelsNearBy += '<ul style="list-style: none;font-family: monospace;">';
            hotels.forEach( function(element){ListOfHotelsNearBy += '<li>' + element.name +'</li>';});
            ListOfHotelsNearBy += '</ul>';

            foursquareCard.marker = dropPin;
            foursquareCard.setContent(ListOfHotelsNearBy);
            foursquareCard.open(map, dropPin);

            //ability to the close the foursquare card
            foursquareCard.addListener('closeclick', function() {foursquareCard.setMarker = null;});

        }).fail(function() {alert('no hotels found nearby');});
    }
};

function getFourSquareClientID(){
    return "LDHJ0Y12ZGGQWNWG3XPH3ZC31BA53WLAYG1W1VPTWV4K5WAK";
}

function getFourSquareClientSecret(){
    return "4BDW2JERZXNIVOZMPOFHFXYIKHOK1313HGZL2VFTAVHFJZB2";
}

function AppViewModel() {
    var self = this;

    self.pinsData = ko.observableArray(pinsData);
    this.inputFilter = ko.observable('');
    this.handleFilter = ko.pureComputed(this.inputFilter);
    this.API = ko.observable("foursquare")

    this.API.subscribe(function ()
    {
        count++
    })

    //filter the list based on the letter entered in the search box
    this.handleFilter.subscribe(function (inputFilter)
    {
        for(var i = 0; i < self.pinsData().length; i++ ) {

            if (!pinsData[i].name.toLowerCase().indexOf(inputFilter.toLowerCase()))
            {
                pinsData[i].visible(true)
                dropPinArray[pinsData[i].id].setMap(map);
            }
            else
            {
                pinsData[i].visible(false)
                dropPinArray[pinsData[i].id].setMap(null);
            }
        }
    });

    //open the wikipedia info card when an item from the list is clicked
    this.onDropPinClick = function(dropPin)
    {
        google.maps.event.trigger(dropPinArray[dropPin.id], 'click');
    };
}

//Launch app
ko.applyBindings(new AppViewModel());