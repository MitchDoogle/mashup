/**
 * scripts.js
 *
 * Computer Science 50
 * Problem Set 8
 *
 * Global JavaScript.
 */

// Google Map
var map;

// markers for map
var markers = [];
var searchedmarkers = [];

// info window
var info = new google.maps.InfoWindow();

// variables for geolocation https://developers.google.com/maps/articles/geolocation
var initialLocation;
var middleofmap = new google.maps.LatLng(39.833333, -98.583333);

//var browserSupportFlag =  new Boolean();

// execute when the DOM is fully loaded
$(function() {
    
    // styles for map
    // https://developers.google.com/maps/documentation/javascript/styling
    var styles = [

        // hide Google's labels
        {
            featureType: "all",
            elementType: "labels",
            stylers: [
                {visibility: "off"}
            ]
        },

        // hide roads
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [
                {visibility: "off"}
            ]
        }

    ];
    
    
    // options for map
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
        var options = {
            disableDefaultUI: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            maxZoom: 14,
            panControl: true,
            styles: styles,
            zoom: 12,
            zoomControl: true
        };
    

    // get DOM node in which map will be instantiated
    var canvas = $("#map-canvas").get(0);

    // instantiate map
    map = new google.maps.Map(canvas, options);
    
    if(navigator.geolocation) 
    {
        //browserSupportFlag = true;
        navigator.geolocation.getCurrentPosition(function(position) {
            initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
            map.setCenter(initialLocation);
        },
        function() {
            noGeo();
        });
    }
    else
    {
        initialLocation = newyork;
        map.setCenter(initialLocation);
    }
    
    function noGeo()
    {
        initialLocation = middleofmap;
        map.setCenter(initialLocation);
        map.setZoom(4);
    }
    
    // configure UI once Google Map is idle (i.e., loaded)
    google.maps.event.addListenerOnce(map, "idle", configure);

});


/**
 * Adds marker for place to map.
 */
function addMarker(place, searched)
{
    // add marker to place location, give it a label
    var placetitle = place.place_name.concat(", ",place.admin_code1," ",place.postal_code);
    var latlong = new google.maps.LatLng(place.latitude,place.longitude);
    var image = "../img/news.gif";
    var marker = new google.maps.Marker({
        position: latlong,
        map: map,
        title: placetitle,
        icon: image    
    });
    
    
    // add suggestion marker to beginning of array
    if (searched != null)
    {
        searchedmarkers.push(marker);
    }
    else
    {
        markers.push(marker);
    }
    
    // get news information from articles.php
    var articles = "<span id='infotitle'><b>"+placetitle+"</b></span><br/><ul>";
    
    $.getJSON("articles.php?geo="+place.postal_code)
    .done(function(data, textStatus, jqXHR) {
        
        if(data.length > 0){
        
            for(var i = 0; i < data.length; i++) {
            articles +="<li><a href='"+data[i].link+"'>"+data[i].title+"</a></li>";
            }
        }
        else if (data.length === 0)
        {
            $.getJSON("articles.php?geo="+place.place_name+", "+place.admin_code1)
            .done(function(data1, textStatus, jqXHR) {
                
                if (data1.length === 0)
                {
                    articles +="No news here.";
                }
                else
                {
                    for(var i = 0; i < data1.length; i++) {
                    articles +="<li><a href='"+data1[i].link+"'>"+data1[i].title+"</a></li>";
                    }
                }
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                
                // log error
                console.log(errorThrown.toString());
            });
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        
        // log error
        console.log(errorThrown.toString());
    });
    
    articles +="</ul>";
    
    //  output articles into infowindow
    google.maps.event.addListener(marker, 'click', function() {
        showInfo(marker,articles);
    });
}

/**
 * Configures application.
 */
function configure()
{

    // update UI after map has been dragged
    google.maps.event.addListener(map, "dragend", function() {
        update();
    });

    // update UI after zoom level changes
    google.maps.event.addListener(map, "zoom_changed", function() {
        update();
    });

    // remove markers whilst dragging
    google.maps.event.addListener(map, "dragstart", function() {
        removeMarkers(markers);
    });

    // configure typeahead
    // https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md
    $("#q").typeahead({
        autoselect: true,
        highlight: true,
        minLength: 1
    },
    {
        source: search,
        templates: {
            empty: "no places found yet",
            suggestion: _.template("<p><%- place_name %>, <%- admin_code1 %> <span class=\"zip\"><%- postal_code %></span></p>")
        }
    });

    // re-center map after place is selected from drop-down
    $("#q").on("typeahead:selected", function(eventObject, suggestion, name) {

        // ensure coordinates are numbers
        var latitude = (_.isNumber(suggestion.latitude)) ? suggestion.latitude : parseFloat(suggestion.latitude);
        var longitude = (_.isNumber(suggestion.longitude)) ? suggestion.longitude : parseFloat(suggestion.longitude);

        // set map's center
        map.setCenter({lat: latitude, lng: longitude});
        map.setZoom(12);
        
        // add marker for suggestion
        removeMarkers(searchedmarkers);
        addMarker(suggestion,1);

        // update UI
        update();
    });

    // hide info window when text box has focus
    $("#q").focus(function(eventData) {
        hideInfo();
    });

    // re-enable ctrl- and right-clicking (and thus Inspect Element) on Google Map
    // https://chrome.google.com/webstore/detail/allow-right-click/hompjdfbfmmmgflfjdlnkohcplmboaeo?hl=en
    document.addEventListener("contextmenu", function(event) {
        event.returnValue = true; 
        event.stopPropagation && event.stopPropagation(); 
        event.cancelBubble && event.cancelBubble();
    }, true);

    // update UI
    update();

    // give focus to text box
    $("#q").focus();
}

/**
 * Hides info window.
 */
function hideInfo()
{
    info.close();
}

/**
 * Removes markers from map.
 */
function removeMarkers(markers)
{
    for(var i = 0; i < markers.length; i++)
    {
        markers[i].setMap(null);
    }
    markers = [];
}

/**
 * Searches database for typeahead's suggestions.
 */
function search(query, cb)
{
    // get places matching query (asynchronously)
    var parameters = {
        geo: query
    };
    $.getJSON("search.php", parameters)
    .done(function(data, textStatus, jqXHR) {

        // call typeahead's callback with search results (i.e., places)
        cb(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());
    });
}

/**
 * Shows info window at marker with content.
 */
function showInfo(marker, content)
{
    // start div
    var div = "<div id='info'>";
    if (typeof(content) === "undefined")
    {
        // http://www.ajaxload.info/
        div += "<img alt='loading' src='img/ajax-loader.gif'/>";
    }
    else
    {
        div += content;
    }

    // end div
    div += "</div>";

    // set info window's content
    info.setContent(div);

    // open info window (if not already open)
    info.open(map, marker);
}

/**
 * Updates UI's markers.
 */
function update() 
{
    // get map's bounds
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    // get places within bounds (asynchronously)
    var parameters = {
        ne: ne.lat() + "," + ne.lng(),
        q: $("#q").val(),
        sw: sw.lat() + "," + sw.lng()
    };
    $.getJSON("update.php", parameters)
    .done(function(data, textStatus, jqXHR) {

        // remove old markers from map
        removeMarkers(markers);

        // add new markers to map
        for (var i = 0; i < data.length; i++)
        {
            addMarker(data[i]);
        }
     })
     .fail(function(jqXHR, textStatus, errorThrown) {

         // log error to browser's console
         console.log(errorThrown.toString());
     });
};
