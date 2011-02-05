/*
 * @ description: Plugin to display 960.gs gridlines See http://960.gs/
 * @author: badlyDrawnToy sharp / http://www.badlydrawntoy.com
 * @license: Creative Commons License - ShareAlike http://creativecommons.org/licenses/by-sa/3.0/
 * @version: 1.0 20th April 2009
 * @params:
 *	 cols - Either 12 or 16. Defaults to 12
 *	 options - Default options are as follows. They may be overridden by passing in this param
 *	   var defaults = {
 *		 default_cols: 12,
 *		 z_index: 999,
 *		 img_path: '/images/',
 *		 opacity:.6
 *	   };
*/

(function ($) {
	$.fn.addGrid = function (cols, options) {
		var defaults = {
			default_cols: 12,
			z_index: 999,
			img_path: '/images/',
			opacity:.6
		};

		// Extend our default options with those provided.
		var opts = $.extend(defaults, options);
					
		var cols = cols != null && (cols === 12 || cols === 16) ? cols : 12;
		var cols = cols === opts.default_cols ? '12_col' : '16_col';
		
		return this.each(function () {
			var $el = $(this);
			var height = $el.height();

			var wrapper = $('<div id="'+opts.grid_id+'"/>')
				.appendTo($el)
				.css({
					'display':'none',
					'position':'absolute',
					'top':0,
					'z-index':(opts.z_index -1),
					'height':height,
					'opacity':opts.opacity,
					'width':'100%'});

			$('<div/>')
				.addClass('container_12')
				.css({
					'margin':'0 auto',
					'width':'960px',
					'height':height,
					'background-image': 'url('+opts.img_path+cols + '.png)',
					'background-repeat': 'repeat-y'})
				.appendTo(wrapper);

				// add toggle
				$('<div>grid on</div>')
					.appendTo($el)
					.css({
						'position':'absolute',
						'top':0,
						'left':0,
						'z-index':opts.z_index,
						'background': '#222',
						'color':'#fff',
						'padding': '3px 6px',
						'width': '40px',
						'text-align':'center'
					})
					.hover( function() {
						$(this).css("cursor", "pointer");
					}, function() {
						$(this).css("cursor", "default");
					})
					.toggle( function () {
						$(this).text("grid off");
						$('#'+opts.grid_id).slideDown();
					},
					function() {
						$(this).text("grid on");
						$('#'+opts.grid_id).slideUp();
					});
		});
	};
})(jQuery);