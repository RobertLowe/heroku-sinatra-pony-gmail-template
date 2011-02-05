/**
 * @license                                     
 * jQuery Tools 1.2.5 Dateinput - <input type="date" /> for humans
 * 
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 * 
 * http://flowplayer.org/tools/form/dateinput/
 *
 * Since: Mar 2010
 * Date:    Wed Sep 22 06:02:10 2010 +0000 
 */
(function($) {	
		
	/* TODO: 
		 preserve today highlighted
	*/
	
	$.tools = $.tools || {version: '1.2.5'};
	
	var instances = [], 
		 tool, 
		 
		 // h=72, j=74, k=75, l=76, down=40, left=37, up=38, right=39
		 KEYS = [75, 76, 38, 39, 74, 72, 40, 37],
		 LABELS = {};
	
	tool = $.tools.dateinput = {
		
		conf: { 
			format: 'mm/dd/yy',
			selectors: false,
			yearRange: [-5, 5],
			lang: 'en',
			offset: [0, 0],
			speed: 0,
			firstDay: 0, // The first day of the week, Sun = 0, Mon = 1, ...
			min: undefined,
			max: undefined,
			trigger: false,
			
			css: {
				
				prefix: 'cal',
				input: 'date',
				
				// ids
				root: 0,
				head: 0,
				title: 0, 
				prev: 0,
				next: 0,
				month: 0,
				year: 0, 
				days: 0,
				
				body: 0,
				weeks: 0,
				today: 0,		
				current: 0,
				
				// classnames
				week: 0, 
				off: 0,
				sunday: 0,
				focus: 0,
				disabled: 0,
				trigger: 0
			}  
		},
		
		localize: function(language, labels) {
			$.each(labels, function(key, val) {
				labels[key] = val.split(",");		
			});
			LABELS[language] = labels;	
		}
		
	};
	
	tool.localize("en", {
		months: 		 'January,February,March,April,May,June,July,August,September,October,November,December', 
		shortMonths: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',  
		days: 		 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', 
		shortDays: 	 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'	  
	});

	
//{{{ private functions
		

	// @return amount of days in certain month
	function dayAm(year, month) {
		return 32 - new Date(year, month, 32).getDate();		
	}
 
	function zeropad(val, len) {
		val = '' + val;
		len = len || 2;
		while (val.length < len) { val = "0" + val; }
		return val;
	}  
	
	// thanks: http://stevenlevithan.com/assets/misc/date.format.js 
	var Re = /d{1,4}|m{1,4}|yy(?:yy)?|"[^"]*"|'[^']*'/g, tmpTag = $("<a/>");
	
	function format(date, fmt, lang) {
		
	  var d = date.getDate(),
			D = date.getDay(),
			m = date.getMonth(),
			y = date.getFullYear(),

			flags = {
				d:    d,
				dd:   zeropad(d),
				ddd:  LABELS[lang].shortDays[D],
				dddd: LABELS[lang].days[D],
				m:    m + 1,
				mm:   zeropad(m + 1),
				mmm:  LABELS[lang].shortMonths[m],
				mmmm: LABELS[lang].months[m],
				yy:   String(y).slice(2),
				yyyy: y
			};

		var ret = fmt.replace(Re, function ($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
		
		// a small trick to handle special characters
		return tmpTag.html(ret).html();
		
	}
	
	function integer(val) {
		return parseInt(val, 10);	
	} 

	function isSameDay(d1, d2)  {
		return d1.getFullYear() === d2.getFullYear() && 
			d1.getMonth() == d2.getMonth() &&
			d1.getDate() == d2.getDate(); 
	}

	function parseDate(val) {
		
		if (!val) { return; }
		if (val.constructor == Date) { return val; } 
		
		if (typeof val == 'string') {
			
			// rfc3339?
			var els = val.split("-");		
			if (els.length == 3) {
				return new Date(integer(els[0]), integer(els[1]) -1, integer(els[2]));
			}	
			
			// invalid offset
			if (!/^-?\d+$/.test(val)) { return; }
			
			// convert to integer
			val = integer(val);
		}
		
		var date = new Date();
		date.setDate(date.getDate() + val);
		return date; 
	}
	
//}}}
		 
	
	function Dateinput(input, conf)  { 

		// variables
		var self = this,  
			 now = new Date(),
			 css = conf.css,
			 labels = LABELS[conf.lang],
			 root = $("#" + css.root),
			 title = root.find("#" + css.title),
			 trigger,
			 pm, nm, 
			 currYear, currMonth, currDay,
			 value = input.attr("data-value") || conf.value || input.val(), 
			 min = input.attr("min") || conf.min,  
			 max = input.attr("max") || conf.max,
			 opened;

		// zero min is not undefined 	 
		if (min === 0) { min = "0"; }
		
		// use sane values for value, min & max		
		value = parseDate(value) || now;
		min   = parseDate(min || conf.yearRange[0] * 365);
		max   = parseDate(max || conf.yearRange[1] * 365);
		
		
		// check that language exists
		if (!labels) { throw "Dateinput: invalid language: " + conf.lang; }
		
		// Replace built-in date input: NOTE: input.attr("type", "text") throws exception by the browser
		if (input.attr("type") == 'date') {
			var tmp = $("<input/>");
				 
			$.each("class,disabled,id,maxlength,name,readonly,required,size,style,tabindex,title,value".split(","), function(i, attr)  {
				tmp.attr(attr, input.attr(attr));		
			});			
			input.replaceWith(tmp);
			input = tmp;
		}
		input.addClass(css.input);
		
		var fire = input.add(self);
			 
		// construct layout
		if (!root.length) {
			
			// root
			root = $('<div><div><a/><div/><a/></div><div><div/><div/></div></div>')
				.hide().css({position: 'absolute'}).attr("id", css.root);			
						
			// elements
			root.children()
				.eq(0).attr("id", css.head).end() 
				.eq(1).attr("id", css.body).children()
					.eq(0).attr("id", css.days).end()
					.eq(1).attr("id", css.weeks).end().end().end()
				.find("a").eq(0).attr("id", css.prev).end().eq(1).attr("id", css.next);		 				  
			
			// title
			title = root.find("#" + css.head).find("div").attr("id", css.title);
			
			// year & month selectors
			if (conf.selectors) {				
				var monthSelector = $("<select/>").attr("id", css.month),
					 yearSelector = $("<select/>").attr("id", css.year);				
				title.html(monthSelector.add(yearSelector));
			}						
			
			// day titles
			var days = root.find("#" + css.days); 
			
			// days of the week
			for (var d = 0; d < 7; d++) { 
				days.append($("<span/>").text(labels.shortDays[(d + conf.firstDay) % 7]));
			}
			
			$("body").append(root);
		}	
		
				
		// trigger icon
		if (conf.trigger) {
			trigger = $("<a/>").attr("href", "#").addClass(css.trigger).click(function(e)  {
				self.show();
				return e.preventDefault();
			}).insertAfter(input);	
		}
		
		
		// layout elements
		var weeks = root.find("#" + css.weeks);
		yearSelector = root.find("#" + css.year);
		monthSelector = root.find("#" + css.month);
			 
		
//{{{ pick
			 			 
		function select(date, conf, e) {  
			
			// current value
			value 	 = date;
			currYear  = date.getFullYear();
			currMonth = date.getMonth();
			currDay	 = date.getDate();				
			
			
			// change
			e = e || $.Event("api");
			e.type = "change";
			
			fire.trigger(e, [date]); 
			if (e.isDefaultPrevented()) { return; }
			
			// formatting			
			input.val(format(date, conf.format, conf.lang));
			
			// store value into input
			input.data("date", date);
			
			self.hide(e); 
		}
//}}}
		
		
//{{{ onShow

		function onShow(ev) {
			
			ev.type = "onShow";
			fire.trigger(ev);
			
			$(document).bind("keydown.d", function(e) {
					
				if (e.ctrlKey) { return true; }				
				var key = e.keyCode;			 
				
				// backspace clears the value
				if (key == 8) {
					input.val("");
					return self.hide(e);	
				}
				
				// esc key
				if (key == 27) { return self.hide(e); }						
					
				if ($(KEYS).index(key) >= 0) {
					
					if (!opened) { 
						self.show(e); 
						return e.preventDefault();
					} 
					
					var days = $("#" + css.weeks + " a"), 
						 el = $("." + css.focus),
						 index = days.index(el);
					 
					el.removeClass(css.focus);
					
					if (key == 74 || key == 40) { index += 7; }
					else if (key == 75 || key == 38) { index -= 7; }							
					else if (key == 76 || key == 39) { index += 1; }
					else if (key == 72 || key == 37) { index -= 1; }
					
					
					if (index > 41) {
						 self.addMonth();
						 el = $("#" + css.weeks + " a:eq(" + (index-42) + ")");
					} else if (index < 0) {
						 self.addMonth(-1);
						 el = $("#" + css.weeks + " a:eq(" + (index+42) + ")");
					} else {
						 el = days.eq(index);
					}
					
					el.addClass(css.focus);
					return e.preventDefault();
					
				}
			 
				// pageUp / pageDown
				if (key == 34) { return self.addMonth(); }						
				if (key == 33) { return self.addMonth(-1); }
				
				// home
				if (key == 36) { return self.today(); } 
				
				// enter
				if (key == 13) {
					if (!$(e.target).is("select")) {
						$("." + css.focus).click(); 
					} 
				}
				
				return $([16, 17, 18, 9]).index(key) >= 0;  				
			});
			
			
			// click outside dateinput
			$(document).bind("click.d", function(e) {					
				var el = e.target;
				
				if (!$(el).parents("#" + css.root).length && el != input[0] && (!trigger || el != trigger[0])) {
					self.hide(e);
				}
				
			}); 
		}
//}}}
		
		
		$.extend(self, {

//{{{  show
								
			show: function(e) {
				
				if (input.attr("readonly") || input.attr("disabled") || opened) { return; }
				
				// onBeforeShow
				e = e || $.Event();
				e.type = "onBeforeShow";
				fire.trigger(e);
				if (e.isDefaultPrevented()) { return; }
			
				$.each(instances, function() {
					this.hide();	
				});
				
				opened = true;
				
				// month selector
				monthSelector.unbind("change").change(function() {
					self.setValue(yearSelector.val(), $(this).val());		
				});
				
				// year selector
				yearSelector.unbind("change").change(function() {
					self.setValue($(this).val(), monthSelector.val());		
				});
				
				// prev / next month
				pm = root.find("#" + css.prev).unbind("click").click(function(e) {
					if (!pm.hasClass(css.disabled)) {	
						self.addMonth(-1);
					}
					return false;
				});
				
				nm = root.find("#" + css.next).unbind("click").click(function(e) {
					if (!nm.hasClass(css.disabled)) {
						self.addMonth();
					}
					return false;
				});	 
				
				// set date
				self.setValue(value);				 
				
				// show calendar
				var pos = input.offset();

				// iPad position fix
				if (/iPad/i.test(navigator.userAgent)) {
					pos.top -= $(window).scrollTop();
				}
				
				root.css({ 
					top: pos.top + input.outerHeight({margins: true}) + conf.offset[0], 
					left: pos.left + conf.offset[1] 
				});
				
				if (conf.speed) {
					root.show(conf.speed, function() {
						onShow(e);			
					});	
				} else {
					root.show();
					onShow(e);
				}
				
				return self;
			}, 
//}}}


//{{{  setValue

			setValue: function(year, month, day)  {
				
				var date = integer(month) >= -1 ?
					new Date(integer(year), integer(month), integer(day || 1)) : year || value
				;				
				
				if (date < min) { date = min; }
				else if (date > max) { date = max; }
				
				year = date.getFullYear();
				month = date.getMonth();
				day = date.getDate(); 
				
				
				// roll year & month
				if (month == -1) {
					month = 11;
					year--;
				} else if (month == 12) {
					month = 0;
					year++;
				} 
				
				if (!opened) { 
					select(date, conf);
					return self; 
				} 				
				
				currMonth = month;
				currYear = year;

				// variables
				var tmp = new Date(year, month, 1 - conf.firstDay), begin = tmp.getDay(),
					 days = dayAm(year, month),
					 prevDays = dayAm(year, month - 1),
					 week;	 
				
				// selectors
				if (conf.selectors) { 
					
					// month selector
					monthSelector.empty();
					$.each(labels.months, function(i, m) {					
						if (min < new Date(year, i + 1, -1) && max > new Date(year, i, 0)) {
							monthSelector.append($("<option/>").html(m).attr("value", i));
						}
					});
					
					// year selector
					yearSelector.empty();		
					var yearNow = now.getFullYear();
					
					for (var i = yearNow + conf.yearRange[0];  i < yearNow + conf.yearRange[1]; i++) {
						if (min <= new Date(i + 1, -1, 1) && max > new Date(i, 0, 0)) {
							yearSelector.append($("<option/>").text(i));
						}
					}		
					
					monthSelector.val(month);
					yearSelector.val(year);
					
				// title
				} else {
					title.html(labels.months[month] + " " + year);	
				} 	   
					 
				// populate weeks
				weeks.empty();				
				pm.add(nm).removeClass(css.disabled); 
				
				// !begin === "sunday"
				for (var j = !begin ? -7 : 0, a, num; j < (!begin ? 35 : 42); j++) { 
					
					a = $("<a/>");
					
					if (j % 7 === 0) {
						week = $("<div/>").addClass(css.week);
						weeks.append(week);			
					}					
					
					if (j < begin)  { 
						a.addClass(css.off); 
						num = prevDays - begin + j + 1;
						date = new Date(year, month-1, num);
						
					} else if (j >= begin + days)  {
						a.addClass(css.off);	
						num = j - days - begin + 1;
						date = new Date(year, month+1, num);
						
					} else  { 
						num = j - begin + 1;
						date = new Date(year, month, num);  
						
						// current date
						if (isSameDay(value, date)) {
							a.attr("id", css.current).addClass(css.focus);
							
						// today
						} else if (isSameDay(now, date)) {
							a.attr("id", css.today);
						}	 
					}
					
					// disabled
					if (min && date < min) {
						a.add(pm).addClass(css.disabled);						
					}
					
					if (max && date > max) {
						a.add(nm).addClass(css.disabled);						
					}
					
					a.attr("href", "#" + num).text(num).data("date", date);					
					
					week.append(a);
				}
				
				// date picking					
				weeks.find("a").click(function(e) {
					var el = $(this); 
					if (!el.hasClass(css.disabled)) {  
						$("#" + css.current).removeAttr("id");
						el.attr("id", css.current);	 
						select(el.data("date"), conf, e);
					}
					return false;
				});

				// sunday
				if (css.sunday) {
					weeks.find(css.week).each(function() {
						var beg = conf.firstDay ? 7 - conf.firstDay : 0;
						$(this).children().slice(beg, beg + 1).addClass(css.sunday);		
					});	
				} 
				
				return self;
			}, 
	//}}}
	
			setMin: function(val, fit) {
				min = parseDate(val);
				if (fit && value < min) { self.setValue(min); }
				return self;
			},
		
			setMax: function(val, fit) {
				max = parseDate(val);
				if (fit && value > max) { self.setValue(max); }
				return self;
			}, 
			
			today: function() {
				return self.setValue(now);	
			},
			
			addDay: function(amount) {
				return this.setValue(currYear, currMonth, currDay + (amount || 1));		
			},
			
			addMonth: function(amount) {
				return this.setValue(currYear, currMonth + (amount || 1), currDay);	
			},
			
			addYear: function(amount) {
				return this.setValue(currYear + (amount || 1), currMonth, currDay);	
			},
						
			hide: function(e) {				 
				
				if (opened) {  
					
					// onHide 
					e = $.Event();
					e.type = "onHide";
					fire.trigger(e);
					
					$(document).unbind("click.d").unbind("keydown.d");
					
					// cancelled ?
					if (e.isDefaultPrevented()) { return; }
					
					// do the hide
					root.hide();
					opened = false;
				}
				
				return self;
			},
			
			getConf: function() {
				return conf;	
			},
			
			getInput: function() {
				return input;	
			},
			
			getCalendar: function() {
				return root;	
			},
			
			getValue: function(dateFormat) {
				return dateFormat ? format(value, dateFormat, conf.lang) : value;	
			},
			
			isOpen: function() {
				return opened;	
			}
			
		}); 
		
		// callbacks	
		$.each(['onBeforeShow','onShow','change','onHide'], function(i, name) {
				
			// configuration
			if ($.isFunction(conf[name]))  {
				$(self).bind(name, conf[name]);	
			}
			
			// API methods				
			self[name] = function(fn) {
				if (fn) { $(self).bind(name, fn); }
				return self;
			};
		});

		
		// show dateinput & assign keyboard shortcuts
		input.bind("focus click", self.show).keydown(function(e) {

			var key = e.keyCode;
	
			// open dateinput with navigation keyw
			if (!opened &&  $(KEYS).index(key) >= 0) {
				self.show(e);
				return e.preventDefault();
			} 
			
			// allow tab
			return e.shiftKey || e.ctrlKey || e.altKey || key == 9 ? true : e.preventDefault();   
			
		}); 
		
		// initial value 		
		if (parseDate(input.val())) { 
			select(value, conf);
		}
		
	} 
	
	$.expr[':'].date = function(el) {
		var type = el.getAttribute("type");
		return type && type == 'date' || !!$(el).data("dateinput");
	};
	
	
	$.fn.dateinput = function(conf) {   
		
		// already instantiated
		if (this.data("dateinput")) { return this; } 
		
		// configuration
		conf = $.extend(true, {}, tool.conf, conf);		
		
		// CSS prefix
		$.each(conf.css, function(key, val) {
			if (!val && key != 'prefix') { 
				conf.css[key] = (conf.css.prefix || '') + (val || key);
			}
		});		
	
		var els;
		
		this.each(function() {									
			var el = new Dateinput($(this), conf);
			instances.push(el);
			var input = el.getInput().data("dateinput", el);
			els = els ? els.add(input) : input;	
		});		
	
		return els ? els : this;		
	}; 
	
	
}) (jQuery);
 
	
/**
 * @license 
 * jQuery Tools 1.2.5 Rangeinput - HTML5 <input type="range" /> for humans
 * 
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 * 
 * http://flowplayer.org/tools/rangeinput/
 *
 * Since: Mar 2010
 * Date:    Wed Sep 22 06:02:10 2010 +0000 
 */
(function($) {
	 
	$.tools = $.tools || {version: '1.2.5'};
	 
	var tool;
	
	tool = $.tools.rangeinput = {
		                            
		conf: {
			min: 0,
			max: 100,		// as defined in the standard
			step: 'any', 	// granularity of the value. a non-zero float or int (or "any")
			steps: 0,
			value: 0,			
			precision: undefined,
			vertical: 0,
			keyboard: true,
			progress: false,
			speed: 100,
			
			// set to null if not needed
			css: {
				input:		'range',
				slider: 		'slider',
				progress: 	'progress',
				handle: 		'handle'					
			}

		} 
	};
	
//{{{ fn.drag
		
	/* 
		FULL featured drag and drop. 0.7 kb minified, 0.3 gzipped. done.
		Who told d'n'd is rocket science? Usage:
		
		$(".myelement").drag({y: false}).bind("drag", function(event, x, y) {
			// do your custom thing
		});
		 
		Configuration: 
			x: true, 		// enable horizontal drag
			y: true, 		// enable vertical drag 
			drag: true 		// true = perform drag, false = only fire events 
			
		Events: dragStart, drag, dragEnd. 
	*/
	var doc, draggable;
	
	$.fn.drag = function(conf) {
		
		// disable IE specialities
		document.ondragstart = function () { return false; };
		
		conf = $.extend({x: true, y: true, drag: true}, conf);
	
		doc = doc || $(document).bind("mousedown mouseup", function(e) {
				
			var el = $(e.target);  
			
			// start 
			if (e.type == "mousedown" && el.data("drag")) {
				
				var offset = el.position(),
					 x0 = e.pageX - offset.left, 
					 y0 = e.pageY - offset.top,
					 start = true;    
				
				doc.bind("mousemove.drag", function(e) {  
					var x = e.pageX -x0, 
						 y = e.pageY -y0,
						 props = {};
					
					if (conf.x) { props.left = x; }
					if (conf.y) { props.top = y; } 
					
					if (start) {
						el.trigger("dragStart");
						start = false;
					}
					if (conf.drag) { el.css(props); }
					el.trigger("drag", [y, x]);
					draggable = el;
				}); 
				
				e.preventDefault();
				
			} else {
				
				try {
					if (draggable) {  
						draggable.trigger("dragEnd");  
					}
				} finally { 
					doc.unbind("mousemove.drag");
					draggable = null; 
				}
			} 
							
		});
		
		return this.data("drag", true); 
	};	

//}}}
	

	
	function round(value, precision) {
		var n = Math.pow(10, precision);
		return Math.round(value * n) / n;
	}
	
	// get hidden element's width or height even though it's hidden
	function dim(el, key) {
		var v = parseInt(el.css(key), 10);
		if (v) { return v; }
		var s = el[0].currentStyle; 
		return s && s.width && parseInt(s.width, 10);	
	}
	
	function hasEvent(el) {
		var e = el.data("events");
		return e && e.onSlide;
	}
	
	function RangeInput(input, conf) {
		
		// private variables
		var self = this,  
			 css = conf.css, 
			 root = $("<div><div/><a href='#'/></div>").data("rangeinput", self),	
			 vertical,		
			 value,			// current value
			 origo,			// handle's start point
			 len,				// length of the range
			 pos;				// current position of the handle		
		 
		// create range	 
		input.before(root);	
		
		var handle = root.addClass(css.slider).find("a").addClass(css.handle), 	
			 progress = root.find("div").addClass(css.progress);
		
		// get (HTML5) attributes into configuration
		$.each("min,max,step,value".split(","), function(i, key) {
			var val = input.attr(key);
			if (parseFloat(val)) {
				conf[key] = parseFloat(val, 10);
			}
		});			   
		
		var range = conf.max - conf.min, 
			 step = conf.step == 'any' ? 0 : conf.step,
			 precision = conf.precision;
			 
		if (precision === undefined) {
			try {
				precision = step.toString().split(".")[1].length;
			} catch (err) {
				precision = 0;	
			}
		}  
		
		// Replace built-in range input (type attribute cannot be changed)
		if (input.attr("type") == 'range') {
			var tmp = $("<input/>");
			$.each("class,disabled,id,maxlength,name,readonly,required,size,style,tabindex,title,value".split(","), function(i, attr)  {
				tmp.attr(attr, input.attr(attr));		
			});
			tmp.val(conf.value);
			input.replaceWith(tmp);
			input = tmp;
		}
		
		input.addClass(css.input);
			 
		var fire = $(self).add(input), fireOnSlide = true;

		
		/**
		 	The flesh and bone of this tool. All sliding is routed trough this.
			
			@param evt types include: click, keydown, blur and api (setValue call)
			@param isSetValue when called trough setValue() call (keydown, blur, api)
			
			vertical configuration gives additional complexity. 
		 */
		function slide(evt, x, val, isSetValue) { 

			// calculate value based on slide position
			if (val === undefined) {
				val = x / len * range;  
				
			// x is calculated based on val. we need to strip off min during calculation	
			} else if (isSetValue) {
				val -= conf.min;	
			}
			
			// increment in steps
			if (step) {
				val = Math.round(val / step) * step;
			}

			// count x based on value or tweak x if stepping is done
			if (x === undefined || step) {
				x = val * len / range;	
			}  
			
			// crazy value?
			if (isNaN(val)) { return self; }       
			
			// stay within range
			x = Math.max(0, Math.min(x, len));  
			val = x / len * range;   

			if (isSetValue || !vertical) {
				val += conf.min;
			}
			
			// in vertical ranges value rises upwards
			if (vertical) {
				if (isSetValue) {
					x = len -x;
				} else {
					val = conf.max - val;	
				}
			}	
			
			// precision
			val = round(val, precision); 
			
			// onSlide
			var isClick = evt.type == "click";
			if (fireOnSlide && value !== undefined && !isClick) {
				evt.type = "onSlide";           
				fire.trigger(evt, [val, x]); 
				if (evt.isDefaultPrevented()) { return self; }  
			}				
			
			// speed & callback
			var speed = isClick ? conf.speed : 0,
				 callback = isClick ? function()  {
					evt.type = "change";
					fire.trigger(evt, [val]);
				 } : null;
			
			if (vertical) {
				handle.animate({top: x}, speed, callback);
				if (conf.progress) { 
					progress.animate({height: len - x + handle.width() / 2}, speed);	
				}				
				
			} else {
				handle.animate({left: x}, speed, callback);
				if (conf.progress) { 
					progress.animate({width: x + handle.width() / 2}, speed); 
				}
			}
			
			// store current value
			value = val; 
			pos = x;			 
			
			// se input field's value
			input.val(val);

			return self;
		} 
		
		
		$.extend(self, {  
			
			getValue: function() {
				return value;	
			},
			
			setValue: function(val, e) {
				init();
				return slide(e || $.Event("api"), undefined, val, true); 
			}, 			  
			
			getConf: function() {
				return conf;	
			},
			
			getProgress: function() {
				return progress;	
			},

			getHandle: function() {
				return handle;	
			},			
			
			getInput: function() {
				return input;	
			}, 
				
			step: function(am, e) {
				e = e || $.Event();
				var step = conf.step == 'any' ? 1 : conf.step;
				self.setValue(value + step * (am || 1), e);	
			},
			
			// HTML5 compatible name
			stepUp: function(am) { 
				return self.step(am || 1);
			},
			
			// HTML5 compatible name
			stepDown: function(am) { 
				return self.step(-am || -1);
			}
			
		});
		
		// callbacks
		$.each("onSlide,change".split(","), function(i, name) {
				
			// from configuration
			if ($.isFunction(conf[name]))  {
				$(self).bind(name, conf[name]);	
			}
			
			// API methods
			self[name] = function(fn) {
				if (fn) { $(self).bind(name, fn); }
				return self;	
			};
		}); 
			

		// dragging		                                  
		handle.drag({drag: false}).bind("dragStart", function() {
		
			/* do some pre- calculations for seek() function. improves performance */			
			init();
			
			// avoid redundant event triggering (= heavy stuff)
			fireOnSlide = hasEvent($(self)) || hasEvent(input);
			
				
		}).bind("drag", function(e, y, x) {        
			
			if (input.is(":disabled")) { return false; } 
			slide(e, vertical ? y : x); 
			
		}).bind("dragEnd", function(e) {
			if (!e.isDefaultPrevented()) {
				e.type = "change";
				fire.trigger(e, [value]);	 
			}
			
		}).click(function(e) {
			return e.preventDefault();	 
		});		
		
		// clicking
		root.click(function(e) { 
			if (input.is(":disabled") || e.target == handle[0]) { 
				return e.preventDefault(); 
			}				  
			init(); 
			var fix = handle.width() / 2;   
			slide(e, vertical ? len-origo-fix + e.pageY  : e.pageX -origo -fix);  
		});

		if (conf.keyboard) {
			
			input.keydown(function(e) {
		
				if (input.attr("readonly")) { return; }
				
				var key = e.keyCode,
					 up = $([75, 76, 38, 33, 39]).index(key) != -1,
					 down = $([74, 72, 40, 34, 37]).index(key) != -1;					 
					 
				if ((up || down) && !(e.shiftKey || e.altKey || e.ctrlKey)) {
				
					// UP: 	k=75, l=76, up=38, pageup=33, right=39			
					if (up) {
						self.step(key == 33 ? 10 : 1, e);
						
					// DOWN:	j=74, h=72, down=40, pagedown=34, left=37
					} else if (down) {
						self.step(key == 34 ? -10 : -1, e); 
					} 
					return e.preventDefault();
				} 
			});
		}
		
		
		input.blur(function(e) {	
			var val = $(this).val();
			if (val !== value) {
				self.setValue(val, e);
			}
		});    
		
		
		// HTML5 DOM methods
		$.extend(input[0], { stepUp: self.stepUp, stepDown: self.stepDown});
		
		
		// calculate all dimension related stuff
		function init() { 
		 	vertical = conf.vertical || dim(root, "height") > dim(root, "width");
		 
			if (vertical) {
				len = dim(root, "height") - dim(handle, "height");
				origo = root.offset().top + len; 
				
			} else {
				len = dim(root, "width") - dim(handle, "width");
				origo = root.offset().left;	  
			} 	  
		}
		
		function begin() {
			init();	
			self.setValue(conf.value !== undefined ? conf.value : conf.min);
		} 
		begin();
		
		// some browsers cannot get dimensions upon initialization
		if (!len) {  
			$(window).load(begin);
		}
	}
	
	$.expr[':'].range = function(el) {
		var type = el.getAttribute("type");
		return type && type == 'range' || !!$(el).filter("input").data("rangeinput");
	};
	
	
	// jQuery plugin implementation
	$.fn.rangeinput = function(conf) {

		// already installed
		if (this.data("rangeinput")) { return this; } 
		
		// extend configuration with globals
		conf = $.extend(true, {}, tool.conf, conf);		
		
		var els;
		
		this.each(function() {				
			var el = new RangeInput($(this), $.extend(true, {}, conf));		 
			var input = el.getInput().data("rangeinput", el);
			els = els ? els.add(input) : input;	
		});		
		
		return els ? els : this; 
	};	
	
	
}) (jQuery);



/**
 * @license 
 * jQuery Tools Validator 1.2.5 - HTML5 is here. Now use it.
 * 
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 * 
 * http://flowplayer.org/tools/form/validator/
 * 
 * Since: Mar 2010
 * Date:    Wed Sep 22 06:02:10 2010 +0000 
 */
/*jslint evil: true */ 
(function($) {	

	$.tools = $.tools || {version: '1.2.5'};
		
	// globals
	var typeRe = /\[type=([a-z]+)\]/, 
		numRe = /^-?[0-9]*(\.[0-9]+)?$/,
		dateInput = $.tools.dateinput,
		
		// http://net.tutsplus.com/tutorials/other/8-regular-expressions-you-should-know/
		emailRe = /^([a-z0-9_\.\-\+]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/i,
		urlRe = /^(https?:\/\/)?[\da-z\.\-]+\.[a-z\.]{2,6}[#&+_\?\/\w \.\-=]*$/i,
		v;
		 
	v = $.tools.validator = {
		
		conf: {   
			grouped: false, 				// show all error messages at once inside the container 
			effect: 'default',			// show/hide effect for error message. only 'default' is built-in
			errorClass: 'invalid',		// input field class name in case of validation error		
			
			// when to check for validity?
			inputEvent: null,				// change, blur, keyup, null 
			errorInputEvent: 'keyup',  // change, blur, keyup, null
			formEvent: 'submit',       // submit, null

			lang: 'en',						// default language for error messages 
			message: '<div/>',
			messageAttr: 'data-message', // name of the attribute for overridden error message
			messageClass: 'error',		// error message element's class name
			offset: [0, 0], 
			position: 'center right',
			singleError: false, 			// validate all inputs at once
			speed: 'normal'				// message's fade-in speed			
		},


		/* The Error Messages */
		messages: {
			"*": { en: "Please correct this value" }		
		},
		
		localize: function(lang, messages) { 
			$.each(messages, function(key, msg)  {
				v.messages[key] = v.messages[key] || {};
				v.messages[key][lang] = msg;		
			});
		},
		
		localizeFn: function(key, messages) {
			v.messages[key] = v.messages[key] || {};
			$.extend(v.messages[key], messages);
		},
		
		/** 
		 * Adds a new validator 
		 */
		fn: function(matcher, msg, fn) {
			
			// no message supplied
			if ($.isFunction(msg)) { 
				fn = msg; 
				
			// message(s) on second argument
			} else {
				if (typeof msg == 'string') { msg = {en: msg}; }
				this.messages[matcher.key || matcher] = msg;
			}

			// check for "[type=xxx]" (not supported by jQuery)
			var test = typeRe.exec(matcher);                                    
			if (test) { matcher = isType(test[1]); }				
			
			// add validator to the arsenal
			fns.push([matcher, fn]);		 
		},

		/* Add new show/hide effect */
		addEffect: function(name, showFn, closeFn) {
			effects[name] = [showFn, closeFn];
		}
		
	};
	
	/* calculate error message position relative to the input */  	
	function getPosition(trigger, el, conf) {	
		
		// get origin top/left position 
		var top = trigger.offset().top, 
			 left = trigger.offset().left,	 
			 pos = conf.position.split(/,?\s+/),
			 y = pos[0],
			 x = pos[1];
		
		top  -= el.outerHeight() - conf.offset[0];
		left += trigger.outerWidth() + conf.offset[1];
		
		
		// iPad position fix
		if (/iPad/i.test(navigator.userAgent)) {
			top -= $(window).scrollTop();
		}
		
		// adjust Y		
		var height = el.outerHeight() + trigger.outerHeight();
		if (y == 'center') 	{ top += height / 2; }
		if (y == 'bottom') 	{ top += height; }
		
		// adjust X
		var width = trigger.outerWidth();
		if (x == 'center') 	{ left -= (width  + el.outerWidth()) / 2; }
		if (x == 'left')  	{ left -= width; }	 
		
		return {top: top, left: left};
	}	
	

	
	// $.is("[type=xxx]") or $.filter("[type=xxx]") not working in jQuery 1.3.2 or 1.4.2
	function isType(type) { 
		function fn() {
			return this.getAttribute("type") == type;  	
		} 
		fn.key = "[type=" + type + "]";
		return fn;
	}	

	
	var fns = [], effects = {
		
		'default' : [
			
			// show errors function
			function(errs) {
				
				var conf = this.getConf();
				
				// loop errors
				$.each(errs, function(i, err) {
						
					// add error class	
					var input = err.input;					
					input.addClass(conf.errorClass);
					
					// get handle to the error container
					var msg = input.data("msg.el"); 
					
					// create it if not present
					if (!msg) { 
						msg = $(conf.message).addClass(conf.messageClass).appendTo(document.body);
						input.data("msg.el", msg);
					}  
					
					// clear the container 
					msg.css({visibility: 'hidden'}).find("p").remove();
					
					// populate messages
					$.each(err.messages, function(i, m) { 
						$("<p/>").html(m).appendTo(msg);			
					});
					
					// make sure the width is not full body width so it can be positioned correctly
					if (msg.outerWidth() == msg.parent().width()) {
						msg.add(msg.find("p")).css({display: 'inline'});		
					} 
					
					// insert into correct position (relative to the field)
					var pos = getPosition(input, msg, conf); 
					 
					msg.css({ visibility: 'visible', position: 'absolute', top: pos.top, left: pos.left })
						.fadeIn(conf.speed);     
				});
						
				
			// hide errors function
			}, function(inputs) {

				var conf = this.getConf();				
				inputs.removeClass(conf.errorClass).each(function() {
					var msg = $(this).data("msg.el");
					if (msg) { msg.css({visibility: 'hidden'}); }
				});
			}
		]  
	};

	
	/* sperial selectors */
	$.each("email,url,number".split(","), function(i, key) {
		$.expr[':'][key] = function(el) {
			return el.getAttribute("type") === key;
		};
	});
	

	/* 
		oninvalid() jQuery plugin. 
		Usage: $("input:eq(2)").oninvalid(function() { ... });
	*/
	$.fn.oninvalid = function( fn ){
		return this[fn ? "bind" : "trigger"]("OI", fn);
	};
	
	
	/******* built-in HTML5 standard validators *********/
	
	v.fn(":email", "Please enter a valid email address", function(el, v) {
		return !v || emailRe.test(v);
	});
	
	v.fn(":url", "Please enter a valid URL", function(el, v) {
		return !v || urlRe.test(v);
	});
	
	v.fn(":number", "Please enter a numeric value.", function(el, v) {
		return numRe.test(v);			
	});
	
	v.fn("[max]", "Please enter a value smaller than $1", function(el, v) {
			
		// skip empty values and dateinputs
		if (v === '' || dateInput && el.is(":date")) { return true; }	
		
		var max = el.attr("max");
		return parseFloat(v) <= parseFloat(max) ? true : [max];
	});
	
	v.fn("[min]", "Please enter a value larger than $1", function(el, v) {

		// skip empty values and dateinputs
		if (v === '' || dateInput && el.is(":date")) { return true; }

		var min = el.attr("min");
		return parseFloat(v) >= parseFloat(min) ? true : [min];
	});
	
	v.fn("[required]", "Please complete this mandatory field.", function(el, v) {
		if (el.is(":checkbox")) { return el.is(":checked"); }
		return !!v; 			
	});
	
	v.fn("[pattern]", function(el) {
		var p = new RegExp("^" + el.attr("pattern") + "$");  
		return p.test(el.val()); 			
	});

	
	function Validator(inputs, form, conf) {		
		
		// private variables
		var self = this, 
			 fire = form.add(self);

		// make sure there are input fields available
		inputs = inputs.not(":button, :image, :reset, :submit");			 

		// utility function
		function pushMessage(to, matcher, returnValue) {
			
			// only one message allowed
			if (!conf.grouped && to.length) { return; }
			
			// the error message
			var msg;
			
			// substitutions are returned
			if (returnValue === false || $.isArray(returnValue)) {
				msg = v.messages[matcher.key || matcher] || v.messages["*"];
				msg = msg[conf.lang] || v.messages["*"].en;

				// substitution
				var matches = msg.match(/\$\d/g);
				
				if (matches && $.isArray(returnValue)) {
					$.each(matches, function(i) {
						msg = msg.replace(this, returnValue[i]);
					});
				} 					 
				
			// error message is returned directly
			} else {
				msg = returnValue[conf.lang] || returnValue;
			}
			
			to.push(msg);
		}
		
		
		// API methods  
		$.extend(self, {

			getConf: function() {
				return conf;	
			},
			
			getForm: function() {
				return form;		
			},
			
			getInputs: function() {
				return inputs;	
			},		
			
			reflow: function() {
				inputs.each(function()  {
					var input = $(this),
						 msg = input.data("msg.el");
						 
					if (msg) {						
						var pos = getPosition(input, msg, conf);
						msg.css({ top: pos.top, left: pos.left });
					}
				});
				return self;
			},
			
			/* @param e - for internal use only */
			invalidate: function(errs, e) {
				
				// errors are given manually: { fieldName1: 'message1', fieldName2: 'message2' }
				if (!e) {
					var errors = [];
					$.each(errs, function(key, val) {
						var input = inputs.filter("[name='" + key + "']");
						if (input.length) {
							
							// trigger HTML5 ininvalid event
							input.trigger("OI", [val]);
							
							errors.push({ input: input, messages: [val]});				
						}
					});

				  	errs = errors; 
					e = $.Event();
				}
				
				// onFail callback
				e.type = "onFail";					
				fire.trigger(e, [errs]); 
				
				// call the effect
				if (!e.isDefaultPrevented()) {						
					effects[conf.effect][0].call(self, errs, e);													
				}
				
				return self;
			},
			
			reset: function(els) {
				els = els || inputs;
				els.removeClass(conf.errorClass).each(function()  {
					var msg = $(this).data("msg.el");
					if (msg) {
						msg.remove();
						$(this).data("msg.el", null);
					}
				}).unbind(conf.errorInputEvent || '');
				return self;
			},
			
			destroy: function() { 
				form.unbind(conf.formEvent + ".V").unbind("reset.V"); 
				inputs.unbind(conf.inputEvent + ".V").unbind("change.V");
				return self.reset();	
			}, 
			
			
//{{{  checkValidity() - flesh and bone of this tool
						
			/* @returns boolean */
			checkValidity: function(els, e) {
				
				els = els || inputs;    
				els = els.not(":disabled");
				if (!els.length) { return true; }

				e = e || $.Event();

				// onBeforeValidate
				e.type = "onBeforeValidate";
				fire.trigger(e, [els]);				
				if (e.isDefaultPrevented()) { return e.result; }				
					
				// container for errors
				var errs = [];
 
				// loop trough the inputs
				els.not(":radio:not(:checked)").each(function() {
						
					// field and it's error message container						
					var msgs = [], 
						 el = $(this).data("messages", msgs),
						 event = dateInput && el.is(":date") ? "onHide.v" : conf.errorInputEvent + ".v";					
					
					// cleanup previous validation event
					el.unbind(event);
					
					
					// loop all validator functions
					$.each(fns, function() {
						var fn = this, match = fn[0]; 
					
						// match found
						if (el.filter(match).length)  {  
							
							// execute a validator function
							var returnValue = fn[1].call(self, el, el.val());
							
							
							// validation failed. multiple substitutions can be returned with an array
							if (returnValue !== true) {								
								
								// onBeforeFail
								e.type = "onBeforeFail";
								fire.trigger(e, [el, match]);
								if (e.isDefaultPrevented()) { return false; }
								
								// overridden custom message
								var msg = el.attr(conf.messageAttr);
								if (msg) { 
									msgs = [msg];
									return false;
								} else {
									pushMessage(msgs, match, returnValue);
								}
							}							
						}
					});
					
					if (msgs.length) { 
						
						errs.push({input: el, messages: msgs});  
						
						// trigger HTML5 ininvalid event
						el.trigger("OI", [msgs]);
						
						// begin validating upon error event type (such as keyup) 
						if (conf.errorInputEvent) {							
							el.bind(event, function(e) {
								self.checkValidity(el, e);		
							});							
						} 					
					}
					
					if (conf.singleError && errs.length) { return false; }
					
				});
				
				
				// validation done. now check that we have a proper effect at hand
				var eff = effects[conf.effect];
				if (!eff) { throw "Validator: cannot find effect \"" + conf.effect + "\""; }
				
				// errors found
				if (errs.length) {					 
					self.invalidate(errs, e); 
					return false;
					
				// no errors
				} else {
					
					// call the effect
					eff[1].call(self, els, e);
					
					// onSuccess callback
					e.type = "onSuccess";					
					fire.trigger(e, [els]);
					
					els.unbind(conf.errorInputEvent + ".v");
				}
				
				return true;				
			}
//}}} 
			
		});
		
		// callbacks	
		$.each("onBeforeValidate,onBeforeFail,onFail,onSuccess".split(","), function(i, name) {
				
			// configuration
			if ($.isFunction(conf[name]))  {
				$(self).bind(name, conf[name]);	
			}
			
			// API methods				
			self[name] = function(fn) {
				if (fn) { $(self).bind(name, fn); }
				return self;
			};
		});	
		
		
		// form validation
		if (conf.formEvent) {
			form.bind(conf.formEvent + ".V", function(e) {
				if (!self.checkValidity(null, e)) { 
					return e.preventDefault(); 
				}
			});
		}
		
		// form reset
		form.bind("reset.V", function()  {
			self.reset();			
		});
		
		// disable browser's default validation mechanism
		if (inputs[0] && inputs[0].validity) {
			inputs.each(function()  {
				this.oninvalid = function() { 
					return false; 
				};		
			});
		}
		
		// Web Forms 2.0 compatibility
		if (form[0]) {
			form[0].checkValidity = self.checkValidity;
		}
		
		// input validation               
		if (conf.inputEvent) {
			inputs.bind(conf.inputEvent + ".V", function(e) {
				self.checkValidity($(this), e);
			});	
		} 
	
		// checkboxes, selects and radios are checked separately
		inputs.filter(":checkbox, select").filter("[required]").bind("change.V", function(e) {
			var el = $(this);
			if (this.checked || (el.is("select") && $(this).val())) {
				effects[conf.effect][1].call(self, el, e); 
			}
		});		
		
		var radios = inputs.filter(":radio").change(function(e) {
			self.checkValidity(radios, e);
		});
		
		// reposition tooltips when window is resized
		$(window).resize(function() {
			self.reflow();		
		});
	}

	
	// jQuery plugin initialization
	$.fn.validator = function(conf) { 
		
		var instance = this.data("validator");
		
		// destroy existing instance
		if (instance) { 
			instance.destroy();
			this.removeData("validator");
		} 
		
		// configuration
		conf = $.extend(true, {}, v.conf, conf);		
		
		// selector is a form		
		if (this.is("form")) {
			return this.each(function() {			
				var form = $(this); 
				instance = new Validator(form.find(":input"), form, conf);	 
				form.data("validator", instance);
			});
			
		} else {
			instance = new Validator(this, this.eq(0).closest("form"), conf);
			return this.data("validator", instance);
		}     
		
	};   
		
})(jQuery);
			

