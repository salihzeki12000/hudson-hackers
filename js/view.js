//(document).ready(function () {
    $('#accordion').accordion({
        collapsible: true,
        active: false,
        containment: 'column mapparent',
        height: 'fill',
        header: 'h4'
    }).sortable({items: '.s_panel'});

    var _markerID = 0;
    var history = {}; //venue objects from foursquare search results
    var currentItinerary = {}; //venue objects that have been selected
    var pinkMarkers = {}; //pink markers, associated with selected venue objects
    var blueMarkers = {}; //blue markers, associated with marker ids.
    var highlightMarker;

    /**
     * Itinerary view prototype
     */
    function View(apiKey, secretKey, apiUrl, authUrl, cloudmadeKey) {
        this.foursquare = new Foursquare(apiKey, secretKey, apiUrl, authUrl);
        this.map = new L.map('map', {
            layers: MQ.mapLayer(),
            center: [40.78, -73.97], // default to New York at start
            zoom: 13
        });
        var map = this.map;
        var baseLayer = L.tileLayer('http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png', {
            key: cloudmadeKey,
            styleId: 96931,
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
            minZoom: 5,
            maxZoom: 15
        }).addTo(map);

        this.zoomRadius = {12: 9000,
                           13: 6000,
                           14: 2000,
                           15: 1000,
                           16: 500};

        // To close popup when remove, ya anthr var wat u gun do abt it, huh??
        this.currentPopup;
        map.on("popupopen", bind(function(evt) { this.currentPopup = evt.popup; }, this));

        this.markerLayer = new L.layerGroup();
        this.saveMarkerLayer = new L.layerGroup();
        this.routeLayer = new L.layerGroup();
        this.markerLayer.addTo(map);
        this.saveMarkerLayer.addTo(map);
        this.routeLayer.addTo(map);

        this.searchForm();
        this.saveHook();
        this.routeHook();
        this.hideHook();
        this.expandHook();
        this.clearMarkersHook();
        this.preloadForm();
        this.splashForm();
        this.setSearchResultPanel();
    }

    /**
     * Connects the splash page to the view page for search
     */
    View.prototype.splashForm = function() {
        var text = window.location.search.substr(1).split("&");        
        if (text[0].length > 0) {
            var venue_string = text[0];
            var location_string = text[1];

            // get venue
            var venue = venue_string.split("=")[1];

            // get location
            var location;
            if (!!(location = location_string.split("=")[1]) ) {
                ;
            } else { 
                location = 'New York'; // default to New York if no location given
            }

            document.getElementById("venue-text").value = decodeURIComponent(venue).split("+").join(" ");
            document.getElementById("location-text").value = decodeURIComponent(location).split("+").join(" ");

            // get the geocode for the location and update the map
            var that = this;
            this.foursquare.geocode(location, function(reply) {
                var locCenter = reply[0]['feature']['geometry']['center'];
                that.map.setView(locCenter, 13);
                that.drawMarkers(venue);
            });
        }
    }

    /**
     * Connects the manage page to the view page for saved itineraries
     */
    View.prototype.preloadForm = function() { 
        var link = document.URL;

        var itineraries = $.jStorage.get("all", []);
        $(".badge").replaceWith('<span class="badge">' + itineraries.length + '</span>');

        if (link.match('#')) {
            var result = link.split('#');
            var itineraryName = result[1]; 
            var itinerary; 

            for (var i = 0; i < itineraries.length; i++) {
                if (itineraries[i].name === itineraryName) {
                    itinerary = itineraries[i]; 
                    break;
                }
            }

            var centerVenue = itinerary.venues[0];
            $('#itinerary-name').val(itinerary.name);

            // This doesn't get called in order view.html before things are preloaded
            $('#accordion').accordion({
              collapsible: true,
              active: false,
              containment: 'column mapparent',
              height: 'fill',
              header: 'h4'
            }).sortable({items: '.s_panel'});

            for (var i = 0; i < itinerary.venues.length; i++) {
                var venue = itinerary.venues[i];
                currentItinerary[venue.id] = venue;
                history[venue.id] = venue;
                this.addVenueToItinerary(venue.id);
            }
            history = {};

            if (!centerVenue) {
                this.map.setView([40.78, -73.97]);
            } else {
                this.map.setView([centerVenue.location.lat, centerVenue.location.lng], 13);
            }
        }

        toggleEmptyItineraryMsg();
    }

    /**
     * Adds markers upon search. Defaults to New York if no location is given
     */
    View.prototype.searchForm = function() {
        // 'that' hack since bind doesn't work with this, so wat
        var that = this;
        
        $('#currentloc').on('click', function() {
            document.getElementById("location-text").value = 'Current';
            history = {};
            $("#search-results li").remove();
            var venue = $('#venue-text').val(),
            location = $('#location-text').val();

            // TODO: validate venues
            // get location; if null, use a default for now
            if (!location || location == "Current") { 
                location = 'New York';
                that.drawMarkers(venue);
            } else {
                that.foursquare.geocode(location, function(reply) {
                    var locCenter = reply[0]['feature']['geometry']['center'];
                    that.map.setView(locCenter, 13);
                    that.drawMarkers(venue);
                });
            }
            return false;
        }); 

        $('#search-form').submit(function () {
            history = {};
            $("#search-results li").remove();
            var venue = $('#venue-text').val(),
            location = $('#location-text').val();

            // TODO: validate venues
            // get location; if null, use a default for now
            if (!location || location == "Current") { 
                location = 'New York';
                that.drawMarkers(venue);
            } else {
                that.foursquare.geocode(location, function(reply) {
                    var locCenter = reply[0]['feature']['geometry']['center'];
                    that.map.setView(locCenter, 13);
                    that.drawMarkers(venue);
                });
            }
            return false;
        });
    }

    /**
     * Draws markers given a list of venues
     */
    View.prototype.drawMarkers = function(venue) {
        this.markerLayer.clearLayers();
        var center = this.map.getCenter();
        blueMarkers = {}; //resetting the blueMarkers dictionary for new search
        if (this.zoomRadius[this.map.getZoom()])
            var radius = this.zoomRadius[this.map.getZoom()];
        else
            var radius = 8000;
        this.foursquare.searchVenues(center.lat, center.lng, venue, radius, bind(this.onVenues, this));
    }

    /**
     * Iterates through venue results to add venue marker
     */
    View.prototype.onVenues = function(venues) {
        $(".break").prepend($('<li/><br/></li>'));

        for (var i = 0; i < venues.length; i++) {
            this.foursquare.getVenueInformation(venues[i].venue.id, bind(this.addVenueMarker, this));        
        }
    }

    /**
     * Adds venue results to sliding side panel
     */
    View.prototype.addSearchResult = function(venue, venueID) {
        $("#search-results")
        .append($('<li/>', {text: venue.name})
            .on('mouseenter', { id: venueID }, bind(this.highlightPossibleVenueEvent, this))
            .on('mouseleave', { id: venueID }, bind(this.unHighlightPossibleVenueEvent, this))
            .on('click', { id: venueID }, bind(this.addVenueToItineraryEvent, this))
        );
    }

    /**
     * Adds venue markers to the map
     */
    View.prototype.addVenueMarker = function(venue) {
        var latLng = new L.LatLng(venue.location.lat, venue.location.lng);
        var venue_name = venue.name;

        if (!!venue.description) {
            var venue_description = '<br/>' + venue.description;
        } else {
            var venue_description = "";
        }

        var markerText = $('<div/>', { id: ++_markerID });
        $('<h4/>', { text: venue.name }).appendTo(markerText);
        this.getSummaryDiv(venue).appendTo(markerText);

        $('<div/>')
            .append($('<button/>', { text: 'Add to Itinerary', class: 'btn btn-default btn-sm popuptext' })
                .on('click', { id: _markerID }, bind(this.addVenueToItineraryEvent, this)))
            .appendTo(markerText);

        history[_markerID] = venue;

        this.addSearchResult(venue, _markerID);

        var marker = new L.Marker(latLng, {title:venue_name, riseOnHover:true})
            .bindPopup(markerText[0])
            .on('click', function(e) { this.openPopup(); })
            .on('unclick', function(e) { this.closePopup(); });
        this.markerLayer.addLayer(marker);

        blueMarkers[_markerID] = marker;
    }

    /**
     * Wrapper function for highlighting venue in search results
     */
    View.prototype.highlightPossibleVenueEvent = function(event) {
        this.highlightPossibleVenue(event.data.id);
    }

    /**
     * Wrapper function for highlighting venue in search results
     */
    View.prototype.highlightPossibleVenue = function(venueID) {
        var venue = history[venueID];

        var latLng = new L.LatLng(venue.location.lat, venue.location.lng); 
        var venue_name = venue.name;

        if (!!venue.description) {
          var venue_description = '<br/>' + venue.description;
        }
        else {
          var venue_description = "";
        }

        var markerText = $('<div/>', { id: ++_markerID });
        $('<h4/>', { text: venue.name }).appendTo(markerText);
        this.getSummaryDiv(venue).appendTo(markerText);

        var saveIcon = L.icon({
          iconUrl: 'lib/leaflet/images/save-marker-icon.png',
          shadowUrl: 'lib/leaflet/images/marker-shadow.png',
          iconSize: [25,41],
          shadowSize: [41,41],
          iconAnchor: [12,41],
          shadowAnchor: [12,41],
          popupAnchor: [0,-34]
        });

        var marker = new L.Marker(latLng, {icon: saveIcon, title:venue_name, riseOnHover:true})
            .bindPopup(markerText[0])
              .on('click', function(e) { this.openPopup(); })
              .on('unclick', function(e) { this.closePopup(); })
              ;
        this.saveMarkerLayer.addLayer(marker);

        marker.openPopup();

        highlightMarker = marker;
    }

    /* 
     * Wrapper function to turn off highlighting of a venue marker
     */
    View.prototype.unHighlightPossibleVenueEvent = function(event) {
        this.unHighlightPossibleVenue(event.data.id);
    }

    /*
     * Turns off the Highlighting of a Venue Marker
     */
    View.prototype.unHighlightPossibleVenue = function(venueID) {
        highlightMarker.closePopup();
        this.saveMarkerLayer.removeLayer(highlightMarker);
    }

    /*
     * Wrapper function for add to itinerary button in popup
     */
    View.prototype.addVenueToItineraryEvent = function(event) {
        this.addVenueToItinerary(event.data.id);
    }

    /*  
     * Adds an itinerary to the itinerary on the right
     */
    View.prototype.addVenueToItinerary = function(venueID) {
        var params = {}
        var venue = history[venueID];
        var html = $('<div/>', {
            class: 's_panel',
            id: "" + venueID
        }).appendTo('#accordion');

        // title and delete button
        $('<h4/>', { text: venue.name + " " })
            .append($('<button/>', { class: 'delete'})
                .append($('<span/>', {class: 'glyphicon glyphicon-remove'}))
                    .on('click', {id: venueID}, bind(this.deleteFromItinerary, this))
            .appendTo(html)
        ).appendTo(html);
                
        var accordionDiv = this.getSummaryDiv(venue).appendTo(html);

        // accordion everything again
        $("#accordion #" + venueID).accordion({
            collapsible: true,
            active: true,
            containment: 'column mapparent',
            header: 'h4',
            heightStyle: "content"
        }).sortable({items: '.s_panel'});

        currentItinerary[venueID] = history[venueID]; // adds selected venue to array 
        toggleEmptyItineraryMsg();
        this.addItineraryMarker(venueID);
    }

    View.prototype.getSummaryDiv = function(venue) {
        var summaryDiv = $('<div/>');

        if (venue.description)
            $('<div/>', { 
                text: venue.description,
                class: 'description summary'
            }).appendTo(summaryDiv);

        if (venue.location.address) 
            $('<div/>', { 
                text: venue.location.address + ', ' + venue.location.city + ', ' + venue.location.state,
                class: 'address summary'
            }).appendTo(summaryDiv);

        if (venue.rating)
            $('<div/>', {
                text: venue.rating + ' / 10 rating',
                class: 'rating summary'
            }).appendTo(summaryDiv);

        $('<div/>', {
            text:  venue.stats.checkinsCount + ' checkins across ' + venue.stats.usersCount + ' users',
            class: 'stats summary'
        }).appendTo(summaryDiv);

        if (venue.categories.length > 0)
            $('<div/>', { 
                text: venue.categories.map(function(x) { return x.name; }).join(", "),
                class: 'categories summary'
            }).appendTo(summaryDiv);

        $('<div/>')
            .append($('<img/>', { src: 'https://playfoursquare.s3.amazonaws.com/press/logo/icon-16x16.png'} ))
            .append($('<a/>', { text: ' Foursquare', class: 'summary foursquare', target: "_blank", href: venue.canonicalUrl } ))
            .appendTo(summaryDiv);
        return summaryDiv;
    }

    /**
     * Adds markers for current itinerary items to the map
     */
    View.prototype.addItineraryMarker = function(key) {
        var venue = currentItinerary[key];

        var latLng = new L.LatLng(venue.location.lat, venue.location.lng); 
        var venue_name = venue.name;

        if (!!venue.description) {
          var venue_description = '<br/>' + venue.description;
        }
        else {
          var venue_description = "";
        }

        var markerText = $('<div/>', { id: ++_markerID });
        $('<h4/>', { text: venue.name }).appendTo(markerText);
        this.getSummaryDiv(venue).appendTo(markerText);

        var saveIcon = L.icon({
          iconUrl: 'lib/leaflet/images/save-marker-icon.png',
          shadowUrl: 'lib/leaflet/images/marker-shadow.png',
          iconSize: [25,41],
          shadowSize: [41,41],
          iconAnchor: [12,41],
          shadowAnchor: [12,41],
          popupAnchor: [0,-34]
        });

        var marker = new L.Marker(latLng, {icon: saveIcon, zIndexOffset: 1000, title:venue_name, riseOnHover:true})
            .bindPopup(markerText[0])
              //.bindPopup(venue['name'])
              .on('click', function(e) { this.openPopup(); })
              .on('unclick', function(e) { this.closePopup(); });
        this.saveMarkerLayer.addLayer(marker);

        pinkMarkers[key] = marker;
    }

    /**
     * Set up save button click
     */
    View.prototype.saveHook = function() {
        $('#save').on('click', this.saveItinerary);
    }

    View.prototype.saveItinerary = function() {

        var link = document.URL;
        var value = $.jStorage.get("all", []);

        var time = new Date();
        var itinerary = {};
        var venues = new Array();
        $("#accordion .s_panel").each(function(index) {
            venues.push(currentItinerary[this.id]);
        });
        itinerary['venues'] = venues;
        itinerary['creation_time'] = time.getTime();

        var itName = $("#itinerary-name").val();

        if (!itName) {
            itinerary['name'] = "Default";
            itName = "Default"
        } else {
            itinerary['name'] = itName;
        }

        // if the itinerary is being edited,
        // we replace the previously saved itinerary
        // with the updated itinerary
        if (link.match('#')) {
            for (var i = value.length - 1; i >= 0; i--) {
                if (value[i].name === link.split("#")[1]) {
                    value.splice(i, 1, itinerary);
                }
            }
        } else {
            var overwritten = false; 

            // overwrite existing 
            for (var i = 0; i < value.length; i++) {
                if (value[i].name === itName) {
                    value.splice(i, 1, itinerary);
                    overwritten = true;
                }
            }

            // else, this is a new itinerary, and push it
            // to the end of our locally stored object
            if (!overwritten) {
                value.push(itinerary);
            }
        }
        $.jStorage.set("all", value);

        $(".badge").replaceWith('<span class="badge">' + value.length + '</span>');


        alert("Itinerary Saved!");
    }

    /**
     * Deletes a venue from an itinerary
     */
    View.prototype.deleteFromItinerary = function(event) {
        if (this.currentPopup)
            // calling a private function, w/e yolo
            this.currentPopup._close();
        var venueID = event.data.id;
        // Stupid hack, wanna fite me over it??
        $('#' + venueID).remove();
        $('#' + venueID).remove();
        this.saveMarkerLayer.removeLayer(pinkMarkers[venueID]);
        delete currentItinerary[venueID];
        delete pinkMarkers[venueID];
        toggleEmptyItineraryMsg();
    }

    /**
     * Set up route button
     */
    View.prototype.routeHook = function() {
        $('#route').on('click', bind(this.routeDirections, this));
    }

    /**
     * Draw Route for itinerary
     */
    View.prototype.routeDirections = function() {
        dir = MQ.routing.directions();

        var locations = [];
        $("#accordion div.s_panel").each(function(index) {
            var place = currentItinerary[this.id];
            locations.push({latLng: {lat: place.location.lat, lng: place.location.lng}});
        }); 

        dir.route({
            locations: locations,
            routeType: 'pedestrian'
        });
        this.routeLayer.clearLayers();
        this.routeLayer.addLayer(MQ.routing.routeLayer({
            directions: dir,
            fitBounds: false
        }));
    }

    /**
     * Sets up collapse button
     */ 
    View.prototype.hideHook = function() {
        $('#hide').on('click', bind(this.hideAll, this));
    }

    /**
     * Collapses all the venues in the current itinerary
     */
    View.prototype.hideAll = function() {
        $("#accordion div.s_panel").accordion("option", "active", false);
    }

    /**
     * Sets up expand button
     */
    View.prototype.expandHook = function() {
        $('#expand').on('click', bind(this.expandAll, this));
    }

    /**
     * Expands all the venues in the current itinerary
     */
    View.prototype.expandAll = function() {
        $("#accordion div.s_panel").accordion("option", "active", 0);
    }

    /**
     * Clears search results from map and list
     */
    View.prototype.clearMarkersHook = function() {
        var that = this;
        $("#clearmarkers").on('click', function() {
            that.markerLayer.clearLayers();
            $("#search-results li").remove();
        });
    }

    View.prototype.setSearchResultPanel = function() {
        $("#search-results").sidebar({
        position:"right"
        // callback:{
        // item : {
        // enter : function(){
        // $(this).find("a").animate({color:"red"}, 250);
        // },
        // leave : function(){
        // $(this).find("a").animate({color:"white"}, 250);
        // }
        // }
        // }
        });
    }

    /**
     * Either displays that current itinerary is empty, 
     * or clears the text of the empty message.
     */
    function toggleEmptyItineraryMsg() {
        if (jQuery.isEmptyObject(currentItinerary))
            $('#emptymsg').text('Your itinerary is empty. Search and add results above!');
        else
            $('#emptymsg').empty();
    }

    /**
     * Main function
     */
    $(function() {
        var v = new View(foursquare_client, foursquare_secret, 
                         "https://foursquare.com/", "https://api.foursquare.com",
                         cloudmade_key);
    });
//});
