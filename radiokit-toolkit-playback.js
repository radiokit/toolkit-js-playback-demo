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
	Object.defineProperty(exports, "__esModule", { value: true });
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
	var __extends = (this && this.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	var __assign = (this && this.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	var Base_1 = __webpack_require__(2);
	var SyncClock_1 = __webpack_require__(3);
	var PlaylistFetcher_1 = __webpack_require__(4);
	var AudioManager_1 = __webpack_require__(9);
	var StreamManager_1 = __webpack_require__(12);
	var Player = (function (_super) {
	    __extends(Player, _super);
	    function Player(channelId, accessToken, options) {
	        if (options === void 0) { options = {}; }
	        var _this = _super.call(this) || this;
	        _this.__fetchTimeoutId = 0;
	        _this.__playbackStartedEmitted = false;
	        _this.__playlist = null;
	        _this.__clock = null;
	        _this.__fetching = false;
	        _this.__playlistFetcher = null;
	        _this.__volume = 1.0;
	        _this.__options = { from: 20, to: 600 };
	        _this.__options = __assign({}, _this.__options, options);
	        _this.__started = false;
	        _this.__channelId = channelId;
	        _this.__accessToken = accessToken;
	        return _this;
	    }
	    Player.prototype.start = function () {
	        if (!this.__started) {
	            this.__startFetching();
	            this.__started = true;
	            this.__playbackStartedEmitted = false;
	            if (this.__supportsAudioManager()) {
	                this.debug("Using AudioManager");
	                this.__audioManager = new AudioManager_1.AudioManager();
	                this.__audioManager.setVolume(this.__volume);
	                this.__audioManager.on('playback-started', this.__onAudioManagerPlaybackStarted.bind(this));
	                this.__audioManager.on('position', this.__onAudioManagerPosition.bind(this));
	            }
	            else {
	                this.debug("Using StreamManager");
	                this.__streamManager = new StreamManager_1.StreamManager(this.__channelId);
	                this.__streamManager.setVolume(this.__volume);
	                this.__streamManager.on('channel-metadata-update', this.__onStreamManagerChannelMetadataUpdate.bind(this));
	                this.__streamManager.on('playback-started', this.__onStreamManagerPlaybackStarted.bind(this));
	                this.__streamManager.start();
	            }
	        }
	        return this;
	    };
	    Player.prototype.stop = function () {
	        if (this.__started) {
	            this.__started = false;
	            if (this.__audioManager) {
	                this.__audioManager.offAll();
	                this.__audioManager.cleanup();
	                delete this.__audioManager;
	                this.__audioManager = undefined;
	            }
	            else if (this.__streamManager) {
	                this.__streamManager.offAll();
	                this.__streamManager.stop();
	                delete this.__streamManager;
	                this.__streamManager = undefined;
	            }
	            return this;
	        }
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
	    Player.prototype.fetchPlaylist = function () {
	        this.__startFetching();
	        return this;
	    };
	    Player.prototype.stopFetching = function () {
	        if (this.__fetching) {
	            this.__fetching = false;
	            if (this.__fetchTimeoutId !== 0) {
	                clearTimeout(this.__fetchTimeoutId);
	                this.__fetchTimeoutId = 0;
	            }
	        }
	    };
	    Player.prototype._loggerTag = function () {
	        return this['constructor']['name'] + " " + this.__channelId;
	    };
	    Player.prototype.__supportsAudioManager = function () {
	        return (!this.__isAndroid() &&
	            !this.__isIPhone() &&
	            !this.__isSafari());
	    };
	    Player.prototype.__isAndroid = function () {
	        return navigator.userAgent.indexOf('Android') !== -1;
	    };
	    Player.prototype.__isIPhone = function () {
	        return navigator.userAgent.indexOf('iPhone') !== -1;
	    };
	    Player.prototype.__isSafari = function () {
	        return navigator.userAgent.indexOf('Chrome') === -1 && navigator.userAgent.indexOf('Safari') !== -1;
	    };
	    Player.prototype.__startFetching = function () {
	        if (!this.__fetching) {
	            this.__fetching = true;
	            this.__fetchOnceAndRepeat();
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
	                    _this.__playlistFetcher = new PlaylistFetcher_1.PlaylistFetcher(_this.__accessToken, _this.__channelId, clock, { from: _this.__options.from, to: _this.__options.to });
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
	            _this.__playlist = playlist;
	            _this.__onPlayListFetched(playlist);
	            _this.__started && _this.__audioManager && _this.__audioManager.update(_this.__playlist, _this.__clock);
	            _this.__scheduleNextFetch();
	        })
	            .catch(function (error) {
	            _this.__scheduleNextFetch();
	        });
	    };
	    Player.prototype.__scheduleNextFetch = function () {
	        var _this = this;
	        if (this.__fetching) {
	            var timeout = 2000 + Math.round(Math.random() * 250);
	            this.debug("Fetch: Scheduling next fetch in " + timeout + " ms");
	            this.__fetchTimeoutId = setTimeout(function () {
	                _this.__fetchTimeoutId = 0;
	                _this.__fetchOnceAndRepeat();
	            }, timeout);
	        }
	    };
	    Player.prototype.__onPlayListFetched = function (playlist) {
	        this._trigger('playlist-fetched', playlist);
	    };
	    Player.prototype.__onAudioManagerPosition = function (track, position, duration) {
	        this._trigger('track-position', track, position, duration);
	    };
	    Player.prototype.__onAudioManagerPlaybackStarted = function (track) {
	        if (!this.__playbackStartedEmitted) {
	            this._trigger('playback-started');
	            this.__playbackStartedEmitted = true;
	        }
	        this._trigger('track-playback-started', track);
	    };
	    Player.prototype.__onStreamManagerPlaybackStarted = function () {
	        if (!this.__playbackStartedEmitted) {
	            this._trigger('playback-started');
	            this.__playbackStartedEmitted = true;
	        }
	    };
	    Player.prototype.__onStreamManagerChannelMetadataUpdate = function (payload) {
	        this._trigger('channel-metadata-update', payload);
	    };
	    return Player;
	}(Base_1.Base));
	exports.Player = Player;


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
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
	var __extends = (this && this.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
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
	var __assign = (this && this.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	var PlaylistResolver_1 = __webpack_require__(5);
	var PlaylistFetcher = (function () {
	    function PlaylistFetcher(accessToken, channelId, clock, options) {
	        if (options === void 0) { options = {}; }
	        this.__options = { from: 20, to: 600 };
	        this.__options = __assign({}, this.__options, options);
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
	                '&s[]=cue%20' + encodeURIComponent(new Date(now).toISOString()) +
	                encodeURIComponent(" " + _this.__options.from + " " + _this.__options.to) +
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
	Object.defineProperty(exports, "__esModule", { value: true });
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
	Object.defineProperty(exports, "__esModule", { value: true });
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
	var __extends = (this && this.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
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
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var TrackInfo = (function () {
	    function TrackInfo(name, metadata) {
	        this.__name = name;
	        this.__metadata = metadata;
	    }
	    TrackInfo.makeFromJson = function (data) {
	        var name = data['name'];
	        var metadata = {};
	        var metadataSchemas = {};
	        for (var _i = 0, _a = data['metadata_schemas']; _i < _a.length; _i++) {
	            var metadataSchema = _a[_i];
	            metadataSchemas[metadataSchema['id']] = metadataSchema;
	        }
	        for (var _b = 0, _c = data['metadata_items']; _b < _c.length; _b++) {
	            var metadataItem = _c[_b];
	            var key = metadataSchemas[metadataItem['metadata_schema_id']].key;
	            var kind = metadataSchemas[metadataItem['metadata_schema_id']].kind;
	            var value = metadataItem["value_" + kind];
	            metadata[key] = value;
	        }
	        return new TrackInfo(name, metadata);
	    };
	    TrackInfo.prototype.getName = function () {
	        return this.__name;
	    };
	    TrackInfo.prototype.getMetadata = function () {
	        return this.__metadata;
	    };
	    return TrackInfo;
	}());
	exports.TrackInfo = TrackInfo;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	var Factory_1 = __webpack_require__(10);
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
	        return this;
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
	    AudioManager.prototype.__onAudioPlayerPlaybackStarted = function (audioPlayer) {
	        this.__currentTrack = audioPlayer.getTrack();
	        this._trigger('playback-started', this.__currentTrack);
	        for (var id in this.__audioPlayers) {
	            var iteratedAudioPlayer = this.__audioPlayers[id];
	            var iteratedTrack = iteratedAudioPlayer.getTrack();
	            if (iteratedAudioPlayer !== audioPlayer && iteratedTrack.getCueInAt() <= this.__currentTrack.getCueInAt()) {
	                this.debug("Applying fade out to player for track " + iteratedAudioPlayer.getTrack().getId() + " so it does not overlap with player for track " + audioPlayer.getTrack().getId());
	                iteratedAudioPlayer.fadeOut(1000);
	            }
	        }
	    };
	    AudioManager.prototype.__onAudioPlayerPosition = function (audioPlayer, position, duration) {
	        var track = audioPlayer.getTrack();
	        if (track === this.__currentTrack) {
	            this._trigger('position', track, position, duration);
	        }
	    };
	    return AudioManager;
	}(Base_1.Base));
	exports.AudioManager = AudioManager;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var HTMLPlayer_1 = __webpack_require__(11);
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
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	var Base_1 = __webpack_require__(2);
	var FADE_OUT_INTERVAL = 25;
	var HTMLPlayer = (function (_super) {
	    __extends(HTMLPlayer, _super);
	    function HTMLPlayer(track, clock) {
	        var _this = _super.call(this) || this;
	        _this.__started = false;
	        _this.__cueInTimeoutId = 0;
	        _this.__restartTimeoutId = 0;
	        _this.__positionIntervalId = 0;
	        _this.__volume = 1.0;
	        _this.__fadeVolumeMultiplier = 1.0;
	        _this.__fadeIntervalId = 0;
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
	            this.__audio.volume = volume * this.__fadeVolumeMultiplier;
	        }
	        return this;
	    };
	    HTMLPlayer.prototype.getTrack = function () {
	        return this.__track;
	    };
	    HTMLPlayer.prototype.fadeOut = function (duration) {
	        var _this = this;
	        if (this.__fadeIntervalId === 0) {
	            this.debug("Starting fade out of duration " + duration + " ms");
	            var step_1 = FADE_OUT_INTERVAL / duration;
	            this.__fadeIntervalId = setInterval(function () {
	                _this.__fadeVolumeMultiplier -= step_1;
	                if (_this.__fadeVolumeMultiplier <= 0) {
	                    _this.__fadeVolumeMultiplier = 0;
	                    clearInterval(_this.__fadeIntervalId);
	                    _this.__fadeIntervalId = 0;
	                    _this.debug("Finishing fade out");
	                }
	                _this.debug("Fade out: " + _this.__fadeVolumeMultiplier + "%");
	                if (_this.__audio) {
	                    _this.__audio.volume = _this.__volume * _this.__fadeVolumeMultiplier;
	                }
	            }, FADE_OUT_INTERVAL);
	        }
	        return this;
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
	        this.__fadeVolumeMultiplier = 1.0;
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
	        this._trigger('playback-started', this);
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
	        if (this.__fadeIntervalId !== 0) {
	            clearInterval(this.__fadeIntervalId);
	            this.__fadeIntervalId = 0;
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
	            this._trigger('position', this, position, duration);
	        }
	    };
	    return HTMLPlayer;
	}(Base_1.Base));
	exports.HTMLPlayer = HTMLPlayer;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	var Base_1 = __webpack_require__(2);
	var phoenix_1 = __webpack_require__(13);
	var StreamManager = (function (_super) {
	    __extends(StreamManager, _super);
	    function StreamManager(channelId) {
	        var _this = _super.call(this) || this;
	        _this.__volume = 1.0;
	        _this.__started = false;
	        _this.__restartTimeoutId = 0;
	        _this.__channelId = channelId;
	        _this.__socket = new phoenix_1.Socket("wss://agenda.radiokitapp.org/api/stream/v1.0");
	        return _this;
	    }
	    StreamManager.prototype.start = function () {
	        if (!this.__started) {
	            this.debug('Starting');
	            this.__started = true;
	            this.__startPlayback();
	            this.__subscribeMetadata();
	        }
	        else {
	            throw new Error('Attempt to start Stream Manager that is already started');
	        }
	        return this;
	    };
	    StreamManager.prototype.stop = function () {
	        if (this.__started) {
	            this.debug('Stopping');
	            this.__stopPlayback();
	            this.__unsubscribeMetadata();
	            this.__started = false;
	        }
	        else {
	            throw new Error('Attempt to stop Stream Manager that is not started');
	        }
	        return this;
	    };
	    StreamManager.prototype.setVolume = function (volume) {
	        if (volume < 0.0 || volume > 1.0) {
	            throw new Error('Volume out of range');
	        }
	        this.__volume = volume;
	        if (this.__audio) {
	            this.__audio.volume = volume;
	        }
	        return this;
	    };
	    StreamManager.prototype._loggerTag = function () {
	        return "" + this['constructor']['name'];
	    };
	    StreamManager.prototype.__onAudioError = function (e) {
	        this.warn('Error');
	        this.__stopPlayback();
	        this.__scheduleRestart();
	    };
	    StreamManager.prototype.__onAudioEnded = function (e) {
	        this.debug('EOS');
	        this.__stopPlayback();
	        this.__scheduleRestart();
	    };
	    StreamManager.prototype.__onAudioWaiting = function (e) {
	        this.warn('Waiting');
	    };
	    StreamManager.prototype.__onAudioStalled = function (e) {
	        this.warn('Stalled');
	    };
	    StreamManager.prototype.__onAudioSuspended = function (e) {
	        this.warn('Suspended');
	    };
	    StreamManager.prototype.__subscribeMetadata = function () {
	        var _this = this;
	        this.__socket.connect();
	        this.__channel = this.__socket.channel("broadcast:metadata:" + this.__channelId);
	        this.__channel.on("update", function (payload) {
	            _this.debug("Received metadata: payload = " + JSON.stringify(payload));
	            _this._trigger("channel-metadata-update", payload);
	        });
	        this.__channel.join()
	            .receive("ok", function (_a) {
	            var messages = _a.messages;
	            return _this.debug("Subscribed to metadata");
	        })
	            .receive("error", function (_a) {
	            var reason = _a.reason;
	            return _this.warn("Failed to subscribe to metadata: error = " + reason);
	        })
	            .receive("timeout", function () { return _this.warn("Failed to subscribe to metadata: timeout"); });
	    };
	    StreamManager.prototype.__unsubscribeMetadata = function () {
	        this.__channel.leave();
	        this.__socket.disconnect();
	    };
	    StreamManager.prototype.__startPlayback = function () {
	        this.debug('Starting playback');
	        this.__audio = new Audio();
	        this.__audio.volume = this.__volume;
	        this.__audio.src = "http://cluster.radiokitstream.org/" + this.__channelId + ".mp3";
	        this.__audio.onerror = this.__onAudioError.bind(this);
	        this.__audio.onended = this.__onAudioEnded.bind(this);
	        this.__audio.onwaiting = this.__onAudioWaiting.bind(this);
	        this.__audio.onstalled = this.__onAudioStalled.bind(this);
	        this.__audio.onsuspend = this.__onAudioSuspended.bind(this);
	        this.__audio.play();
	        this._trigger('playback-started');
	    };
	    StreamManager.prototype.__stopPlayback = function () {
	        this.debug('Stopping playback');
	        if (this.__audio) {
	            this.__audio.onerror = undefined;
	            this.__audio.onended = undefined;
	            this.__audio.onwaiting = undefined;
	            this.__audio.onstalled = undefined;
	            this.__audio.onsuspend = undefined;
	            if (this.__audio.readyState == 4) {
	                this.__audio.pause();
	            }
	            this.__audio.src = '';
	            delete this.__audio;
	            this.__audio = undefined;
	        }
	        if (this.__restartTimeoutId !== 0) {
	            clearTimeout(this.__restartTimeoutId);
	            this.__restartTimeoutId = 0;
	        }
	    };
	    StreamManager.prototype.__scheduleRestart = function () {
	        var _this = this;
	        if (this.__started) {
	            var timeout = 500 + Math.round(Math.random() * 250);
	            this.debug("Scheduling restart in " + timeout + " ms");
	            this.__restartTimeoutId = setTimeout(function () {
	                _this.__restartTimeoutId = 0;
	                _this.__startPlayback();
	            }, timeout);
	        }
	    };
	    return StreamManager;
	}(Base_1.Base));
	exports.StreamManager = StreamManager;


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	(function(exports){
	"use strict";
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	// Phoenix Channels JavaScript client
	//
	// ## Socket Connection
	//
	// A single connection is established to the server and
	// channels are multiplexed over the connection.
	// Connect to the server using the `Socket` class:
	//
	//     let socket = new Socket("/ws", {params: {userToken: "123"}})
	//     socket.connect()
	//
	// The `Socket` constructor takes the mount point of the socket,
	// the authentication params, as well as options that can be found in
	// the Socket docs, such as configuring the `LongPoll` transport, and
	// heartbeat.
	//
	// ## Channels
	//
	// Channels are isolated, concurrent processes on the server that
	// subscribe to topics and broker events between the client and server.
	// To join a channel, you must provide the topic, and channel params for
	// authorization. Here's an example chat room example where `"new_msg"`
	// events are listened for, messages are pushed to the server, and
	// the channel is joined with ok/error/timeout matches:
	//
	//     let channel = socket.channel("room:123", {token: roomToken})
	//     channel.on("new_msg", msg => console.log("Got message", msg) )
	//     $input.onEnter( e => {
	//       channel.push("new_msg", {body: e.target.val}, 10000)
	//        .receive("ok", (msg) => console.log("created message", msg) )
	//        .receive("error", (reasons) => console.log("create failed", reasons) )
	//        .receive("timeout", () => console.log("Networking issue...") )
	//     })
	//     channel.join()
	//       .receive("ok", ({messages}) => console.log("catching up", messages) )
	//       .receive("error", ({reason}) => console.log("failed join", reason) )
	//       .receive("timeout", () => console.log("Networking issue. Still waiting...") )
	//
	//
	// ## Joining
	//
	// Creating a channel with `socket.channel(topic, params)`, binds the params to
	// `channel.params`, which are sent up on `channel.join()`.
	// Subsequent rejoins will send up the modified params for
	// updating authorization params, or passing up last_message_id information.
	// Successful joins receive an "ok" status, while unsuccessful joins
	// receive "error".
	//
	// ## Duplicate Join Subscriptions
	//
	// While the client may join any number of topics on any number of channels,
	// the client may only hold a single subscription for each unique topic at any
	// given time. When attempting to create a duplicate subscription,
	// the server will close the existing channel, log a warning, and
	// spawn a new channel for the topic. The client will have their
	// `channel.onClose` callbacks fired for the existing channel, and the new
	// channel join will have its receive hooks processed as normal.
	//
	// ## Pushing Messages
	//
	// From the previous example, we can see that pushing messages to the server
	// can be done with `channel.push(eventName, payload)` and we can optionally
	// receive responses from the push. Additionally, we can use
	// `receive("timeout", callback)` to abort waiting for our other `receive` hooks
	//  and take action after some period of waiting. The default timeout is 5000ms.
	//
	//
	// ## Socket Hooks
	//
	// Lifecycle events of the multiplexed connection can be hooked into via
	// `socket.onError()` and `socket.onClose()` events, ie:
	//
	//     socket.onError( () => console.log("there was an error with the connection!") )
	//     socket.onClose( () => console.log("the connection dropped") )
	//
	//
	// ## Channel Hooks
	//
	// For each joined channel, you can bind to `onError` and `onClose` events
	// to monitor the channel lifecycle, ie:
	//
	//     channel.onError( () => console.log("there was an error!") )
	//     channel.onClose( () => console.log("the channel has gone away gracefully") )
	//
	// ### onError hooks
	//
	// `onError` hooks are invoked if the socket connection drops, or the channel
	// crashes on the server. In either case, a channel rejoin is attempted
	// automatically in an exponential backoff manner.
	//
	// ### onClose hooks
	//
	// `onClose` hooks are invoked only in two cases. 1) the channel explicitly
	// closed on the server, or 2). The client explicitly closed, by calling
	// `channel.leave()`
	//
	//
	// ## Presence
	//
	// The `Presence` object provides features for syncing presence information
	// from the server with the client and handling presences joining and leaving.
	//
	// ### Syncing initial state from the server
	//
	// `Presence.syncState` is used to sync the list of presences on the server
	// with the client's state. An optional `onJoin` and `onLeave` callback can
	// be provided to react to changes in the client's local presences across
	// disconnects and reconnects with the server.
	//
	// `Presence.syncDiff` is used to sync a diff of presence join and leave
	// events from the server, as they happen. Like `syncState`, `syncDiff`
	// accepts optional `onJoin` and `onLeave` callbacks to react to a user
	// joining or leaving from a device.
	//
	// ### Listing Presences
	//
	// `Presence.list` is used to return a list of presence information
	// based on the local state of metadata. By default, all presence
	// metadata is returned, but a `listBy` function can be supplied to
	// allow the client to select which metadata to use for a given presence.
	// For example, you may have a user online from different devices with a
	// a metadata status of "online", but they have set themselves to "away"
	// on another device. In this case, they app may choose to use the "away"
	// status for what appears on the UI. The example below defines a `listBy`
	// function which prioritizes the first metadata which was registered for
	// each user. This could be the first tab they opened, or the first device
	// they came online from:
	//
	//     let state = {}
	//     state = Presence.syncState(state, stateFromServer)
	//     let listBy = (id, {metas: [first, ...rest]}) => {
	//       first.count = rest.length + 1 // count of this user's presences
	//       first.id = id
	//       return first
	//     }
	//     let onlineUsers = Presence.list(state, listBy)
	//
	//
	// ### Example Usage
	//
	//     // detect if user has joined for the 1st time or from another tab/device
	//     let onJoin = (id, current, newPres) => {
	//       if(!current){
	//         console.log("user has entered for the first time", newPres)
	//       } else {
	//         console.log("user additional presence", newPres)
	//       }
	//     }
	//     // detect if user has left from all tabs/devices, or is still present
	//     let onLeave = (id, current, leftPres) => {
	//       if(current.metas.length === 0){
	//         console.log("user has left from all devices", leftPres)
	//       } else {
	//         console.log("user left from a device", leftPres)
	//       }
	//     }
	//     let presences = {} // client's initial empty presence state
	//     // receive initial presence data from server, sent after join
	//     myChannel.on("presence_state", state => {
	//       presences = Presence.syncState(presences, state, onJoin, onLeave)
	//       displayUsers(Presence.list(presences))
	//     })
	//     // receive "presence_diff" from server, containing join/leave events
	//     myChannel.on("presence_diff", diff => {
	//       presences = Presence.syncDiff(presences, diff, onJoin, onLeave)
	//       this.setState({users: Presence.list(room.presences, listBy)})
	//     })
	//
	var VSN = "1.0.0";
	var SOCKET_STATES = { connecting: 0, open: 1, closing: 2, closed: 3 };
	var DEFAULT_TIMEOUT = 10000;
	var CHANNEL_STATES = {
	  closed: "closed",
	  errored: "errored",
	  joined: "joined",
	  joining: "joining",
	  leaving: "leaving"
	};
	var CHANNEL_EVENTS = {
	  close: "phx_close",
	  error: "phx_error",
	  join: "phx_join",
	  reply: "phx_reply",
	  leave: "phx_leave"
	};
	var TRANSPORTS = {
	  longpoll: "longpoll",
	  websocket: "websocket"
	};
	
	var Push = function () {
	
	  // Initializes the Push
	  //
	  // channel - The Channel
	  // event - The event, for example `"phx_join"`
	  // payload - The payload, for example `{user_id: 123}`
	  // timeout - The push timeout in milliseconds
	  //
	
	  function Push(channel, event, payload, timeout) {
	    _classCallCheck(this, Push);
	
	    this.channel = channel;
	    this.event = event;
	    this.payload = payload || {};
	    this.receivedResp = null;
	    this.timeout = timeout;
	    this.timeoutTimer = null;
	    this.recHooks = [];
	    this.sent = false;
	  }
	
	  _createClass(Push, [{
	    key: "resend",
	    value: function resend(timeout) {
	      this.timeout = timeout;
	      this.cancelRefEvent();
	      this.ref = null;
	      this.refEvent = null;
	      this.receivedResp = null;
	      this.sent = false;
	      this.send();
	    }
	  }, {
	    key: "send",
	    value: function send() {
	      if (this.hasReceived("timeout")) {
	        return;
	      }
	      this.startTimeout();
	      this.sent = true;
	      this.channel.socket.push({
	        topic: this.channel.topic,
	        event: this.event,
	        payload: this.payload,
	        ref: this.ref
	      });
	    }
	  }, {
	    key: "receive",
	    value: function receive(status, callback) {
	      if (this.hasReceived(status)) {
	        callback(this.receivedResp.response);
	      }
	
	      this.recHooks.push({ status: status, callback: callback });
	      return this;
	    }
	
	    // private
	
	  }, {
	    key: "matchReceive",
	    value: function matchReceive(_ref) {
	      var status = _ref.status;
	      var response = _ref.response;
	      var ref = _ref.ref;
	
	      this.recHooks.filter(function (h) {
	        return h.status === status;
	      }).forEach(function (h) {
	        return h.callback(response);
	      });
	    }
	  }, {
	    key: "cancelRefEvent",
	    value: function cancelRefEvent() {
	      if (!this.refEvent) {
	        return;
	      }
	      this.channel.off(this.refEvent);
	    }
	  }, {
	    key: "cancelTimeout",
	    value: function cancelTimeout() {
	      clearTimeout(this.timeoutTimer);
	      this.timeoutTimer = null;
	    }
	  }, {
	    key: "startTimeout",
	    value: function startTimeout() {
	      var _this = this;
	
	      if (this.timeoutTimer) {
	        return;
	      }
	      this.ref = this.channel.socket.makeRef();
	      this.refEvent = this.channel.replyEventName(this.ref);
	
	      this.channel.on(this.refEvent, function (payload) {
	        _this.cancelRefEvent();
	        _this.cancelTimeout();
	        _this.receivedResp = payload;
	        _this.matchReceive(payload);
	      });
	
	      this.timeoutTimer = setTimeout(function () {
	        _this.trigger("timeout", {});
	      }, this.timeout);
	    }
	  }, {
	    key: "hasReceived",
	    value: function hasReceived(status) {
	      return this.receivedResp && this.receivedResp.status === status;
	    }
	  }, {
	    key: "trigger",
	    value: function trigger(status, response) {
	      this.channel.trigger(this.refEvent, { status: status, response: response });
	    }
	  }]);
	
	  return Push;
	}();
	
	var Channel = exports.Channel = function () {
	  function Channel(topic, params, socket) {
	    var _this2 = this;
	
	    _classCallCheck(this, Channel);
	
	    this.state = CHANNEL_STATES.closed;
	    this.topic = topic;
	    this.params = params || {};
	    this.socket = socket;
	    this.bindings = [];
	    this.timeout = this.socket.timeout;
	    this.joinedOnce = false;
	    this.joinPush = new Push(this, CHANNEL_EVENTS.join, this.params, this.timeout);
	    this.pushBuffer = [];
	    this.rejoinTimer = new Timer(function () {
	      return _this2.rejoinUntilConnected();
	    }, this.socket.reconnectAfterMs);
	    this.joinPush.receive("ok", function () {
	      _this2.state = CHANNEL_STATES.joined;
	      _this2.rejoinTimer.reset();
	      _this2.pushBuffer.forEach(function (pushEvent) {
	        return pushEvent.send();
	      });
	      _this2.pushBuffer = [];
	    });
	    this.onClose(function () {
	      _this2.rejoinTimer.reset();
	      _this2.socket.log("channel", "close " + _this2.topic + " " + _this2.joinRef());
	      _this2.state = CHANNEL_STATES.closed;
	      _this2.socket.remove(_this2);
	    });
	    this.onError(function (reason) {
	      if (_this2.isLeaving() || _this2.isClosed()) {
	        return;
	      }
	      _this2.socket.log("channel", "error " + _this2.topic, reason);
	      _this2.state = CHANNEL_STATES.errored;
	      _this2.rejoinTimer.scheduleTimeout();
	    });
	    this.joinPush.receive("timeout", function () {
	      if (!_this2.isJoining()) {
	        return;
	      }
	      _this2.socket.log("channel", "timeout " + _this2.topic, _this2.joinPush.timeout);
	      _this2.state = CHANNEL_STATES.errored;
	      _this2.rejoinTimer.scheduleTimeout();
	    });
	    this.on(CHANNEL_EVENTS.reply, function (payload, ref) {
	      _this2.trigger(_this2.replyEventName(ref), payload);
	    });
	  }
	
	  _createClass(Channel, [{
	    key: "rejoinUntilConnected",
	    value: function rejoinUntilConnected() {
	      this.rejoinTimer.scheduleTimeout();
	      if (this.socket.isConnected()) {
	        this.rejoin();
	      }
	    }
	  }, {
	    key: "join",
	    value: function join() {
	      var timeout = arguments.length <= 0 || arguments[0] === undefined ? this.timeout : arguments[0];
	
	      if (this.joinedOnce) {
	        throw "tried to join multiple times. 'join' can only be called a single time per channel instance";
	      } else {
	        this.joinedOnce = true;
	        this.rejoin(timeout);
	        return this.joinPush;
	      }
	    }
	  }, {
	    key: "onClose",
	    value: function onClose(callback) {
	      this.on(CHANNEL_EVENTS.close, callback);
	    }
	  }, {
	    key: "onError",
	    value: function onError(callback) {
	      this.on(CHANNEL_EVENTS.error, function (reason) {
	        return callback(reason);
	      });
	    }
	  }, {
	    key: "on",
	    value: function on(event, callback) {
	      this.bindings.push({ event: event, callback: callback });
	    }
	  }, {
	    key: "off",
	    value: function off(event) {
	      this.bindings = this.bindings.filter(function (bind) {
	        return bind.event !== event;
	      });
	    }
	  }, {
	    key: "canPush",
	    value: function canPush() {
	      return this.socket.isConnected() && this.isJoined();
	    }
	  }, {
	    key: "push",
	    value: function push(event, payload) {
	      var timeout = arguments.length <= 2 || arguments[2] === undefined ? this.timeout : arguments[2];
	
	      if (!this.joinedOnce) {
	        throw "tried to push '" + event + "' to '" + this.topic + "' before joining. Use channel.join() before pushing events";
	      }
	      var pushEvent = new Push(this, event, payload, timeout);
	      if (this.canPush()) {
	        pushEvent.send();
	      } else {
	        pushEvent.startTimeout();
	        this.pushBuffer.push(pushEvent);
	      }
	
	      return pushEvent;
	    }
	
	    // Leaves the channel
	    //
	    // Unsubscribes from server events, and
	    // instructs channel to terminate on server
	    //
	    // Triggers onClose() hooks
	    //
	    // To receive leave acknowledgements, use the a `receive`
	    // hook to bind to the server ack, ie:
	    //
	    //     channel.leave().receive("ok", () => alert("left!") )
	    //
	
	  }, {
	    key: "leave",
	    value: function leave() {
	      var _this3 = this;
	
	      var timeout = arguments.length <= 0 || arguments[0] === undefined ? this.timeout : arguments[0];
	
	      this.state = CHANNEL_STATES.leaving;
	      var onClose = function onClose() {
	        _this3.socket.log("channel", "leave " + _this3.topic);
	        _this3.trigger(CHANNEL_EVENTS.close, "leave", _this3.joinRef());
	      };
	      var leavePush = new Push(this, CHANNEL_EVENTS.leave, {}, timeout);
	      leavePush.receive("ok", function () {
	        return onClose();
	      }).receive("timeout", function () {
	        return onClose();
	      });
	      leavePush.send();
	      if (!this.canPush()) {
	        leavePush.trigger("ok", {});
	      }
	
	      return leavePush;
	    }
	
	    // Overridable message hook
	    //
	    // Receives all events for specialized message handling
	    // before dispatching to the channel callbacks.
	    //
	    // Must return the payload, modified or unmodified
	
	  }, {
	    key: "onMessage",
	    value: function onMessage(event, payload, ref) {
	      return payload;
	    }
	
	    // private
	
	  }, {
	    key: "isMember",
	    value: function isMember(topic) {
	      return this.topic === topic;
	    }
	  }, {
	    key: "joinRef",
	    value: function joinRef() {
	      return this.joinPush.ref;
	    }
	  }, {
	    key: "sendJoin",
	    value: function sendJoin(timeout) {
	      this.state = CHANNEL_STATES.joining;
	      this.joinPush.resend(timeout);
	    }
	  }, {
	    key: "rejoin",
	    value: function rejoin() {
	      var timeout = arguments.length <= 0 || arguments[0] === undefined ? this.timeout : arguments[0];
	      if (this.isLeaving()) {
	        return;
	      }
	      this.sendJoin(timeout);
	    }
	  }, {
	    key: "trigger",
	    value: function trigger(event, payload, ref) {
	      var close = CHANNEL_EVENTS.close;
	      var error = CHANNEL_EVENTS.error;
	      var leave = CHANNEL_EVENTS.leave;
	      var join = CHANNEL_EVENTS.join;
	
	      if (ref && [close, error, leave, join].indexOf(event) >= 0 && ref !== this.joinRef()) {
	        return;
	      }
	      var handledPayload = this.onMessage(event, payload, ref);
	      if (payload && !handledPayload) {
	        throw "channel onMessage callbacks must return the payload, modified or unmodified";
	      }
	
	      this.bindings.filter(function (bind) {
	        return bind.event === event;
	      }).map(function (bind) {
	        return bind.callback(handledPayload, ref);
	      });
	    }
	  }, {
	    key: "replyEventName",
	    value: function replyEventName(ref) {
	      return "chan_reply_" + ref;
	    }
	  }, {
	    key: "isClosed",
	    value: function isClosed() {
	      return this.state === CHANNEL_STATES.closed;
	    }
	  }, {
	    key: "isErrored",
	    value: function isErrored() {
	      return this.state === CHANNEL_STATES.errored;
	    }
	  }, {
	    key: "isJoined",
	    value: function isJoined() {
	      return this.state === CHANNEL_STATES.joined;
	    }
	  }, {
	    key: "isJoining",
	    value: function isJoining() {
	      return this.state === CHANNEL_STATES.joining;
	    }
	  }, {
	    key: "isLeaving",
	    value: function isLeaving() {
	      return this.state === CHANNEL_STATES.leaving;
	    }
	  }]);
	
	  return Channel;
	}();
	
	var Socket = exports.Socket = function () {
	
	  // Initializes the Socket
	  //
	  // endPoint - The string WebSocket endpoint, ie, "ws://example.com/ws",
	  //                                               "wss://example.com"
	  //                                               "/ws" (inherited host & protocol)
	  // opts - Optional configuration
	  //   transport - The Websocket Transport, for example WebSocket or Phoenix.LongPoll.
	  //               Defaults to WebSocket with automatic LongPoll fallback.
	  //   timeout - The default timeout in milliseconds to trigger push timeouts.
	  //             Defaults `DEFAULT_TIMEOUT`
	  //   heartbeatIntervalMs - The millisec interval to send a heartbeat message
	  //   reconnectAfterMs - The optional function that returns the millsec
	  //                      reconnect interval. Defaults to stepped backoff of:
	  //
	  //     function(tries){
	  //       return [1000, 5000, 10000][tries - 1] || 10000
	  //     }
	  //
	  //   logger - The optional function for specialized logging, ie:
	  //     `logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
	  //
	  //   longpollerTimeout - The maximum timeout of a long poll AJAX request.
	  //                        Defaults to 20s (double the server long poll timer).
	  //
	  //   params - The optional params to pass when connecting
	  //
	  // For IE8 support use an ES5-shim (https://github.com/es-shims/es5-shim)
	  //
	
	  function Socket(endPoint) {
	    var _this4 = this;
	
	    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
	
	    _classCallCheck(this, Socket);
	
	    this.stateChangeCallbacks = { open: [], close: [], error: [], message: [] };
	    this.channels = [];
	    this.sendBuffer = [];
	    this.ref = 0;
	    this.timeout = opts.timeout || DEFAULT_TIMEOUT;
	    this.transport = opts.transport || window.WebSocket || LongPoll;
	    this.heartbeatIntervalMs = opts.heartbeatIntervalMs || 30000;
	    this.reconnectAfterMs = opts.reconnectAfterMs || function (tries) {
	      return [1000, 2000, 5000, 10000][tries - 1] || 10000;
	    };
	    this.logger = opts.logger || function () {}; // noop
	    this.longpollerTimeout = opts.longpollerTimeout || 20000;
	    this.params = opts.params || {};
	    this.endPoint = endPoint + "/" + TRANSPORTS.websocket;
	    this.reconnectTimer = new Timer(function () {
	      _this4.disconnect(function () {
	        return _this4.connect();
	      });
	    }, this.reconnectAfterMs);
	  }
	
	  _createClass(Socket, [{
	    key: "protocol",
	    value: function protocol() {
	      return location.protocol.match(/^https/) ? "wss" : "ws";
	    }
	  }, {
	    key: "endPointURL",
	    value: function endPointURL() {
	      var uri = Ajax.appendParams(Ajax.appendParams(this.endPoint, this.params), { vsn: VSN });
	      if (uri.charAt(0) !== "/") {
	        return uri;
	      }
	      if (uri.charAt(1) === "/") {
	        return this.protocol() + ":" + uri;
	      }
	
	      return this.protocol() + "://" + location.host + uri;
	    }
	  }, {
	    key: "disconnect",
	    value: function disconnect(callback, code, reason) {
	      if (this.conn) {
	        this.conn.onclose = function () {}; // noop
	        if (code) {
	          this.conn.close(code, reason || "");
	        } else {
	          this.conn.close();
	        }
	        this.conn = null;
	      }
	      callback && callback();
	    }
	
	    // params - The params to send when connecting, for example `{user_id: userToken}`
	
	  }, {
	    key: "connect",
	    value: function connect(params) {
	      var _this5 = this;
	
	      if (params) {
	        console && console.log("passing params to connect is deprecated. Instead pass :params to the Socket constructor");
	        this.params = params;
	      }
	      if (this.conn) {
	        return;
	      }
	
	      this.conn = new this.transport(this.endPointURL());
	      this.conn.timeout = this.longpollerTimeout;
	      this.conn.onopen = function () {
	        return _this5.onConnOpen();
	      };
	      this.conn.onerror = function (error) {
	        return _this5.onConnError(error);
	      };
	      this.conn.onmessage = function (event) {
	        return _this5.onConnMessage(event);
	      };
	      this.conn.onclose = function (event) {
	        return _this5.onConnClose(event);
	      };
	    }
	
	    // Logs the message. Override `this.logger` for specialized logging. noops by default
	
	  }, {
	    key: "log",
	    value: function log(kind, msg, data) {
	      this.logger(kind, msg, data);
	    }
	
	    // Registers callbacks for connection state change events
	    //
	    // Examples
	    //
	    //    socket.onError(function(error){ alert("An error occurred") })
	    //
	
	  }, {
	    key: "onOpen",
	    value: function onOpen(callback) {
	      this.stateChangeCallbacks.open.push(callback);
	    }
	  }, {
	    key: "onClose",
	    value: function onClose(callback) {
	      this.stateChangeCallbacks.close.push(callback);
	    }
	  }, {
	    key: "onError",
	    value: function onError(callback) {
	      this.stateChangeCallbacks.error.push(callback);
	    }
	  }, {
	    key: "onMessage",
	    value: function onMessage(callback) {
	      this.stateChangeCallbacks.message.push(callback);
	    }
	  }, {
	    key: "onConnOpen",
	    value: function onConnOpen() {
	      var _this6 = this;
	
	      this.log("transport", "connected to " + this.endPointURL());
	      this.flushSendBuffer();
	      this.reconnectTimer.reset();
	      if (!this.conn.skipHeartbeat) {
	        clearInterval(this.heartbeatTimer);
	        this.heartbeatTimer = setInterval(function () {
	          return _this6.sendHeartbeat();
	        }, this.heartbeatIntervalMs);
	      }
	      this.stateChangeCallbacks.open.forEach(function (callback) {
	        return callback();
	      });
	    }
	  }, {
	    key: "onConnClose",
	    value: function onConnClose(event) {
	      this.log("transport", "close", event);
	      this.triggerChanError();
	      clearInterval(this.heartbeatTimer);
	      this.reconnectTimer.scheduleTimeout();
	      this.stateChangeCallbacks.close.forEach(function (callback) {
	        return callback(event);
	      });
	    }
	  }, {
	    key: "onConnError",
	    value: function onConnError(error) {
	      this.log("transport", error);
	      this.triggerChanError();
	      this.stateChangeCallbacks.error.forEach(function (callback) {
	        return callback(error);
	      });
	    }
	  }, {
	    key: "triggerChanError",
	    value: function triggerChanError() {
	      this.channels.forEach(function (channel) {
	        return channel.trigger(CHANNEL_EVENTS.error);
	      });
	    }
	  }, {
	    key: "connectionState",
	    value: function connectionState() {
	      switch (this.conn && this.conn.readyState) {
	        case SOCKET_STATES.connecting:
	          return "connecting";
	        case SOCKET_STATES.open:
	          return "open";
	        case SOCKET_STATES.closing:
	          return "closing";
	        default:
	          return "closed";
	      }
	    }
	  }, {
	    key: "isConnected",
	    value: function isConnected() {
	      return this.connectionState() === "open";
	    }
	  }, {
	    key: "remove",
	    value: function remove(channel) {
	      this.channels = this.channels.filter(function (c) {
	        return c.joinRef() !== channel.joinRef();
	      });
	    }
	  }, {
	    key: "channel",
	    value: function channel(topic) {
	      var chanParams = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
	
	      var chan = new Channel(topic, chanParams, this);
	      this.channels.push(chan);
	      return chan;
	    }
	  }, {
	    key: "push",
	    value: function push(data) {
	      var _this7 = this;
	
	      var topic = data.topic;
	      var event = data.event;
	      var payload = data.payload;
	      var ref = data.ref;
	
	      var callback = function callback() {
	        return _this7.conn.send(JSON.stringify(data));
	      };
	      this.log("push", topic + " " + event + " (" + ref + ")", payload);
	      if (this.isConnected()) {
	        callback();
	      } else {
	        this.sendBuffer.push(callback);
	      }
	    }
	
	    // Return the next message ref, accounting for overflows
	
	  }, {
	    key: "makeRef",
	    value: function makeRef() {
	      var newRef = this.ref + 1;
	      if (newRef === this.ref) {
	        this.ref = 0;
	      } else {
	        this.ref = newRef;
	      }
	
	      return this.ref.toString();
	    }
	  }, {
	    key: "sendHeartbeat",
	    value: function sendHeartbeat() {
	      if (!this.isConnected()) {
	        return;
	      }
	      this.push({ topic: "phoenix", event: "heartbeat", payload: {}, ref: this.makeRef() });
	    }
	  }, {
	    key: "flushSendBuffer",
	    value: function flushSendBuffer() {
	      if (this.isConnected() && this.sendBuffer.length > 0) {
	        this.sendBuffer.forEach(function (callback) {
	          return callback();
	        });
	        this.sendBuffer = [];
	      }
	    }
	  }, {
	    key: "onConnMessage",
	    value: function onConnMessage(rawMessage) {
	      var msg = JSON.parse(rawMessage.data);
	      var topic = msg.topic;
	      var event = msg.event;
	      var payload = msg.payload;
	      var ref = msg.ref;
	
	      this.log("receive", (payload.status || "") + " " + topic + " " + event + " " + (ref && "(" + ref + ")" || ""), payload);
	      this.channels.filter(function (channel) {
	        return channel.isMember(topic);
	      }).forEach(function (channel) {
	        return channel.trigger(event, payload, ref);
	      });
	      this.stateChangeCallbacks.message.forEach(function (callback) {
	        return callback(msg);
	      });
	    }
	  }]);
	
	  return Socket;
	}();
	
	var LongPoll = exports.LongPoll = function () {
	  function LongPoll(endPoint) {
	    _classCallCheck(this, LongPoll);
	
	    this.endPoint = null;
	    this.token = null;
	    this.skipHeartbeat = true;
	    this.onopen = function () {}; // noop
	    this.onerror = function () {}; // noop
	    this.onmessage = function () {}; // noop
	    this.onclose = function () {}; // noop
	    this.pollEndpoint = this.normalizeEndpoint(endPoint);
	    this.readyState = SOCKET_STATES.connecting;
	
	    this.poll();
	  }
	
	  _createClass(LongPoll, [{
	    key: "normalizeEndpoint",
	    value: function normalizeEndpoint(endPoint) {
	      return endPoint.replace("ws://", "http://").replace("wss://", "https://").replace(new RegExp("(.*)\/" + TRANSPORTS.websocket), "$1/" + TRANSPORTS.longpoll);
	    }
	  }, {
	    key: "endpointURL",
	    value: function endpointURL() {
	      return Ajax.appendParams(this.pollEndpoint, { token: this.token });
	    }
	  }, {
	    key: "closeAndRetry",
	    value: function closeAndRetry() {
	      this.close();
	      this.readyState = SOCKET_STATES.connecting;
	    }
	  }, {
	    key: "ontimeout",
	    value: function ontimeout() {
	      this.onerror("timeout");
	      this.closeAndRetry();
	    }
	  }, {
	    key: "poll",
	    value: function poll() {
	      var _this8 = this;
	
	      if (!(this.readyState === SOCKET_STATES.open || this.readyState === SOCKET_STATES.connecting)) {
	        return;
	      }
	
	      Ajax.request("GET", this.endpointURL(), "application/json", null, this.timeout, this.ontimeout.bind(this), function (resp) {
	        if (resp) {
	          var status = resp.status;
	          var token = resp.token;
	          var messages = resp.messages;
	
	          _this8.token = token;
	        } else {
	          var status = 0;
	        }
	
	        switch (status) {
	          case 200:
	            messages.forEach(function (msg) {
	              return _this8.onmessage({ data: JSON.stringify(msg) });
	            });
	            _this8.poll();
	            break;
	          case 204:
	            _this8.poll();
	            break;
	          case 410:
	            _this8.readyState = SOCKET_STATES.open;
	            _this8.onopen();
	            _this8.poll();
	            break;
	          case 0:
	          case 500:
	            _this8.onerror();
	            _this8.closeAndRetry();
	            break;
	          default:
	            throw "unhandled poll status " + status;
	        }
	      });
	    }
	  }, {
	    key: "send",
	    value: function send(body) {
	      var _this9 = this;
	
	      Ajax.request("POST", this.endpointURL(), "application/json", body, this.timeout, this.onerror.bind(this, "timeout"), function (resp) {
	        if (!resp || resp.status !== 200) {
	          _this9.onerror(status);
	          _this9.closeAndRetry();
	        }
	      });
	    }
	  }, {
	    key: "close",
	    value: function close(code, reason) {
	      this.readyState = SOCKET_STATES.closed;
	      this.onclose();
	    }
	  }]);
	
	  return LongPoll;
	}();
	
	var Ajax = exports.Ajax = function () {
	  function Ajax() {
	    _classCallCheck(this, Ajax);
	  }
	
	  _createClass(Ajax, null, [{
	    key: "request",
	    value: function request(method, endPoint, accept, body, timeout, ontimeout, callback) {
	      if (window.XDomainRequest) {
	        var req = new XDomainRequest(); // IE8, IE9
	        this.xdomainRequest(req, method, endPoint, body, timeout, ontimeout, callback);
	      } else {
	        var req = window.XMLHttpRequest ? new XMLHttpRequest() : // IE7+, Firefox, Chrome, Opera, Safari
	        new ActiveXObject("Microsoft.XMLHTTP"); // IE6, IE5
	        this.xhrRequest(req, method, endPoint, accept, body, timeout, ontimeout, callback);
	      }
	    }
	  }, {
	    key: "xdomainRequest",
	    value: function xdomainRequest(req, method, endPoint, body, timeout, ontimeout, callback) {
	      var _this10 = this;
	
	      req.timeout = timeout;
	      req.open(method, endPoint);
	      req.onload = function () {
	        var response = _this10.parseJSON(req.responseText);
	        callback && callback(response);
	      };
	      if (ontimeout) {
	        req.ontimeout = ontimeout;
	      }
	
	      // Work around bug in IE9 that requires an attached onprogress handler
	      req.onprogress = function () {};
	
	      req.send(body);
	    }
	  }, {
	    key: "xhrRequest",
	    value: function xhrRequest(req, method, endPoint, accept, body, timeout, ontimeout, callback) {
	      var _this11 = this;
	
	      req.timeout = timeout;
	      req.open(method, endPoint, true);
	      req.setRequestHeader("Content-Type", accept);
	      req.onerror = function () {
	        callback && callback(null);
	      };
	      req.onreadystatechange = function () {
	        if (req.readyState === _this11.states.complete && callback) {
	          var response = _this11.parseJSON(req.responseText);
	          callback(response);
	        }
	      };
	      if (ontimeout) {
	        req.ontimeout = ontimeout;
	      }
	
	      req.send(body);
	    }
	  }, {
	    key: "parseJSON",
	    value: function parseJSON(resp) {
	      return resp && resp !== "" ? JSON.parse(resp) : null;
	    }
	  }, {
	    key: "serialize",
	    value: function serialize(obj, parentKey) {
	      var queryStr = [];
	      for (var key in obj) {
	        if (!obj.hasOwnProperty(key)) {
	          continue;
	        }
	        var paramKey = parentKey ? parentKey + "[" + key + "]" : key;
	        var paramVal = obj[key];
	        if ((typeof paramVal === "undefined" ? "undefined" : _typeof(paramVal)) === "object") {
	          queryStr.push(this.serialize(paramVal, paramKey));
	        } else {
	          queryStr.push(encodeURIComponent(paramKey) + "=" + encodeURIComponent(paramVal));
	        }
	      }
	      return queryStr.join("&");
	    }
	  }, {
	    key: "appendParams",
	    value: function appendParams(url, params) {
	      if (Object.keys(params).length === 0) {
	        return url;
	      }
	
	      var prefix = url.match(/\?/) ? "&" : "?";
	      return "" + url + prefix + this.serialize(params);
	    }
	  }]);
	
	  return Ajax;
	}();
	
	Ajax.states = { complete: 4 };
	
	var Presence = exports.Presence = {
	  syncState: function syncState(currentState, newState, onJoin, onLeave) {
	    var _this12 = this;
	
	    var state = this.clone(currentState);
	    var joins = {};
	    var leaves = {};
	
	    this.map(state, function (key, presence) {
	      if (!newState[key]) {
	        leaves[key] = presence;
	      }
	    });
	    this.map(newState, function (key, newPresence) {
	      var currentPresence = state[key];
	      if (currentPresence) {
	        (function () {
	          var newRefs = newPresence.metas.map(function (m) {
	            return m.phx_ref;
	          });
	          var curRefs = currentPresence.metas.map(function (m) {
	            return m.phx_ref;
	          });
	          var joinedMetas = newPresence.metas.filter(function (m) {
	            return curRefs.indexOf(m.phx_ref) < 0;
	          });
	          var leftMetas = currentPresence.metas.filter(function (m) {
	            return newRefs.indexOf(m.phx_ref) < 0;
	          });
	          if (joinedMetas.length > 0) {
	            joins[key] = newPresence;
	            joins[key].metas = joinedMetas;
	          }
	          if (leftMetas.length > 0) {
	            leaves[key] = _this12.clone(currentPresence);
	            leaves[key].metas = leftMetas;
	          }
	        })();
	      } else {
	        joins[key] = newPresence;
	      }
	    });
	    return this.syncDiff(state, { joins: joins, leaves: leaves }, onJoin, onLeave);
	  },
	  syncDiff: function syncDiff(currentState, _ref2, onJoin, onLeave) {
	    var joins = _ref2.joins;
	    var leaves = _ref2.leaves;
	
	    var state = this.clone(currentState);
	    if (!onJoin) {
	      onJoin = function onJoin() {};
	    }
	    if (!onLeave) {
	      onLeave = function onLeave() {};
	    }
	
	    this.map(joins, function (key, newPresence) {
	      var currentPresence = state[key];
	      state[key] = newPresence;
	      if (currentPresence) {
	        var _state$key$metas;
	
	        (_state$key$metas = state[key].metas).unshift.apply(_state$key$metas, _toConsumableArray(currentPresence.metas));
	      }
	      onJoin(key, currentPresence, newPresence);
	    });
	    this.map(leaves, function (key, leftPresence) {
	      var currentPresence = state[key];
	      if (!currentPresence) {
	        return;
	      }
	      var refsToRemove = leftPresence.metas.map(function (m) {
	        return m.phx_ref;
	      });
	      currentPresence.metas = currentPresence.metas.filter(function (p) {
	        return refsToRemove.indexOf(p.phx_ref) < 0;
	      });
	      onLeave(key, currentPresence, leftPresence);
	      if (currentPresence.metas.length === 0) {
	        delete state[key];
	      }
	    });
	    return state;
	  },
	  list: function list(presences, chooser) {
	    if (!chooser) {
	      chooser = function chooser(key, pres) {
	        return pres;
	      };
	    }
	
	    return this.map(presences, function (key, presence) {
	      return chooser(key, presence);
	    });
	  },
	
	  // private
	
	  map: function map(obj, func) {
	    return Object.getOwnPropertyNames(obj).map(function (key) {
	      return func(key, obj[key]);
	    });
	  },
	  clone: function clone(obj) {
	    return JSON.parse(JSON.stringify(obj));
	  }
	};
	
	// Creates a timer that accepts a `timerCalc` function to perform
	// calculated timeout retries, such as exponential backoff.
	//
	// ## Examples
	//
	//    let reconnectTimer = new Timer(() => this.connect(), function(tries){
	//      return [1000, 5000, 10000][tries - 1] || 10000
	//    })
	//    reconnectTimer.scheduleTimeout() // fires after 1000
	//    reconnectTimer.scheduleTimeout() // fires after 5000
	//    reconnectTimer.reset()
	//    reconnectTimer.scheduleTimeout() // fires after 1000
	//
	
	var Timer = function () {
	  function Timer(callback, timerCalc) {
	    _classCallCheck(this, Timer);
	
	    this.callback = callback;
	    this.timerCalc = timerCalc;
	    this.timer = null;
	    this.tries = 0;
	  }
	
	  _createClass(Timer, [{
	    key: "reset",
	    value: function reset() {
	      this.tries = 0;
	      clearTimeout(this.timer);
	    }
	
	    // Cancels any previous scheduleTimeout and schedules callback
	
	  }, {
	    key: "scheduleTimeout",
	    value: function scheduleTimeout() {
	      var _this13 = this;
	
	      clearTimeout(this.timer);
	
	      this.timer = setTimeout(function () {
	        _this13.tries = _this13.tries + 1;
	        _this13.callback();
	      }, this.timerCalc(this.tries + 1));
	    }
	  }]);
	
	  return Timer;
	}();
	
	})( false ? window.Phoenix = window.Phoenix || {} : exports);
	


/***/ }
/******/ ]);
//# sourceMappingURL=radiokit-toolkit-playback.js.map