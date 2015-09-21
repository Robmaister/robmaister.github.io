var background_images = [
	'ZyzTf6b.jpg',
	'2010-11-26_13.40.30.png',
	'DIV7gaC.png',
	'jp_diner_port0037.jpg',
	'TopHat-2013-07-04-00.03.45.0008.png'
];

var background_index = 0;

function transition_background() {
	$('body').css("background-image", "url(../img/" + background_images[background_index] + ")");
	background_index++;
	background_index = background_index % background_images.length;
}

$(document).ready(function () {

	transition_background();
	setInterval(function() {
		transition_background();
	}, 10000);
	

	$(".nav-item").click(function () {
		
	});
    
    $("#nav-toggle").click(function () {
        if ($(this).is(":visible")) {
            $(".header-container").toggleClass("expanded");
        }
    });
});