//TODO some auto-scroll locations are wrong when navigating back and forth
//between pages of different heights. Most noticable by scrolling to the
//bottom of /blog and clicking on the last article, then pressing the browser
//back button.

//https://stackoverflow.com/a/13556622/1122135
function load_new_css(url) {
    var tag  = $("<link>");
    $("head").append(tag);

    tag.attr({
        rel: "stylesheet",
        type: "text/css",
        href: url
    });
}

// Makes sure there are no selected nav bar links
function clear_selected_links() {
    $("nav ul li").each(function() {
        $(this).removeClass("active");
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
            $(this).parent("li").addClass("active");
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
            var new_bg = data.match(/<body style=\"(.*?)\"/)[1];
            if ($("body").attr("style") != new_bg) {
                var new_bg_path = new_bg.match(/background-image: url\((.*?)\)/)[1];
                var new_bg_img = new Image();
                new_bg_img.onload = function() {
                    $("body").attr("style", new_bg);
                };
                new_bg_img.src = new_bg_path;
            }

            //load extra stylesheets and js
            var new_html_classes = data.match(/<html class=\"(.*?)\"/)[1].split(" ");
            if (new_html_classes.indexOf("has-lightbox") >= 0 && !$("html").hasClass("has-lightbox")) {
                load_new_css("/css/lightbox.min.css");
                $.getScript("/js/vendor/lightbox.min.js");
                $("html").addClass("has-lightbox");
            }
            if (new_html_classes.indexOf("has-code") >= 0 && !$("html").hasClass("has-code")) {
                load_new_css("/css/solarized-dark.css");
                $("html").addClass("has-code");
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
            $("#breadcrumbs").html(jData.find("#breadcrumbs>*"));
            
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

            //Fix broken Instagram embeds on AJAX navigation
            if (window.instgrm) {
                window.instgrm.Embeds.process();
            }
            
            //swap titles
            document.title = jData.filter("title").text();
            
            //intercept new links
            intercept_links("#main a");
            intercept_links("#breadcrumbs a");
            
            //transition back after a short wait
            setTimeout(function(){
                $("#main").removeClass("loading");
                $("body").removeClass("loading");

                ga('set', {page: url, title: document.title});
                ga('send', 'pageview');

                if (url.indexOf("#") >= 0) {
                    window.scrollTo(0, $(url.split("#")[1]).offset().top);
                }
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
        var url = $(this).prop('href');

        //don't intercept external links or ones forced off
        if (this.host != location.host || $(this).hasClass("ext-link") || $(this).attr("data-lightbox")) {
            return;
        }

        //prevent link from clicking through
        e.preventDefault();

        //if we're linking to something on the same page
        if (this.protocol == location.protocol &&
            this.host == location.host &&
            this.pathname == location.pathname &&
            this.search == location.search) {
            
            //scoll to new anchor if one exists
            if (this.hash !== '' && this.hash !== '#') {

                //push new history state
                if (this.hash != location.hash) {
                    history.pushState({url: url}, document.title, url);
                }

                //scroll to anchor
                window.scrollTo(0, $(this.hash).offset().top);
            }

            //don't do anything else if on the same page
            return;
        }

        //push new history state if link is valid
        history.pushState({url: url}, document.title, url);
        load_new_page(url);

        //clicking on a link should scroll to top
        //browser forward/back maintain scrolling positions
        window.scrollTo(0, 0);
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
    intercept_links("header a");
    intercept_links("#main a");

    //Deal with history
    $(window).on("popstate", function(event) {
        load_new_page(event.originalEvent.state.url);
    });
});
