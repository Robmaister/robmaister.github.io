var background_images = [
	/*'ZyzTf6b.jpg',
	'2010-11-26_13.40.30.png',
	'DIV7gaC.png',*/
	'jp_diner_port0037.jpg',
	'TopHat-2013-07-04-00.03.45.0008.png'
];

var background_index = 0;

function transition_background() {
	$('body').css("background-image", "url(/img/" + background_images[background_index] + ")");
	background_index++;
	background_index = background_index % background_images.length;
}

$(document).ready(function () {

    //HACK swap backgrounds to test
	transition_background();
	setInterval(function() {
		transition_background();
	}, 10000);

    //Collapse sidebar if click on anything else while expanded
    $(document).click(function(e) {
        var target = e.target;
        if ($(".header-container").hasClass("expanded") && 
            !$(target).is(".header-container") &&
            !$(target).parents().is(".header-container")) {
            
            $(".header-container").removeClass("expanded");
        }
    });

    //Handle links dynamically
	$(".nav-item").click(function(e) {
        e.preventDefault();
		History.pushState(null, document.title, $(this).children("a:first").attr('href'));
	});
    $(".nav-title").click(function(e) {
        e.preventDefault();
        History.pushState(null, document.title, $(this).attr('href'));
    });
    
    //Toggle sidebar when the hamburger icon is clicked
    $("#nav-toggle").click(function () {
        if ($(this).is(":visible")) {
            $(".header-container").toggleClass("expanded");
        }
    });
    
    //Deal with history
    History.Adapter.bind(window, "statechange", function() {
        var state = History.getState();
        var data = state.data;
        
        $("#main-content").addClass("loading");
        setTimeout(function() {
            $("#main-content").load(state.url + " #main-content>*", function() {
                setTimeout(function( ){
                    $("#main-content").removeClass("loading");
                }, 10);
            });
        }, 500);
    });
});