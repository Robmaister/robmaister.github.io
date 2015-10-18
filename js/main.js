
// Intercept all nav links for history.js
function intercept_nav_links() {
    $(".nav-item").click(function(e) {
        e.preventDefault();
		History.pushState(
            null,
            document.title,
            $(this).children("a:first").attr('href')
        );
	});
}

// Intercept the link of the navigation title for history.js
function intercept_title_link() {
	$(".nav-title").click(function(e) {
        e.preventDefault();
        History.pushState(null, document.title, $(this).attr('href'));
    });
}

function intercept_main_links() {
    $("#main-md a").click(function(e) {
        if (this.host == location.host) {
            e.preventDefault();
            History.pushState(null, document.title, $(this).attr('href'));
        }
    });
}

// Compare two nav bars for "equality" (all the same links)
// Determines whether or not to swap nav bars when loading with history.js
function nav_equals(old_nav, new_nav) {
    
    var old_links = [];
    var new_links = [];
    
    old_nav.find("li a").each(function() {
        old_links.push(this.href);
    });
    
    new_nav.find("li a").each(function() {
        new_links.push(this.href);
    });
    
    if (old_links.length != new_links.length)
        return false;

    for (var i = 0; i < old_links.length; i++) {
        if (old_links[i] !== new_links[i]) {
            return false;
        }
    }
    
    return true;
}

// Makes sure there are no selected nav bar links
function clear_selected_links() {
    $(".nav-item.selected").each(function() {
        $(this).removeClass("selected");
    });
}

// Selects a nav bar link (the page currently being viewed)
function select_active_link(active_url) {
    $(".nav-item a").each(function() {
        if (active_url === this.href) {
            $(this).closest("li").addClass("selected");
        }
    });
}

//On page load
$(document).ready(function () {

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
    
    //select active link
    select_active_link(window.location.href);

    //Handle links dynamically
	intercept_nav_links();
    intercept_title_link();
    intercept_main_links();
    
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
            
            //if the nav bars are the same, then the link that was clicked
            //
            if (!swap_nav) {
                clear_selected_links();
                select_active_link(state.url);
            }
            
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
                var new_bg = data.match(/body style=\"(.*?)\"/)[1];
                $("body").attr("style", new_bg);
                
                //swap titles
                document.title = $(data).filter("title").text();
                
                //intercept new links
                intercept_main_links();
                
				//transition back
                setTimeout(function(){
                    
                    //scroll back to the top
                    //TODO prevent when this isn't a new page (back/forward)
                    window.scrollTo(0, 0);
                    
                    $("#main").removeClass("loading");
                    $("nav").removeClass("loading");
                    $("body").removeClass("loading");
                }, 10);
            }, 500);
        });
    });
});