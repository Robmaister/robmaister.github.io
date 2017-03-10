
//TODO some auto-scroll locations are wrong when navigating back and forth
//between pages of different heights. Most noticable by scrolling to the
//bottom of /blog and clicking on the last article, then pressing the browser
//back button.

// Intercept links for history.js
function intercept_links(selector) {
    $(selector).click(function(e) {

        //don't intercept external links or ones forced off
        if (this.host == location.host && !$(this).hasClass("ext-link")) {
            History.pushState(null, document.title, $(this).attr('href'));
            
            //clicking on a link should scroll to top
            //browser forward/back maintain scrolling positions
            window.scrollTo(0, 0);

            e.preventDefault();
        }
	});
}

// Makes sure there are no selected nav bar links
function clear_selected_links() {
    $("nav ul li a").each(function() {
        $(this).removeClass("selected");
    });
}

// Selects a nav bar link (the page currently being viewed)
function select_active_link(active_url) {

    //Sort the nav links in order of longest href to shortest then find the
    //first one that is the root of the current url. This provides the most
    //specific link instead of just the first one.
    $("nav ul li a")
    .sort(function(a, b) {
        return a.href.length < b.href.length;
    })
    .each(function() {
        if (active_url.startsWith(this.href)) {
            $(this).addClass("selected");
            return false;
        }
    });
}

//On page load
$(document).ready(function () {

    //select active link
    select_active_link(window.location.href);

    //Handle links dynamically
	intercept_links("nav ul li a");
    intercept_links("#main-md a");

    //Deal with history
    $(window).on("statechange", function() {
        var state = History.getState();
        var hsData = state.data;
        
        //AJAX get the new page
        $.get(state.url)
        .done(function(data) {
            
            //get some CSS3 transitions going
            $("#main").addClass("loading");
            $("body").addClass("loading");

            //prep nav links
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
                intercept_links("#main-md a");
                
				//transition back after a short wait
                setTimeout(function(){
                    $("#main").removeClass("loading");
                    $("body").removeClass("loading");
                }, 10);
            }, 500);
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            window.location.href = state.url;
        });
    });
});
