// Helper function: displays a course in the detail view, no matter how it was clicked
function display(course_id) {
    /* highlight the course if it's in the search results */
    $(".course_shown").switchClass("course_shown","course");
    if ($("#result_num_"+course_id).hasClass('course')) {
        $("#result_num_"+course_id).switchClass('course','course_shown');
    } 
    
    /* show the info */
    if ($("#detail_num_"+course_id).attr('class') != "detail_shown") {
        $(".detail_shown").switchClass("detail_shown", "detail");                        
        var detail_id = "#detail_num_"+course_id;
        $(detail_id).switchClass("detail", "detail_shown");
    }
}

// Helper function: handles a click on a detail view's semester button.
// params[1] is the course id, params[2] is the term number
function load_semester(params) {
    var detail_id = "#detail_num_"+params[1];
    /* Hide / show selected semester */
    if ($(detail_id+">.detail_sem_"+params[2]).length == 0) {
        $.get("/semester/", {course_id: params[1], semester: params[2]}, function( data ) {
            $(detail_id).append(data);
            $(detail_id+">.semester_shown").switchClass("semester_shown", "semester");
            $(detail_id+">.detail_sem_"+params[2]).switchClass("semester", "semester_shown");
        });
    }
    else {
        $(detail_id+">.semester_shown").switchClass("semester_shown", "semester");
        $(detail_id+">.detail_sem_"+params[2]).switchClass("semester", "semester_shown");
    }
    /* Enable / disable course history selection buttons */ 
    $(detail_id+">.semester_menu>button").removeAttr("disabled");
    $(detail_id+">.semester_menu>.semester_"+params[1]+"_"+params[2]).attr("disabled", "disabled");

}

$(document).ready(function() {
    /* Enable showing cart courses */
    $(".coursecart").click(function(){
        var course_id = this.id.split('_')[2];
        display(course_id);
    });
    
    /* set the behavior of the "load semester button" */
    $(".semester_menu>button").click(function() {
        var params = $(this).attr('class').split('_');
        load_semester(params);
    });

    /*set behavior of remove from cart button */
    $(".removecourse_form").submit(function(e) {
        e.preventDefault();
        var course_id = $(this).parent().attr('id').split('_')[2];
        /* send post request to save that the user has removed the course from his/her cart */
        var posting = $.post("/course/remove/", $(this).serialize());
        /* remove the course from the cart list and remove any hidden info about the course */
        $("#cart_num_"+course_id).remove();
    });
                        
    /* Show and hide the advanced search dialog */
    $("#show_advanced").click(function(){
        $(".advanced_search_off").switchClass("advanced_search_off", "advanced_search_on");
    });
    
    $("#hide_advanced").click(function(){
        $(".advanced_search_on").switchClass("advanced_search_on", "advanced_search_off");
    });
    
    /* Set up the advanced search form */
    $( "#advanced_num_slider" ).slider({
      range: true,
      min: 100,
      max: 600,
      values: [ 100, 600 ],
      slide: function( event, ui ) {
        $( "#advanced_num_range" ).val(ui.values[ 0 ] + "-" + ui.values[ 1 ] );
      }
    });
    $( "#advanced_num_range" ).val($( "#advanced_num_slider" ).slider( "values", 0 ) +
      "-" + $( "#advanced_num_slider" ).slider( "values", 1 ) );
    
    /* 'Submit' the advanced search form */
    $("#advanced_form").submit(function(event) {
        event.preventDefault();
        var input = $("input#advanced_keyword").val();
        input += " " + $("select#advanced_distribution").val();
        var nums = $("input#advanced_num_range").val().split("-");
        if (nums[0] > 100) input += " >" + nums[0];
        if (nums[1] < 600) input += " <" + nums[1];
        $("#omnibar_input").val(input);
        $("#omnibar_input").submit();
        $(".advanced_search_on").switchClass("advanced_search_on", "advanced_search_off");
    });

    /* Attach a handler to the preset search button */
    $("#preset_search_1").click(function() {
        $("#omnibar_input").val("pdf-only");
        $("#omnibar_input").submit();
    });
    
    /* attach a submit handler to the form */
    $("#omnibar_form").submit(function(event) {
        /* stop form from submitting normally */
        event.preventDefault();
        /* send the data using post */
        var posting = $.post("/results/", $("#omnibar_form").serialize(), 
            function( data ) {
                /* put the data in the result div */
                $("#results_div").empty().append( $( data ) );
                
                /* Enable showing cart courses */
                $(".coursecart").click(function(){
                    var course_id = this.id.split('_')[2];
                    display(course_id);
                });
                
                /* make the course's data show up when it is clicked */
                $(".course").click(function() {
                    var course_id = $(this).attr('id').split('_')[2];
                    display(course_id);
                });
                
                /* set the behavior of the "load semester button" */
                $(".semester_menu>button").click(function() {
                    var params = $(this).attr('class').split('_');
                    load_semester(params);
                });
                
                /* set the behavior of the "save course to cart button" */
                $(".savecourse_form").submit(function(ev) {
                    ev.preventDefault();
                    var posting = $.post("/course/add/", $(this).serialize(), function( data ) {
                        $("#cart_list").append(data);

                        /* redisplay course information when user selects it in his/her cart */
                        $(".coursecart").click(function(){
                            var course_id = this.id.split('_')[2];
                            display(course_id);
                        });
                        
                        /*set behavior of remove from cart button */
                        $(".removecourse_form").submit(function(e) {
                            e.preventDefault();
                            var course_id = $(this).parent().attr('id').split('_')[2];
                            /* send post request to save that the user has removed the course from his/her cart */
                            var posting = $.post("/course/remove/", $(this).serialize());
                            /* remove the course from the cart list and remove any hidden info about the course */
                            $("#cart_num_"+course_id).remove();
                        });
                    });
                }); 
            });
    });
});
