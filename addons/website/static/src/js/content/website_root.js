odoo.define('website.root', function (require) {
'use strict';

var core = require('web.core');
var Dialog = require('web.Dialog');
var publicRootData = require('web.public.root');
require('website.content.zoomodoo');

var _t = core._t;

var websiteRootRegistry = publicRootData.publicRootRegistry;

var WebsiteRoot = publicRootData.PublicRoot.extend({
    events: _.extend({}, publicRootData.PublicRoot.prototype.events || {}, {
        'click .js_change_lang': '_onLangChangeClick',
        'click .js_publish_management .js_publish_btn': '_onPublishBtnClick',
        'click .js_multi_website_switch': '_onWebsiteSwitch',
        'click .js_multi_company_switch': '_onCompanySwitch',
        'shown.bs.modal': '_onModalShown',
    }),
    custom_events: _.extend({}, publicRootData.PublicRoot.prototype.custom_events || {}, {
        'ready_to_clean_for_save': '_onAnimationStopDemand',
    }),

    /**
     * @override
     */
    start: function () {
        // Compatibility lang change ?
        if (!this.$('.js_change_lang').length) {
            var $links = this.$('ul.js_language_selector li a:not([data-oe-id])');
            var m = $(_.min($links, function (l) {
                return $(l).attr('href').length;
            })).attr('href');
            $links.each(function () {
                var $link = $(this);
                var t = $link.attr('href');
                var l = (t === m) ? "default" : t.split('/')[1];
                $link.data('lang', l).addClass('js_change_lang');
            });
        }

        // Enable magnify on zommable img
        this.$('.zoomable img[data-zoom]').zoomOdoo();

        return this._super.apply(this, arguments);
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _getContext: function (context) {
        var html = document.documentElement;
        return _.extend({
            'website_id': html.getAttribute('data-website-id') | 0,
        }, this._super.apply(this, arguments));
    },
    /**
     * @override
     */
    _getExtraContext: function (context) {
        var html = document.documentElement;
        return _.extend({
            'editable': !!(html.dataset.editable || $('[data-oe-model]').length), // temporary hack, this should be done in python
            'translatable': !!html.dataset.translatable,
            'edit_translations': !!html.dataset.edit_translations,
        }, this._super.apply(this, arguments));
    },
    /**
     * @override
     */
    _getPublicWidgetsRegistry: function (options) {
        var registry = this._super.apply(this, arguments);
        if (options.editableMode) {
            return _.pick(registry, function (PublicWidget) {
                return !PublicWidget.prototype.disabledInEditableMode;
            });
        }
        return registry;
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _onAnimationStartDemand: function (ev) {
        ev.data.options = _.clone(ev.data.options || {});
        ev.data.options.editableMode = ev.data.editableMode;
        this._super.apply(this, arguments);
    },
    /**
     * @todo review
     * @private
     */
    _onLangChangeClick: function (ev) {
        ev.preventDefault();

        var $target = $(ev.target);
        // retrieve the hash before the redirect
        var redirect = {
            lang: $target.data('lang'),
            url: encodeURIComponent($target.attr('href').replace(/[&?]edit_translations[^&?]+/, '')),
            hash: encodeURIComponent(window.location.hash)
        };
        window.location.href = _.str.sprintf("/website/lang/%(lang)s?r=%(url)s%(hash)s", redirect);
    },
    /**
     * @todo review
     * @private
     */
    _onPublishBtnClick: function (ev) {
        ev.preventDefault();

        var self = this;
        var $data = $(ev.currentTarget).parents(".js_publish_management:first");
        this._rpc({
            route: $data.data('controller') || '/website/publish',
            params: {
                id: +$data.data('id'),
                object: $data.data('object'),
            },
        })
        .done(function (result) {
            $data.toggleClass("css_unpublished css_published");
            $data.find('input').prop("checked", result);
            $data.parents("[data-publish]").attr("data-publish", +result ? 'on' : 'off');
        })
        .fail(function (err, data) {
            return new Dialog(self, {
                title: data.data ? data.data.arguments[0] : "",
                $content: $('<div/>', {
                    html: (data.data ? data.data.arguments[1] : data.statusText)
                        + '<br/>'
                        + _.str.sprintf(
                            _t('It might be possible to edit the relevant items or fix the issue in <a href="%s">the classic Odoo interface</a>'),
                            '/web#return_label=Website&model=' + $data.data('object') + '&id=' + $data.data('id')
                        ),
                }),
            }).open();
        });
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onWebsiteSwitch: function (ev) {
        var websiteID = ev.currentTarget.getAttribute('website-id');

        // need to force in each case, even if domain is set
        // Website 1: localhost; Website 2: 0.0.0.0; website 3: -
        // when you switch 3 <--> 1, you need to force the website

        var websiteDomain = ev.currentTarget.getAttribute('domain');
        var url = $.param.querystring(window.location.href, {fw: websiteID});
        if (websiteDomain && window.location.hostname !== websiteDomain) {
            // if domain unchanged, this line will do a nop while we need to refresh
            // the page to load the new forced website.
            url = new URL(url);
            url.hostname = websiteDomain;
        }
        window.location.href = url;
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onCompanySwitch: function (ev) {
        var companyID = parseInt(ev.currentTarget.getAttribute('company-id'), 10);
        this._rpc({model: 'res.users',
            method: 'write',
            args: [odoo.session_info.user_id, {'company_id': companyID}],
        }).then(function () {
            window.location.reload(true);
        });
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onModalShown: function (ev) {
        $(ev.target).addClass('modal_shown');
    },
});

return {
    WebsiteRoot: WebsiteRoot,
    websiteRootRegistry: websiteRootRegistry,
};
});
