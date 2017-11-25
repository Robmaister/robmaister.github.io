
//TODO some auto-scroll locations are wrong when navigating back and forth
//between pages of different heights. Most noticable by scrolling to the
//bottom of /blog and clicking on the last article, then pressing the browser
//back button.

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
        return b.href.length - a.href.length ||
            a.href.localeCompare(b.href);
    })
    .each(function() {
        if (active_url.startsWith(this.href)) {
            $(this).addClass("selected");
            return false;
        }
    });
}

function load_new_page(url) {
    //AJAX get the new page
    $.get(url)
    .done(function(data) {
        
        //get some CSS3 transitions going
        $("#main").addClass("loading");
        $("body").addClass("loading");

        //prep nav links
        clear_selected_links();
        select_active_link(url);

        //Let the transition finish
        setTimeout(function() {

            //data to jQuery object once
            var jData = $(data);

            //swap backgrounds
            var new_bg = data.match(/body style=\"(.*?)\"/)[1];
            if ($("body").attr("style") != new_bg) {
                var new_bg_path = new_bg.match(/background-image: url\((.*?)\)/)[1];
                var new_bg_img = new Image();
                new_bg_img.onload = function() {
                    $("body").attr("style", new_bg);
                };
                new_bg_img.src = new_bg_path;
            }

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
            
            //swap titles
            document.title = jData.filter("title").text();
            
            //intercept new links
            intercept_links("#main a");
            
            //transition back after a short wait
            setTimeout(function(){
                $("#main").removeClass("loading");
                $("body").removeClass("loading");
            }, 10);
        }, 500);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        window.location.href = url;
    });
}

// Intercept links for history.js
function intercept_links(selector) {
    $(selector).click(function(e) {

        //don't intercept external links or ones forced off
        if (this.host != location.host || $(this).hasClass("ext-link") || $(this).attr("data-lightbox"))
            return;

        var url = $(this).prop('href');
        history.pushState({url: url}, document.title, url);
        load_new_page(url);

        //clicking on a link should scroll to top
        //browser forward/back maintain scrolling positions
        window.scrollTo(0, 0);

        e.preventDefault();
	});
}

//On page load
$(document).ready(function () {

    //Only replace 
    if (document.referrer.split('/')[2] != location.hostname)
        history.replaceState({url: window.location.href}, document.title, window.location.href);

    //select active link
    select_active_link(window.location.href);

    //Handle links dynamically
	intercept_links("nav ul li a");
    intercept_links("#main a");

    //Deal with history
    $(window).on("popstate", function(event) {
            load_new_page(event.originalEvent.state.url);
    });
});
