$(function(){ 
  $("#accordian").tabs("#accordian > .pane", {
  	tabs: '.tab', 
  	effect: 'custom-horizontal'
  });
  
  $('#projects').cycle({
      fx:     'shuffle',
      easing: 'backout',
      prev: '#previous-project',
      next: '#next-project',
      delay:  2600,
      speed: 600
  });
  $('#next-project').click(function(){
    $('#projects').cycle('pause');
  });
  $('#previous-project').click(function(){
    $('#projects').cycle('pause');
  });
  
  $("#contact-form").validator({position: 'center left'});
  
  /* set @ 540; expands to 560 and doesnt break */
  //$(".project-details").css({width:'560px'});
  
  $("body").addGrid(12);
});


$.tools.tabs.addEffect("custom-horizontal", function(i, done) {
  // store original width of a pane into memory
  $('#accordian').css({overflow:'hidden'}); //lock in positions
  var pane = this.getPanes().eq(i); //nested animations

  // set current pane's width to 1 (chrome)
  this.getCurrentPane().animate({width: 1}, function() { 
    $(this).hide(); 

    pane.show(); //unhide before animate
    pane.animate({width: '700px'}, function() {
      $('#accordian').css({overflow:'visible'}); //natural positions for shuffles
      done.call();
    });
  });
});	
