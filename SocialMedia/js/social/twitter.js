dojo.requireLocalization("esriTemplate", "twitter");
dojo.provide("social.twitter");
dojo.addOnLoad(function () {
    dojo.declare("social.twitter", null, {
        // Doc: http://docs.dojocampus.org/dojo/declare#chaining
        "-chains-": {
            constructor: "manual"
        },
        constructor: function (options) {
            this.i18n = dojo.i18n.getLocalization("esriTemplate", "twitter");
            this._map = options.map || null;
            if (this._map === null) {
                throw this.i18n.error.reference;
            }
            dojo.io.script.get({
                url: location.protocol + '//platform.twitter.com/widgets.js'
            });
            var socialInstance = this;
            this.autopage = options.autopage || true;
            this.maxpage = options.maxpage || 3;
            this.limit = 100;
            if (location.protocol === "https:") {
                this.baseurl = "https://search.twitter.com/search.json";
            } else {
                this.baseurl = "http://search.twitter.com/search.json";
            }
            this.title = options.title || '';
            this.id = options.id || 'twitter';
            this.searchTerm = options.searchTerm || '';
            this.symbolUrl = options.symbolUrl;
            this.symbolHeight = options.symbolHeight || 22.5;
            this.symbolWidth = options.symbolWidth || 18.75;
            this.popupHeight = options.popupHeight || 200;
            this.popupWidth = options.popupWidth || 290;
            this.getWindowContentCallback = options.getWindowContentCallback || false;
            this.onClearFunction = options.onClear || false;
            this.onUpdateEndFunction = options.onUpdateEnd || false;
            this.onSetTitleFunction = options.onSetTitle || false;
            this.distance = options.distance;
            this.featureCollection = {
                layerDefinition: {
                    "geometryType": "esriGeometryPoint",
                    "drawingInfo": {
                        "renderer": {
                            "type": "simple",
                            "symbol": {
                                "type": "esriPMS",
                                "url": this.symbolUrl,
                                "contentType": "image/" + this.symbolUrl.substring(this.symbolUrl.lastIndexOf(".") + 1),
                                "width": this.symbolWidth,
                                "height": this.symbolHeight
                            }
                        }
                    },
                    "fields": [{
                        "name": "OBJECTID",
                        "type": "esriFieldTypeOID"
                    }, {
                        "name": "created_at",
                        "type": "esriFieldTypeDate",
                        "alias": "Created"
                    }, {
                        "name": "id",
                        "type": "esriFieldTypeString",
                        "alias": "id",
                        "length": 100
                    }, {
                        "name": "from_user",
                        "type": "esriFieldTypeString",
                        "alias": "User",
                        "length": 100
                    }, {
                        "name": "location",
                        "type": "esriFieldTypeString",
                        "alias": "Location",
                        "length": 1073741822
                    }, {
                        "name": "place",
                        "type": "esriFieldTypeString",
                        "alias": "Place",
                        "length": 100
                    }, {
                        "name": "text",
                        "type": "esriFieldTypeString",
                        "alias": "Text",
                        "length": 1073741822
                    }, {
                        "name": "profile_image_url",
                        "type": "esriFieldTypeString",
                        "alias": "ProfileImage",
                        "length": 255
                    }],
                    "globalIdField": "id",
                    "displayField": "from_user"
                },
                featureSet: {
                    "features": [],
                    "geometryType": "esriGeometryPoint"
                }
            };
            this.infoTemplate = new esri.InfoTemplate();
            this.infoTemplate.setTitle(function (graphic) {
                if (this.onSetTitleFunction && typeof this.onSetTitleFunction === 'function') {
                    return this.onSetTitleFunction(graphic);
                } else {
                    return socialInstance.title;
                }
            });
            this.infoTemplate.setContent(function (graphic) {
                return socialInstance.getWindowContent(graphic, socialInstance);
            });
            this.featureLayer = new esri.layers.FeatureLayer(this.featureCollection, {
                id: this.id,
                outFields: ["*"],
                infoTemplate: this.infoTemplate,
                visible: false
            });
            this._map.addLayer(this.featureLayer);
            dojo.connect(this.featureLayer, "onClick", dojo.hitch(this, function (evt) {
                var query = new esri.tasks.Query();
                query.geometry = this.pointToExtent(this._map, evt.mapPoint, this.symbolWidth);
                var deferred = this.featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW);
                this._map.infoWindow.setFeatures([deferred]);
                this._map.infoWindow.show(evt.mapPoint);
                this._map.infoWindow.resize(this.popupWidth, this.popupHeight);
            }));
            this.stats = {
                geoPoints: 0,
                geoNames: 0,
                noGeo: 0
            };
            this.dataPoints = [];
            this.deferreds = [];
            this.geocoded_ids = {};
            this.loaded = true;
        },
        update: function (options) {
            if (options) {
                this.searchTerm = options.searchTerm || this.searchTerm;
                this.distance = options.distance || this.distance;
                this.socialSourceX = options.socialSourceX;
                this.socialSourceY = options.socialSourceY;
            }
            this.constructQuery(this.searchTerm);
        },
        pointToExtent: function (map, point, toleranceInPixel) {
            var pixelWidth = map.extent.getWidth() / map.width;
            var toleraceInMapCoords = toleranceInPixel * pixelWidth;
            return new esri.geometry.Extent(point.x - toleraceInMapCoords, point.y - toleraceInMapCoords, point.x + toleraceInMapCoords, point.y + toleraceInMapCoords, map.spatialReference);
        },
        getStats: function () {
            var x = this.stats;
            x.total = this.stats.geoPoints + this.stats.noGeo + this.stats.geoNames;
            return x;
        },
        parseURL: function (text) {
            return text.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function (url) {
                return '<a target="_blank" href="' + url + '">' + url + '</a>';
            });
        },
        parseUsername: function (text) {
            return text.replace(/[@]+[A-Za-z0-9-_]+/g, function (u) {
                var username = u.replace("@", "");
                return '<a target="_blank" href="' + location.protocol + '//twitter.com/' + username + '">' + u + '</a>';
            });
        },
        parseHashtag: function (text) {
            return text.replace(/[#]+[A-Za-z0-9-_]+/g, function (t) {
                var tag = t.replace("#", "%23");
                return '<a target="_blank" href="' + location.protocol + '//search.twitter.com/search?q=' + tag + '">' + t + '</a>';
            });
        },
        getPoints: function () {
            return this.dataPoints;
        },
        clear: function () {
            // cancel any outstanding requests
            this.query = null;
            dojo.forEach(this.deferreds, function (def) {
                def.cancel();
            });
            if (this.deferreds) {
                this.deferreds.length = 0;
            }
            // remove existing tweets  
            if (this._map.infoWindow.isShowing) {
                this._map.infoWindow.hide();
            }
            if (this.featureLayer.graphics.length > 0) {
                this.featureLayer.applyEdits(null, null, this.featureLayer.graphics);
            }
            // clear stats and points
            this.stats = {
                geoPoints: 0,
                noGeo: 0,
                geoNames: 0
            };
            this.dataPoints = [];
            this.geocoded_ids = {};
            this.onClear();
        },
        show: function () {
            this.featureLayer.setVisibility(true);
        },
        hide: function () {
            this.featureLayer.setVisibility(false);
        },
        setVisibility: function (val) {
            if (val) {
                this.show();
            } else {
                this.hide();
            }
        },
        getExtent: function () {
            return esri.graphicsExtent(this.featureLayer.graphics);
        },
        // Format Date Object
        formatDate: function (dateObj) {
            if (dateObj) {
                return dojo.date.locale.format(dateObj, {
                    datePattern: "h:mma",
                    selector: "date"
                }).toLowerCase() + ' &middot; ' + dojo.date.locale.format(dateObj, {
                    datePattern: "d MMM yy",
                    selector: "date"
                });
            }
        },
        getRadius: function () {
            var map = this._map;
            var extent = this.extent || map.extent;
            var radius = Math.min(932, Math.ceil(esri.geometry.getLength(new esri.geometry.Point(extent.xmin, extent.ymin, map.spatialReference), new esri.geometry.Point(extent.xmax, extent.ymin, map.spatialReference)) * 3.281 / 5280 / 2));
            radius = Math.round(radius, 0);
            return {
                radius: radius,
                center: map.extent.getCenter(),
                units: "mi"
            };
        },
        setSearchExtent: function (extent) {
            this.extent = extent;
        },
        getWindowContent: function (graphic, socialInstance) {
            if (socialInstance.getWindowContentCallback) {
                if (typeof socialInstance.getWindowContentCallback === 'function') {
                    socialInstance.getWindowContentCallback(graphic);
                }
            }
            var date = new Date(graphic.attributes.created_at);
            var linkedText = socialInstance.parseURL(graphic.attributes.text);
            linkedText = socialInstance.parseUsername(linkedText);
            linkedText = socialInstance.parseHashtag(linkedText);
            // define content for the tweet pop-up window.
            var html = '';
            html += '<div class="twContent">';
            if (graphic.attributes.profile_image_url) {
                var imageURL;
                if (location.protocol === "https:") {
                    imageURL = graphic.attributes.profile_image_url_https;
                } else {
                    imageURL = graphic.attributes.profile_image_url;
                }
                html += '<a tabindex="0" class="twImage" href="' + location.protocol + '//twitter.com/' + graphic.attributes.from_user + '/statuses/' + graphic.attributes.id_str + '" target="_blank"><img class="shadow" src="' + imageURL + '" width="40" height="40"></a>';
            }
            html += '<div class="followButton"><iframe allowtransparency="true" frameborder="0" scrolling="no" src="//platform.twitter.com/widgets/follow_button.html?screen_name=' + graphic.attributes.from_user + '&lang=' + locale + '&show_count=false&show_screen_name=false" style="width:60px; height:20px;"></iframe></div>';
            html += '<h3 class="twUsername">' + graphic.attributes.from_user_name + '</h3>';
            html += '<div class="twUser"><a target="_blank" href="' + location.protocol + '//twitter.com/' + graphic.attributes.from_user + '">&#64;' + graphic.attributes.from_user + '</a></div>';
            html += '<div class="clear"></div>';
            html += '<div class="tweet">' + linkedText + '</div>';
            if (graphic.attributes.created_at) {
                html += '<div class="twDate"><a target="_blank" href="' + location.protocol + '//twitter.com/' + graphic.attributes.from_user + '/statuses/' + graphic.attributes.id_str + '">' + this.formatDate(date) + '</a></div>';
            }
            var tmp = dojo.locale.split('-');
            var locale = 'en';
            if (tmp[0]) {
                locale = tmp[0];
            }
            html += '<div class="actions">';
            html += '<a title="' + this.i18n.general.reply + '" class="reply" href="https://twitter.com/intent/tweet?in_reply_to=' + graphic.attributes.id_str + '&lang=' + locale + '"></a> ';
            html += '<a title="' + this.i18n.general.retweet + '" class="retweet" href="https://twitter.com/intent/retweet?tweet_id=' + graphic.attributes.id_str + '&lang=' + locale + '"></a> ';
            html += '<a title="' + this.i18n.general.favorite + '" class="favorite" href="https://twitter.com/intent/favorite?tweet_id=' + graphic.attributes.id_str + '&lang=' + locale + '"></a> ';
            html += '</div>';
            html += '</div>';
            return html;
        },
        constructQuery: function (searchValue) {
            var map = this._map;
            var radius = this.distance || this.getRadius().radius;
            var search = dojo.trim(searchValue);
            if (search.length === 0) {
                search = "";
            }
            var extent = this.extent || map.extent;
            var center = extent.getCenter();
            center = esri.geometry.webMercatorToGeographic(center);
            var geoPoint;
            if (this.socialSourceX && this.socialSourceY) {
                geoPoint = new esri.geometry.Point(this.socialSourceX, this.socialSourceY, map.spatialReference);
            } else {
                geoPoint = new esri.geometry.Point(center.x, center.y, map.spatialReference);
            }
            this.query = {
                q: search,
                rpp: this.limit,
                result_type: "recent",
                // 'recent', 'mixed', 'popular'
                geocode: geoPoint.y + "," + geoPoint.x + "," + radius + "mi",
                page: 1
            };
            // start Twitter API call of several pages
            this.pageCount = 1;
            this.sendRequest(this.baseurl + "?" + dojo.objectToQuery(this.query));
        },
        sendRequest: function (url) {
            // get the results from twitter for each page
            var deferred = esri.request({
                url: url,
                handleAs: "json",
                timeout: 10000,
                callbackParamName: "callback",
                preventCache: true,
                load: dojo.hitch(this, function (data) {
                    if (data.results.length > 0) {
                        this.mapResults(data);
                        // display results for multiple pages
                        if ((this.autopage) && (this.maxpage > this.pageCount) && (data.next_page !== undefined) && (this.query)) {
                            this.pageCount++;
                            this.query.page++;
                            this.sendRequest(this.baseurl + "?" + dojo.objectToQuery(this.query));
                        } else {
                            this.onUpdateEnd();
                        }
                    } else {
                        // No results found, try another search term
                        this.onUpdateEnd();
                    }
                }),
                error: dojo.hitch(this, function (e) {
                    if (deferred.canceled) {
                        console.log(this.i18n.error.cancelled);
                    } else {
                        console.log(this.i18n.error.general + ": " + e.message);
                    }
                    this.onError(e);
                })
            });
            this.deferreds.push(deferred);
        },
        unbindDef: function (dfd) {
            // if deferred has already finished, remove from deferreds array
            var index = dojo.indexOf(this.deferreds, dfd);
            if (index === -1) {
                return; // did not find
            }
            this.deferreds.splice(index, 1);
            if (!this.deferreds.length) {
                return 2; // indicates we received results from all expected deferreds
            }
            return 1; // found and removed   
        },
        mapResults: function (j) {
            var id = this.id;
            var socialInstance = this;
            if (j.error) {
                console.log(this.i18n.error.general + ": " + j.error);
                this.onError(j.error);
                return;
            }
            var b = [];
            var k = j.results;
            dojo.forEach(k, dojo.hitch(this, function (result) {
                result.smType = id;
                // eliminate Tweets which we have on the map
                if (this.geocoded_ids[result.id]) {
                    return;
                }
                this.geocoded_ids[result.id] = true;
                var geoPoint = null;
                if (result.geo) {
                    var g = result.geo.coordinates;
                    geoPoint = new esri.geometry.Point(parseFloat(g[1]), parseFloat(g[0]));
                } else {
                    var n = result.location;
                    if (n) {
                        var c, d, e, f;
                        // try some different parsings for result.location
                        if (n.indexOf("iPhone:") > -1) {
                            n = n.slice(7);
                            f = n.split(",");
                            geoPoint = new esri.geometry.Point(parseFloat(f[1]), parseFloat(f[0]));
                        } else if (n.indexOf("�T") > -1) {
                            n = n.slice(3);
                            e = n.split(",");
                            geoPoint = new esri.geometry.Point(parseFloat(e[1]), parseFloat(e[0]));
                        } else if (n.indexOf("T") === 1) {
                            n = n.slice(3);
                            e = n.split(",");
                            geoPoint = new esri.geometry.Point(parseFloat(e[1]), parseFloat(e[0]));
                        } else if (n.indexOf("Pre:") > -1) {
                            n = n.slice(4);
                            d = n.split(",");
                            geoPoint = new esri.geometry.Point(parseFloat(d[1]), parseFloat(d[0]));
                        } else if (n.split(",").length === 2) {
                            c = n.split(",");
                            if (c.length === 2 && parseFloat(c[1]) && parseFloat(c[0])) {
                                geoPoint = new esri.geometry.Point(parseFloat(c[1]), parseFloat(c[0]));
                            } else {
                                // location cannot be interpreted by this geocoder
                                this.stats.geoNames++;
                                return;
                            }
                        } else {
                            // location cannot be interpreted by this geocoder
                            this.stats.geoNames++;
                            return;
                        }
                    } else {
                        // location cannot be interpreted by this geocoder
                        this.stats.geoNames++;
                        return;
                    }
                }
                if (geoPoint) {
                    // last check to make sure we parsed it right
                    if (isNaN(geoPoint.x) || isNaN(geoPoint.y)) {
                        //discard bad geopoints
                        this.stats.noGeo++;
                    } else {
                        // convert the Point to WebMercator projection
                        var a = new esri.geometry.geographicToWebMercator(geoPoint);
                        // make the Point into a Graphic
                        var graphic = new esri.Graphic(a);
                        graphic.setAttributes(result);
                        b.push(graphic);
                        this.dataPoints.push({
                            x: a.x,
                            y: a.y,
                            symbol: esri.symbol.PictureMarkerSymbol(this.featureCollection.layerDefinition.drawingInfo.renderer.symbol),
                            attributes: result
                        });
                        this.stats.geoPoints++;
                    }
                } else {
                    this.stats.noGeo++;
                }

            }));
            this.featureLayer.applyEdits(b, null, null);
            this.onUpdate();
        },
        onUpdate: function () {},
        onUpdateEnd: function () {
            this.query = null;
            if (this.onUpdateEndFunction) {
                if (typeof this.onUpdateEndFunction === 'function') {
                    this.onUpdateEndFunction(this.dataPoints.length);
                }
            }
        },
        onClear: function () {
            if (this.onClearFunction) {
                if (typeof this.onClearFunction === 'function') {
                    this.onClearFunction();
                }
            }
        },
        onError: function (info) {
            this.onUpdateEnd();
        }
    }); // end of class declaration
}); // end of addOnLoad