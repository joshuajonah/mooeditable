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
		onPreShow: $empty,
		onShow: $empty,
		onFirstShow: $empty,
		onHide: $empty,
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
				var styles = {};
				var h = arrw.getStyle('height');
				if (h) h = h.toInt();
				var w = arrw.getStyle('width');
				if (w) w = w.toInt();
				switch (d) {
					case 'n':
						styles.top='auto';
						if ($type(h)=='number') styles.bottom = 1 - h;
						break;
					case 's':
						if ($type(h)=='number') styles.top = 1 - h;
						break;
					case 'e':
						if ($type(w)=='number') styles.left = 1 - w;
						break;
					case 'w':
						if ($type(w)=='number') styles.right = 1 - w;
						break;				
				}
				arrw.setStyles(styles);
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
		this.fireEvent('preshow', this);
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
var AscStatesTooltip = new Class({
	Implements: [Options,Events], 
    Extends: AscDialog,
 	options: {
		isModal: false,
		addCloseBtn: true, 
		useArrows: true,
		popOpacity: .97,
		speed:150,
		actionDelay: 50,
		showDelay: 0,
		hideDelay: 0,
		default_align:'auto',
		classPrefix: 'Tip',
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
		},
		onPreshow: function(e) {
			// this is to prevent double show of tip upon double click
			if (this.allow_tip_show) {
				this.suspend_tip_temporarily();
			} else {
				this.isShowing = true;
			}
		}

	},
	initialize: function(options){
        this.parent(options);
        this.allow_tip_show = true;
	},
	suspend_tip_temporarily: function(){
       this.allow_tip_show = false;
		$clear(this.timer);
		this.timer = this.allow_tip.delay(500,this);
	},
	allow_tip: function(){
		this.allow_tip_show = true;
    },
    target_to_el_in_iframe: function(el, iframe) {
		this.posRelativeEl = iframe;
		var settings = {
			'target':el,
			'align':this.auto_align(el, 'auto')
		};
		if (this.options.place.se.trans=='fly')	{
			$extend(this.options.place.ss, settings);
			this.options.place.ss.offset = 25;
		}
		$extend(this.options.place.se, settings);
		$extend(this.options.place.he, settings); 
    },
    add_link_controls: function(c, href) {
		var goto = new Element('p', {'html':'Go to ', 'class':'goto'}).inject(c);
		if (href.length > 100) {
			var link_text_to_show = href.substr(0,50) + "&hellip;";
		} else {
			var link_text_to_show = href;
		}
		var test_a = new Element('a', {'href':href, 'html':link_text_to_show, 'target':'_blank'}).inject(goto);
		var edit_a = new Element('a', {'class':'edit-link', 'href':'#', 'html':'Edit link'}).inject(c);
		var remove_a = new Element('a', {'class':'remove-link', 'href':'#', 'html':'Remove link'}).inject(c);
		return c;
    },
    enable_link_controls: function(editor) {
		var link_item = editor.toolbar.getItem('createlink');
		this.pop.getElement('a[class=edit-link]').addEvent('click', function(e) {
			e.preventDefault();
			link_item.action(e);
			this.hide();							
		}.bind(this));
		this.pop.getElement('a[class=remove-link]').addEvent('click', function(e) {
			e.preventDefault();
			var node = editor.selection.getNode();
			if (editor.selection.isCollapsed()) {
				editor.selection.selectNode(node);
				editor.execute('unlink', false, null);
				editor.selection.collapse();
			} else {
				editor.execute('unlink', false, null);
			}
			this.hide();							
		}.bind(this));

    },
    add_img_controls: function(c, img_align) {
		var tbl = new Element('table', {'class':'btns'}).inject(c);
		var tbody = new Element('tbody').inject(tbl);
		var tr = new Element('tr').inject(tbody);
		var td1 = new Element('td', {'html': '<b>Align: </b>', 'styles':{'padding-right':5}} ).inject(tr);
		var td2 = new Element('td', {'class':'btns'} ).inject(tr);

		var img_align_options = {
			'left':'Left',
			'center':'Center',
			'right':'Right',
			'absmiddle':'Middle'
		};
		
		var lcrm  = ['left','center','right','absmiddle'];
		lcrm.each(function(x) {
			var ia_attr = {'href':'#', 'class':'btn align-'+x,'title': "Align " + img_align_options[x]};
			if (img_align == x) {
				ia_attr['class'] += " down";
			}
			var btn = new Element('a', ia_attr).inject(td2);
			var icon = new Element('div', {'class': 'icon'}).inject(btn);
		});

		var td3 = new Element('td', {'class':'or', 'html':'or'}).inject(tr);
		var td4 = new Element('td', {'class':'cancel'} ).inject(tr);
		var none_a = new Element('a', {'href':'#', 'class': 'none', 'html':'None'}).inject(td4);
		
		var edit_a = new Element('a', {'class':'edit-img', 'href':'#', 'html':'Edit image'}).inject(c);
		var remove_a = new Element('a', {'class':'remove-img', 'href':'#', 'html':'Remove image'}).inject(c);
		return c;
    },
    enable_img_controls: function(img_el, editor, range) {
		var img_item = editor.toolbar.getItem('urlimage');
		this.pop.getElement('a[class=edit-img]').addEvent('click', function(e) {
			e.preventDefault();
			img_item.action(e);
			this.hide();							
		}.bind(this));
		this.pop.getElement('a[class=remove-img]').addEvent('click', function(e) {
			e.preventDefault();
			img_el.destroy();
			editor.saveContent();
			editor.selection.collapse();
			this.hide();							
		}.bind(this));
		
		['left','center','right','absmiddle'].each(function(x) {
			this.pop.getElement('a[class*=align-'+x+']').addEvent('click', function(e) {
				e.preventDefault();
				img_el.set('align', x);
				var styles={};
				switch (x) {
					case 'left':
						styles={
							'display':'block',
							'margin':'0 .5em .3em 0',
							'float':'left'
						};									
						break;
					case 'center':
						styles={
							'display':'block',
							'margin':'.5em auto',
							'float':'none'
						};									
						break;
					case 'right':
						styles={
							'display':'block',
							'margin':'0 0 .3em .5em',
							'float':'right'
						};									
						break;
					case 'absmiddle':
						styles={
							'display':'inline',
							'margin':'auto',
							'float':'none'
						};									
						break;
				}
				img_el.setStyles(styles);
				editor.selection.setRange(range);
				this.hide();							
			}.bind(this));
		}.bind(this));
		this.pop.getElement('a[class=none]').addEvent('click', function(e) {
			e.preventDefault();
			img_el.set('align', '');
			img_el.setStyles({
				'display':'inline',
				'margin':'auto',
				'float':'none'
			});
			editor.selection.setRange(range);
			this.hide();							
		}.bind(this));
    },
    el_img_child: function(el) {
    	if ($type(el) != 'element') {
    		el = $(el);
    	}
    	return el.getElement('img');    	
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
	function randomString() {
		var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
		var string_length = 12;
		var randomstring = '';
		for (var i=0; i<string_length; i++) {
			var rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum,rnum+1);
		}
		return randomstring;
	}

	var AscDialogModal = new AscDialog({
		isModal: true,
		addCloseBtn: false, 
		popOpacity: .97,
		speed:150,
		classPrefix: 'Modal',
		place: {
			'se': { trans:'fade', target:'window', io:-1, align:'n', offset:80, margin:0 }, // show end
			'he': { trans:'fade', target:'window', io:-1} // hide end
		}
	});
		
	var AscTooltip = new AscStatesTooltip();
	
	// misc variables that really should be in the class somewhere
	
	var formatBlockOverlayWidth = 150;
	if (Browser.Engine.trident) {
		formatBlockOverlayWidth = 165;
	}
	var upload_ct = 0;
	var max_file_size = 4194304;
	var url_regexp = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/i;
	var mailto_regexp = /^mailto:(?:[a-zA-Z0-9_'^&amp;/+-])+(?:\.(?:[a-zA-Z0-9_'^&amp;/+-])+)*@(?:(?:\[?(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\.){3}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\]?)|(?:[a-zA-Z0-9-]+\.)+(?:[a-zA-Z]){2,}\.?)$/;
	var email_regexp = /^(?:[a-zA-Z0-9_'^&amp;/+-])+(?:\.(?:[a-zA-Z0-9_'^&amp;/+-])+)*@(?:(?:\[?(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\.){3}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\]?)|(?:[a-zA-Z0-9-]+\.)+(?:[a-zA-Z]){2,}\.?)$/;
				
	
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
		
		toggleview: {
			title: 'Toggle between rich text editor and source code',
			command: function(){
				(this.mode == 'textarea') ? this.toolbar.enable() : this.toolbar.disable('toggleview');
				this.toggleView();
				AscTooltip.hide();
			}
		},	
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
		urlimage: {
			title: 'Add Image',
			options: {
				shortcut: 'm'
			},
			states: function(el,editor) {
				var item = this;
					// webkit can't detect an img when it is floating left or right, click will only grab the body tag
				var tag = el.tagName.toLowerCase();
				if (tag != 'img') {
					return;
				}
				this.activate(tag);

				var tip = AscTooltip;
			
				var img_el = $(el);
				var range = editor.selection.getRange();
				editor.selection.selectNode(el);
				tip.target_to_el_in_iframe(img_el, editor.iframe);
				
				tip.isShowing = false;
				
				var img_align = img_el.get('align');
				
				var c = new Element('div');
				c = tip.add_img_controls(c, img_align);
				
				if (el.parentNode.tagName == 'A') {
				
					var secondrow = new Element('div', {'class':'secondrow'}).inject(c);
					secondrow = tip.add_link_controls(secondrow, $(el.parentNode).get('href').trim());
				}

				var html = c.get('html');
				tip.set_contents(c.get('html'), 'small', 'auto');

				tip.removeEvents('show');
				tip.addEvent('show', function() {
					tip.enable_img_controls(img_el, editor, range);								
					if (el.parentNode.tagName == 'A') {
						tip.enable_link_controls(editor);
					}										
				}.bind(tip));
				
				tip.show();
			},
			ondblclick: function(item, e) {
				var el = this.selection.getNode();
				if (!el) return;
				var img_found = false;
				do {
					if ($type(el) != 'element') break;
					var tag = el.tagName.toLowerCase();
					if (tag == 'img') {
						item.action(e);
						return;
					}
				} while (el = el.parentNode);
			},
			command: function() {
			
				var img_found = false;
				var isCollapsed = this.selection.isCollapsed();
				var node = this.selection.getNode();
				var src = '';
				var alt = '';
				var img_type = 'src';
	
				var submitBtnText = 'Add Image';
				var h3txt = 'Add an image';
				
				if (node.nodeName == 'IMG') {
					img_found = true;
					// editing existing image
					var img_el = $(node);
					src = img_el.get('src').trim();
					alt = img_el.get('alt');
					if (alt) alt = alt.trim();
					submitBtnText = 'Edit Image';
					h3txt = 'Edit this image';
					
				}
				
				// build dialog form
				// insert img (1) via src, (2) upload, (3) albums
				
				var d = new Element('div');
				var c = new Element('div').inject(d);
				var h3 = new Element('h3',{'html': h3txt}).inject(c);
				
				var img_type_row = new Element('div', {'class':'tab_bar'}).inject(c);

				// url textbox

				var url_tab = new Element('div', {'class':'tab src-blk'}).inject(c);
				var src_lbl = new Element('label',{'for':'img_src', 'html': 'Image URL' }).inject(url_tab);
				var input_text = new Element('input', {
					'type':'text', 
					'id':'img_src', 
					'class':'dialog-input'
				}).inject(url_tab);
				var feedback = new Element('div',{'class':'fdbk right'}).inject(url_tab);
				var lblk = new Element('div', {'class':'left'}).inject(url_tab);
				
				// attributes
				
				var attr_row = new Element('div', {'class':'attr'}).inject(lblk);
				var alt_lbl = new Element('label',{'for':'img_alt', 'html': 'Image tooltip text'}).inject(attr_row);
				var alt_text = new Element('input', {
					'type':'text', 
					'id':'img_alt', 
					'class':'img-alt'
				}).inject(attr_row);
				
				// buttons
				
				var tbl = new Element('table', {'class':'btns'}).inject(lblk);
				var tbody = new Element('tbody').inject(tbl);
				var tr = new Element('tr').inject(tbody);
				var td2 = new Element('td', {'class':'btns'} ).inject(tr);
				var submit_btn_a = gen_btn(submitBtnText, 'form submit-dialog').inject(td2);
				var td3 = new Element('td', {'class':'or', 'html':'or'}).inject(tr);
				var td4 = new Element('td', {'class':'cancel'} ).inject(tr);
				var cancel_a = new Element('a', {'href':'#', 'class': 'cancel-btn', 'html':'Cancel'}).inject(td4);

				var clr = new Element('div',{'class':'clr'}).inject(url_tab);	
								
				var dialog_html = d.get('html');
								
				// function to process form
				
				var fn = function(els){
					var src = els.src.get('value').trim();
					var alt = els.alt.get('value').trim();
					if (src != '') {
							
						if (img_found)	{
							// edit the old image
							img_el.set('src',src);
							img_el.set('alt',alt);
						} else {
							// insert new image
							
							var img_attr = {'src':src};
							if (alt) img_attr.alt = alt;
							
							var d = new Element('div');
							var img = new Element('img', img_attr).inject(d);
							var html = d.get('html');
							this.selection.insertContent(html);

							/*
							this.execute('insertimage', false, src);
							
							var s = this.selection.getSelection();
							
							var range = s.getRangeAt(0);
							var oElement = range.startContainer.childNodes[range.startOffset-1];
							s = this.selection.getSelection();
							range = s.createRange();
							range.selectNodeContents(oElement);
							s.removeAllRanges();
							s.addRange(range);
							
							alert(oElement.nodeName);

							if (oElement.nodeName == 'IMG') {
								img_el = oElement;
							}
							*/
							
						}
					} else {
						if (img_found) img_el.destroy();
					}
					this.focus();
				}.bind(this);
				
				// open dialog
			
				var dialog = new MooEditable.UI.AscDialog(dialog_html, {
					onOpen: function(e){
						if ((img_type=='src') && this.els.src) {
							(function(){
								this.els.src.focus();
							}.bind(this)).delay(1,this);
						}
						AscTooltip.hide();		
					},
					onPreshow: function(e) {
						this.modal.pop.removeEvents('click');
						this.els = {
							img_type: img_type,
							cancel_upload_btn: this.modal.pop.getElement('a[class$=upload_cancel]'),
							attr: this.modal.pop.getElement('div[class=attr]'),
							submit_btn: this.modal.pop.getElement('a[class*=submit-dialog]'),
							cancel_btn: this.modal.pop.getElement('a[class=cancel-btn]'),
							fdbk: this.modal.pop.getElement('div[class*=fdbk]'),
							src_blk: this.modal.pop.getElement('div[class$=src-blk]')
						};
						this.els.src = this.els.src_blk.getElement('input[class=dialog-input]');
						this.els.alt = this.els.src_blk.getElement('input[class=img-alt]');

						// for some reason I was unable to set the input value when creating the el earlier
						this.els.src.set('value', src);
						this.els.alt.set('value', alt);
						
						this.els.submit_btn.addEvent('click', function(e) {
							if (fn) fn.attempt(this.els, this);
							this.close();
						}.bind(this));
						
						this.els.cancel_btn.addEvent('click', this.close.bindWithEvent(this));
						this.els.src.addEvent('keydown', function(e) {
							if (e.key=='enter') {
								e.preventDefault();
								if (fn) fn.attempt(this.els, this);
								this.close();
							}
						}.bind(this));
						this.els.alt.addEvent('keydown', function(e) {
							if (e.key=='enter') {
								e.preventDefault();
								if (fn) fn.attempt(this.els, this);
								this.close();
							}
						}.bind(this));
						
					}
				}, 'img');
				
				dialog.open(530);
				
			}
		},
		createlink: {
			title: 'Add Hyperlink',
			options: {
				shortcut: 'l'
			},
			states: function(el,editor) {
				var item = this;
				var a_found = false;
				var i = 0;
				do {
					if (i < 5) {
						if ($type(el) != 'element') break;
						var tag = el.tagName.toLowerCase();
						if (tag == 'a') {
							this.activate(tag);
							a_found = true;
							var link_el = $(el);
							break;
						}
					}
					i++;
				} while (el = el.parentNode);
				var tip = AscTooltip;
				if (a_found) {
					
					tip.target_to_el_in_iframe(link_el, editor.iframe);
					
					tip.isShowing = false;
					
					var href = link_el.get('href');
					var c = new Element('div');
					var range = editor.selection.getRange();
				
					// show img controls if this link contains an image
					var img_el = tip.el_img_child(link_el);
					if (img_el) {
						c = tip.add_img_controls(c, img_align);
						var secondrow = new Element('div', {'class':'secondrow'}).inject(c);
						secondrow = tip.add_link_controls(secondrow, href);
						
					} else {
						c = tip.add_link_controls(c, href);
					}
					tip.set_contents(c.get('html'), 'small', 'auto');
					
					tip.removeEvents('show');
					tip.addEvent('show', function() {
						if (el.firstChild.nodeName == 'IMG') {
							tip.enable_img_controls(img_el, editor, range);
						}
						tip.enable_link_controls(editor);						
					}.bind(tip));
					
					tip.show();
					
				} else {
					if (tip.isShowing) {
						tip.hide();
					}
				}
			
			},
			ondblclick: function(item, e) {
				var el = this.selection.getNode();
				if (!el) return;
				var a_found = false;
				do {
					if ($type(el) != 'element') break;
					var tag = el.tagName.toLowerCase();
					if (tag == 'a') {
						item.action(e);
						return;
					}
				} while (el = el.parentNode);

			},
			onScroll: function(editor) {
				var tip = AscTooltip;
				tip.scrollRelativeEl = editor.doc.getScroll();
				if (tip.isShowing) {
					tip.hide();
				}
			},
			command: function() {
														
				var mode = 'text';
				var linkFound = false;
				var isCollapsed = this.selection.isCollapsed();
				var node = this.selection.getNode();
				var original_node = node;
				
				var el = node;

				var i = 0;
				do {
					if (i < 5) {
						if ($type(el) != 'element') break;
						var tag = el.tagName.toLowerCase();
						if (i==0) var original_tag = tag;
						if (tag == 'a') {
							linkFound = true;
							node = $(el);
							break;
						}
					}
					i++;
				} while (el = el.parentNode);

				var href = 'http://';
				var email = '';
				var link_html = '';
				var submitBtnText = 'Edit Link';
				var target_blank = false;
				
				if (linkFound) {
					// a link was found so select the entire node for editing the link
					href = node.get('href').trim();
					this.selection.selectNode(node);
					mode = 'link';
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
						if (original_node && (original_tag == 'img')) {
							var img = original_node.clone();
							if (img) {
								var d = new Element('div').grab(img);
								linkhtml = d.get('html');
								d.destroy();
								img.destroy();
							}
						} else {
							link_html = this.selection.getText();
						}
					}
				}
				
				var link_text_to_show = '';
				
				if (link_html) {
					// if this contains images, show thumb (max 50px) and remove any alignment
					if (link_html.toLowerCase().contains('<img')) {
						var thumb_px = 50;
						var tmp = new Element('div', {'styles':{'position':'absolute','left':-99999,'top':0}, 'html':link_html}).inject(document.body);
						var imgs = tmp.getElements('img');
						if (imgs) {
							imgs.each(function(img) {
								img.erase('height');
								img.erase('width');
								img.erase('styles');
								img.erase('align');
								var sz = img.getSize();
								if ((sz.x > thumb_px) || (sz.y > thumb_px)) {
									if (sz.y > thumb_px) {
										img.set('height', thumb_px);
										var thumb_w = (sz.x * (thumb_px / sz.y)).toInt();
										if (thumb_w > 100) thumb_w = 100;
										img.set('width', thumb_w);
									} else if (sz.x > thumb_px) {
										img.set('width', thumb_px);
										var thumb_h = (sz.y * (thumb_px / sz.x)).toInt();
										if (thumb_h > 100) thumb_h = 100;
										img.set('height', thumb_h);
									}
								}
							});
						}
						link_text_to_show = tmp.get('html');
						tmp.destroy();
					} else {
						if (link_html.length > 100) {
							link_text_to_show = link_html.substr(0,100) + "&hellip;";
						} else {
							link_text_to_show = link_html;
						}
					}
				}
				
								

				var link_type = 'webpage';
				if (!href.test(url_regexp)) {
					if (href.test(mailto_regexp)) {
						link_type = 'email';
						submitBtnText = 'Edit Email Address';
						email = href.substr(7);
						href = email;
					} else {
						submitBtnText = 'Insert Link';
					}	
				}
				
				// build dialog form
				
				if (link_text_to_show) {
					h3_str = 'Link <b>' + link_text_to_show + '</b> to &hellip;';
				} else {
					h3_str = 'Enter URL';
				}	
								
				var d = new Element('div');
				var c = new Element('form').inject(d);
				var h3 = new Element('h3',{'html': h3_str}).inject(c);
				
				var link_type_row = new Element('div', {'class':'tab_bar'}).inject(c);
				
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
					
						if (els.link_type == 'email') {
							url = 'mailto:' + url;
						}
						
						if (linkFound)	{
							// edit the existing link
							node.set('href', url);
							if (els.link_type == 'webpage') {
								if (els.blank_ckb.checked) {
									var target = '_blank';
								} else {
									var target = '';
								}
								node.set('target', target);
							}
						} else {
						
							// insert a link with a random string as href
							var rs = randomString();
							this.execute('createlink', false, rs);
							// then look for the link with the random href and replace with correct one
							node = this.doc.body.getElement('a[href='+rs+']');
							if (node) {
								node.set('href', url);
								if ((els.link_type == 'webpage') && els.blank_ckb.checked) {
									node.set('target', '_blank');
								}
							} 
							
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
								AscTooltip.hide();
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
							tabs: {
								webpage: this.modal.pop.getElement('a[class*=webpage]'),
								email: this.modal.pop.getElement('a[class*=email]')
							},
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
						this.els.tabs.webpage.addEvent('click', function(e) {
							e.preventDefault();
							if (!this.els.tabs.webpage.hasClass('down')) {
								this.els.link_type = 'webpage';
								this.els.fdbk.empty();
								this.email = this.els.url.get('value').trim();
								this.els.url.set('value',this.web);												
								this.els.url.fireEvent('keyup',e);
								this.els.url.focus();
								this.els.tabs.webpage.addClass('down');
								this.els.tabs.email.removeClass('down');
								this.els.attr.setStyle('display', 'block');
							} else {
								this.els.tabs.webpage.blur()
							}
						}.bind(this));

						this.els.tabs.email.addEvent('click', function(e) {
							e.preventDefault();
							if (!this.els.tabs.email.hasClass('down')) {
								this.els.link_type = 'email';
								this.web = this.els.url.get('value').trim();
								this.els.url.set('value',this.email);
								this.els.url.fireEvent('keyup',e);
								this.els.url.focus();
								this.els.tabs.webpage.removeClass('down');
								this.els.tabs.email.addClass('down');
								this.els.attr.setStyle('display', 'none');
							} else {
								this.els.tabs.email.blur()
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