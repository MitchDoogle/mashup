<?php

    require(__DIR__ . "/../includes/mashconfig.php");

    // numerically indexed array of places
    $places = [];

    // search database for places matching $_GET["geo"]
    $searchfor = [' ',','];
    $replacewith = '%';
    $geo = str_replace($searchfor, $replacewith, $_GET['geo']).'%';
    
    $places = query("SELECT postal_code, place_name, admin_name1, admin_code1, latitude, longitude FROM places 
        WHERE (CONCAT(place_name, admin_code1, postal_code) LIKE '$geo')
        OR (CONCAT(place_name, admin_name1, postal_code) LIKE '$geo') 
        OR (postal_code LIKE '$geo')"); 

    // output places as JSON (pretty-printed for debugging convenience)
    header("Content-type: application/json");
    print(json_encode($places, JSON_PRETTY_PRINT));

?>
