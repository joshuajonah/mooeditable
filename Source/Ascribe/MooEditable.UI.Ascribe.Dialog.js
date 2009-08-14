/*
Script: MooEditable.UI.MenuList.js
	UI Class to create a menu list (select) element.

License:
	MIT-style license.

Copyright:
	Copyright (c) 2007-2009 [Lim Chee Aun](http://cheeaun.com).
*/
MooEditable.UI.ButtonOverlay = new Class({

	Extends: MooEditable.UI.Button,

	options: {
		/*
		onOpenOverlay: $empty,
		onCloseOverlay: $empty,
		*/
		overlayHTML: '',
		overlayClass: '',
		overlaySize: {x: 150, y: 'auto'},
		overlayContentClass: ''
	},

	initialize: function(options){
		this.parent(options);
		this.render();
		this.el.addClass('mooeditable-ui-buttonOverlay');
		this.renderOverlay(this.options.overlayHTML);
	},
	
	renderOverlay: function(html){
		var self = this;
		this.overlay = new Element('div', {
			'class': 'mooeditable-ui-button-overlay ' + self.name + '-overlay ' + self.options.overlayClass,
			html: '<div class="overlay-content ' + self.options.overlayContentClass + '">' + html + '</div>',
			tabindex: 0,
			styles: {
				left: '-999em',
				position: 'absolute',
				width: self.options.overlaySize.x,
				height: self.options.overlaySize.y
			},
			events: {
				mousedown: self.clickOverlay.bind(self),
				focus: self.openOverlay.bind(self),
				blur: self.closeOverlay.bind(self)
			}
		}).inject(document.body).store('MooEditable.UI.ButtonOverlay', this);
		this.overlayVisible = false;
	},
	
	openOverlay: function(){
		if (this.overlayVisible) return;
		this.overlayVisible = true;
		this.activate();
		this.fireEvent('openOverlay', this);
		return this;
	},
	
	closeOverlay: function(){
		if (!this.overlayVisible) return;
		this.overlay.setStyle('left', '-999em');
		this.overlayVisible = false;
		this.deactivate();
		this.fireEvent('closeOverlay', this);
		return this;
	},
	
	clickOverlay: function(e){
		if (e.target == this.overlay || e.target.parentNode == this.overlay) return;
		e.preventDefault();
		this.action(e);
		this.overlay.blur();
	},
	
	click: function(e){
		e.preventDefault();
		if (this.disabled) return;
		if (this.overlayVisible){
			this.overlay.blur();
			return;
		} else {
			var coords = this.el.getCoordinates();
			this.overlay.setStyles({
				top: coords.bottom,
				left: coords.left
			});
			this.overlay.focus();
		}
	}
	
});

/*
Script: MooEditable.UI.AscribeDialog.js
	UI Class to create Ascribe Dialog

License:
	MIT-style license.

Copyright:
	Copyright (c) 2009 [Truman Leung](http://www.ascribedata.com).
*/

/*
 *	Ascribe Data Systems LLC
 *	www.ascribedata.com
 *
 *	by Truman Leung <tru@ascribedata.com>
 *	Honolulu, Hawaii, USA
 *
 *	"Ascribe greatness to our God, the Rock. 
 *	His works are perfect and all His ways are just."
 *							... glory to Jesus Christ
 *	4/17/2008
 *	10/24/2008
 *	dialog.js - compatible with MooTools 1.2.3
 *	
 *	displays DHTML popup that can be modal and have arrows with easy placement targeting the window or an element
 * future upgrade should have a timed check to see if the mouse if over an element and if not then to hide the tip
*/
var AscDialog = new Class({
	Implements: [Options,Events], 
	options: {
		strs: {
			'close': 'Click to close'
		},
		speed: 500,
		maskOpacity: 0.3,
		maskColor: '#000000',
		isModal: false,
		useArrows: false,
		addCloseBtn: true,
		popOpacity: 1,
		cornerRadius: 10,
		classPrefix: 'Asc',
		place: {
			'ss': { target:'window', io:1, align:'n', offset:0, margin:0 }, // show start
			'se': { trans:'fly', target:'window', io:-1, align:'c', offset:0, margin:0 }, // show end
			'he': { trans:'fly', target:'window', io:1, align:'n', offset:0, margin:0 } // hide end
		},
		posRelative: null,
		onHide: Class.empty,
		onShow: Class.empty,
		onFirstShow: Class.empty,
		transition: Fx.Transitions.Quad.easeInOut
	},
	initialize: function(options){
		this.setOptions(options);
		this.isShowing = false;
		this.shownOnce = false;
		this.mask = false;
		this.pop = false;
		this.event = window.event;

		this.isIE6 = false;
		if (Browser.Engine.trident && Browser.Platform.win && (Browser.Engine.version<=4)) {
			this.isIE6 = true;
		}
		if (Browser.Engine.trident && Browser.Platform.win) {
			this.options.useArrows = false;
		}		

		this.fx_dir = 0; // track whether showing/hiding
		this.fx_in_process = false;
		
		window.addEvents({
			'keyup': this.esc.bindWithEvent(this),
			'resize': function(e){ 
				this.update(e);
				if(this.isShowing){
					this.isShowing = false;
					this.show();
				}
			}.bind(this),
			'scroll': this.update.bindWithEvent(this)
		});
		this.init();
	},
	init: function(){
		if (this.pop) {
			this.pop.destroy();
		}
		this.add_pop();
		var fxels = [this.pop];

		if (this.options.isModal) {
			this.add_mask();
			fxels[1] = this.mask;
		} else if (this.isIE6) {
			this.options.maskColor = '#FFF';
			this.add_mask();
		}
		this.fx = new Fx.Elements(fxels, {
			wait: false, 
			duration: this.options.speed, 
			transition: this.options.transition,
			onStart: function() {
				this.fx_in_process = true;
			}.bind(this), 
			onComplete: function() {
				switch (this.fx_dir) {
					case 1:
						if (!this.shownOnce) {
							this.shownOnce = true;
							this.fireEvent('firstShow');
						}
						this.isShowing = true;
						if (this.options.isModal) {
							this.pop.fireEvent('focus', '', 200); // to activate pop close by ESC, the ESC keydown for window doesn't work in IE
						}
						this.fireEvent('show');
						break;
					case 0:
						this.isShowing = false;
						this.pop.setStyles({
							'visibility':'hidden',
							'display': 'none'
						});
						if (this.options.isModal) {
							this.mask.setStyle('display', 'none');
						}
						if (!this.options.isModal && this.mask) {
							this.mask.set('opacity',0);
						}
						this.fireEvent('hide');
						break;				
				}
				this.fx_in_process = false;
			}.bind(this)
		});
	},
	add_mask: function(){
		if (!this.mask)	{
			var mask_styles = {
				'position':'absolute',
				'top': 0,
				'left': 0,
				'opacity': 0,
				'z-index': 9999,
				'background-color':this.options.maskColor,
				'display': 'none'
			};
			if (this.isIE6){
				// need to use IFRAME for IE in order to cover SELECT elements
				this.mask = new Element('iframe', {
					'class':this.options.classPrefix+'Mask',
					'src':"about:blank",
					'frameborder':0,
					'src':"about:blank",
					styles: mask_styles
				}).inject(document.body);
			} else {
				// make mask a div for other browsers
				this.mask = new Element('div', {
					'class':this.options.classPrefix+'Mask',
					styles: mask_styles
				}).inject(document.body);
			}
		}
	},
	add_pop: function(){

		/*
		<div class="Pop">			
			<TABLE class="grid">
				<TR>
					<TD class="nw"></TD>
					<TD class="north"></TD>
					<TD class="ne"></TD>
				</TR>
				<TR>
					<TD class="sw"></TD>
					<TD class="s"></TD>
					<TD class="se"></TD>
				</TR>
			</TABLE>
		</div>
		*/

		this.pop = new Element('div', {
			'class':this.options.classPrefix+'Pop',
			'styles':{
				'position': 'absolute',
				'visibility': 'hidden',
				'top': -1000,
				'left': 0,
				'z-index': 10000,
				'display': 'none'
			}
		}).inject(document.body, 'bottom');

		this.pop.addEvent('keydown', function(e){ 
			this.esc(e);
		}.bind(this));

		// add table for pop with border graphics
		this.poptbl = new Element('table',{ 'class':'grid' }).inject(this.pop);
		this.poptbody = new Element('tbody').inject(this.poptbl);

		[['nw', 'north', 'ne'],['sw', 's', 'se']].each(function(tds) {
			this.insertPopTblRow(tds);
		}.bind(this));
		// assign td class "north" as contents block of pop
		this.popc = this.poptbl.getElement('td[class=north]');

		if (this.options.useArrows)	{
			this.addPopArrows();
		}

		if (this.options.addCloseBtn) {
			this.close = new Element('div',{
				'class':this.options.classPrefix+'Close'
			}).inject(this.pop);
			var close_a = new Element('a', {
				'href':'#',
				'title':this.options.strs.close,
				'events':{
					'click':this.hide.bindWithEvent(this)
				}
			}).inject(this.close);
			close_a.addEvent('click', function(e){ 
				if(e) e = new Event(e).stop();
				this.hide();
			}.bind(this));	
		}
	},
	cursor_pos: function(e) {
		if (!e) {e = window.event;}
		return {'x':e.page.x, 'y':e.page.y};
		return cursor;	
	},
	insertPopTblRow: function(tds){
		var tr = new Element('tr').inject(this.poptbody);
		tds.each(function(cls) {
			var td = new Element('td',{ 'class':cls }).inject(tr);
		});
	},
	addPopArrows: function(){
		// insert pop arrows into pop if they don't already exist
		var an = this.pop.getElement('div[class$=p]');
		if (!an) {
			['n','s','e','w'].each(function(d) {
				var arrw = new Element('div',{ 'class':'a'+d+' p', 'styles': { 'visibility':'hidden'} }).inject(this.pop);
				switch (d) {
					case 'n':
						arrw.setStyles({
							'bottom': 1 - arrw.getStyle('height').toInt(),
							'top':'auto'
						});
						break;
					case 's':
						arrw.setStyle('top', 1 - arrw.getStyle('height').toInt());
						break;
					case 'e':
						arrw.setStyle('left', 1 - arrw.getStyle('width').toInt());
						break;
					case 'w':
						arrw.setStyle('right', 1 - arrw.getStyle('width').toInt());
						break;				
				}
			}.bind(this));
		}
	},
	show_arrow: function(io, align) {
		if (!this.isIE6)	{
			var arrw,p={top:0,left:0},a={},nsew='';

			switch (io) {
				case 1:
					nsew = align.substr(0,1);
					break;
				case -1:				
					switch (align) {
						case 'n':
							nsew = 's';
							break;
						case 'w':
							nsew = 'e';
							break;
						case 'e':
							nsew = 'w';
							break;
						case 's':
							nsew = 'n';
							break;				
					}
					break;
			}
			this.pop.getElements('div[class$=p]').each(function(el) {
				if (el.hasClass('a'+nsew)) {
					el.set('opacity',1);
					el.setStyle('z-index',(this.pop.getStyle('z-index').toInt()+1));
					arrw = el;
				} else {
					el.set('opacity',0);
				}
			}.bind(this));

			if (arrw) {

				var axy = {
					'x':arrw.getStyle('width').toInt(),
					'y':arrw.getStyle('height').toInt()
				};

				switch (io) {
					case 1:
						// outside 
						switch (align) {
							case 'nw': 
							case 'sw':
								a = {
									'left': this.options.cornerRadius,
									'right': 'auto'
								};
								break;
							case 'n':
							case 's':
								a = {
									'left': this.popsize.x/2 - axy.x/2,
									'right': 'auto'
								};
								break;
							case 'ne':
							case 'se':
								a = {
									'left': 'auto',
									'right': this.options.cornerRadius
								};
								break;
							case 'wn':
							case 'en':
								a = {
									'top': this.options.cornerRadius,
									'bottom': 'auto'
								};
								break;
							case 'w':
							case 'e':
								a = {
									'top': this.popsize.y/2 - axy.y/2,
									'bottom': 'auto'
								};
								break;
							case 'ws':
							case 'es':
								a = {
									'top': 'auto',
									'bottom': this.options.cornerRadius
								};
								break;			
						}
						
						switch (align) {
							case 'nw': 
							case 'n':
							case 'ne':
								p.top = -axy.y;
								break;
							case 'wn':
							case 'w':
							case 'ws':
								p.left = -axy.x;
								break;
							case 'en':
							case 'e':
							case 'es':
								p.left = axy.x;
								break;
							case 'sw':
							case 's':
							case 'se':
								p.top = axy.y;
								break;		
						}
						break;
					case -1:
						// inside 
						switch (align) {
							case 'n':
							case 's':
								a = {
									'left': this.popsize.x/2 - axy.x/2,
									'right': 'auto'
								};
								break;
							case 'w':
							case 'e':
								a = {
									'top': this.popsize.y/2 - axy.y/2,
									'bottom': 'auto'
								};
								break;
						}					
						switch (align) {
							case 'n':
								p.top = axy.y;
								break;
							case 'w':
								p.left = axy.x;
								break;
							case 'e':
								p.left = -axy.x;
								break;
							case 's':
								p.top = -axy.y;
								break;				
						}						
						break;
				}

				arrw.setStyles(a);

				return {'p':p, 'a':axy};
			}
		}
	},
	set_contents: function(msg, cls, width) {
		this.shownOnce = false;

//		if (($type(cls)=='undefined') || (cls=='')) {
//			cls = 'n';
//		}
		if (this.popc) {
			this.popc.className = 'north ' + cls;
		}
		if (this.popc) {
			this.popc.empty();
			if (cls != '')	{
				var tipnote = new Element('div',{'class':'mi'}).inject(this.popc);

				switch($type(msg)) {
					case 'element':
						var msg_cl = msg.clone(true,true).cloneEvents(msg).inject(tipnote);
						break;
					case 'string':
						tipnote.set('html',msg);
						break;
				}
			} else {
				switch($type(msg)) {
					case 'element':
						var msg_cl = msg.clone(true,true).cloneEvents(msg).inject(this.popc);
						break;
					case 'string':
						this.popc.set('html',msg);
						break;
				}
			}
		}
		if (width) {
			if ((width != 'auto') && (width>0)) {
				width = width.toInt();
			}
			if (width) {
				this.poptbl.setStyle('width',width);
			}
		}

		// determine the width/height of the pop after adding new content to pop

		var was_dn = false;
		if (this.pop.getStyle('display') == 'none') {
			was_dn = true;
			this.pop.setStyle('display', 'block');
		}
		this.popsize = this.pop.getSize();
		if (was_dn) {
			this.pop.setStyle('display', 'none');
		}
	},
	esc: function(e){
		if (this.isShowing && (e.key == 'esc'))	{
			this.hide();
		}
	},
	show: function() {
		if(!this.isShowing){

			// set the starting position of the pop
			var start = {
				'visibility':'visible',
				'display': 'block',
				'opacity': 0
			};

			// both fade and fly trans fades in
			var fx = {
				'0': { 
					'opacity': this.options.popOpacity
				}
			};

			var se = this.options.place.se;
			var ss = this.options.place.ss;

			var end_xy = this.coord(se.target, se.io, se.align, se.offset, true);

			if ((se.trans == 'fly')) {

				fx['0'].top = end_xy.top;
				fx['0'].left = end_xy.left;
				fx['0'].margin = se.margin;

				if (($type(ss) == 'object') && (ss.target !=='')) {

					var start_xy = this.coord(ss.target, ss.io, ss.align, ss.offset, false);
					if (start_xy) {
						fx['0'].top = [start_xy.top,end_xy.top];
						fx['0'].left = [start_xy.left,end_xy.left];
					}
				}


			} else {
				// just fade into the end coords
				start.top = end_xy.top;
				start.left = end_xy.left;
			}
			this.pop.setStyles(start);

			// show fx for pop

			if (this.options.isModal) {
				this.add_mask(); // only adds one if it doesn't exist
				this.mask.setStyles({
					'height': window.getScrollHeight(),
					'width': window.getScrollWidth(),
					'display': 'block'
				});
				// fx for mask
				fx['1'] = { 'opacity': this.options.maskOpacity };
			} else {
				if (!this.options.isModal && this.isIE6) {
					this.mask.setStyles({
						'height': this.popsize.y,
						'width': this.popsize.x,
						'display': 'block',
						'visibility':'visible',
						'top': end_xy.top,
						'left':end_xy.left
					});
				}
			}
			this.fx_dir = 1;
			this.fx.start(fx);
		}
	},
	hide: function(e) {
		if(this.pop.getStyle('opacity')>0) {
			this.fx.cancel();
			this.fx_dir = 0;
			// fx for pop
			var fx = {
				'0': { 
					'opacity': 0
				}
			};
			var he = this.options.place.he;

			if (he.trans == 'fly') {

				var se = this.options.place.se;
				var start_xy = this.coord(se.target, se.io, se.align, se.offset, false);

				var end_xy = this.coord(he.target, he.io, he.align, he.offset, false);

				fx['0'].top = [start_xy.top,end_xy.top];
				fx['0'].left = [start_xy.left,end_xy.left];
				fx['0'].margin = he.margin;
			}
			if (this.options.isModal) {
				// fx for mask
				fx['1'] = { 'opacity': 0 };
			}
		
			this.fx.start(fx);
		}
	},
	update: function(e) {
//		if(e) e = new Event(e).stop();
		if (this.isShowing) {
			if (this.options.isModal) {
				// resize the mask to the new size of the window
				var size = window.getSize();
				var scrollSize = window.getScrollSize();
				this.mask.setStyles({
					'height': (size.y > scrollSize.y)?size.y:scrollSize.y,
					'width': size.x
				});
			}
			var se = this.options.place.se;
			if ((se.target == 'window') && (se.io==-1)) {
				// if the pop is inside the window
				this.fx.cancel();

				var coord = this.coord('window', -1, se.align, se.offset, false);

				// move pop to the center of visible screen
				this.fx.start({
					'0': { 
						'top': coord.top,
						'left': coord.left,
						'margin': se.margin
					}
				});
			}
		}
	},
	movePop: function(target, io, align, offset, margin) {
		var coord = this.coord(target, io, align, offset, true);
		if (coord)
		{
			this.pop.setStyles({
				'top': coord.top,
				'left': coord.left,
				'margin': margin
			});
		}
	},
	max: function(obj) {
		var max;
		for (var z in obj){
			if (max) {
				if (obj[z] > obj[max]) {
					max = z;
				}
			} else {
				max = z;
			}
		};
		return max;
	},
	auto_align: function(el, default_align) {

		// auto target best align for display of tip depending on scroll, window size, target size, and pop size
		var win = {'x': window.getWidth(), 'y': window.getHeight()};
		var scroll = {'x': window.getScrollLeft(), 'y': window.getScrollTop()};
		var elpos = el.getPosition();
		var eldim = { 'x':el.offsetWidth, 'y':el.offsetHeight };
		var popdim = { 'x':this.pop.offsetWidth, 'y':this.pop.offsetHeight };
		var align='';

		// determine which side has the most visible space
		// visible space

		var vs = {
			'top': elpos.y - scroll.y,
			'right': (win.x + scroll.x) - (elpos.x + eldim.x),
			'bottom': (win.y + scroll.y) - (elpos.y + eldim.y),
			'left': elpos.x - scroll.x
		};
		var vista = this.max(vs);

		if ((typeof(default_align)!='undefined') && (default_align != 'auto') && (default_align!='')) {
			// if there was a default, check to see if it will work
			align = default_align;
			var nesw = align.substr(0,1);
			switch (nesw) {
				case 'n':
					if (vs.top < this.popsize.y) {
						align='';
					}
					break;
				case 'e':
					if (vs.right < this.popsize.w) {
						align='';
					}
					break;
				case 's':
					if (vs.bottom < this.popsize.y) {
						align='';
					}
					break;
				case 'w':
					if (vs.left < this.popsize.w) {
						align='';
					}
					break;
			
			}
		}
		
		if (align == '') {

			// by determining the side on which the mouse entered, we know that there is space on that side

			if ((vista=='top')||(vista=='bottom')) {
				switch (vista) {
					case 'top':
						align = 'n';
						break;
					case 'bottom':
						align = 's';
						break;
				}
				if ((vs.right < 0) && (vs.left < 0)) {
					// both sides are covered
					if (vs.right > vs.left)	{
						// right side covered less
						align += 'e';
						op.se.margin = '0 ' + (-vs.right + op.se.offset) + 'px 0 0';
					} else {
						// left side covered less
						align += 'w';
						op.se.margin = '0 0 0 ' + (-vs.left + op.se.offset) + 'px';
					}
				} else if (vs.right < 0) {
					// right side is covered, but not left
					align += 'w';
				} else if (vs.left < 0) {
					// left side is covered, but not right
					align += 'e';
				}
			} else {
				switch (vista) {
					case 'right':
						align = 'e';
						break;
					case 'left':
						align = 'w';
						break;
				}
				if ((vs.top < 0) && (vs.bottom < 0)) {
					// both top & bottom are covered
					if (vs.top > vs.bottom)	{
						// top side covered less
						align += 'n';
						op.se.margin = (-vs.right + op.se.offset) + 'px 0 0 0';
					} else {
						// bottom side covered less
						align += 's';
						op.se.margin = '0 0 ' + (-vs.left + op.se.offset) + 'px 0';
					}
				} else if (vs.top < 0) {
					// top side is covered, but not bottom
					align += 's';
				} else if (vs.bottom < 0) {
					// bottom side is covered, but not top
					align += 'n';
				}
			}
		}
		return align;
	},
	coord: function(target, io, align, offset, arr_mode) {
		var top=0,left=0,tdim=0;
		
		this.fireEvent('beforeCoord');
		
		if (target == 'window') {
			top = window.getScrollTop();
			left = window.getScrollLeft();
			tdim = { 'x':window.getWidth(), 'y':window.getHeight() };
		} else {
			if ($type(target)=='string') {
				var t = $(target);
			} else {
				var t = target;
			}
			if (t) {
				// figure out if the element is in the same window as the dialog
				var tpos = t.getPosition();
				if (!tpos && (t.getStyle('display')=='inline')) {
					var tpos = this.cursor_pos(this.event);
					top = tpos.y;
					left = tpos.x;
					tdim = { 'x':1, 'y':1 };
				} else {
					var tpos = t.getPosition();
					if (tpos) {
						top = tpos.y;
						left = tpos.x;
						tdim = { 'x':t.offsetWidth, 'y':t.offsetHeight };
					}
				}
				if (!$defined(align)) {
					align = this.auto_align(t,'auto');
				}
			}
		}
		if (tdim) {

			if ((arr_mode===true) && this.options.useArrows) {
				var pa = this.show_arrow(io, align);
			}

			var nesw = align.substr(0,1);
			switch (io) {
				case 1:
					// outside 
					switch (nesw) {
						case 'n':
							top -= (this.popsize.y + offset);
							break;
						case 'e':
							left += (tdim.x + offset);
							break;
						case 's':
							top += (tdim.y + offset);
							break;
						case 'w':
							left -= (this.popsize.x + offset);
							break;					
					}

					// move pop if the size of pop is bigger than the target
					switch (align) {
						case 'nw':
						case 'sw':
							if ((tdim.x < this.popsize.x) && pa) {
								left -= pa.a.x/2;
							}
							break;
						case 'ne':
						case 'se':
							if ((tdim.x < this.popsize.x) && pa) {
								left += pa.a.x/2;
							}
							break;
					}

					switch (align) {
						case 'n': // above target, centered
							left += (tdim.x/2 - this.popsize.x/2);
							break;
						case 'ne': // above target, right aligned
							left += (tdim.x - this.popsize.x);
							break;
						case 'w': // left of target, middle aligned
							top += (tdim.y/2 - this.popsize.y/2);
							break;
						case 'ws': // left of target, bottom aligned
							top += (tdim.y - this.popsize.y);
							break;
						case 'e': // right of target, middle aligned
							top += (tdim.y/2 - this.popsize.y/2);
							break;
						case 'es': // right of target, bottom aligned
							top += (tdim.y - this.popsize.y);
							break;
						case 's': // below target, middle aligned
							left += (tdim.x/2 - this.popsize.x/2);
							break;				
						case 'se': // below target, right aligned
							left += (tdim.x - this.popsize.x);
							break;				
					}
					break;
				case -1:
					// inside 
					switch (nesw) {
						case 'n':
							top += offset;
							break;
						case 's':
							top += (tdim.y - this.popsize.y - offset);
							break;
					}
					switch (align) {
						case 'nw':
							left += offset;
							break;
						case 'n':
							left += (tdim.x/2 - this.popsize.x/2);
							break;
						case 'ne':
							left += (tdim.x - this.popsize.x - offset);
							break;
						case 'w':
							top += (tdim.y/2 - this.popsize.y/2);
							left += offset;
							break;
						case 'c':
							top += (tdim.y/2 - this.popsize.y/2);
							left += (tdim.x/2 - this.popsize.x/2);
							break;
						case 'e':
							top += (tdim.y/2 - this.popsize.y/2);
							left += (tdim.x - this.popsize.x - offset);
							break;
						case 'sw':
							left += offset;
							break;				
						case 's':
							left += (tdim.x/2 - this.popsize.x/2);
							break;				
						case 'se':
							left += (tdim.x - this.popsize.x - offset);
							break;				
					}
					break;

			}
			if (pa) {
				top += pa.p.top;
				left += pa.p.left;
			}
			if (this.posRelative) {
				top += this.posRelative.y;
				left += this.posRelative.x;
			}
			return { 'top': top, 'left': left };
		}
		return false
	},
	destroy: function() {
		if (this.mask) {
			this.mask.remove();
		}
		this.pop.remove();
	}

});

window.addEvent('domready', function(){
	
	function gen_btn(str, cls, extra_cls){
		var obj = { 'class': cls + ' ' + extra_cls, 'href':'#' };
		var anchor = new Element('a', obj);
		var s1 = new Element('span').inject(anchor);
		var s2 = new Element('span').inject(s1);
		var s3 = new Element('span', {'class':'s3'}).set('html',str).inject(s2);
		return anchor;
	};

	var AscDialogModal = new AscDialog({
		isModal: true,
		addCloseBtn: false, 
		popOpacity: .97,
		speed:150,
		classPrefix: 'Modal',
		place: {
			'se': { trans:'fade', target:'window', io:-1, align:'c', offset:0, margin:0 }, // show end
			'he': { trans:'fade', target:'window', io:-1} // hide end
		}
	});
	var AscLinkEditModal = new AscDialog({
		isModal: false,
		addCloseBtn: true, 
		useArrows: true,
		popOpacity: .97,
		speed:150,
		actionDelay: 50,
		showDelay: 0,
		hideDelay: 0,
		default_align:'auto',
		classPrefix: 'Link',
		place: {
			'ss': { 'io':1, offset:6 }, // show start
			'se': { 'io':1, offset:6 }, // show end
			'he': { trans:'fade' } // hide end
		},
		onBeforeCoord: function() {
			if (this.posRelativeEl) {
				this.posRelative = this.posRelativeEl.getPosition();
				if (this.scrollRelativeEl) {
					this.posRelative.x -= this.scrollRelativeEl.x;
					this.posRelative.y -= this.scrollRelativeEl.y;
				}
			} else {
				this.posRelative = {x: 0, y: 0};
			}
		}
	});
	
	var formatBlockOverlayWidth = 150;
	if (Browser.Engine.trident) {
		formatBlockOverlayWidth = 165;
	}
	
	MooEditable.UI.AscDialog = new Class({
	
		Implements: [Events, Options],
	
		options:{
			/*
			onOpen: $empty,
			onPreShow: $empty,
			onShow: $empty,
			onClose: $empty,
			*/
			modal_speed: 150
		},
		initialize: function(html, options, modal_class){
			this.setOptions(options);
			this.html = html;
			this.modal_class = modal_class;
			
			this.modal = AscDialogModal;
			this.els = {};
		},
		
		toElement: function(){
			return this.modal.pop;
		},
		
		click: function(){
			this.fireEvent('click', arguments);
			return this;
		},
		
		open: function(modal_width){
			this.modal.init();
			
			this.modal.addEvent('hide', function() {
				// this reactivates toolbar upon modal hide
				this.fireEvent('close', this);
			}.bind(this));
			
			// return all clicks on the modal dialog to the click function
			this.modal.pop.addEvent('click', this.click.bind(this));
			
			// refresh the modal contents to that of this dialog
			this.modal.set_contents(this.html, this.modal_class, modal_width);
			
			this.fireEvent('preshow', this);
			
			// position the modal to the center of the editor
			var body = $(document.body);
			var container = body.getElement('.mooeditable-container');
			body.grab(this.modal.pop, 'bottom');
			this.modal.options.place.ss.target = container;
			this.modal.options.place.se.target = container;
			this.modal.options.place.he.target = container;
			
			// establish action to take once the modal is finished showing
			this.modal.removeEvents('show');
			this.modal.addEvent('show', function() {
				this.fireEvent('show', this);
				this.fireEvent('open', this);
			}.bind(this));
			
			// start modal show animation
			this.modal.show();
			
			return this;
		},
		
		close: function(){
			this.modal.hide();
			return this;
		}
	
	});
	MooEditable.UI.AscAlertDialog = function(alertText){
		if (!alertText) return;
	
		var d = new Element('div');
		var c = new Element('div',{'class':'eregmodal'}).inject(d);
		var p = new Element('p',{'class':'alert', 'html': alertText}).inject(c);
		var ok2 = gen_btn('OK', 'cancel-btn', 'form').inject(c);
		var html = d.get('html');
	
		return new MooEditable.UI.AscDialog(html, {
			onClick: function(e){
				e.preventDefault();
				var link = '';
				var el = e.target;
				var tag = e.target.tagName.toLowerCase();
				if (tag == 'span') {
					link = $(el).getParent('a[*=cancel-btn]');
				} else if (tag == 'a') {
					if (document.id(e.target).hasClass('cancel-btn')) link = el;
				}
				if (link) {
					this.close();
				}
			}
		}, 'alert');
	};
	
	MooEditable.UI.AscPromptDialog = function(questionText, submitBtnText, fn, dialog_class){
		if (!questionText) return;
	
		var d = new Element('div');
		var c = new Element('div').inject(d);
		var h3 = new Element('h3',{'html': questionText}).inject(c);
		var input_text = new Element('input', {'type':'text', 'class':'dialog-input', 'value': '' }).inject(c);
		var tbl = new Element('table', {'class':'btns'}).inject(c);
		var tbody = new Element('tbody').inject(tbl);
		var tr = new Element('tr').inject(tbody);
		var td2 = new Element('td', {'class':'btns'} ).inject(tr);
		var submit_btn_a = gen_btn(submitBtnText, 'form submit-dialog').inject(td2);
		var td3 = new Element('td', {'class':'or', 'html':'or'}).inject(tr);
		var td4 = new Element('td', {'class':'cancel'} ).inject(tr);
		var cancel_a = new Element('a', {'href':'#', 'class': 'cancel-btn', 'html':'Cancel'}).inject(td4);
	
		var html = d.get('html');
	
		return new MooEditable.UI.AscDialog(html, {
			onOpen: function(){
				var input = this.modal.pop.getElement('input[*=dialog-input]');
				if (input) {
					input.addEvent('keydown', function(e) {
						if (e.key=='enter') {
							if (fn) fn.attempt(input.get('value'), this);
							this.close();
						}
					}.bind(this));
					(function(){
						input.focus();
					}).delay(1);
				}
			},
			onClick: function(e){
				e.preventDefault();
				var link = '';
				var el = e.target;
				var tag = e.target.tagName.toLowerCase();
				if (tag == 'span') {
					link = $(el).getParent('a[class*=submit-dialog]');
					if (link) {
						var input = this.modal.pop.getElement('input[*=dialog-input]');
						if (fn) fn.attempt(input.get('value'), this);
					}
				} else if (tag == 'a') {
					if (document.id(e.target).hasClass('cancel-btn')) link = el;
				}
				if (link) {
					this.close();
				}
			}
		}, dialog_class);
	};
	
	
	MooEditable.Actions.extend({
	
		formatBlock: {
			title: 'Paragraph',
			type: 'button-overlay',
			options: {
				mode: 'text',
				overlayHTML: (function(){
					var html = '<p><a href="#">Paragraph</a></p><h1><a href="#">Heading 1</a></h1><h2><a href="#">Heading 2</a></h2><h3><a href="#">Heading 3</a></h3><h4><a href="#">Heading 4</a></h4><h5><a href="#">Heading 5</a></h5><h6><a href="#">Heading 6</a></h6><pre><a href="#">Monospace</a></pre>';
					return html;
				})(),
				overlaySize: {x: formatBlockOverlayWidth, y: 'auto'}
			},
			command: function(buttonOverlay, e){
				var el = e.target;
				var tag = $(el).getParent().get('tag');
				var argument = '<' + tag + '>';
//				this.selection.selectNode(this.selection.getNode());
				
				if (Browser.Engine.webkit) {
					var node = this.selection.getNode();
					if (node) {
						var blks = ["p","h1","h2",'h3','h4','h5','h6','code','pre'];
						var node_tag = node.nodeName.toLowerCase();
						if (!blks.contains(node_tag)) {
							blks.each(function(blk){ 
								var parent_blk = node.getParent(blk);
								if (parent_blk) {
									node = parent_blk;
								}
							});			
						}
						node = $(node);
						var new_blk = new Element(tag, {'html': node.get('html')}).inject(node,'before');
						node.destroy(); 
					}
				} else {
					if (Browser.Engine.trident) {
						this.selection.selectNode(this.selection.getNode());
					}
					this.execute('formatBlock', false, argument);
				}
				this.focus();
				buttonOverlay.overlayVisible = true;
				buttonOverlay.closeOverlay();
			}
		},
		snippets: {
			title: 'Snippets',
			type: 'button-overlay',
			options: {
				mode: 'text',
				overlayHTML: (function(){
					var data = ['Listen closely', 'As you may already know', "Now, I don't know about you", "Well, I've got news for you", "Let me explain", "And best of all", "In fact", "Here's the bottom line", "Now, I know what you're thinking", "<p><a href=\"http://www.acme-hardware.com/\">ACME Hardware</a> is at all times interested in providing you with the best possible user experience. Part of our service to you includes a strong commitment to your privacy as our customer. To that end, we endeavor to provide you with a safe, secure service and use our best efforts to ensure that the information you submit to us remains private and is used only for the expressed purposes of the Employment Center. The following statements provide additional details about our privacy commitment.</p>"];
					if (data) {
						var d = new Element('div');
						data.each(function(blurb){
							var b = new Element('div', {'class':'snip', 'html':blurb}).inject(d);
						});
						return d.get('html');
					}
				})(),
				overlaySize: {x: 450, y: 'auto'}
			},
			command: function(buttonOverlay, e){
				var text = '';
				var el = $(e.target);
				if (el) {
					if ((el.get('tag') == 'div') && el.hasClass('snip')) {
						text = el.get('html');
					} else {
						var parent = el.getParent('div[class=snip]');
						if (parent) {
							text = parent.get('html');
						}
					}
					if (text) {
						this.selection.insertContent(text);
					}
				} 
				this.focus();
				buttonOverlay.overlayVisible = true;
				buttonOverlay.closeOverlay();
			}
		},
				
		justifyleft:{
			title: 'Align Left',
			states: {
				css: {'text-align': 'left'}
			}
		},
		
		justifyright:{
			title: 'Align Right',
			states: {
				css: {'text-align': 'right'}
			}
		},
		
		justifycenter:{
			title: 'Align Center',
			states: {
				tags: ['center'],
				css: {'text-align': 'center'}
			}
		},
		asc_unlink: {
			title: 'Remove Hyperlink',
			dialogs: {
				alert: MooEditable.UI.AscAlertDialog.pass('No hyperlink was found to remove.')
			},
			command: function(){
				var node = this.selection.getNode();
				if (this.selection.isCollapsed() && (node.nodeName != 'A')){
					this.dialogs.asc_unlink.alert.open(400);
				} else {
					if (this.selection.isCollapsed()) {
						this.selection.selectNode(node);
						this.execute('unlink', false, null);
						this.selection.collapse();
					} else {
						this.execute('unlink', false, null);
					}
				}
			}
		},
		asc_createlink: {
			title: 'Add Hyperlink',
			options: {
				shortcut: 'l'
			},
			states: function(el,editor) {
				var item = this;
				var a_found = false;
				do {
					if ($type(el) != 'element') break;
					var tag = el.tagName.toLowerCase();
					if (tag == 'a') {
						this.activate(tag);
						a_found = true;
						var link_el = $(el);
						break;
					}
				} while (el = el.parentNode);
				var tip = AscLinkEditModal;
				if (a_found) {
					
					tip.posRelativeEl = editor.iframe;
				
					var settings = {
						'target':link_el,
						'align':tip.auto_align(link_el, 'auto')
					};
					if (tip.options.place.se.trans=='fly')	{
						$extend(tip.options.place.ss, settings);
						tip.options.place.ss.offset = 25;
					}
					$extend(tip.options.place.se, settings);
					$extend(tip.options.place.he, settings);
					
					tip.isShowing = false;
					
					var href = link_el.get('href');
					var c = new Element('div');
					var goto = new Element('p', {'html':'Go to ', 'class':'goto'}).inject(c);
					if (href.length > 100) {
						var link_text_to_show = href.substr(0,50) + "&hellip;";
					} else {
						var link_text_to_show = href;
					}
					var test_a = new Element('a', {'href':href, 'html':link_text_to_show, 'target':'_blank'}).inject(goto);
					var edit_a = new Element('a', {'class':'edit', 'href':'#', 'html':'Edit link'}).inject(c);
					var remove_a = new Element('a', {'class':'remove', 'href':'#', 'html':'Remove link'}).inject(c);
					
					tip.set_contents(c.get('html'), 'small', 'auto');
					
					tip.removeEvents('show');
					tip.addEvent('show', function() {
						var edit_a = this.pop.getElement('a[class=edit]');
						edit_a.addEvent('click', function(e) {
							e.preventDefault();
							item.action(e);
							tip.hide();							
						});
						
						var remove_a = this.pop.getElement('a[class=remove]');
						remove_a.addEvent('click', function(e) {
							e.preventDefault();
							var node = editor.selection.getNode();
							if (editor.selection.isCollapsed()) {
								editor.selection.selectNode(node);
								editor.execute('unlink', false, null);
								editor.selection.collapse();
							} else {
								editor.execute('unlink', false, null);
							}
							tip.hide();							
						});
						
					}.bind(tip));
					
					tip.show();
				} else {
					if (tip.isShowing) {
						tip.hide();
					}
				}
			},
			onScroll: function(editor) {
				var tip = AscLinkEditModal;
				tip.scrollRelativeEl = editor.doc.getScroll();
				if (tip.isShowing) {
					tip.hide();
				}
			},
			command: function() {
														
				var mode = 'text';
				var linkFound = false;
				var isCollapsed = this.selection.isCollapsed();
				var range = this.selection.getRange();
				var node = this.selection.getNode();
	
				if (node.nodeName == 'A') {
					linkFound = true;
//						$('data').set('html', 'link found by itself');
				} else {
					var parent_link = node.getParent('a');
					if (parent_link) {
//						$('data').set('html', 'parent link found');
						node = parent_link;
						linkFound = true;
					} else {
						var firstChild = node.getFirst('a');
						if (firstChild) {
							if (node.tagName == 'A') {
//								$('data').set('html', 'child link found');
								node = firstChild;
								linkFound = true;
							}
						}
					}				
				}
				var href = '';
				var email = '';
				if (linkFound)	{
					href = node.get('href').trim();
					this.selection.selectNode(node);
					mode = 'link';
				} 			
				
				var link_html = '';
				var submitBtnText = 'Edit Link';
				var target_blank = false;
				
				if (linkFound) {
					// a link was found so select the entire node for editing the link
					this.selection.selectNode(node);
					var link_el = $(node);
					link_html = link_el.get('html');
					if (link_el.get('target') == '_blank') {
						target_blank = true;
					}
				} else {
					if (isCollapsed) {
						MooEditable.UI.AscAlertDialog('Select something to link.').open(400);
						return;
					} else {
						link_html = this.selection.getText();
					}
				}
								
				if (link_html.length > 100) {
					var link_text_to_show = link_html.substr(0,100) + "&hellip;";
				} else {
					var link_text_to_show = link_html;
				}

				var mailto_regexp = /^mailto:(?:[a-zA-Z0-9_'^&amp;/+-])+(?:\.(?:[a-zA-Z0-9_'^&amp;/+-])+)*@(?:(?:\[?(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\.){3}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\]?)|(?:[a-zA-Z0-9-]+\.)+(?:[a-zA-Z]){2,}\.?)$/;
				var email_regexp = /^(?:[a-zA-Z0-9_'^&amp;/+-])+(?:\.(?:[a-zA-Z0-9_'^&amp;/+-])+)*@(?:(?:\[?(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\.){3}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\]?)|(?:[a-zA-Z0-9-]+\.)+(?:[a-zA-Z]){2,}\.?)$/;
				
				var url_regexp = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/i;
				var link_type = 'webpage';
				if (!href.test(url_regexp)) {
					if (href.test(mailto_regexp)) {
						link_type = 'email';
						submitBtnText = 'Edit Email Address';
						email = href.substr(7);
						href = email;
					} else {
						href = 'http://';
						submitBtnText = 'Insert Link';
					}	
				}
				
				// build dialog form
				
				if (link_text_to_show) {
					h3_str = 'Link "<b>' + link_text_to_show + '</b>" to &hellip;';
				} else {
					h3_str = 'Enter URL';
				}	
								
				var d = new Element('div');
				var c = new Element('form').inject(d);
				var h3 = new Element('h3',{'html': h3_str}).inject(c);
				
				var link_type_row = new Element('div', {'class':'type'}).inject(c);
				
				var type_tabs = {
					'webpage':'Webpage',
					'email':'Email Address'
				};
				for (var ltype in type_tabs){
					var ltype_attr = {'href':'#', 'class':ltype,'html':type_tabs[ltype]};
					if (link_type == ltype) {
						ltype_attr['class'] += " down";
					}
					var ltype_tab = new Element('a', ltype_attr).inject(link_type_row);
				}
				
				// url textbox

				var input_text = new Element('input', {
					'type':'text', 
					'class':'dialog-input'
				}).inject(c);

				var feedback = new Element('div',{'class':'fdbk right'}).inject(c);
				var lblk = new Element('div', {'class':'left'}).inject(c);
				
				// attributes
				
				var attr_row = new Element('div', {'class':'attr'}).inject(lblk);
				var blank_target_checkbox = new Element('input', {'type':'checkbox', 'name':'blank_target', 'id':'blank_target', 'class':'blank', 'styles': {'margin':0}}).inject(attr_row);
				var blank_lbl = new Element('label',{'for':'blank_target', 'class':'blank', 'html': 'Have link open a new window', 'styles': {'margin':'0 0 0 5px'} }).inject(attr_row);
				
				// buttons
				
				var tbl = new Element('table', {'class':'btns'}).inject(lblk);
				var tbody = new Element('tbody').inject(tbl);
				var tr = new Element('tr').inject(tbody);
				var td2 = new Element('td', {'class':'btns'} ).inject(tr);
				var submit_btn_a = gen_btn(submitBtnText, 'form submit-dialog').inject(td2);
				var td3 = new Element('td', {'class':'or', 'html':'or'}).inject(tr);
				var td4 = new Element('td', {'class':'cancel'} ).inject(tr);
				var cancel_a = new Element('a', {'href':'#', 'class': 'cancel-btn', 'html':'Cancel'}).inject(td4);

				var clr = new Element('div',{'class':'clr'}).inject(c);
				
				var dialog_html = d.get('html');
				
				// function to process form
				
				var fn = function(els){
					var url = els.url.get('value').trim();
					if (url && (url != 'http://')) {
						var link_attr = {'href':url};
					
						switch (els.link_type) {
							case 'webpage':
								if (els.blank_ckb.checked) {
									link_attr['target'] = '_blank';
								}
								break;
							case 'email':
								link_attr['href'] = 'mailto:' + url;
								break;
						}
						
						if (linkFound)	{
							// replace that link with a new one
							link_attr.html = link_html;
							var link = new Element('a', link_attr).inject(node,'before');
							node.destroy(); 
						} else {
							// inserting link
							if (isCollapsed) {
								// nothing was selected, so just insert link using url as text
								link_attr.html = url;
							} else {
								// some text was selected
								link_attr.html = link_html;
							}
							var d = new Element('div');
							var link = new Element('a', link_attr).inject(d);
							var html = d.get('html');

							this.selection.setRange(range);
							this.selection.insertContent(html);
						}
					} else {
						this.execute('unlink', false, null);
					}
					this.focus();
				}.bind(this);
					
				// open dialog
			
				var dialog = new MooEditable.UI.AscDialog(dialog_html, {
					onOpen: function(e){
						if (this.els.url) {
							(function(){
								this.els.url.focus();
								this.els.url.fireEvent('keydown',e);
							}.bind(this)).delay(1,this);
						}
					},
					onPreshow: function() {
						this.modal.pop.removeEvents('click');
						this.els = {
							link_type: link_type,
							web: href,
							email: email,
							url: this.modal.pop.getElement('input[class*=dialog-input]'),
							attr: this.modal.pop.getElement('div[class=attr]'),
							blank_ckb: this.modal.pop.getElement('input[class=blank]'),
							blank_lbl: this.modal.pop.getElement('label[class=blank]'),
							submit_btn: this.modal.pop.getElement('a[class*=submit-dialog]'),
							cancel_btn: this.modal.pop.getElement('a[class=cancel-btn]'),
							webpage_tab: this.modal.pop.getElement('a[class*=webpage]'),
							email_tab: this.modal.pop.getElement('a[class*=email]'),
							fdbk: this.modal.pop.getElement('div[class*=fdbk]')
						};
						// for some reason I was unable to set the input value when creating the el earlier
						this.els.url.set('value', href);

						this.els.url.addEvent('keyup', function(e) {
							var url = this.els.url.get('value').trim();
							this.els.fdbk.empty();
							
							switch (this.els.link_type) {
								case 'webpage':
									// if valid URL, then show test URL link
									if (url.test(url_regexp)) {
										var test_a = this.els.fdbk.getElement('a[id=test_link]');
										if (test_a) {
											test_a.set('href', url);
										} else {
											var test_a = new Element('a', {'id':'test_link', 'href':url, 'html':'Test this link', 'target':'_blank'}).inject(this.els.fdbk);
										}											
									}
									break;
								case 'email':
									// test to see if this is a valid email address
									if (url == '') {
										this.els.fdbk.set('html', 'Enter an email address').removeClass('pass').removeClass('fail');
									} else {
										if (url.test(email_regexp)) {
											this.els.fdbk.set('html', 'Valid email address').addClass('pass').removeClass('fail');
										} else {
											this.els.fdbk.set('html', 'Invalid email address').addClass('fail').removeClass('pass');
											return;
										}
									}
									break;
							}
						}.bind(this));
						this.els.url.addEvent('keydown', function(e) {
							if (e.key=='enter') {
								e.preventDefault();
								if (fn) fn.attempt(this.els, this);
								this.close();
							}
						}.bind(this));
						this.els.webpage_tab.addEvent('click', function(e) {
							e.preventDefault();
							if (!this.els.webpage_tab.hasClass('down')) {
								this.els.link_type = 'webpage';
								this.els.fdbk.empty();
								this.email = this.els.url.get('value').trim();
								this.els.url.set('value',this.web);												this.els.url.fireEvent('keyup',e);
								this.els.url.focus();
								this.els.webpage_tab.addClass('down');
								this.els.email_tab.removeClass('down');
								this.els.attr.setStyle('display', 'block');
							} else {
								this.els.webpage_tab.blur()
							}
						}.bind(this));

						this.els.email_tab.addEvent('click', function(e) {
							e.preventDefault();
							if (!this.els.email_tab.hasClass('down')) {
								this.els.link_type = 'email';
								this.web = this.els.url.get('value').trim();
								this.els.url.set('value',this.email);
								this.els.url.fireEvent('keyup',e);
								this.els.url.focus();
								this.els.webpage_tab.removeClass('down');
								this.els.email_tab.addClass('down');
								this.els.attr.setStyle('display', 'none');
							} else {
								this.els.email_tab.blur()
							}
						}.bind(this));
						
						if (link_type == 'email') {
							this.els.attr.setStyle('display', 'none');
						}

						this.els.submit_btn.addEvent('click', function(e) {
							if (fn) fn.attempt(this.els, this);
							this.close();
						}.bind(this));
						
						this.els.cancel_btn.addEvent('click', this.close.bindWithEvent(this));
						
						if (target_blank)	{
							this.els.blank_ckb.checked = true;
						}
					}
				}, 'link');
				
				dialog.open(530);
				
			}
		}
	});	
});
