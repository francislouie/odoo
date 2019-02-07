odoo.define('website_event_track.website_event_track', function (require) {
'use strict';

var sAnimations = require('website.content.snippets.animation');

sAnimations.registry.websiteEventTrack = sAnimations.Class.extend({
    selector: '.o_website_event',
    events: {
        'input #event_track_search': '_onEventTrackSearchInput',
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {Event} ev
     */
    _onEventTrackSearchInput: function (ev) {
        ev.preventDefault();

        var text = $(ev.currentTarget).val();
        var filter = _.str.sprintf(':containsLike(%s)', text);

        $('#search_summary').removeClass('invisible');
        var $tracks = $('.event_track');
        $('#search_number').text($tracks.filter(filter).length);
        $tracks.removeClass('invisible').not(filter).addClass('invisible');
    },
});
});
