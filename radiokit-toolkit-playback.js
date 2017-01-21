/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Player_1 = __webpack_require__(1);
	exports.Channel = {
	    Player: Player_1.Player,
	};
	if (typeof (window) !== "undefined") {
	    window['RadioKitToolkitPlayback'] = {
	        Channel: {
	            Player: Player_1.Player,
	        }
	    };
	}


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Base_1 = __webpack_require__(2);
	var SyncClock_1 = __webpack_require__(3);
	var PlaylistFetcher_1 = __webpack_require__(4);
	var AudioManager_1 = __webpack_require__(10);
	var Player = (function (_super) {
	    __extends(Player, _super);
	    function Player(channelId, accessToken) {
	        var _this = _super.call(this) || this;
	        _this.__fetchTimeoutId = 0;
	        _this.__clock = null;
	        _this.__playlistFetcher = null;
	        _this.__volume = 1.0;
	        _this.__started = false;
	        _this.__channelId = channelId;
	        _this.__accessToken = accessToken;
	        return _this;
	    }
	    Player.prototype.start = function () {
	        this.__startFetching();
	        this.__started = true;
	        this.__audioManager = new AudioManager_1.AudioManager();
	        this.__audioManager.setVolume(this.__volume);
	        this.__audioManager.on('playback-started', this.__onAudioManagerPlaybackStarted.bind(this));
	        this.__audioManager.on('position', this.__onAudioManagerPosition.bind(this));
	        return this;
	    };
	    Player.prototype.stop = function () {
	        this.__stopFetching();
	        this.__started = false;
	        if (this.__audioManager) {
	            this.__audioManager.offAll();
	            this.__audioManager.cleanup();
	            delete this.__audioManager;
	            this.__audioManager = undefined;
	        }
	        return this;
	    };
	    Player.prototype.setVolume = function (volume) {
	        if (volume < 0.0 || volume > 1.0) {
	            throw new Error('Volume out of range');
	        }
	        this.debug("Volume set to " + volume);
	        this.__volume = volume;
	        if (this.__audioManager) {
	            this.__audioManager.setVolume(volume);
	        }
	        return this;
	    };
	    Player.prototype.getVolume = function () {
	        return this.__volume;
	    };
	    Player.prototype.isStarted = function () {
	        return this.__started;
	    };
	    Player.prototype._loggerTag = function () {
	        return this['constructor']['name'] + " " + this.__channelId;
	    };
	    Player.prototype.__startFetching = function () {
	        this.__fetchOnceAndRepeat();
	    };
	    Player.prototype.__stopFetching = function () {
	        if (this.__fetchTimeoutId !== 0) {
	            clearTimeout(this.__fetchTimeoutId);
	            this.__fetchTimeoutId = 0;
	        }
	    };
	    Player.prototype.__fetchOnce = function () {
	        var _this = this;
	        if (this.__clock === null) {
	            this.debug("Fetch: Synchronizing clock...");
	            var promise = new Promise(function (resolve, reject) {
	                SyncClock_1.SyncClock.makeAsync()
	                    .then(function (clock) {
	                    _this.debug("Fetch: Synchronized clock");
	                    _this.__clock = clock;
	                    _this.__playlistFetcher = new PlaylistFetcher_1.PlaylistFetcher(_this.__accessToken, _this.__channelId, clock);
	                    return _this.__fetchPlaylist(resolve, reject);
	                })
	                    .catch(function (error) {
	                    _this.warn("Fetch error: Unable to sync clock (" + error.message + ")");
	                    _this._trigger('error-network');
	                    reject(new Error("Unable to sync clock (" + error.message + ")"));
	                });
	            });
	            return promise;
	        }
	        else {
	            var promise = new Promise(function (resolve, reject) {
	                _this.__fetchPlaylist(resolve, reject);
	            });
	            return promise;
	        }
	    };
	    Player.prototype.__fetchPlaylist = function (resolve, reject) {
	        var _this = this;
	        this.debug("Fetch: Fetching playlist...");
	        this.__playlistFetcher.fetchAsync()
	            .then(function (playlist) {
	            _this.debug("Fetch: Done");
	            resolve(playlist);
	        })
	            .catch(function (error) {
	            _this.warn("Fetch error: Unable to fetch playlist (" + error.message + ")");
	            _this._trigger('error-network');
	            reject(new Error("Unable to fetch playlist (" + error.message + ")"));
	        });
	    };
	    Player.prototype.__fetchOnceAndRepeat = function () {
	        var _this = this;
	        this.__fetchOnce()
	            .then(function (playlist) {
	            if (_this.__started) {
	                _this.__audioManager.update(playlist, _this.__clock);
	            }
	            _this.__scheduleNextFetch();
	        })
	            .catch(function (error) {
	            _this.__scheduleNextFetch();
	        });
	    };
	    Player.prototype.__scheduleNextFetch = function () {
	        var _this = this;
	        if (this.__started) {
	            var timeout = 2000 + Math.round(Math.random() * 250);
	            this.debug("Fetch: Scheduling next fetch in " + timeout + " ms");
	            this.__fetchTimeoutId = setTimeout(function () {
	                _this.__fetchTimeoutId = 0;
	                _this.__fetchOnceAndRepeat();
	            }, timeout);
	        }
	    };
	    Player.prototype.__onAudioManagerPosition = function (track, position, duration) {
	        this._trigger('track-position', track, position, duration);
	    };
	    Player.prototype.__onAudioManagerPlaybackStarted = function (track) {
	        this._trigger('track-playback-started', track);
	    };
	    return Player;
	}(Base_1.Base));
	exports.Player = Player;


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	var Base = (function () {
	    function Base() {
	        this.__events = {};
	    }
	    Base.prototype.on = function (eventName, callback) {
	        if (this.__events.hasOwnProperty(eventName)) {
	            if (this.__events[eventName].indexOf(callback) === -1) {
	                this.__events[eventName].push(callback);
	            }
	            else {
	                throw new Error("Trying to addd twice the same callback for event \"" + eventName + "\"");
	            }
	        }
	        else {
	            this.__events[eventName] = [callback];
	        }
	        return this;
	    };
	    Base.prototype.off = function (eventName, callback) {
	        if (this.__events.hasOwnProperty(eventName)) {
	            var index = this.__events[eventName].indexOf(callback);
	            if (index !== -1) {
	                this.__events[eventName].splice(index, 1);
	            }
	            else {
	                throw new Error("Trying to remove non-existent callback for event \"" + eventName + "\"");
	            }
	        }
	        return this;
	    };
	    Base.prototype.offAll = function (eventName) {
	        if (eventName) {
	            if (this.__events.hasOwnProperty(eventName)) {
	                delete this.__events[eventName];
	            }
	        }
	        else {
	            this.__events = {};
	        }
	        return this;
	    };
	    Base.prototype._trigger = function (eventName) {
	        var args = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            args[_i - 1] = arguments[_i];
	        }
	        this.debug("Event: " + eventName + " (" + JSON.stringify(args) + ")");
	        if (this.__events.hasOwnProperty(eventName)) {
	            for (var _a = 0, _b = this.__events[eventName]; _a < _b.length; _a++) {
	                var callback = _b[_a];
	                callback.apply(this, args);
	            }
	        }
	        return this;
	    };
	    Base.prototype.warn = function (message) {
	        console.warn("[" + new Date().toISOString() + " RadioKit.Toolkit.Playback " + this._loggerTag() + "] " + message);
	    };
	    Base.prototype.info = function (message) {
	        console.info("[" + new Date().toISOString() + " RadioKit.Toolkit.Playback " + this._loggerTag() + "] " + message);
	    };
	    Base.prototype.debug = function (message) {
	        console.debug("[" + new Date().toISOString() + " RadioKit.Toolkit.Playback " + this._loggerTag() + "] " + message);
	    };
	    return Base;
	}());
	exports.Base = Base;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Base_1 = __webpack_require__(2);
	var SyncClock = (function (_super) {
	    __extends(SyncClock, _super);
	    function SyncClock(serverDate) {
	        var _this = _super.call(this) || this;
	        _this.__offset = serverDate - Date.now();
	        _this.debug("Synchronized clock: offset = " + _this.__offset + " ms");
	        return _this;
	    }
	    SyncClock.makeAsync = function () {
	        var promise = new Promise(function (resolve, reject) {
	            var xhr = new XMLHttpRequest();
	            xhr.open('OPTIONS', 'https://time.radiokitapp.org/api/time/v1.0/now', true);
	            xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
	            xhr.timeout = 5000;
	            xhr.onerror = function (e) {
	                reject(new Error("Unable to synchronize clock: Network error (" + xhr.status + ")"));
	            };
	            xhr.onabort = function (e) {
	                reject(new Error("Unable to synchronize clock: Aborted"));
	            };
	            xhr.ontimeout = function (e) {
	                reject(new Error("Unable to synchronize clock: Timeout"));
	            };
	            xhr.onreadystatechange = function () {
	                if (xhr.readyState === 4) {
	                    if (xhr.status === 200) {
	                        resolve(new SyncClock(Date.parse(JSON.parse(xhr.responseText).utc_time)));
	                    }
	                    else {
	                        reject(new Error("Unable to synchronize clock: Unexpected response (status = " + xhr.status + ")"));
	                    }
	                }
	            };
	            xhr.send();
	        });
	        return promise;
	    };
	    SyncClock.prototype.nowAsTimestamp = function () {
	        return Date.now() + this.__offset;
	    };
	    SyncClock.prototype._loggerTag = function () {
	        return this['constructor']['name'];
	    };
	    return SyncClock;
	}(Base_1.Base));
	exports.SyncClock = SyncClock;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var PlaylistResolver_1 = __webpack_require__(5);
	var PlaylistFetcher = (function () {
	    function PlaylistFetcher(accessToken, channelId, clock) {
	        this.__clock = clock;
	        this.__channelId = channelId;
	        this.__accessToken = accessToken;
	    }
	    PlaylistFetcher.prototype.fetchAsync = function () {
	        var _this = this;
	        var promise = new Promise(function (resolve, reject) {
	            var now = _this.__clock.nowAsTimestamp();
	            var xhr = new XMLHttpRequest();
	            var url = 'https://plumber.radiokitapp.org/api/rest/v1.0/media/input/file/radiokit/vault' +
	                '?a[]=id' +
	                '&a[]=name' +
	                '&a[]=file' +
	                '&a[]=cue_in_at' +
	                '&a[]=cue_out_at' +
	                '&a[]=cue_offset' +
	                '&a[]=fade_in_at' +
	                '&a[]=fade_out_at' +
	                '&s[]=cue%20' + encodeURIComponent(new Date(now).toISOString()) + '%2020%20600' +
	                '&c[references][]=deq%20broadcast_channel_id%20' + encodeURIComponent(_this.__channelId) +
	                '&o[]=cue_in_at%20asc';
	            xhr.open('GET', url, true);
	            xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
	            xhr.setRequestHeader('Authorization', "Bearer " + _this.__accessToken);
	            xhr.setRequestHeader('Accept', 'application/json');
	            xhr.timeout = 15000;
	            xhr.onerror = function (e) {
	                reject(new Error("Unable to fetch playlist: Network error (" + xhr.status + ")"));
	            };
	            xhr.onabort = function (e) {
	                reject(new Error("Unable to fetch playlist: Aborted"));
	            };
	            xhr.ontimeout = function (e) {
	                reject(new Error("Unable to fetch playlist: Timeout"));
	            };
	            xhr.onreadystatechange = function () {
	                if (xhr.readyState === 4) {
	                    if (xhr.status === 200) {
	                        var responseAsJson = JSON.parse(xhr.responseText);
	                        var resolver = new PlaylistResolver_1.PlaylistResolver(_this.__accessToken, responseAsJson['data']);
	                        resolver.resolveAsync()
	                            .then(function (playlist) {
	                            resolve(playlist);
	                        })
	                            .catch(function (error) {
	                            reject(new Error("Unable to resolve playlist (" + error.message + ")"));
	                        });
	                    }
	                    else {
	                        reject(new Error("Unable to fetch playlist: Unexpected response (status = " + xhr.status + ")"));
	                    }
	                }
	            };
	            xhr.send();
	        });
	        return promise;
	    };
	    return PlaylistFetcher;
	}());
	exports.PlaylistFetcher = PlaylistFetcher;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Playlist_1 = __webpack_require__(6);
	var PlaylistResolver = (function () {
	    function PlaylistResolver(accessToken, playlistRaw) {
	        this.__playlistRaw = playlistRaw;
	        this.__accessToken = accessToken;
	    }
	    PlaylistResolver.prototype.resolveAsync = function () {
	        var _this = this;
	        var promise = new Promise(function (resolve, reject) {
	            var xhr = new XMLHttpRequest();
	            var fileIds = [];
	            for (var _i = 0, _a = _this.__playlistRaw; _i < _a.length; _i++) {
	                var file = _a[_i];
	                fileIds.push(encodeURIComponent(file["file"]));
	            }
	            var url = 'https://vault.radiokitapp.org/api/rest/v1.0/data/record/file' +
	                '?a[]=id' +
	                '&a[]=public_url' +
	                '&c[id][]=in%20' + fileIds.join("%20");
	            xhr.open('GET', url, true);
	            xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
	            xhr.setRequestHeader('Authorization', "Bearer " + _this.__accessToken);
	            xhr.setRequestHeader('Accept', 'application/json');
	            xhr.timeout = 15000;
	            var audio = new Audio();
	            var knownFormats = [];
	            if (audio.canPlayType('application/ogg; codecs=opus')) {
	                knownFormats.push('application/ogg; codecs=opus');
	            }
	            if (audio.canPlayType('application/ogg; codecs=vorbis')) {
	                knownFormats.push('application/ogg; codecs=vorbis');
	            }
	            if (audio.canPlayType('audio/mpeg')) {
	                knownFormats.push('audio/mpeg');
	            }
	            xhr.setRequestHeader('X-RadioKit-KnownFormats', knownFormats.join(', '));
	            xhr.onerror = function (e) {
	                reject(new Error("Unable to fetch playlist: Network error (" + xhr.status + ")"));
	            };
	            xhr.onabort = function (e) {
	                reject(new Error("Unable to fetch playlist: Aborted"));
	            };
	            xhr.ontimeout = function (e) {
	                reject(new Error("Unable to fetch playlist: Timeout"));
	            };
	            xhr.onreadystatechange = function () {
	                if (xhr.readyState === 4) {
	                    if (xhr.status === 200) {
	                        var responseAsJson = JSON.parse(xhr.responseText);
	                        var responseData = responseAsJson['data'];
	                        resolve(Playlist_1.Playlist.makeFromJson(_this.__accessToken, _this.__playlistRaw, responseData));
	                    }
	                    else {
	                        reject(new Error("Unable to fetch files: Unexpected response (status = " + xhr.status + ")"));
	                    }
	                }
	            };
	            xhr.send();
	        });
	        return promise;
	    };
	    return PlaylistResolver;
	}());
	exports.PlaylistResolver = PlaylistResolver;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Track_1 = __webpack_require__(7);
	var Playlist = (function () {
	    function Playlist(tracks) {
	        this.__tracks = tracks;
	    }
	    Playlist.makeFromJson = function (accessToken, playlistRaw, filesRaw) {
	        var tracks = {};
	        for (var _i = 0, playlistRaw_1 = playlistRaw; _i < playlistRaw_1.length; _i++) {
	            var playlistRecord = playlistRaw_1[_i];
	            var id = playlistRecord['id'];
	            var fileId = playlistRecord['file'];
	            var fileUrl = void 0;
	            for (var _a = 0, filesRaw_1 = filesRaw; _a < filesRaw_1.length; _a++) {
	                var fileRecord = filesRaw_1[_a];
	                if (fileRecord['id'] === playlistRecord['file']) {
	                    fileUrl = fileRecord['public_url'];
	                    break;
	                }
	            }
	            var cueInAt = new Date(playlistRecord['cue_in_at']);
	            var cueOutAt = new Date(playlistRecord['cue_out_at']);
	            var cueOffset = playlistRecord['cue_offset'];
	            var fadeInAt = playlistRecord['fade_in_at'] !== null ? new Date(playlistRecord['fade_in_at']) : null;
	            var fadeOutAt = playlistRecord['fade_out_at'] !== null ? new Date(playlistRecord['fade_out_at']) : null;
	            var track = new Track_1.Track(accessToken, id, fileId, fileUrl, cueInAt, cueOutAt, cueOffset, fadeInAt, fadeOutAt);
	            tracks[id] = track;
	        }
	        return new Playlist(tracks);
	    };
	    Playlist.prototype.getTracks = function () {
	        return this.__tracks;
	    };
	    return Playlist;
	}());
	exports.Playlist = Playlist;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Base_1 = __webpack_require__(2);
	var TrackInfo_1 = __webpack_require__(8);
	var Track = (function (_super) {
	    __extends(Track, _super);
	    function Track(accessToken, id, fileId, fileUrl, cueInAt, cueOutAt, cueOffset, fadeInAt, fadeOutAt) {
	        var _this = _super.call(this) || this;
	        _this.__accessToken = accessToken;
	        _this.__id = id;
	        _this.__fileId = fileId;
	        _this.__fileUrl = fileUrl;
	        _this.__cueInAt = cueInAt;
	        _this.__cueOutAt = cueOutAt;
	        _this.__cueOffset = cueOffset;
	        _this.__fadeInAt = fadeInAt;
	        _this.__fadeOutAt = fadeOutAt;
	        return _this;
	    }
	    Track.prototype.getId = function () {
	        return this.__id;
	    };
	    Track.prototype.getFileId = function () {
	        return this.__fileId;
	    };
	    Track.prototype.getFileUrl = function () {
	        return this.__fileUrl;
	    };
	    Track.prototype.getCueInAt = function () {
	        return this.__cueInAt;
	    };
	    Track.prototype.getCueOutAt = function () {
	        return this.__cueOutAt;
	    };
	    Track.prototype.getFadeInAt = function () {
	        return this.__fadeInAt;
	    };
	    Track.prototype.getFadeOutAt = function () {
	        return this.__fadeOutAt;
	    };
	    Track.prototype.getCueOffset = function () {
	        return this.__cueOffset;
	    };
	    Track.prototype.getInfoAsync = function () {
	        var _this = this;
	        var promise = new Promise(function (resolve, reject) {
	            var xhr = new XMLHttpRequest();
	            var url = 'https://vault.radiokitapp.org/api/rest/v1.0/data/record/file' +
	                '?a[]=id' +
	                '&a[]=name' +
	                '&a[]=stage' +
	                '&a[]=references' +
	                '&a[]=extra' +
	                '&a[]=public_url' +
	                '&a[]=affiliate_schemas.id' +
	                '&a[]=affiliate_schemas.name' +
	                '&a[]=affiliate_schemas.key' +
	                '&a[]=affiliate_schemas.kind' +
	                '&a[]=affiliate_items.id' +
	                '&a[]=affiliate_items.affiliate_schema_id' +
	                '&a[]=affiliate_items.item_url' +
	                '&a[]=metadata_schemas.id' +
	                '&a[]=metadata_schemas.name' +
	                '&a[]=metadata_schemas.key' +
	                '&a[]=metadata_schemas.kind' +
	                '&a[]=metadata_items.id' +
	                '&a[]=metadata_items.metadata_schema_id' +
	                '&a[]=metadata_items.metadata_schema_id' +
	                '&a[]=metadata_items.value_string' +
	                '&a[]=metadata_items.value_db' +
	                '&a[]=metadata_items.value_text' +
	                '&a[]=metadata_items.value_float' +
	                '&a[]=metadata_items.value_integer' +
	                '&a[]=metadata_items.value_duration' +
	                '&a[]=metadata_items.value_date' +
	                '&a[]=metadata_items.value_datetime' +
	                '&a[]=metadata_items.value_time' +
	                '&a[]=metadata_items.value_file' +
	                '&a[]=metadata_items.value_image' +
	                '&a[]=metadata_items.value_url' +
	                '&j[]=metadata_schemas' +
	                '&j[]=metadata_items' +
	                '&j[]=affiliate_schemas' +
	                '&j[]=affiliate_items' +
	                '&c[id][]=eq%20' + encodeURIComponent(_this.__fileId);
	            xhr.open('GET', url, true);
	            xhr.setRequestHeader('Authorization', "Bearer " + _this.__accessToken);
	            xhr.setRequestHeader('Accept', 'application/json');
	            xhr.timeout = 15000;
	            xhr.onerror = function (e) {
	                reject(new Error("Unable to fetch track info: Network error (" + xhr.status + ")"));
	            };
	            xhr.onabort = function (e) {
	                reject(new Error("Unable to fetch track info: Aborted"));
	            };
	            xhr.ontimeout = function (e) {
	                reject(new Error("Unable to fetch track info: Timeout"));
	            };
	            xhr.onreadystatechange = function () {
	                if (xhr.readyState === 4) {
	                    if (xhr.status === 200) {
	                        var responseAsJson = JSON.parse(xhr.responseText);
	                        if (responseAsJson["data"].length === 1) {
	                            resolve(TrackInfo_1.TrackInfo.makeFromJson(responseAsJson["data"][0]));
	                        }
	                        else {
	                            reject(new Error("Unable to fetch track info: Record not found"));
	                        }
	                    }
	                    else {
	                        reject(new Error("Unable to fetch track info: Unexpected response (status = " + xhr.status + ")"));
	                    }
	                }
	            };
	            xhr.send();
	        });
	        return promise;
	    };
	    Track.prototype._loggerTag = function () {
	        return this['constructor']['name'] + " " + this.__id;
	    };
	    return Track;
	}(Base_1.Base));
	exports.Track = Track;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var AffiliateInfo_1 = __webpack_require__(9);
	var TrackInfo = (function () {
	    function TrackInfo(name, metadata, affiliates) {
	        this.__name = name;
	        this.__metadata = metadata;
	        this.__affiliates = affiliates;
	    }
	    TrackInfo.makeFromJson = function (data) {
	        var name = data['name'];
	        var metadata = {};
	        var affiliates = {};
	        var metadataSchemas = {};
	        for (var _i = 0, _a = data['metadata_schemas']; _i < _a.length; _i++) {
	            var metadataSchema = _a[_i];
	            metadataSchemas[metadataSchema['id']] = metadataSchema;
	        }
	        var affiliateSchemas = {};
	        for (var _b = 0, _c = data['affiliate_schemas']; _b < _c.length; _b++) {
	            var affiliateSchema = _c[_b];
	            affiliateSchemas[affiliateSchema['id']] = affiliateSchema;
	        }
	        for (var _d = 0, _e = data['metadata_items']; _d < _e.length; _d++) {
	            var metadataItem = _e[_d];
	            var key = metadataSchemas[metadataItem['metadata_schema_id']].key;
	            var kind = metadataSchemas[metadataItem['metadata_schema_id']].kind;
	            var value = metadataItem["value_" + kind];
	            metadata[key] = value;
	        }
	        for (var _f = 0, _g = data['affiliate_items']; _f < _g.length; _f++) {
	            var affiliateItem = _g[_f];
	            var key = affiliateSchemas[affiliateItem['affiliate_schema_id']].key;
	            var value = new AffiliateInfo_1.AffiliateInfo(affiliateItem);
	            affiliates[key] = value;
	        }
	        return new TrackInfo(name, metadata, affiliates);
	    };
	    TrackInfo.prototype.getName = function () {
	        return this.__name;
	    };
	    TrackInfo.prototype.getMetadata = function () {
	        return this.__metadata;
	    };
	    TrackInfo.prototype.getAffiliates = function () {
	        return this.__affiliates;
	    };
	    return TrackInfo;
	}());
	exports.TrackInfo = TrackInfo;


/***/ },
/* 9 */
/***/ function(module, exports) {

	"use strict";
	var AffiliateInfo = (function () {
	    function AffiliateInfo(affiliateItem) {
	        this.__affiliateItem = affiliateItem;
	    }
	    AffiliateInfo.prototype.hasItem = function () {
	        return this.__affiliateItem['item_url'] !== null;
	    };
	    AffiliateInfo.prototype.getItemUrl = function () {
	        return this.__affiliateItem['item_url'];
	    };
	    return AffiliateInfo;
	}());
	exports.AffiliateInfo = AffiliateInfo;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Factory_1 = __webpack_require__(11);
	var Base_1 = __webpack_require__(2);
	var AudioManager = (function (_super) {
	    __extends(AudioManager, _super);
	    function AudioManager() {
	        var _this = _super !== null && _super.apply(this, arguments) || this;
	        _this.__audioPlayers = {};
	        _this.__volume = 1.0;
	        return _this;
	    }
	    AudioManager.prototype.update = function (playlist, clock) {
	        var tracks = playlist.getTracks();
	        var existingIds = Object.keys(this.__audioPlayers);
	        var newIds = Object.keys(tracks);
	        var tracksToAdd = this.__diff(tracks, this.__audioPlayers);
	        var tracksToRemove = this.__diff(this.__audioPlayers, tracks);
	        for (var id in tracksToAdd) {
	            this.debug("Adding track: ID = " + id);
	            this.__audioPlayers[id] = Factory_1.Factory.makeFromTrack(tracks[id], clock);
	            this.__audioPlayers[id].setVolume(this.__volume);
	            this.__audioPlayers[id].on('playback-started', this.__onAudioPlayerPlaybackStarted.bind(this));
	            this.__audioPlayers[id].on('position', this.__onAudioPlayerPosition.bind(this));
	            this.__audioPlayers[id].start();
	        }
	        for (var id in tracksToRemove) {
	            this.debug("Removing track: ID = " + id);
	            this.__removeAudioPlayer(id);
	        }
	    };
	    AudioManager.prototype.cleanup = function () {
	        for (var id in this.__audioPlayers) {
	            this.__removeAudioPlayer(id);
	        }
	    };
	    AudioManager.prototype.setVolume = function (volume) {
	        if (volume < 0.0 || volume > 1.0) {
	            throw new Error('Volume out of range');
	        }
	        this.__volume = volume;
	        for (var id in this.__audioPlayers) {
	            this.__audioPlayers[id].setVolume(volume);
	        }
	        return this;
	    };
	    AudioManager.prototype._loggerTag = function () {
	        return "" + this['constructor']['name'];
	    };
	    AudioManager.prototype.__removeAudioPlayer = function (id) {
	        if (this.__currentTrack === this.__audioPlayers[id].getTrack()) {
	            this.__currentTrack = undefined;
	        }
	        this.__audioPlayers[id].offAll();
	        this.__audioPlayers[id].stop();
	        delete this.__audioPlayers[id];
	    };
	    AudioManager.prototype.__diff = function (object1, object2) {
	        var result = {};
	        var array1 = Object.keys(object1);
	        var array2 = Object.keys(object2);
	        for (var _i = 0, array1_1 = array1; _i < array1_1.length; _i++) {
	            var item = array1_1[_i];
	            if (array2.indexOf(item) === -1) {
	                result[item] = object1[item];
	            }
	        }
	        return result;
	    };
	    AudioManager.prototype.__onAudioPlayerPlaybackStarted = function (track) {
	        this.__currentTrack = track;
	        this._trigger('playback-started', track);
	    };
	    AudioManager.prototype.__onAudioPlayerPosition = function (track, position, duration) {
	        if (track === this.__currentTrack) {
	            this._trigger('position', track, position, duration);
	        }
	    };
	    return AudioManager;
	}(Base_1.Base));
	exports.AudioManager = AudioManager;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var HTMLPlayer_1 = __webpack_require__(12);
	var Factory = (function () {
	    function Factory() {
	    }
	    Factory.makeFromTrack = function (track, clock) {
	        return new HTMLPlayer_1.HTMLPlayer(track, clock);
	    };
	    return Factory;
	}());
	exports.Factory = Factory;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Base_1 = __webpack_require__(2);
	var HTMLPlayer = (function (_super) {
	    __extends(HTMLPlayer, _super);
	    function HTMLPlayer(track, clock) {
	        var _this = _super.call(this) || this;
	        _this.__started = false;
	        _this.__cueInTimeoutId = 0;
	        _this.__restartTimeoutId = 0;
	        _this.__positionIntervalId = 0;
	        _this.__volume = 1.0;
	        _this.__track = track;
	        _this.__clock = clock;
	        return _this;
	    }
	    HTMLPlayer.prototype.start = function () {
	        if (!this.__started) {
	            this.debug('Starting');
	            this.__started = true;
	            this.__preparePlayback();
	        }
	        else {
	            throw new Error('Attempt to start HTML Player that is already started');
	        }
	        return this;
	    };
	    HTMLPlayer.prototype.stop = function () {
	        if (this.__started) {
	            this.debug('Stopping');
	            this.__stopPlayback();
	            this.__started = false;
	        }
	        else {
	            throw new Error('Attempt to stop HTML Player that is not started');
	        }
	        return this;
	    };
	    HTMLPlayer.prototype.setVolume = function (volume) {
	        if (volume < 0.0 || volume > 1.0) {
	            throw new Error('Volume out of range');
	        }
	        this.__volume = volume;
	        if (this.__audio) {
	            this.__audio.volume = volume;
	        }
	        return this;
	    };
	    HTMLPlayer.prototype.getTrack = function () {
	        return this.__track;
	    };
	    HTMLPlayer.prototype._loggerTag = function () {
	        return this['constructor']['name'] + " " + this.__track.getId();
	    };
	    HTMLPlayer.prototype.__onAudioCanPlayThroughWhenPreparing = function (e) {
	        this.debug('Can play through (when preparing)');
	        var now = this.__clock.nowAsTimestamp();
	        var cueInAt = this.__track.getCueInAt().valueOf();
	        var cueOutAt = this.__track.getCueOutAt().valueOf();
	        if (now >= cueOutAt) {
	            this.warn('Unable to play: Track is obsolete');
	        }
	        else {
	            if (now < cueInAt) {
	                var timeout = cueInAt - now;
	                this.debug("Waiting for " + timeout + " ms");
	                this.__cueInTimeoutId = setTimeout(this.__onCueInTimeout.bind(this), timeout);
	            }
	            else if (now > cueInAt) {
	                this.__audio.oncanplaythrough = this.__onAudioCanPlayThroughWhenReady.bind(this);
	                var position = now - cueInAt;
	                this.debug("Seeking to " + position + " ms");
	                this.__audio.currentTime = position / 1000.0;
	            }
	            else {
	                this.__startPlayback();
	            }
	        }
	    };
	    HTMLPlayer.prototype.__onAudioCanPlayThroughWhenReady = function (e) {
	        this.debug('Can play through (when ready)');
	        this.__startPlayback();
	    };
	    HTMLPlayer.prototype.__onAudioError = function (e) {
	        this.warn('Error');
	        this.__stopPlayback();
	        this.__scheduleRestart();
	    };
	    HTMLPlayer.prototype.__onAudioEnded = function (e) {
	        this.debug('EOS');
	        this.__stopPlayback();
	    };
	    HTMLPlayer.prototype.__onAudioSeeking = function (e) {
	        this.debug('Seeking');
	    };
	    HTMLPlayer.prototype.__onAudioSeeked = function (e) {
	        this.debug('Seeked');
	    };
	    HTMLPlayer.prototype.__onAudioWaiting = function (e) {
	        this.warn('Waiting');
	    };
	    HTMLPlayer.prototype.__onAudioStalled = function (e) {
	        this.warn('Stalled');
	    };
	    HTMLPlayer.prototype.__onAudioSuspended = function (e) {
	        this.warn('Suspended');
	    };
	    HTMLPlayer.prototype.__onCueInTimeout = function () {
	        this.debug('Cue In timeout has passed');
	        this.__cueInTimeoutId = 0;
	        this.__startPlayback();
	    };
	    HTMLPlayer.prototype.__preparePlayback = function () {
	        this.debug('Preparing playback');
	        this.__audio = new Audio();
	        this.__audio.volume = this.__volume;
	        this.__audio.preload = 'none';
	        this.__audio.src = this.__track.getFileUrl();
	        var now = this.__clock.nowAsTimestamp();
	        var cueInAt = this.__track.getCueInAt().valueOf();
	        var cueOutAt = this.__track.getCueOutAt().valueOf();
	        if (now >= cueOutAt) {
	            this.warn('Unable to set initial currentTime: Track is obsolete');
	        }
	        else {
	            if (now <= cueInAt) {
	                this.__audio.currentTime = 0;
	            }
	            else {
	                var position = now - cueInAt;
	                this.debug("Setting initial currentTime to " + position + " ms");
	                this.__audio.onseeking = this.__onAudioSeeking.bind(this);
	                this.__audio.onseeked = this.__onAudioSeeked.bind(this);
	                this.__audio.currentTime = position / 1000.0;
	            }
	        }
	        this.__audio.oncanplaythrough = this.__onAudioCanPlayThroughWhenPreparing.bind(this);
	        this.__audio.onerror = this.__onAudioError.bind(this);
	        this.__audio.load();
	    };
	    HTMLPlayer.prototype.__startPlayback = function () {
	        this.debug('Starting playback');
	        this.__positionIntervalId = setInterval(this.__onPositionInterval.bind(this), 250);
	        this.__audio.onwaiting = this.__onAudioWaiting.bind(this);
	        this.__audio.onstalled = this.__onAudioStalled.bind(this);
	        this.__audio.onsuspend = this.__onAudioSuspended.bind(this);
	        this.__audio.onended = this.__onAudioEnded.bind(this);
	        this.__audio.play();
	        this._trigger('playback-started', this.__track);
	    };
	    HTMLPlayer.prototype.__stopPlayback = function () {
	        this.debug('Stopping playback');
	        if (this.__audio) {
	            this.__audio.oncanplaythrough = undefined;
	            this.__audio.onerror = undefined;
	            this.__audio.onended = undefined;
	            this.__audio.onwaiting = undefined;
	            this.__audio.onstalled = undefined;
	            this.__audio.onsuspend = undefined;
	            this.__audio.onseeking = undefined;
	            this.__audio.onseeked = undefined;
	            if (this.__audio.readyState == 4) {
	                this.__audio.pause();
	            }
	            this.__audio.src = '';
	            delete this.__audio;
	            this.__audio = undefined;
	        }
	        if (this.__cueInTimeoutId !== 0) {
	            clearTimeout(this.__cueInTimeoutId);
	            this.__cueInTimeoutId = 0;
	        }
	        if (this.__restartTimeoutId !== 0) {
	            clearTimeout(this.__restartTimeoutId);
	            this.__restartTimeoutId = 0;
	        }
	        if (this.__positionIntervalId !== 0) {
	            clearInterval(this.__positionIntervalId);
	            this.__positionIntervalId = 0;
	        }
	    };
	    HTMLPlayer.prototype.__scheduleRestart = function () {
	        var _this = this;
	        if (this.__started) {
	            var timeout = 500 + Math.round(Math.random() * 250);
	            this.debug("Scheduling restart in " + timeout + " ms");
	            this.__restartTimeoutId = setTimeout(function () {
	                _this.__restartTimeoutId = 0;
	                _this.__preparePlayback();
	            }, timeout);
	        }
	    };
	    HTMLPlayer.prototype.__onPositionInterval = function () {
	        if (this.__audio) {
	            var position = Math.round(this.__audio.currentTime * 1000);
	            var cueInAt = this.__track.getCueInAt().valueOf();
	            var cueOutAt = this.__track.getCueOutAt().valueOf();
	            var duration = cueOutAt - cueInAt;
	            this._trigger('position', this.__track, position, duration);
	        }
	    };
	    return HTMLPlayer;
	}(Base_1.Base));
	exports.HTMLPlayer = HTMLPlayer;


/***/ }
/******/ ]);
//# sourceMappingURL=radiokit-toolkit-playback.js.map