/*var background_images = [
	'ZyzTf6b.jpg',
	'2010-11-26_13.40.30.png',
	'DIV7gaC.png',
	'jp_diner_port0037.jpg',
	'TopHat-2013-07-04-00.03.45.0008.png'
];

var background_index = 0;

function transition_background() {
	$('body').css("background-image", "url(/img/" + background_images[background_index] + ")");
	background_index++;
	background_index = background_index % background_images.length;
}*/

function intercept_nav_links() {
    $(".nav-item").click(function(e) {
        e.preventDefault();
		History.pushState(null, document.title, $(this).children("a:first").attr('href'));
	});
}

function intercept_title_link() {
	$(".nav-title").click(function(e) {
        e.preventDefault();
        History.pushState(null, document.title, $(this).attr('href'));
    });
}

function nav_equals(old_nav, new_nav) {
    return old_nav.html().replace(/\s+/g, '') === new_nav.html().replace(/\s+/g, '');
}

$(document).ready(function () {

    //HACK swap backgrounds to test
	/*transition_background();
	setInterval(function() {
		transition_background();
	}, 10000);*/

    //Collapse sidebar if click on anything else while expanded
    $(document).click(function(e) {
        var target = e.target;
        if ($(".header-container").hasClass("expanded") && 
            !$(target).is(".header-container") &&
            !$(target).parents().is(".header-container")) {
            
            $(".header-container").removeClass("expanded");
        }
    });
	
	//Toggle sidebar when the hamburger icon is clicked
    $("#nav-toggle").click(function () {
        if ($(this).is(":visible")) {
            $(".header-container").toggleClass("expanded");
        }
    });

    //Handle links dynamically
	intercept_nav_links();
    intercept_title_link();
    
    //Deal with history
    History.Adapter.bind(window, "statechange", function() {
        var state = History.getState();
        var data = state.data;
        
        //AJAX get the new page
        $.get(state.url, function(data) {
            
            //compare nav bars
            var old_nav = $("nav ul");
            var new_nav = $("nav ul", data);
            var swap_nav = !nav_equals(old_nav, new_nav);
            
            //get some CSS3 transitions going
			$("#main").addClass("loading");
            if (swap_nav) 
                $("nav").addClass("loading");
			
			
            $("body").addClass("loading");
            
            //Let the transition finish
            setTimeout(function() {
                
                //swap main content
                $("#main").html($("#main>*", data));
                
                //swap the nav bar if necessary
                if (swap_nav) {
                    old_nav.html(new_nav.children());
                    intercept_nav_links();
                }
                
                //swap backgrounds
                var new_bg = $(data).filter("#bg-storage").attr("style");
                $("body").attr("style", new_bg);
                
                //swap titles
                document.title = $(data).filter("title").text();
                
				//transition back
                setTimeout(function( ){
                    $("#main").removeClass("loading");
                    $("nav").removeClass("loading");
                    $("body").removeClass("loading");
                }, 10);
            }, 500);
        });
    });
});