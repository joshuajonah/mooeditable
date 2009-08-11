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

		window.addEvent('keyup', function(e){ 
			this.esc(e);
		}.bind(this));			
		window.addEvent('resize', function(e){ 
			this.update(e);
			if(this.isShowing){
				this.isShowing = false;
				this.show();
			}

		}.bind(this));			
		window.addEvent('scroll', function(e){ 
			this.update(e);
		}.bind(this));		

		this.init();
	},
	init: function(){
		if (this.pop) {
			this.pop.remove();
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
							this.pop.focus(); // to activate pop close by ESC, the ESC keydown for window doesn't work in IE
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
						if (!this.options.isModal) {
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
			if (this.isIE6){
				// need to use IFRAME for IE in order to cover SELECT elements
				this.mask = new Element('iframe', {
					'class':this.options.classPrefix+'Mask',
					'src':"about:blank",
					'frameborder':0,
					'src':"about:blank"
				}).inject(document.body);
			} else {
				// make mask a div for other browsers
				this.mask = new Element('div', {
					'class':this.options.classPrefix+'Mask'
				}).inject(document.body);
			}
			this.mask.setStyles({
				'position':'absolute',
				'top': 0,
				'left': 0,
				'opacity': 0,
				'z-index': 9999,
				'background-color':this.options.maskColor,
				'display': 'none'
			});
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
		}).inject(document.body);

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
var AscModal = new Class({
	Implements: [Options,Events], 
    Extends: AscDialog,
 	options: {
		isModal: true,
		addCloseBtn: true,
		popOpacity: .9,
		classPrefix: 'Modal',
		place: {
			'ss': { target:'window', io:1, align:'n'}, // show start
			'se': { trans:'fly', target:'window', io:-1, align:'c'}, // show end
			'he': { trans:'fly', target:'window', io:1, align:'n'} // hide end
		}
	},
	initialize: function(msg, cls, options){
        this.parent(options); 
		this.set_contents(msg, cls);
    }
});
var AscTip = new Class({
	Implements: [Options,Events], 
    Extends: AscDialog,
 	options: {
		addCloseBtn: false,
		speed: 200,
		useArrows: true,
		popOpacity: .9,
		actionDelay: 50,
		showDelay: 0,
		hideDelay: 0,
		default_align:'auto',
		classPrefix: 'Tip',
		place: {
			'ss': { 'io':1, offset:16 }, // show start
			'se': { 'io':1, offset:6 }, // show end
			'he': { trans:'fade' } // hide end
		}
	},
	initialize: function(el, msg, cls, options, width){
        this.parent(options);
		this.current_el;
		this.mousein = false;

		if ($type(el)=='element') {
			this.enable_tip(el, msg, cls, width);
		} 
    },
	enable_tip: function(el, msg, cls, width, align) {
		if (el) {
			el.addEvents({
				'mouseenter': function(e) {
					this.event = e;
					this.current_el = el;
					this.mousein = true;
					$clear(this.timer);
					this.timer = this.do_show.delay(this.options.showDelay, this, [el, msg, cls, width, align]);

				}.bind(this),	 
				'mouseleave': function(e) {
					this.mousein = false;
					$clear(this.timer);
					if (this.current_el == el) {
						this.current_el = '';
					}
					if (this.fx_in_process && (this.fx_dir == 1)) {
						this.isShowing = true;
						this.hide();
					} else {						
						this.timer = this.hide.delay(this.options.hideDelay, this);
					}
				}.bind(this)
			});
		}
		return false;
	},
	do_show: function(el, msg, cls, width, align) {
		if (this.mousein && (this.current_el == el)) {

			var op = this.options.place;

			this.set_contents(msg, cls, width);

			if (!$chk(align)) {
				align = this.options.default_align;
			}

			var settings = {
				'target':el,
				'align':this.auto_align(el, align)
			};
			if (op.se.trans=='fly')	{
				$extend(op.ss, settings);
				op.ss.offset = 25;
			}
			if (this.isShowing || this.fx_in_process) {
				if (this.fx_in_process) {
					this.fx.cancel();
				}
				op.ss.target = '';
			}
			this.isShowing = false;
			$extend(op.se, settings);
			$extend(op.he, settings);

			this.show();
		}
	}
});
var AscTips = new Class({
	Implements: [Options,Events], 
    Extends: AscTip,
 	initialize: function(els, options){
        this.parent('', '', '', options);
		if ($type(els)=='array') {
			var i, ct=els.length,t;
			for (i=0;i<ct;i++ ) {
				if (els[i]) {
					t = $(els[i].id);
					if (t) {
						this.enable_tip(t, els[i].msg, els[i].cls, els[i].width, els[i].align);
					}
				}
			}
		}
    }
});
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



function gen_btn(str, cls, extra_cls){
	var obj = { 'class': cls + ' ' + extra_cls, 'href':'#' };
	var anchor = new Element('a', obj);
	var s1 = new Element('span').inject(anchor);
	var s2 = new Element('span').inject(s1);
	var s3 = new Element('span').set('html',str).inject(s2);
	return anchor;
};


MooEditable.UI.AscDialog = new Class({

	Implements: [Events, Options],

	options:{
		/*
		onOpen: $empty,
		onClose: $empty,
		*/
		modal_speed: 150
	},
	initialize: function(html, options, modal_class){
		this.setOptions(options);
		this.modal = new AscModal(html, modal_class, {'addCloseBtn': false, 'speed':this.options.modal_speed});
		this.modal.pop.addEvent('click', this.click.bind(this));
	},
	
	toElement: function(){
		return this.modal.pop;
	},
	
	click: function(){
		this.fireEvent('click', arguments);
		return this;
	},
	
	open: function(){
		this.modal.show();
		this.fireEvent('open', this, this.options.modal_speed);
		return this;
	},
	
	close: function(){
		this.modal.hide();
		this.fireEvent('close', this, this.options.modal_speed);
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
		onOpen: function(){
			this.modal.pop.focus();
			this.modal.addEvent('keydown', function (e) {
				alert(e.key);
				if (e.key=='enter') {
					this.close();
				}
			}.bind(this));
		},
		onClick: function(e){
			e.preventDefault();
			var link = '';
			var el = e.target;
			var tag = e.target.tagName.toLowerCase();
			if (tag == 'span') {
				link = el.getParent('a[*=cancel-btn]');
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
	var p = new Element('h3',{'html': questionText}).inject(c);
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
					input.select();
				}).delay(10);
			}
		},
		onClick: function(e){
			e.preventDefault();
			var link = '';
			var el = e.target;
			var tag = e.target.tagName.toLowerCase();
			if (tag == 'span') {
				link = el.getParent('a[class*=submit-dialog]');
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
				var html = '<p><a href="#">Paragraph</a></p><h1><a href="#">Heading 1</a></h1><h2><a href="#">Heading 2</a></h2><h3><a href="#">Heading 3</a></h3><h4><a href="#">Heading 4</a></h4>';
				return html;
			})()
		},
		command: function(buttonOverlay, e){
			var el = e.target;
			var tag = el.getParent().get('tag');
			var argument = '<' + tag + '>';
			this.execute('formatBlock', false, argument);
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
				this.dialogs.asc_unlink.alert.open();
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
		states: {
			tags: ['a']
		},
		dialogs: {
			alert: MooEditable.UI.AscAlertDialog.pass('Please select the text you wish to hyperlink.'),
			prompt: function(editor){
				return MooEditable.UI.AscPromptDialog('Enter URL', 'Insert Link', function(url){
					editor.execute('createlink', false, url.trim());
				}, 'link');
			}
		},
		command: function(){
			var mode = 'text';
			var linkFound = false;
			var isCollapsed = this.selection.isCollapsed();
			var node = this.selection.getNode();

			if (node.nodeName == 'A') {
				linkFound = true;
			} else {
				var parent_link = node.getParent('a');
				if (parent_link) {
					node = parent_link;
					linkFound = true;
				} else {
					var firstChild = node.getFirst('a');
					if (firstChild) {
						if (node.tagName == 'A') {
							node = firstChild;
							linkFound = true;
						}
					}
				}				
			}
			if (linkFound)	{
				var text = node.get('href');
				this.selection.selectNode(node);
				mode = 'link';
			} else {
				if (isCollapsed) {
					this.dialogs.asc_createlink.alert.open();
					return;
				} 
			}
			
			this.selection.selectNode(node);
			if (!linkFound && !isCollapsed) {
				var text = this.selection.getText();
			}
			
			var url = /^(https?|ftp|rmtp|mms):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i;
			var prompt = this.dialogs.asc_createlink.prompt;
			var input = prompt.modal.pop.getElement('.dialog-input');
			if (input) {
				if (url.test(text)) {	
					input.set('value', text);
				} else {
					input.set('value', 'http://');
				}
			}
			prompt.open();
			
		}
	}
});