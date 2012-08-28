function toggleSettingsContent() {
    var node = dojo.query('#collapseIcon')[0];
    var panel = dojo.query('#settingsDialog .dijitDialogPaneContent');
    dojo.toggleClass(node, "iconDown");
    if (dojo.hasClass(node, "iconDown")) {
        panel.style('display', 'none');
    } else {
        panel.style('display', 'block');
    }
}

// Get distances for social search based on vernacular slider
function getSocialDistance(socID) {
    var distance = 500;
    if (socID && configOptions.socialSliderValues) {
        if (configOptions.socialSliderValues[configOptions.socialSliderCurrent]) {
            distance = configOptions.socialSliderValues[configOptions.socialSliderCurrent].values[socID.toLowerCase()];
        }
    }
    return distance;
}

// returns a nice geoPoint w/ a formatted string
function prettyGeoPoint(mapPoint, label) {
    label = label || "";
    this.geo = esri.geometry.webMercatorToGeographic(mapPoint);
    this.x_float = this.geo.x;
    this.y_float = this.geo.y;
    this.x = this.geo.x.toFixed(2);
    this.y = this.geo.y.toFixed(2);
    this.geoString = i18n.viewer.settings.latitude + ' <strong id="' + label + 'LatCoord">' + this.x + '</strong> ' + i18n.viewer.settings.longitude + ': <strong id="' + label + 'LonCoord">' + this.y + '</strong>';
    return this;
}

// return date object for flickr dateFrom and dateTo
function getFlickrDate(type) {
    var date = new Date();
    switch (configOptions.flickrRange) {
    case "today":
        if (type === 'to') {
            return date;
        } else {
            date = dojo.date.add(date, "day", - 1);
            return date;
        }
        break;
    case "this_week":
        if (type === 'to') {
            return date;
        } else {
            date = dojo.date.add(date, "week", - 1);
            return date;
        }
        break;
    case "this_month":
        if (type === 'to') {
            return date;
        } else {
            date = dojo.date.add(date, "month", - 1);
            return date;
        }
        break;
    case "all_time":
        return false;
    default:
        return false;
    }
}

// Sets social media search center point
function setMenuForLatLong(PGP, locationText) {
    if (map && PGP && locationText) {
        map.setMapCursor('default');
        if (locationText[0]) {
            locationText[0].innerHTML = PGP.geoString;
        }
        locationText.next('.resetCenter').style('display', 'inline-block');
        dojo.query('#settingsDialog .locationButton').removeClass('buttonSelected');
        setSharing();
    }
}

// SETTINGS PANEL UI
function configureSettingsUI() {
    var props = {
        style: "width: 425px",
        draggable: true,
        showTitle: true,
        title: 'Settings'
    };
    // new dijit.Dialog(
    configOptions.settingsDialog = new dijit.Dialog(props, dojo.byId('settingsDialog'));
    configOptions.settingsDialog.titleBar.children[0].innerHTML = '<div id="collapseIcon"></div><span class="configIcon"></span><span id="settingsTitle">' + i18n.viewer.settings.title + '</span>';

    // Social Slider

    configOptions.socialSliderCurrent = parseInt(configOptions.socialSliderCurrent, 10);
    var slider = new dijit.form.HorizontalSlider({
        name: "slider",
        value: configOptions.socialSliderCurrent,
        minimum: 0,
        maximum: 2,
        showButtons: false,
        discreteValues: 3,
        intermediateChanges: true,
        style: "width:60px; display:inline-block; *display:inline; margin-right:10px; vertical-align:middle;",
        onChange: function (value) {
            var index = parseInt(value, 10);
            if (configOptions.socialSliderValues[index]) {
                dojo.query('#socialmi').text(configOptions.socialSliderValues[index].label);
                configOptions.socialSliderCurrent = index;
                configOptions.socialDistance = configOptions.socialSliderValues[index].id;
            }
        }
    }, "socialSlider");

    // Settings Menu Config
    dojo.query(document).delegate("#cfgMenu .mapButton", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            dojo.query('#cfgMenu .mapButton').removeClass('buttonSelected');
            dojo.query(this).addClass('buttonSelected');
            var id = dojo.query(this).attr('data-layer')[0];
            var panelObj = dojo.query('#settingsDialog .cfgPanel[data-layer=' + id + ']');
            dojo.query("#settingsDialog .cfgPanel").style('display', 'none');
            panelObj.style('display', 'block');
        }
    });

    dojo.query(document).delegate("#collapseIcon", "click", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            toggleSettingsContent();
        }
    });

    dojo.query(document).delegate("#socialList li:not(.cLoading) .toggle", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            toggleChecked(this);
            var changeMapVal = dojo.query(this).parent('li').attr('data-layer')[0];
            toggleMapLayerSM(changeMapVal);
        }
    });

    dojo.query(document).delegate("#settingsDialog .dijitDialogTitleBar", "dblclick", function (event) {
        toggleSettingsContent();
    });

    dojo.query(document).delegate("#YTkwinput", "keyup", function (event) {
        if (event.keyCode === 13) {
            changeYouTube();
        }
    });
    dojo.query(document).delegate("#TWkwinput", "keyup", function (event) {
        if (event.keyCode === 13) {
            changeTwitter();
        }
    });
    dojo.query(document).delegate("#FLkwinput", "keyup", function (event) {
        if (event.keyCode === 13) {
            changeFlickr();
        }
    });

    dojo.query(document).delegate("#ytSubmit", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            changeYouTube();
        }
    });

    dojo.query(document).delegate("#twSubmit", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            changeTwitter();
        }
    });

    dojo.query(document).delegate("#flSubmit", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            changeFlickr();
        }
    });

    dojo.query(document).delegate("#settingsDialog .locationButton", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            dojo.query(this).addClass('buttonSelected');
            var locationText = dojo.query('#socialLocationText');
            locationText.next('.resetCenter').style('display', 'none');
            locationText.text(i18n.viewer.settings.locationText);
            map.setMapCursor("url(" + configOptions.crosshairImage + "), auto");
            var PGP;
            //click universal social geo choose and then...
            configOptions.socialClickListener = dojo.connect(map, "onClick", function (evt) {
                PGP = prettyGeoPoint(evt.mapPoint);
                configOptions.socialPointX = PGP.x;
                configOptions.socialPointY = PGP.y;
                setMenuForLatLong(PGP, locationText);
                clearDataPoints();
                updateSocialLayers();
                dojo.disconnect(configOptions.socialClickListener);
            });
        }
    });
    //set the passed variable for social geo
    if (configOptions.socialPointX && configOptions.socialPointY) {
        var prePoint = {
            "x": configOptions.socialPointX,
            "y": configOptions.socialPointY,
            "geoString": i18n.viewer.settings.latitude + ': <b id="LatCoord">' + configOptions.socialPointX + '</b> ' + i18n.viewer.settings.longitude + ': <b id="LonCoord">' + configOptions.socialPointY + '</b>'
        };
        setMenuForLatLong(prePoint, dojo.query('#socialLocationText'));
    }
    // RESET TO CENTER OF MAP
    dojo.query(document).delegate("#settingsDialog .resetCenter", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            resetMenuForCenter(dojo.query(this));
        }
    });
}

function clearDataPoints() {
    if (youtubeLayer) {
        youtubeLayer.clear();
    }
    if (twitterLayer) {
        twitterLayer.clear();
    }
    if (flickrLayer) {
        flickrLayer.clear();
    }
}

// CHANGE SOCIAL MEDIA SETTINGS
function changeYouTube() {
    configOptions.youtubeSearch = dojo.query('#YTkwinput').attr('value')[0];
    configOptions.youtubeRange = dojo.query("#youtuberange").attr('value')[0];
    showLoading('YTLoad');
    dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + ']').addClass("checked cLoading");
    setSharing();
    youtubeLayer.clear();
    youtubeLayer.update({
        searchTerm: configOptions.youtubeSearch,
        distance: getSocialDistance("yt"),
        socialSourceX: configOptions.socialPointX,
        socialSourceY: configOptions.socialPointY,
        range: configOptions.youtubeRange
    });
}

// changes twitter keywords and such
function changeTwitter() {
    configOptions.twitterSearch = dojo.query('#TWkwinput').attr('value')[0];
    dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + ']').addClass("checked cLoading");
    showLoading('TWLoad');
    setSharing();
    twitterLayer.clear();
    twitterLayer.update({
        searchTerm: configOptions.twitterSearch,
        distance: getSocialDistance("tw"),
        socialSourceX: configOptions.socialPointX,
        socialSourceY: configOptions.socialPointY
    });
}

// changes flickr keywords and such
function changeFlickr() {
    configOptions.flickrSearch = dojo.query('#FLkwinput').attr('value')[0];
    configOptions.flickrRange = dojo.query("#flickrrange").attr('value')[0];
    showLoading('FLLoad');
    dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + ']').addClass("checked cLoading");
    setSharing();
    flickrLayer.clear();
    var updateObj = {
        searchTerm: configOptions.flickrSearch,
        distance: getSocialDistance("fl"),
        socialSourceX: configOptions.socialPointX,
        socialSourceY: configOptions.socialPointY
    };
    if (configOptions.flickrRange) {
        updateObj.dateFrom = getFlickrDate('from');
        updateObj.dateTo = getFlickrDate('to');
    }
    flickrLayer.update(updateObj);
}

// resets social media center point to map center
function resetMenuForCenter(btn) {
    if (btn) {
        configOptions.socialPointX = '';
        configOptions.socialPointY = '';
        var locationText = btn.prev('.smallTxt');
        locationText.text(i18n.viewer.settings.centerOfMap);
        setSharing();
        btn.style('display', 'none');
    }
}

// GETS STRING FOR SOCIAL MEDIA POPUP TITLE
function getSmPopupTitle() {
    var graphic = configOptions.customPopup.getSelectedFeature();
    var socialString = '';
    var pagString = '';
    if (graphic) {
        if (graphic.attributes.smType) {
            var total = configOptions.customPopup.count;
            var current = configOptions.customPopup.selectedIndex + 1;
            var socialObject = false;
            // IF MORE THAN 1
            if (total > 1) {
                pagString = '<span class="pageInfo">(' + dojo.number.format(current) + ' ' + i18n.viewer.general.of + ' ' + dojo.number.format(total) + ')</span>';
            }
            var ytID, twID, flID, usID = 'unassigned';
            if (configOptions.showYouTube) {
                ytID = configOptions.youtubeID;
            }
            if (configOptions.showTwitter) {
                twID = configOptions.twitterID;
            }
            if (configOptions.showFlickr) {
                flID = configOptions.flickrID;
            }
            // SET SOCIAL ICON
            switch (graphic.attributes.smType) {
            case ytID:
                socialObject = {
		            title: configOptions.youtubeTitle,
		            legendIcon: configOptions.youtubeIcon
		        };
                break;
            case twID:
                socialObject = socialObject = {
		            title: configOptions.twitterTitle,
		            legendIcon: configOptions.twitterIcon
		        };
                break;
            case flID:
                socialObject = {
		            title: configOptions.flickrTitle,
		            legendIcon: configOptions.flickrIcon
		        };
                break;
            }
            if (socialObject) {
                socialString = '<span title="' + socialObject.title + '" class="iconImg" style="background-image:url(' + socialObject.legendIcon + ');"></span>' + '<span class="titleInfo">' + socialObject.title + '</span>';
            }
        }
    }
    return socialString + pagString;
}

// OVERRIDES POPUP TITLE FOR SOCIAL MEDIA TO ADD IMAGE
function overridePopupTitle() {
    configOptions.customPopup.setTitle(getSmPopupTitle());
}

// update social layers
function updateSocialLayers() {
    if (configOptions.showYouTube) {
        // IF YOUTUBE cbox is checked
        var ytList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + ']');
        if (dojo.hasClass(ytList[0], "checked")) {
            ytList.addClass("cLoading");
            youtubeLayer.update({
                searchTerm: configOptions.youtubeSearch,
                distance: getSocialDistance("yt"),
                socialSourceX: configOptions.socialPointX,
                socialSourceY: configOptions.socialPointY,
                range: configOptions.youtubeRange
            });
            configOptions.youtubeChecked = true;
        }
    }
    // IF TWITTER cbox is checked
    if (configOptions.showTwitter) {
        var twList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + ']');
        if (dojo.hasClass(twList[0], "checked")) {
            twList.addClass("cLoading");
            twitterLayer.update({
                searchTerm: configOptions.twitterSearch,
                distance: getSocialDistance("tw"),
                socialSourceX: configOptions.socialPointX,
                socialSourceY: configOptions.socialPointY
            });
            configOptions.twitterChecked = true;
        }
    }
    if (configOptions.showFlickr) {
        // IF FLICKR cbox is checked
        var flList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + ']');
        if (dojo.hasClass(flList[0], "checked")) {
            flList.addClass("cLoading");
            var updateObj = {
                searchTerm: configOptions.flickrSearch,
                distance: getSocialDistance("fl"),
                socialSourceX: configOptions.socialPointX,
                socialSourceY: configOptions.socialPointY
            };
            if (configOptions.flickrRange) {
                updateObj.dateFrom = getFlickrDate('from');
                updateObj.dateTo = getFlickrDate('to');
            }
            flickrLayer.update(updateObj);
            configOptions.flickrChecked = true;
        }
    }
}

// RESET SOCIAL REFRESH TIMER
function resetSocialRefreshTimer() {
    clearTimeout(configOptions.autoRefreshTimer);
    if (!(configOptions.socialPointX && configOptions.socialPointY)) {
        configOptions.autoRefreshTimer = setTimeout(function () {
            updateSocialLayers();
        }, 3000);
    }
}

// TOGGLE SOCIAL MEDIA LAYER ON AND OFF
function toggleMapLayerSM(layerid) {
    var ytID, twID, flID, usID = false;
    if (configOptions.showYouTube) {
        ytID = configOptions.youtubeID;
    }
    if (configOptions.showTwitter) {
        twID = configOptions.twitterID;
    }
    if (configOptions.showFlickr) {
        flID = configOptions.flickrID;
    }
    var layerList = dojo.query('#socialMenu li[data-layer="' + layerid + '"]');
    if (dojo.hasClass(layerList[0], 'checked')) {
        switch (layerid) {
        case ytID:
            configOptions.youtubeChecked = true;
            youtubeLayer.update({
                searchTerm: configOptions.youtubeSearch,
                distance: getSocialDistance("yt"),
                socialSourceX: configOptions.socialPointX,
                socialSourceY: configOptions.socialPointY,
                range: configOptions.youtubeRange
            });
            break;
        case twID:
            configOptions.twitterChecked = true;
            twitterLayer.update({
                searchTerm: configOptions.twitterSearch,
                distance: getSocialDistance("tw"),
                socialSourceX: configOptions.socialPointX,
                socialSourceY: configOptions.socialPointY
            });
            break;
        case flID:
            configOptions.flickrChecked = true;
            var updateObj = {
                searchTerm: configOptions.flickrSearch,
                distance: getSocialDistance("fl"),
                socialSourceX: configOptions.socialPointX,
                socialSourceY: configOptions.socialPointY
            };
            if (configOptions.flickrRange) {
                updateObj.dateFrom = getFlickrDate('from');
                updateObj.dateTo = getFlickrDate('to');
            }
            flickrLayer.update(updateObj);
            break;
        }
    } else {
        switch (layerid) {
        case ytID:
            dojo.query('#YTLoad').style('display', 'none');
            youtubeLayer.clear();
            break;
        case twID:
            dojo.query('#TWLoad').style('display', 'none');
            twitterLayer.clear();
            break;
        case flID:
            dojo.query('#FLLoad').style('display', 'none');
            flickrLayer.clear();
            break;
        }
    }
    setSharing();
}

// TOGGLE HEAT/CLUSTER
function showHeatLayer() {
    if (clusterLayer) {
        clusterLayer.setVisibility(false);
    }
    if (heatLayer) {
        heatLayer.setVisibility(true);
    } else {
        alertDialog(i18n.viewer.errors.heatmap);
    }
}

// shows clusters and hides heatmap
function showClusterLayer() {
    if (heatLayer) {
        heatLayer.setVisibility(false);
    }
    if (clusterLayer) {
        clusterLayer.setVisibility(true);
    }
}

// TOGGLE DISPLAY AS CLUSTERS/HEATMAP
function toggleDisplayAs(obj) {
    dojo.query('#displayAs .mapButton').removeClass('buttonSelected');
    // DATA TYPE VARIABLE
    var dataType = dojo.query(obj).attr('data-type')[0];
    if (dataType === 'heatmap') {
        showHeatLayer();
        configOptions.socialDisplay = 'heatmap';
    } else {
        showClusterLayer();
        configOptions.socialDisplay = 'cluster';
    }
    hidePopup();
    setSharing();
    // CLASS
    dojo.query(obj).addClass('buttonSelected');
}

// HEATMAP / CLUSTERS TOGGLE
function insertSMToggle() {
    var clusterClass = '';
    var heatmapClass = '';
    var html = '';
    if (configOptions.socialDisplay === 'heatmap') {
        heatmapClass = 'buttonSelected';
    } else {
        clusterClass = 'buttonSelected';
    }
    html += '<div id="displayAs" class="displayAs">';
    html += '<span class="label"></span>';
    html += '<span data-type="cluster" class="mapButton clusterButton buttonLeft ' + clusterClass + '"><span class="iconBlock"></span>' + i18n.viewer.buttons.cluster + '</span>';
    html += '<span data-type="heatmap" class="mapButton heatButton buttonRight ' + heatmapClass + '"><span class="iconBlock"></span>' + i18n.viewer.buttons.heatmap + '</span>';
    html += '</div>';
    var node = dojo.byId('socialMenu');
    if (node) {
        dojo.place(html, node, "last");
    }
    dojo.query(document).delegate("#displayAs .mapButton", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            toggleDisplayAs(this);
        }
    });
}

// INSERT SOCIAL MEDIA LIST ITEM
function insertSMItem(obj) {
    if (obj) {
        // LAYER DEFAULT CLASS
        var layerClass = 'layer';
        var key;
        // IF LAYER IS CHECKED
        if (obj.visible) {
            // SET CLASS TO CHECKED
            layerClass = 'layer checked';
        }
        // COMPOSE HTML LIST STRING
        var html = '';
        html += '<li data-layer="' + obj.uniqueID + '" class="' + layerClass + '">';
        html += '<div class="cover"></div>';
        if (obj.showSocialSettings) {
            html += ' <span class="cBconfig" title="' + obj.title + ' ' + i18n.viewer.layer.searchSettings + '"></span>';
        }
        if (obj.description) {
            html += '<span class="cBinfo" title="' + i18n.viewer.layer.information + '"></span>';
        }
        html += '<span class="toggle cBox"></span>';
        html += '<span class="toggle cBicon"><img alt="' + obj.title + '" title="' + obj.title + '" width="16" height="16" src="' + obj.legendIcon + '" /></span>';
        html += '<span class="toggle cBtitle">' + obj.title + '<span class="count"></span></span>';
        html += '<div class="clear"></div>';
        if (obj.description) {
            html += '<div class="infoHidden">';
            html += '<p>' + obj.description + '</p>';
            if (obj.searchTerm) {
                html += '<p>' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + obj.searchTerm + '</span>"</p>';
            }
            html += '</div>';
        }
        html += '</li>';
        // INSERT HTML
        var node = dojo.byId('socialList');
        if (node) {
            dojo.place(html, node, "last");
        }
    }
}

// UPDATE HEAT MAP
function updateDataPoints() {
    var dataPoints = [];
    if (configOptions.showTwitter) {
        var twList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + ']');
        if (twitterLayer.dataPoints && dojo.hasClass(twList[0], "checked")) {
            dataPoints = dataPoints.concat(twitterLayer.dataPoints);
        }
    }
    if (configOptions.showYouTube) {
        var ytList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + ']');
        if (youtubeLayer.dataPoints && dojo.hasClass(ytList[0], "checked")) {
            dataPoints = dataPoints.concat(youtubeLayer.dataPoints);
        }
    }
    if (configOptions.showFlickr) {
        var flList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + ']');
        if (flickrLayer.dataPoints && dojo.hasClass(flList[0], "checked")) {
            dataPoints = dataPoints.concat(flickrLayer.dataPoints);
        }
    }
    if (heatLayer) {
        heatLayer.setData(dataPoints);
    }
    if (clusterLayer) {
        clusterLayer.setData(dataPoints);
    }
}


// INSERT SETTINGS PANEL HTML
function insertSettingsHTML() {
    var html = '';
    html += '<div class="padContainer">';
    html += '<div class="cfgMenu" id="cfgMenu"></div>';
    html += '<div class="Pad ">';
    html += '<div class="clear"></div>';
    if (configOptions.showFlickr) {
        if (configOptions.showFlickrConfig) {
            html += '<div class="cfgPanel" data-layer="' + configOptions.flickrID + '">';
            html += '<div class="firstDesc"><strong>' + i18n.viewer.settings.searchAll + ' ' + configOptions.flickrTitle + ':</strong></div>';
            html += '<ul class="formStyle">';
            html += '<li>';
            html += '<label for="FLkwinput">' + i18n.viewer.settings.usingThisKeyword + '</label>';
            html += '<input id="FLkwinput" class="mapInput inputSingle" type="text" size="20" value="' + configOptions.flickrSearch + '" />';
            html += '</li>';
            html += '<li>';
            html += '<label for="flickrrange">' + i18n.viewer.settings.fromThePast + '</label>';
            html += '<select id="flickrrange">';
            html += '<option value="today">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.today + '</option>';
            html += '<option value="this_week">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.this_week + '</option>';
            html += '<option value="this_month">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.this_month + '</option>';
            html += '<option value="all_time">' + i18n.viewer.settings.all_time + '</option>';
            html += '</select>';
            html += '</li>';
            html += '<li>';
            html += '<label for="flSubmit">&nbsp;</label>';
            html += '<span id="flSubmit" class="mapSubmit">' + i18n.viewer.settings.search + '</span><span class="Status" id="FLLoad"></span>';
            html += '</li>';
            html += '</ul>';
            html += '</div>';
        }
    }
    if (configOptions.showTwitter) {
        if (configOptions.showTwitterConfig) {
            html += '<div class="cfgPanel" data-layer="' + configOptions.twitterID + '">';
            html += '<div class="firstDesc"><strong>' + i18n.viewer.settings.searchAll + ' ' + configOptions.twitterTitle + ':</strong></div>';
            html += '<ul class="formStyle">';
            html += '<li>';
            html += '<label for="TWkwinput">' + i18n.viewer.settings.usingThisKeyword + '</label>';
            html += '<input id="TWkwinput" class="mapInput inputSingle" type="text" size="20" value="' + configOptions.twitterSearch + '" />';
            html += '<a title="' + i18n.viewer.settings.twSearch + '" class="twInfo" href="' + location.protocol + '//support.twitter.com/articles/71577-how-to-use-advanced-twitter-search" target="_blank"></a>';
            html += '</li>';
            html += '<li>';
            html += '<label for="twSubmit">&nbsp;</label>';
            html += '<span id="twSubmit" class="mapSubmit">' + i18n.viewer.settings.search + '</span><span class="Status" id="TWLoad"></span>';
            html += '</li>';
            html += '</ul>';
            html += '</div>';
        }
    }
    if (configOptions.showYouTube) {
        if (configOptions.showYouTubeConfig) {
            html += '<div class="cfgPanel" data-layer="' + configOptions.youtubeID + '">';
            html += '<div class="firstDesc"><strong>' + i18n.viewer.settings.searchAll + ' ' + configOptions.youtubeTitle + ':</strong></div>';
            html += '<ul class="formStyle">';
            html += '<li>';
            html += '<label for="YTkwinput">' + i18n.viewer.settings.usingThisKeyword + '</label>';
            html += '<input id="YTkwinput" class="mapInput inputSingle" type="text" size="20" value="' + configOptions.youtubeSearch + '" />';
            html += '</li>';
            html += '<li>';
            html += '<label for="youtuberange">' + i18n.viewer.settings.fromThePast + '</label>';
            html += '<select id="youtuberange">';
            html += '<option value="today">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.today + '</option>';
            html += '<option value="this_week">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.this_week + '</option>';
            html += '<option value="this_month">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.this_month + '</option>';
            html += '<option value="all_time">' + i18n.viewer.settings.all_time + '</option>';
            html += '</select>';
            html += '</li>';
            html += '<li>';
            html += '<label for="ytSubmit">&nbsp;</label>';
            html += '<span class="mapSubmit" id="ytSubmit">' + i18n.viewer.settings.search + '</span><span class="Status" id="YTLoad"></span>';
            html += '</li>';
            html += '</ul>';
            html += '</div>';
        }
    }
    html += '</div>';
    html += '<div class="allOptions">';
    html += '<div class="Pad">';
    html += '<ul class="formStyle">';
    html += '<li>';
    html += '<label for="socialUseCenter">' + i18n.viewer.settings.atLocation + '</label>';
    html += '<span class="mapButton locationButton buttonSingle"><span class="iconBlock"></span></span><span id="socialLocationText" class="smallTxt">' + i18n.viewer.settings.centerOfMap + '</span><span title="' + i18n.viewer.settings.centerOfMap + '" id="socialUseCenter" class="resetCenter"></span>';
    html += '<div class="clear"></div>';
    html += '</li>';
    html += '<li>';
    html += '<label for="socialSlider">' + i18n.viewer.settings.withinThisDistance + '</label>';
    html += '<span id="socialSlider" class="slider"></span>';
    html += '<span id-"socialSliderText" class="smallTxt sliderTxt"><span class="miTxt" id="socialmi">' + configOptions.socialSliderValues[configOptions.socialSliderCurrent].label + '</span></span>';
    html += '<div class="clear"></div>';
    html += '</li>';
    html += '</ul>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    var node = dojo.byId('settingsDialog');
    if (node) {
        node.innerHTML = html;
    }
    //	SET SELECT MENU VALUES
    if (configOptions.showYouTube) {
        dojo.query('#youtuberange').attr('value', configOptions.youtubeRange);
    }
    //	SET SELECT MENU VALUES
    if (configOptions.showFlickr) {
        dojo.query('#flickrrange').attr('value', configOptions.flickrRange);
    }
}

// Social Media
function configureSocialMedia() {
    // if canvas is supported
    if (isCanvasSupported()) {
        // set up heat layer
        heatLayer = new HeatmapLayer({
            "map": map,
            "domNodeId": "heatLayer",
            "opacity": 0.85
        });
        map.addLayer(heatLayer);
    }
    // SET UP CLUSTER LAYER
    clusterLayer = new modules.ClusterLayer(null, {
        map: map,
        clusterImage: configOptions.clusterImage,
        clusterHoverImage: configOptions.clusterHoverImage
    });
    // set default visible of the two
    if (configOptions.socialDisplay === 'heatmap') {
        if (heatLayer) {
            heatLayer.setVisibility(true);
        } else {
            alertDialog(i18n.viewer.errors.heatmap);
        }
        if (clusterLayer) {
            clusterLayer.setVisibility(false);
        }
    } else {
        if (heatLayer) {
            heatLayer.setVisibility(false);
        }
        if (clusterLayer) {
            clusterLayer.setVisibility(true);
        }
    }

    // APPEND LIST CONTAINER        
    var node = dojo.byId('socialMenu');
    if (node) {
        node.innerHTML = '<ul class="zebraStripes" id="socialList"></ul>';
    }
    // IF FLICKR
    if (configOptions.showFlickr) {
        flickrLayer = new social.flickr({
            map: map,
            autopage: true,
            maxpage: 2,
            title: configOptions.flickrTitle,
            id: configOptions.flickrID,
            searchTerm: configOptions.flickrSearch,
            symbolUrl: configOptions.flickrSymbol.url,
            symbolHeight: configOptions.flickrSymbol.height,
            symbolWidth: configOptions.flickrSymbol.width,
            popupWidth: configOptions.popupWidth,
            popupHeight: configOptions.popupHeight,
            dateFrom: getFlickrDate('from'),
            dateTo: getFlickrDate('to'),
            apiKey: configOptions.flickrKey,
            onClear: function () {
                var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + '] .count')[0];
                if (node) {
                    node.innerHTML = '';
                }
            },
            onUpdateEnd: function (totalCount) {
                hideLoading(dojo.query('#socialMenu ul li[data-layer=' + configOptions.flickrID + ']'), dojo.query('#FLLoad'));
                var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + '] .keyword')[0];
                if (node) {
                    node.innerHTML = configOptions.flickrSearch;
                }
                var textCount = '';
                if (totalCount) {
                    textCount = ' (' + totalCount + ')' || '';
                }
                node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + '] .count')[0];
                if (node) {
                    node.innerHTML = textCount;
                }
            },
            onSetTitle: getSmPopupTitle
        });
        dojo.connect(flickrLayer, 'onUpdate', updateDataPoints);
        dojo.connect(flickrLayer, 'onClear', updateDataPoints);
        // INSERT HTML
        insertSMItem({
            visible: configOptions.flickrChecked,
            uniqueID: configOptions.flickrID,
            title: configOptions.flickrTitle,
            showSocialSettings: configOptions.showFlickrConfig,
            legendIcon: configOptions.flickrIcon,
            description: configOptions.flickrDescription,
            searchTerm: configOptions.flickrSearch
        });
    }
    // IF TWITTER
    if (configOptions.showTwitter) {
        twitterLayer = new social.twitter({
            map: map,
            autopage: true,
            maxpage: 4,
            title: configOptions.twitterTitle,
            id: configOptions.twitterID,
            searchTerm: configOptions.twitterSearch,
            symbolUrl: configOptions.twitterSymbol.url,
            symbolHeight: configOptions.twitterSymbol.height,
            symbolWidth: configOptions.twitterSymbol.width,
            popupWidth: configOptions.popupWidth,
            popupHeight: configOptions.popupHeight,
            onClear: function () {
                var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + '] .count')[0];
                if (node) {
                    node.innerHTML = '';
                }
            },
            onUpdateEnd: function (totalCount) {
                hideLoading(dojo.query('#socialMenu ul li[data-layer=' + configOptions.twitterID + ']'), dojo.query('#TWLoad'));
                var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + '] .keyword')[0];
                if (node) {
                    node.innerHTML = configOptions.twitterSearch;
                }
                var textCount = '';
                if (totalCount) {
                    textCount = ' (' + totalCount + ')' || '';
                }
                node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + '] .count')[0];
                if (node) {
                    node.innerHTML = textCount;
                }
            },
            onSetTitle: getSmPopupTitle
        });
        dojo.connect(twitterLayer, 'onUpdate', updateDataPoints);
        dojo.connect(twitterLayer, 'onClear', updateDataPoints);
        // INSERT HTML
        insertSMItem({
            visible: configOptions.twitterChecked,
            uniqueID: configOptions.twitterID,
            title: configOptions.twitterTitle,
            showSocialSettings: configOptions.showTwitterConfig,
            legendIcon: configOptions.twitterIcon,
            description: configOptions.twitterDescription,
            searchTerm: configOptions.twitterSearch
        });
    }
    // IF YOUTUBE
    if (configOptions.showYouTube) {
        youtubeLayer = new social.youtube({
            map: map,
            autopage: true,
            maxpage: 4,
            title: configOptions.youtubeTitle,
            id: configOptions.youtubeID,
            key: configOptions.youtubeKey,
            searchTerm: configOptions.youtubeSearch,
            symbolUrl: configOptions.youtubeSymbol.url,
            symbolHeight: configOptions.youtubeSymbol.height,
            symbolWidth: configOptions.youtubeSymbol.width,
            popupWidth: configOptions.popupWidth,
            popupHeight: configOptions.popupHeight,
            range: configOptions.youtubeRange,
            onClear: function () {
                var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + '] .count')[0];
                if (node) {
                    node.innerHTML = '';
                }
            },
            onUpdateEnd: function (totalCount) {
                hideLoading(dojo.query('#socialMenu ul li[data-layer=' + configOptions.youtubeID + ']'), dojo.query('#YTLoad'));
                var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + '] .keyword')[0];
                if (node) {
                    node.innerHTML = configOptions.youtubeSearch;
                }
                var textCount = '';
                if (totalCount) {
                    textCount = ' (' + totalCount + ')' || '';
                }
                node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + '] .count')[0];
                if (node) {
                    node.innerHTML = textCount;
                }
            },
            onSetTitle: getSmPopupTitle
        });
        dojo.connect(youtubeLayer, 'onUpdate', updateDataPoints);
        dojo.connect(youtubeLayer, 'onClear', updateDataPoints);
        // INSERT HTML
        insertSMItem({
            visible: configOptions.youtubeChecked,
            uniqueID: configOptions.youtubeID,
            title: configOptions.youtubeTitle,
            showSocialSettings: configOptions.showYouTubeConfig,
            legendIcon: configOptions.youtubeIcon,
            description: configOptions.youtubeDescription,
            searchTerm: configOptions.youtubeSearch
        });
    }
    insertSMToggle();
    insertSettingsHTML();
    configureSettingsUI();

    // ONCLICK CONNECT
    dojo.connect(clusterLayer.graphics, "onClick",

    function (evt) {
        dojo.stopEvent(evt);
        var arr = [];
        var query = new esri.tasks.Query();
        query.geometry = evt.graphic.attributes.extent;
        if (configOptions.showTwitter) {
            arr.push(twitterLayer.featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW));
        }
        if (configOptions.showFlickr) {
            arr.push(flickrLayer.featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW));
        }
        if (configOptions.showYouTube) {
            arr.push(youtubeLayer.featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW));
        }
        configOptions.customPopup.setFeatures(arr);
        configOptions.customPopup.show(evt.mapPoint);
        configOptions.customPopup.resize(configOptions.popupWidth, configOptions.popupHeight);
        overridePopupTitle();
    });

    // ZEBRA STRIPE LAYERS
    zebraStripe(dojo.query('#socialList li.layer'));

    // SETTINGS MENU GENERATOR
    var settingsCount = dojo.query('#socialList li.layer .cBconfig').length;
    if (settingsCount > -1) {
        dojo.forEach(dojo.query('#socialList li.layer .cBconfig'), function (entry, i) {
            var parent = dojo.query(entry).parent('li');
            var settingsID = dojo.query(parent).attr('data-layer');
            var settingsClass = getButtonClass(i + 1, settingsCount);
            var settingsSource = dojo.query(parent).children('.cBicon').children('img').attr('src');
            var settingsTitle = dojo.query(parent).children('.cBtitle').innerHTML;
            var node = dojo.byId('cfgMenu');
            if (node) {
                var html = '<span data-layer="' + settingsID + '" class="mapButton ' + settingsClass + '" title="' + settingsTitle + '"><img width="16" height="16" src="' + settingsSource + '" /></span>';
                dojo.place(html, node, "last");
            }
        });
    }
}