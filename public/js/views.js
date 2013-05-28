var alertError = function(title, body) {
    var header = '<h4 class="alert-heading">' + title + '</h4>'
    var body = '<span class="body">' + body + '</span>';
    var close = '<a class="close" data-dismiss="alert" href="#">&times;</a>';
    var alert = '<div class="alert alert-error">' + close + header + body + '</div>'; 
    var container = $('#alerts');
    container.append(alert);
}

var secondsToString = function(duration) {
    var str = "";
    // The duration can be a decimal, but we want it to be an integer so the user 
    // doesn't end up seeing the a track is 4:20 when the track is actually 260.75 seconds long.
    // This would mean that adding this track to the playlist twice would cause the 
    // total duration to be 8:41 (260.75 + 260.75 = 521.5 seconds). To prevent this from happening, 
    // we round up. The track of 260.75 seconds is now reported to be 4:21, and 
    // the adding this track twice to the playlist would make the total duration 
    // to be 8:42, which the user would expect intuitively.
    var secondsLeft = Math.ceil(duration);
    var hours = Math.floor(secondsLeft / 3600);
    secondsLeft -= (hours >= 1) ? hours * 3600 : 0;

    var minutes = Math.floor(secondsLeft / 60);
    secondsLeft -= (minutes >= 1) ? minutes * 60 : 0;

    var seconds = Math.floor(secondsLeft);
    str = (hours >= 1) ? (hours.toString() + ":") : "";
    if (minutes < 10 && hours >= 1) {
        str += "0";
    }
    str += minutes.toString() + ":";
    if (seconds < 10) {
        str += "0";
    }
    str += seconds.toString();
    return str;
};

var getAttribute = function(name, value) {
    return name + '="' + value.toString().replace(/"/g, '&quot;') + '"';
};

var ModalView = Backbone.View.extend({
    el: $('#about-button'),
    events: {
        'click': 'modal'
    },
    modal: function() {
        $('#about').modal({
            backdrop: true
        });
    }
});

var MainView = Backbone.View.extend({
    initialize: function() {
        this.blockUI = false;
        this.subviews = [new ControlsView(), new ModalView(), new PlaylistView(),
            new SearchBarView(), new SearchResultsView(), new TimebarView(), new VolumeView()];

        var showCommunicationError = function(error) {
            bootbox.alert('Sorry, the server could not be contacted. ' + error);
        };

        var showServerError = function(error) {
            bootbox.alert('Sorry, a server error occurred. ' + error);
        };

        this.listenTo(Playlist, 'error:communication', showCommunicationError);
        this.listenTo(SearchResults, 'error:communication', showCommunicationError);
        this.listenTo(Playlist, 'error:server', showServerError);
        this.listenTo(SearchResults, 'error:server', showServerError);
    },

    el: "body",
    render: function() {
        rejected = checkBrowser();
        if (rejected) {
            $('#header, #wrapper, #footer, #about').html('');
        }
        _(this.subviews).each(function(subview) {
            subview.render();
        });
        return this;
    },

    toggleBlock: function() {
        this.blockUI = !this.blockUI;
        if (this.blockUI) {
            $.blockUI();
        } else {
            $.unblockUI();
        }
        return this;
    }
});

var ControlsView = Backbone.View.extend({
    el: $('#controls'),
    events: {
        'click #next': 'nextTrack',
        'click #play': 'play',
        'click #previous': 'previousTrack',
        'click #shuffle': 'shuffle',
        'click #stop': 'stop'
    },
    initialize: function() {
        var showPause = function() {
            this.setPlayButton(true);
        };
        var showPlay = function() {
            this.setPlayButton(false);
        }

        Playlist.on('play resume', showPause, this);
        Playlist.on('pause stop', showPlay, this);
    },
    nextTrack: function() {
        Playlist.nextTrack(true);
    },
    play: function() {
        var playing = Playlist.isPlaying(), paused = Playlist.isPaused();
        if (playing || paused) {
            Playlist.togglePause();
        }
        else {
            Playlist.play();
        }
    },
    previousTrack: function() {
        Playlist.previousTrack(true);
    },
    setPlayButton: function(playing) {
        if (playing) {
            $('#play').find('i').removeClass('icon-play').addClass('icon-pause');
        }
        else {
            $('#play').find('i').removeClass('icon-pause').addClass('icon-play');
        }
    },
    shuffle: function() {
        Playlist.shuffle();
    },
    stop: function() {
        Playlist.stop();
    }
});

var TrackView = Backbone.View.extend({
    beforeClose: function() {
        this.model && this.collection.remove && this.collection.remove(this.model);
        this.undelegateEvents();
    },
    initialize: function(options) {
        this.action1 = '';
        if (options.action1) {
            var action1 = options.action1;
            this.action1 = '<a class="btn action ' + action1.classes + '" href onclick="return false;"><i class="' + action1.icon + '"></i></a>';
        }
        this.action2 = '';
        if (options.action2) {
            var action2 = options.action2;
            this.action2 = '<a class="btn action ' + action2.classes + '" href onclick="return false;"><i class="' + action2.icon + '"></i></a>';
        }
        this.model = options.model || {};
        this.collection = options.collection || {};
    },
    render: function() {
        var actions = '<div class="actions">' + this.action1 + this.action2 + '</div>';
        var actionsCell = '<td class="action-cell">' + actions + '</td>';
        var uploader = '<td class="uploader-cell" ' + getAttribute('title', this.model.get('uploader')) + '>' + this.model.get('uploader') + '</td>';
        var title = '<td class="title-cell" ' + getAttribute('title', this.model.get('mediaName')) + '>' + this.model.get('mediaName') + '</td>';
        var seconds = secondsToString(this.model.get('duration'));
        var duration = '<td class="duration-cell" ' + getAttribute('title', seconds) + '>' + seconds + '</td>';
        var link = '<td class="link-cell"><a href="' + this.model.get('permalink') + '"><img src="' + this.model.get('icon') + '" /></a></td>';
        var innerHtml = actionsCell + uploader + title + duration + link;
        this.$el.html(innerHtml);
        return this;
    },
    tagName: 'tr'
});

var PlaylistTrackView = TrackView.extend({
    events: {
        'click .play': 'play',
        'click .remove': 'removeFromPlaylist',
        'dblclick': 'play'
    },
    play: function() {
        var index = this.$el.closest('tr').index();
        Playlist.goToTrack(index, true);
    },
    removeFromPlaylist: function() {
        this.remove();
        Playlist.remove(this.model);
    }
});

var SearchTrackView = TrackView.extend({
    addToPlaylist: function() {
        Playlist.add(this.getModel());
    },
    events: {
        "click .search-add-result": "addToPlaylist",
        "click .search-play-result": "playInPlaylist",
        "dblclick": "playInPlaylist"
    },
    getModel: function() {
        return this.model.clone();
    },
    playInPlaylist: function() {
        var addIndex = Playlist.currentTrack + 1;
        Playlist.add(this.getModel(), {
            at: addIndex,
            play: true
        });
    }
});

var SearchBarView = Backbone.View.extend({
    el: $("#search-form"),
    events: {
        "click #search-site-dropdown a": "selectSite",
        "submit": "search"
    },
    search: function(e) {
        e.preventDefault();
        var query = $('#search-query').val();
        var site = $("#search-site").val();
        if (query) {
            SearchResults.search(query, site);
        }
        return false;
    },
    selectSite: function(e) {
        var site = $(e.target).html();
        var oldSiteCode = $("#search-site").val();
        var siteCode = '';
        switch(site) {
            case "YouTube":
                siteCode = "ytv";
                break;
            case "SoundCloud":
                siteCode = "sct";
                break;
            case "Jamendo":
                siteCode = 'jmt';
                break;
            case "URL":
                siteCode = "url";
                break;
        }
        $("#search-site").val(siteCode);
        $("#site-selector").html(site + '&nbsp;<span class="caret"></span>');
        var query = $('#search-query').val();
        if (query && siteCode != oldSiteCode) {
            SearchResults.search(query, siteCode);
        }
    }
});

var PlaylistView = Backbone.View.extend({
    append: function(tracks, playlist, options) {
        options || (options = {});
        var playlistView = this, index = options.index;
        _.isArray(tracks) || (tracks = [tracks]);
        var newRows = [];
        _(tracks).each(function(track) {
            var view = new PlaylistTrackView({
                model: track,
                action1: {
                    classes: 'remove',
                    icon: 'icon-remove'
                },
                action2: {
                    classes: 'play',
                    icon: 'icon-play'
                }
            });
            view.render();
            newRows.push(view.$el);
            playlistView.rows.push(view);
        });
        var $table = $(this.table);
        if (index == undefined || options.index >= $table.children().length) {
            $table.append.apply($table, newRows);
        } else {
            var addPoint = $table.find('tr').eq(index);
            addPoint.before.apply(addPoint, newRows);
        }
    },
    clearPlaylist: function() {
        Playlist.reset();
    },
    el: $("#playlist-pane"),
    events: {
        'click #clear': 'clearPlaylist'
    },
    initialize: function() {
        this.table = '#tracks tbody';
        // Unordered list of row views, only meant for internal bookkeeping
        this.rows = [];

        var playlistView = this;
        var startPos;
        $(this.table).sortable({
            axis: 'y',
            containment: 'document',
            helper: function(event, ui) {
                try {
                    var children = ui.children();
                    var helper = ui.clone();
                    helper.children().each(function(index) {
                        $(this).width(children.eq(index).width());
                    });
                    return helper;
                } catch(e) {
                    Playlist.trigger('error:communication', 'The server will not be able to send you any data.')
                    return {};
                }
            },
            start: function(event, ui) {
                startPos =ui.item.index();
            },
            tolerance: 'pointer',
            stop: function(event, ui) {
                var pos = ui.item.index();
                Playlist.moveTrack(startPos, pos);
            }
        });

        Playlist.on('tracks:new', this.reset, this);
        Playlist.on('tracks', this.append, this);
        Playlist.on('id', this.updateList, this);
        Playlist.on('track', this.setCurrentTrack, this);
    },
    reset: function(tracks) {
        $(this.table).empty();
        _(this.rows).each(function(row) {
                row.remove();
            });
        this.rows = [];
        if (tracks) {
            this.append(tracks);
        }
    },
    setCurrentTrack: function(track, trackNumber) {
        $(this.table).find('tr')
            .removeClass('playing')
            .eq(trackNumber)
            .addClass('playing');
    },
    updateList: function() {
        var count = Playlist.size();
        
        $(this.table).sortable('refresh');

        $('#playlist-duration').text(secondsToString(Playlist.totalDuration));
        $('#track-count').text(count.toString());
        if (count == 1) {
            $("#multiple-tracks").empty();
        } else {
            $("#multiple-tracks").text("s");
        }
    },
    show: function() {
        $("#playlist-tab").tab('show');
    }
});

var SearchResultsView = Backbone.View.extend({
    addAll: function() {
        var tracks = SearchResults.map(function(track) {
            return track.clone();
        });
        Playlist.add(tracks, {
            at: Playlist.size(),
            batch: tracks.length
        });
    },
    append: function(searchResults) {
        var resultsView = this;
        _.isArray(searchResults) || (searchResults = [searchResults]);
        var newRows = [];
        _(searchResults).each(function(searchResult) {
            var view = new SearchTrackView({
                model: searchResult,
                action1: {
                    classes: 'search-add-result',
                    icon: 'icon-plus'
                },
                action2: {
                    classes: 'search-play-result',
                    icon: 'icon-play'
                }
            });
            view.render();
            newRows.push(view.$el);
            resultsView.rows.push(view);
        });
        var $table = $(this.table);
        $table.append.apply($table, newRows);
        $table.find('tr').draggable({
            // thanks to David Petersen
            helper: function(event, ui) {
                var row = $(event.target).closest('tr');
                return $('<div class="drag-search-result"></div>')
                    .data("search-index", row.index())
                    .append(row.find('.uploader-cell').html() + ' &mdash; ' + row.find('.title-cell').html())
                    .appendTo('body');
            }
        }).disableSelection();
    },
    el: $('#search-results-pane'),
    events: {
        'click #add-all': 'addAll',
        'click #play-all': 'playAll',
        'click #load-more-search-results': 'loadMore'
    },
    initialize: function() {
        this.rows = [];
        this.table = '#search-results tbody';
        SearchResults.on('results:new', this.reset, this);
        SearchResults.on('results', this.append, this);
        SearchResults.on('results:new results', this.show, this);

        $("#playlist-tab").droppable({
            accept: '#search-results .ui-draggable',
            drop: function(event, ui) {
                //alert("Hi");
                var index = ui.helper.data("search-index");
                ui.helper.remove();
                Playlist.add(SearchResults.at(index).clone());
                
            },
            hoverClass: 'nav-hover'
        });
    },
    loadMore: function() {
        SearchResults.nextPage();
    },
    playAll: function() {
        var tracks = SearchResults.map(function(track) {
            return track.clone();
        });
        Playlist.add(tracks, {
            at: Playlist.size(),
            batch: tracks.length,
            play: true
        });
    },
    reset: function(collection) {
        _.chain(this.rows)
            .reverse()
            .each(function(row) {
                row.remove();
            });
        this.rows = [];
        if (collection) {
            this.append(collection.models);
        }
    },
    show: function() {
        $("#search-tab").tab('show');
    }
});

var TimebarView = Backbone.View.extend({
    el: $("#timebar-row"),
    initialize: function() {
        this.timebar = $('#timebar-inner');
        this.timeElapsed = $('#time-elapsed');
        var timebarOuter = $("#timebar-outer");
        var precison = 100;
        timebarOuter.slider({
            range: "min",
            value: 0,
            min: 0,
            max: timebarOuter.width() * precison,
            slide: function(event, ui) {
                var fraction = ui.value / timebarOuter.slider("option", "max");
                Playlist.seek(parseFloat(fraction.toFixed(4)));
            }
        });

        this.lastUpdate = new Date();

        Playlist.on('progress', this.onProgress, this);
        Playlist.on('end stop', function() {
            this.onProgress({percent: 0, time: 0});
        }, this)
    },
    onProgress: function(details) {
        var percent = details.percent || 0;
        var time = details.time || 0;

        var updateTime = new Date();
        if (updateTime - this.lastUpdate < 333) {
            return;
        }
        this.lastUpdate = updateTime;
        this.timebar.width(percent.toFixed(2) + "%");
        this.timeElapsed.text(secondsToString(time));
    }
});

var VolumeView = Backbone.View.extend({
    el: $("#volume"),
    events: {
        'click #volume-symbol': 'toggleMute'
    },
    initialize: function() {
        $("#volume-outer").slider({
            orientation: "horizontal",
            range: "min",
            min: 0,
            max: 100,
            value: 50,
            slide: function(event, ui) {
                Playlist.setVolume(ui.value);
            }
        });

        Playlist.on('volume', this.updateSymbol, this);
        Playlist.on('mute', function() {
            this.updateSymbol(0);
        }, this)
    },
    toggleMute: function() {
        Playlist.toggleMute();
    },
    updateSymbol: function(volume) {
        var amount = parseInt(volume).toString();
        $("#volume-inner").width(amount + "%");
        $("#volume-number").text(amount);
        if (volume >= 50) {
            $("#volume-symbol").removeClass("icon-volume-down").removeClass("icon-volume-off").addClass("icon-volume-up");
        }
        else if (volume > 0) {
            $("#volume-symbol").removeClass("icon-volume-up").removeClass("icon-volume-off").addClass("icon-volume-down");
        }
        else if (volume == 0) {
            $("#volume-symbol").removeClass("icon-volume-up").removeClass("icon-volume-down").addClass("icon-volume-off");
        }
    }
});

var YouTubeInterface = Backbone.View.extend({
    clearInterval: function() {
        if (this.whilePlaying) {
            window.clearInterval(this.whilePlaying);
            this.whilePlaying = false;
        }
    },
    getData: function() {
        var self = this;
        var callback = function() {
            data = self.$el.tubeplayer('data');
            self.trigger('data', data);
            return data;
        };
        return view.onload.done(callback);
    },
    getVolume: function() {
        return this.$el.tubeplayer('volume') || 0;
    },
    initialize: function() {
        var view = this;
        var triggerError = function(view) {
            var data = view.$el.tubeplayer('data');
            view.state = data.state;
            view.onload.reject();
            view.clearInterval();
            view.stop();
            view.trigger('error');
        };
        this.defaults = {
            showControls: false,
            autoPlay: false,
            initialVideo: "",
            loadSWFObject: false,
            width: view.$el.width(),
            height: view.$el.height(),
            onErrorNotEmbeddable: function() {
                triggerError(view);
            },
            onErrorNotFound: function() {
                triggerError(view);
            },
            onErrorInvalidParameter: function() {
                triggerError(view);
            },
            onMute: function() {
                view.trigger('mute');
            },
            onPause: function() {
                view.state = 2;
                view.clearInterval();
                view.trigger('pause', view.$el.tubeplayer('data'));
            },
            onStop: function() {
                var data = view.$el.tubeplayer('data');
                view.state = data.state;
                view.clearInterval();
                view.trigger('stop', view.$el.tubeplayer('data'));
            },
            onPlayerCued: function() {
                view.state = 5;
            },
            onPlayerBuffering: function() {
                view.state = 3;
                view.clearInterval();
                view.trigger('buffering', view.$el.tubeplayer('data'));
            },
            onPlayerPlaying: function() {
                view.onload.resolve();
                view.state = 1;
                view.setInterval();
                view.trigger('play');
            },
            onPlayerEnded: function() {
                view.state = 0;
                view.clearInterval();
                view.stop();
                view.trigger('end');
            },
            onSeek: function(time) {
                var data = view.$el.tubeplayer('data');
                var percent = time / data.duration;
                view.trigger('progress', {percent: percent, time: time});
            },
            onUnMute: function() {
                view.trigger('unmute');
            }
        };
        this.reset();

        this.on('mute', function() {
            this.muted = true;
        }, this);

        this.on('unmute', function() {
            this.muted = false;
        }, this);
    },
    hasPlayer: function() {
        return this.onload.state() == 'resolved';
    },
    isMuted: function() {
        return this.muted;
    },
    load: function(options) {
        var view = this;
        var params = _.extend({}, view.defaults, options);
        view.$el.tubeplayer(params);
        if (_.isNumber(options.volume)) {
            view.setVolume(options.volume);
        } else {
            view.setVolume(view.currentVolume);
        }
        return view.onload.promise();
    },
    mute: function() {
        var view = this;
        var mute = function() {
            view.$el.tubeplayer('mute');
        };
        return view.onload.done(mute);
    },
    pause: function() {
        var view = this;
        var callback = function() {
            view.$el.tubeplayer('pause');
        };
        return view.onload.done(callback);
    },
    play: function() {
        var view = this;
        var play = function() {
            var data = view.$el.tubeplayer('data');
            var paused = data.state === 2;
            view.$el.tubeplayer('play');
            if (paused) {
                view.trigger('resume');
            }
        };
        return view.onload.done(play);
    },
    reset: function() {
        var view = this;
        view.clearInterval();
        if (view.onload && view.onload.state == 'pending') {
            view.onload.reject();
        }
        view.onload = $.Deferred();
        if (view.$el.hasClass("jquery-youtube-tubeplayer")) {
            view.$el.tubeplayer('stop');
            view.$el.tubeplayer('destroy');
        }
        view.$el.removeClass('data-prev-mute-volume');
        view.muted = false;
        view.state = -2;
        if (!_.isNumber(view.currentVolume)) {
            view.currentVolume = 50;
        }
        view.trigger('reset');
        var dfd = $.Deferred();
        dfd.resolve();
        return dfd.promise();
    },
    seek: function(time) {
        var view = this;
        var seek = function() {
            view.$el.tubeplayer('seek', time);
        };
        return view.onload.done(seek);
    },
    setInterval: function() {
        if (this.whilePlaying) {
            this.clearInterval();
        }
        var view = this;
        this.whilePlaying = window.setInterval(function() {
            var data = view.$el.tubeplayer('data');
            if (data && data.hasOwnProperty('currentTime') && data.hasOwnProperty('duration')) {
                var percent =  (data.currentTime / data.duration) * 100;
                var time = data.currentTime;
                view.trigger('progress', {percent: percent, time: time});
            }
        }, 333);
    },
    setVolume: function(percent) {
        var view = this;
        var volumize = function() {
            view.$el.tubeplayer('volume', percent);
            view.currentVolume = percent;
            view.trigger('volume', view.currentVolume);
        };
        return view.onload.done(volumize);
    },
    stop: function() {
        var view = this;
        var stop = function() {
            view.$el.tubeplayer('stop');
            view.trigger('stop');
        };
        return view.onload.done(stop);
    },
    unmute: function() {
        var view = this;
        var unmute = function() {
            view.$el.tubeplayer('unmute');
        };
        return view.onload.done(unmute);
    },
    videoId: function() {
        return this.$el.tubeplayer('videoId');
    }
});