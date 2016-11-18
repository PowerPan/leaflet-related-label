/*
	leaflet-tracksymbol-label, a plugin that adds labels leaflet-trackmarkers for Leaflet powered maps. Based on Leaflet.label
	(c) 2016, Johannes Rudolph

 	https://github.com/PowerPan/leaflet-tracksymbol-label
	https://github.com/Leaflet/Leaflet.label
	http://leafletjs.com
	https://github.com/PowerPan
*/

/**
 *
 */
L.RelatedLabel = L.Layer.extend({

	includes: L.Mixin.Events,

	/**
	 *
	 */
	options: {
		className: '',
		clickable: false,
		direction: 'right',
		offset: [12, -15], // 6 (width of the label triangle) + 6 (padding)
		opacity: 0.9,
		zoomAnimation: true
	},

	/**
	 *
	 * @param related
	 * @param parrent
	 * @param options
	 */
	initialize: function (related, parrent, options) {
		L.setOptions(this, options);

		this._related = related;
		this._parrent = parrent;
		this._animated = L.Browser.any3d && this.options.zoomAnimation;
		this._isOpen = false;

		this.setLatLng(this._related.getLatLng());
		this._related.on("move",this._relatedMove,this);
	},

	/**
	 *
	 * @param map
	 */
	onAdd: function (map) {

		if(!map.hasLayer(this._related)){
			return false;
		}

		this._map = map;


		this._pane = this.options.pane ? map._panes[this.options.pane] :
			this._related instanceof L.Marker ? map._panes.markerPane : map._panes.popupPane;

		if (!this._container) {
			this._initLayout();
		}

		this._pane.appendChild(this._container);

		this._initInteraction();

		this._update();

		this.setOpacity(this.options.opacity);

		map
			.on('moveend', this._onMoveEnd, this)
			.on('viewreset', this._onViewReset, this);


		this._related.on("add",this._relatedAdd,this);
		this._related.on("remove",this._relatedRemove,this);

		if (this._animated) {
			map.on('zoomanim', this._zoomAnimation, this);
		}
	},

	/**
	 *
	 * @param e
	 * @private
	 */
	_relatedMove: function(e){
		this.setLatLng(e.target.getLatLng());
	},

	/**
	 *
	 * @param e
	 * @private
	 */
	_relatedAdd: function (e) {
		if(!this.isOnMap()){
			if(e.target._map.hasLayer(this._parrent)){
				this.onAdd(e.target._map);
			}
		}
	},

	/**
	 *
	 * @param e
	 * @private
	 */
	_relatedRemove: function (e) {
		this.onRemove(this._map);
	},

	/**
	 *
	 * @param con
	 * @param e
	 * @private
	 */
	_layerAdd: function (con, e) {
		this.onAdd(con.target);
	},

	/**
	 *
	 * @returns {boolean}
	 */
	isOnMap: function () {
		if (this._map) {
			return true;
		}
		return false;
	},

	/**
	 *
	 * @param map
	 */
	onRemove: function (map) {
		if(!this.isOnMap()){
			return false;
		}

		this._related.off("remove",this._relatedRemove,this);

		this._pane.removeChild(this._container);

		map.off({
			zoomanim: this._zoomAnimation,
			moveend: this._onMoveEnd,
			viewreset: this._onViewReset
		}, this);

		this._removeInteraction();

		this._map = null;
	},

	/**
	 *
	 * @param latlng
	 * @returns {L.RelatedLabel}
	 */
	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		if (this._map) {
			this._updatePosition();
		}
		return this;
	},

	/**
	 *
	 * @param content
	 * @returns {L.RelatedLabel}
	 */
	setContent: function (content) {
		// Backup previous content and store new content
		this._previousContent = this._content;
		this._content = content;

		this._updateContent();

		return this;
	},

	/**
	 *
	 * @param zIndex
	 */
	updateZIndex: function (zIndex) {
		this._zIndex = zIndex;

		if (this._container && this._zIndex) {
			this._container.style.zIndex = zIndex;
		}
	},

	/**
	 *
	 * @param opacity
	 */
	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._container) {
			L.DomUtil.setOpacity(this._container, opacity);
		}
	},

	/**
	 *
	 * @private
	 */
	_initLayout: function () {
		this._container = L.DomUtil.create('div', 'leaflet-related-label ' + this.options.className + ' leaflet-zoom-animated');
		this.updateZIndex(this._zIndex);
	},

	/**
	 *
	 * @private
	 */
	_update: function () {
		if (!this._map) { return; }

		this._container.style.visibility = 'hidden';

		this._updateContent();
		this._updatePosition();

		this._container.style.visibility = '';
	},

	/**
	 *
	 * @private
	 */
	_updateContent: function () {
		if (!this._content || !this._map || this._prevContent === this._content) {
			return;
		}

		if (typeof this._content === 'string') {
			this._container.innerHTML = this._content;

			this._prevContent = this._content;

			this._labelWidth = this._container.offsetWidth;
		}
	},

	/**
	 *
	 * @private
	 */
	_updatePosition: function () {
		var pos = this._map.latLngToLayerPoint(this._latlng);

		this._setPosition(pos);
	},

	/**
	 *
	 * @param pos
	 * @private
	 */
	_setPosition: function (pos) {
		var map = this._map,
			container = this._container,
			centerPoint = map.latLngToContainerPoint(map.getCenter()),
			labelPoint = map.layerPointToContainerPoint(pos),
			direction = this.options.direction,
			labelWidth = this._labelWidth,
			offset = L.point(this.options.offset);

		// position to the right (right or auto & needs to)
		if (direction === 'right' || direction === 'auto' && labelPoint.x < centerPoint.x) {
			L.DomUtil.addClass(container, 'leaflet-related-label-right');
			L.DomUtil.removeClass(container, 'leaflet-related-label-left');

			pos = pos.add(offset);
		} else { // position to the left
			L.DomUtil.addClass(container, 'leaflet-related-label-left');
			L.DomUtil.removeClass(container, 'leaflet-related-label-right');

			pos = pos.add(L.point(-offset.x - labelWidth, offset.y));
		}

		L.DomUtil.setPosition(container, pos);
	},

	/**
	 *
	 * @param opt
	 * @private
	 */
	_zoomAnimation: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

		this._setPosition(pos);
	},

	/**
	 *
	 * @private
	 */
	_onMoveEnd: function () {
		if (!this._animated || this.options.direction === 'auto') {
			this._updatePosition();
		}
	},

	/**
	 *
	 * @param e
	 * @private
	 */
	_onViewReset: function (e) {
		/* if map resets hard, we must update the label */
		if (e && e.hard) {
			this._update();
		}
	},

	/**
	 *
	 * @private
	 */
	_initInteraction: function () {
		if (!this.options.clickable) { return; }

		var container = this._container,
			events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];

		L.DomUtil.addClass(container, 'leaflet-clickable');
		L.DomEvent.on(container, 'click', this._onMouseClick, this);

		for (var i = 0; i < events.length; i++) {
			L.DomEvent.on(container, events[i], this._fireMouseEvent, this);
		}
	},

	/**
	 *
	 * @private
	 */
	_removeInteraction: function () {
		if (!this.options.clickable) { return; }

		var container = this._container,
			events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];

		L.DomUtil.removeClass(container, 'leaflet-clickable');
		L.DomEvent.off(container, 'click', this._onMouseClick, this);

		for (var i = 0; i < events.length; i++) {
			L.DomEvent.off(container, events[i], this._fireMouseEvent, this);
		}
	},

	/**
	 *
	 * @param e
	 * @private
	 */
	_onMouseClick: function (e) {
		if (this.hasEventListeners(e.type)) {
			L.DomEvent.stopPropagation(e);
		}

		this.fire(e.type, {
			originalEvent: e
		});
	},

	/**
	 *
	 * @param e
	 * @private
	 */
	_fireMouseEvent: function (e) {
		this.fire(e.type, {
			originalEvent: e
		});

		// TODO proper custom event propagation
		// this line will always be called if marker is in a FeatureGroup
		if (e.type === 'contextmenu' && this.hasEventListeners(e.type)) {
			L.DomEvent.preventDefault(e);
		}
		if (e.type !== 'mousedown') {
			L.DomEvent.stopPropagation(e);
		} else {
			L.DomEvent.preventDefault(e);
		}
	}
});

/**
 *
 * @param related
 * @param parrent
 * @param options
 * @returns {*}
 */
L.relatedLabel = function (related, parrent, options) {
	return new L.RelatedLabel(related, parrent, options);
};
