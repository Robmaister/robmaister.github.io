
// Intercept all nav links for history.js
function intercept_nav_links() {
    $(".nav-item").click(function(e) {
        e.preventDefault();
		History.pushState(null, document.title,
            $(this).children("a:first").attr('href')
        );
	});
}

function intercept_main_links() {
    $("#main-md a").click(function(e) {

        //don't intercept external links or ones forced off
        if (this.host == location.host && !$(this).hasClass("ext-link")) {
            e.preventDefault();
            History.pushState(null, document.title, $(this).attr('href'));
        }
    });
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

    //select active link
    select_active_link(window.location.href);

    //Handle links dynamically
	intercept_nav_links();
    intercept_main_links();
    
    //Deal with history
    History.Adapter.bind(window, "statechange", function() {
        var state = History.getState();
        var data = state.data;
        
        //AJAX get the new page
        $.get(state.url, function(data) {
            
            //get some CSS3 transitions going
			$("#main").addClass("loading");			
            $("body").addClass("loading");

            clear_selected_links();
            select_active_link(state.url);

            //Let the transition finish
            setTimeout(function() {

                //data to jQuery object once
                var jData = $(data);

                //check for DISQUS on new page
                var shouldResetDisqus = false;
                var newDisqusJsBlock = jData.find("script#disqus-js");
                var newDisqusId = newDisqusJsBlock.data("disqus-id");
                var newDisqusUrl = newDisqusJsBlock.data("disqus-url");

                //remove DISQUS script tag and mark for reset if necessary
                if (typeof(DISQUS) !== 'undefined'
                    && newDisqusJsBlock.length
                    && newDisqusId && newDisqusUrl) {

                    shouldResetDisqus = true;
                    newDisqusJsBlock.remove();
                }

                //swap main content
                $("#main").html(jData.find("#main>*"));
                
                //Reset DISQUS after reload
                if (shouldResetDisqus) {
                    DISQUS.reset({
                        reload: true,
                        config: function() {
                            this.page.identifier = newDisqusId;
                            this.page.url = newDisqusUrl;
                        }
                    });
                }

                //swap backgrounds
                var new_bg = data.match(/body style=\"(.*?)\"/)[1];
                if ($("body").attr("style") != new_bg) {
                    $("body").attr("style", new_bg);
                }
                
                //swap titles
                document.title = jData.filter("title").text();
                
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
