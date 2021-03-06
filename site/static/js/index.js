// Helper function: styles show previous button (state "courses_shown" or "courses_hidden")
function styleShowPreviousButton(state) {
    if (state == "courses_shown") {
        $("#showold_span>label").text("Hide Older Courses");
        $("#showold_span>label").css("background-color", "rgba(255, 49, 0, 0.5)");
        $("#show_prev_result").css("display", "none");
    } else if (state == "courses_hidden") {
        $("#showold_span>label").text("View Older Courses");
        $("#showold_span>label").css("background-color", "rgba(255, 49, 0, 0.0)");
        $("#show_prev_result").css("display", "");            
    } else {
        alert("Oops! Please refresh the page");
    }
}

// Helper function: adds/removes cart empty message
function toggleCartEmptyMessage() {
    if ($("#cart_list li").length == 0) {
        $("#cart_label").append("<span id='cart_empty_message'> (Click a course's cart icon to save it here)</span>");
    } else {
        $("#cart_empty_message").remove();
    }
}

// Helper function: displays a course in the detail view, no matter how it was clicked
function display(course_id) {
    /* Make sure we aren't trying to display the "show previous" entry */
    if (course_id == "result") return;
    
    /* turn the right-hand pane dark */
    $("#right_scrollbar_wrap").css("background-color","rgba(0,0,0,0.8)");

    /* highlight the course if it's in the search results */
    if ($("#result_num_"+course_id).attr('class') !=('course_shown')) {
        $(".course_shown").addClass("course").removeClass("course_shown");
        $("#result_num_"+course_id).addClass("course_shown").removeClass("course");
    }
    
    /* show the info */
    if ($("#detail_num_"+course_id).attr('class') != "detail_shown") {
        $(".detail_shown").addClass("detail").removeClass("detail_shown");
        var detail_id = "#detail_num_"+course_id;
        $(detail_id).addClass("detail_shown").removeClass("detail");
        $(".coursecart").removeClass("coursecart_selected");
        $("#cart_num_"+course_id).addClass("coursecart_selected");
    }
}

// Helper function: handles the post request to get a specific semester of a course.
// params[1] is the course id, params[2] is the term number
function load_semester(params) {
    var detail_id = "#detail_num_"+params[1];
    /* Hide / show selected semester */
    if ($(detail_id+">.detail_sem_"+params[2]).length == 0) {
        $.post("/semester/", $(detail_id+">.semester_menu>.term_selector").serialize(), function( data ) {
            $(detail_id).append(data);
            $(detail_id+">.semester_shown").addClass("semester").removeClass("semester_shown");
            $(detail_id+">.detail_sem_"+params[2]).addClass("semester_shown").removeClass("semester");
            $(detail_id+">.semester_menu>.reviews_form>input[type=submit]").attr("value", "See Reviews");
        });
    }
    else {
        $(detail_id+">.semester_shown").addClass("semester").removeClass("semester_shown"); 
        $(detail_id+">.detail_sem_"+params[2]).addClass("semester_shown").removeClass("semester"); 
        $(detail_id+">.semester_menu>.reviews_form>input[type=submit]").attr("value", "See Reviews");
    }
}

function load_reviews(course_id) {
    var detail_id = "#detail_num_"+course_id;
    if ($(detail_id+">.detail_reviews").hasClass("semester_shown")) {
       var semester_id = $(detail_id+">.semester_menu>.term_selector>select>option:selected").attr("value");
       $(detail_id+">.semester_shown").addClass("semester").removeClass("semester_shown"); 
       $(detail_id+">.detail_sem_"+semester_id).addClass("semester_shown").removeClass("semester"); 
       $(detail_id+">.semester_menu>.reviews_form>input[type=submit]").attr("value", "See Reviews");
    }
    else {      
        /* Hide / show selected semester */
        if ($(detail_id+">.detail_reviews").length == 0) {
            $.post("/reviews/", $(detail_id+">.semester_menu>.reviews_form").serialize(), function( data ) {
                $(detail_id).append(data);
                $(detail_id+">.detail_reviews").find(".detail_semester").each(function() {
                    if ($(this).find(".detail_description").text().trim() == "No data available for this semester.")
                        $(this).css("display","none");
                });
                $(detail_id+">.semester_shown").addClass("semester").removeClass("semester_shown"); 
                $(detail_id+">.detail_reviews").addClass("semester_shown").removeClass("semester"); 
                plot_review_data(course_id);
                /* Enable show / hide review lists */
                $(detail_id+">.detail_reviews").find(".toggle_reviews").click(function() {
                    toggle_review_text($(this));
                });
            });
        }
        else {
            $(detail_id+">.semester_shown").addClass("semester").removeClass("semester_shown"); 
            $(detail_id+">.detail_reviews").addClass("semester_shown").removeClass("semester"); 
            plot_review_data(course_id);
        }
        $(detail_id+">.semester_menu>.reviews_form>input[type=submit]").attr("value", "See Course Data");
    }
}

/* Function to display or hide review text */
function toggle_review_text(link) {
    if (link.text().trim() == "Show") {
        link.text("Hide");
        link.parents(".detail_semester").find("ul").css("display", "block");
    }
    else {
        link.text("Show");
        link.parents(".detail_semester").find("ul").css("display", "none");
    }
}

/* function to make the plots of the numerical review data */
function plot_review_data(course_id) {
    var data = [
                {label:"Readings", data:[], color:"rgb(0,0,150)"},
                {label:"Assignments", data:[], color:"rgb(255,0,255)"},
                {label:"Precepts", data:[], color:"rgb(0,150,0)"},
                {label:"Lectures", data:[], color:"rgb(255,200,0)"},
                {label:"Classes", data:[], color:"rgb(0, 150, 150)"},
                {label:"Overall", data:[], color:"rgb(255,49,0)"}
               ];
    var xmapping = [];
    
    /* iterate through all the past semesters of ratings */
    var xval = 0;
    var categories = {"overall_mean": 5, "classes_mean": 4, "lectures_mean":3, "precepts_mean":2, "assignments_mean":1, "readings_mean":0};
    $(".detail_shown>.detail_reviews.semester_shown>.detail_ratings_numbers").children().each(function() {
        /* iterate through all the ratings for that semester */
        if ($(this).children().length <= 1) return;
        xmapping.push([ xval, $(this).children().first().text()]);
        $(this).children().each(function() {
            var itemarray = $(this).text().split(":");
            if (itemarray[0] in categories) {
                data[categories[itemarray[0]]]["data"].push([xval, itemarray[1]]);
            }
        });
        xval = xval - 1;
    });
    
    for (var i = data.length-1; i >= 0; i--) {
        if (data[i]["data"].length == 0) {
            data.splice(i,1);
        }
    }
    if (data.length == 0) {
        $(".detail_shown").find(".detail_ratings_plot").css("display","none");
    }
   
    var options = {
                    series: {
                             lines: {show:true, lineWidth:3},
                             points: {show:true, radius:4}
                            },
                    xaxis:  {
                             ticks: xmapping,
                             font: {size: 13, weight: "bold", family: "sans-serif", color: "#FFFFFF"}
                            },
                    yaxis:  {
                            min: 1,
                            max: 5,
                            tickDecimals: 0,
                            font: {size: 13, weight: "bold", family: "sans-serif", color: "#FFFFFF"}
                            },
                    legend: {
                            position: "se", 
                            labelBoxBorderColor: "#000000",
                            backgroundColor: "#AAAAAA",
                            font: {size: 13, weight: "bold", family: "sans-serif", color: "#FFFFFF"}
                            },
                    grid:   {
                            backgroundColor: "#888888",
                            color: "#000000"
                            }
                   };
    $.plot($(".detail_shown").find(".detail_ratings_plot"), data, options);
}

/* function to sort the results based on the current selection of the spinner */
function sort_results(sortby) {
    var sorted = {};
    var keys = [];
    var courses = $("#search_results_list").children().not("#show_prev_result");
    $.each(courses, function() {
        var key;
        var course_id = $(this).attr("id").split("_")[2];
        
        // get the keys for each type of sorting
        if (sortby == "professor") {
           var profs = $(this).find(".sub_span").text();
           var mainprof = profs.split(",");
           var lname = mainprof[0].trim().split(/\s+/);
           key = lname[lname.length-1];
           key = key + course_id;
           keys.push(key);
        }
        else if (sortby == "rating") {
            var rating = $("#detail_num_"+course_id).children().eq('1').find(".overall_rating").text().trim();
            key = rating + course_id;
            keys.push(key);
        }
        else if (sortby == "subject") {
            var sub = $("#detail_num_"+course_id).children().eq('1').find(".detail_subject_number_dist").text();
            key = sub.trim()+course_id;
            keys.push(key);
        }
        else if (sortby = "relevance") {
            var rel = $(this).find(".relevance").text().trim();
            key = rel + course_id;
            keys.push(key);
        }
        
        // add key and element to dict
        sorted[key] = $(this);
    });
    
   //do the sort
    keys.sort();    
    
   // Preemptively undo the reversing unless sorting by numbers 
    if (sortby != "rating" && sortby != "relevance") keys.reverse();
    
    // Put the results back in the html. Has the effect of reversing the keys (done to keep 'show previous' at the end).
    courses.remove();
    $.each(keys, function() {
        $("#search_results_list").prepend(sorted[this]);
    });
    
    /* make the course's data show up when it is clicked */
    $(".course").click(function() {
        var course_id = $(this).attr('id').split('_')[2];
        display(course_id);  
    });
}

/* function to make the spinner */
function make_spinner() {
        var opts = {
        lines: 9, // The number of lines to draw
        length: 5, // The length of each line
        width: 4, // The line thickness
        radius: 6, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 0, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        color: "#ff6400", // #rgb or #rrggbb
        speed: 1, // Rounds per second
        trail: 80, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: 'auto', // Top position relative to parent in px
        left: '264px' // Left position relative to parent in px
    };
    var target = document.getElementById('omnibar_form');
    var spinner = new Spinner(opts).spin(target);
    return spinner;
}

var spinner_on = false;
var old_search = "";

$(document).ready(function() {

    /* Enable showing cart courses */
    $(".coursecart").click(function(ev){
        if ($(ev.target).attr("type") == "submit") return;
        var course_id = this.id.split('_')[2];
        display(course_id);
    });

    toggleCartEmptyMessage();

    /* Give cart courses a scrollbar */
    $("#results_right_div").jScrollPane({showArrows:true, hideFocus:true, autoReinitialise:true});

    /* Give the tutorial a scrollbar */
    $("#tutorial").show().jScrollPane({showArrows:true, hideFocus:true, autoReinitialize:true}).hide();
    
    /* Set up initial left pane */
    $("#results_left_div").append('<div class="instruction_text">\
                          <p>Welcome to CAT!</p>\
                          <p>Search for courses:</p>\
                          <ul>\
                            <li class="instruction_item">Looking for a specific course? </br>\
                                "COS 333"</li>\
                            <li class="instruction_item">Want all courses taught by a professor?</br>\
                                "Kernighan"</li>\
                            <li class="instruction_item">Have a gap in your schedule you want to fill?</br>\
                                "MW 10:00"</li>\
                            <li class="instruction_item">Distribution reqirements?</br>\
                                "HA", "EC", etc.</li>\
                            <li class="instruction_item">Heavy courseload?</br>\
                                "pdf only"</li>\
                            <li class="instruction_item">Interested in a topic?</br>\
                                "Italian food"</li>\
                         </ul>\
                        </div>');
    
    /* set the behavior of the "load semester button" */
    $(".semester_menu>.term_selector>.term_dropdown").change(function() {
        var params = $(this).find("option:selected").attr('class').split('_');
        load_semester(params);
    });
    
    /* Load reviews */
    $(".semester_menu>.reviews_form").submit(function(e) {
        e.preventDefault();
        var course_id = $(this).find("input[name=course_id]").attr('value');
        load_reviews(course_id);
    });

    /*set behavior of remove from cart button. Also under search results */
    $(".removecourse_form").submit(function(e) {
        e.preventDefault();
        var course_id = $(this).parent().attr('id').split('_')[2];
        /* send post request to save that the user has removed the course from his/her cart */
        var posting = $.post("/course/remove/", $(this).serialize());
        /* remove the course from the cart list and remove any hidden info about the course */
        $("#cart_num_"+course_id).remove();
        /* if in result list activate save button */
        if ($("#result_num_"+course_id).length > 0) {
            $("#save_"+course_id+">input[type=submit]").removeAttr("disabled").css("visibility","visible");
        }
        $("#save_"+course_id+">input[type=submit]").removeAttr("disabled");
        /* Display empty message if the cart is empty */
        toggleCartEmptyMessage();
    });
                        
    /* Show and hide the advanced search dialog */
    $("#show_advanced").click(function(){
        $("#advanced_search_wrapper").fadeIn();
        $("#advanced_search").fadeIn(function() {
            $("#advanced_search_wrapper").click(function(ev) {
                if (ev.target != this) return;
                $("#advanced_search_wrapper").fadeOut();
                $("#advanced_search").fadeOut();
                $("#advanced_search_wrapper").unbind('click');
            });  
        });
    });
    
    $("#hide_advanced").click(function(){
        $("#advanced_search_wrapper").fadeOut();
		$("#advanced_search").fadeOut();
    });

    /* Show and hide the tutorial. CURRENTLY DISABLED 
    $("#show_tutorial").click(function(){
        $("#advanced_search_wrapper").fadeIn();
        $("#tutorial").fadeIn(function() {
            $("#advanced_search_wrapper").click(function(ev) {
                if (ev.target != this) return;
                $("#advanced_search_wrapper").fadeOut();
                $("#tutorial").fadeOut();
                $("#advanced_search_wrapper").unbind('click');
            });  
        });
    });

    $("#hide_tutorial").click(function(){
        $("#advanced_search_wrapper").fadeOut();
		$("#tutorial").fadeOut();
    });
*/    
    /* Show and hide the analytics. CURRENTLY DISABLED 
     $("#show_analytics").click(function(){
        $("#advanced_search_wrapper").fadeIn();
        $("#analytics").fadeIn(function(){
            $("#advanced_search_wrapper").click(function(ev) {
                if (ev.target != this) return;
                $("#advanced_search_wrapper").fadeOut();
                $("#analytics").fadeOut();
                $("#advanced_search_wrapper").unbind('click');
            });  
        });
    });
    
    $("#hide_analytics").click(function(){
        $("#advanced_search_wrapper").fadeOut();
        $("#analytics").fadeOut();
    });
*/    
    /* Set up the advanced search form slider. CURRENTLY DISABLED
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
      "-" + $( "#advanced_num_slider" ).slider( "values", 1 ) );*/
    
    /* 'Submit' the advanced search form */
    $("#advanced_form").submit(function(event) {
        event.preventDefault();
        var boxes;
        var input = $("#advanced_subject").val();
        if ($("#advanced_course_number").val().trim().length != 0) {
            input += " " + $("#advanced_course_number").val();
        }
        var min = 999;
        var max = 0;
        boxes = $("input[name=level]:checked");
        boxes.each(function(){
            var level = parseInt($(this).val());
            if (level < min) min = level;
            if (level > max) max = level;
        });
        if (min < 999) {
            input += " >=" + min;
        }
        if (max > 0) {
            input += " <" + (max + 100);
        }
        if ($("#advanced_instructor").val().trim().length != 0) {
            input += " " + $("#advanced_instructor").val();
        }
        if ($("#advanced_title").val().trim().length != 0) {
            input += " " + $("#advanced_title").val();
        }
        boxes = $("input[name=day]:checked");
        boxes.each(function(){
            input += " " + $(this).val();
        });
        boxes = $("input[name=time]:checked");
        boxes.each(function(){
            input += " " + $(this).val();
        });
        boxes = $("input[name=dist]:checked");
        boxes.each(function(){
            input += " " + $(this).val();
        });
        boxes = $("input[name=pdfonly]:checked");
        boxes.each(function(){
            input += " " + $(this).val();
        });
        if ($("#advanced_keyword").val().trim().length != 0) {
            input += " kw:" + $("#advanced_keyword").val();
        }
        
        $("#omnibar_input").val(input);
        $("#omnibar_input").submit();
        $("#advanced_search").fadeOut();
        $("#advanced_search_wrapper").fadeOut();
        $("#advanced_search_wrapper").unbind('click');
        $("#advanced_form")[0].reset(); // clear fields
    });
    
    /* handle checking and unchecking the show old courses checkbox */
    $("#omnibar_showold").change(function() {
        /* handle if just checked */
        if ($(this).is(":checked")) {
            $(".course_old").css("display","");
            /* get rid of the prev_only_message if it's there */
            if ($("#prev_only_message").length != 0) $("#prev_only_message").remove();
            styleShowPreviousButton("courses_shown");
        }
        else if (!$(this).is(":checked")) {
            $(".course_old").css("display","none");
            styleShowPreviousButton("courses_hidden");
        }
    });
    
    /* attach a submit handler to the form */
    $("#omnibar_form").submit(function(event) {
        /* stop form from submitting normally */
        event.preventDefault();
        
        /* Prevent spamming repeat requests */
        if ($("#omnibar_input").val().trim() == old_search) { return; }
        old_search = $("#omnibar_input").val().trim();

        /* make the spinner */
        var spinner;
        if (!spinner_on) {
            spinner = make_spinner();
            spinner_on = true;
        }
        
        /* send the data using post */
        var posting = $.post("/results/", $("#omnibar_form").serialize(), 
            function( data ) {
                /* put the data in the result div */
                $("#results_div").empty().append( $( data ) );
                
                /* display a "no results found" message if no results were found */
                if($("#search_results_list").children().length == 0) {
                 $("#results_left_div").prepend("<div class='instruction_text' id='no_results_message'> <p>No results found</p></div>"); 
                }
                else {
                    /* Show the "check prev semesters" message if we return only old semester courses */
                    if ($("#search_results_list").children().length == $("#search_results_list>.course_old").length && !$("#omnibar_showold").is(":checked")) {
                        $("#results_left_div").append("<div class='instruction_text' id='prev_only_message'>\
                                                          <p> No results from most recent semester.</p>\
                                                          <p>Select 'View Older Courses' above to display courses taught in previous semesters.</p>\
                                                      </div>");
                    } /* Otherwise, if we have any old semester courses, append an extra result that reminds
                         people to show past results if they get to the end of the list and don't find what they want.*/
                    else if ($("#search_results_list>.course_old").length != 0) {
                        $("#search_results_list").append("<li id='show_prev_result' class='course'>See results from previous semesters</li>");
                        $("#show_prev_result").click(function() {
                                $(".course_old").css("display", "");
                                $("#omnibar_showold").prop('checked', true);
                                styleShowPreviousButton("courses_shown");
                        });                     
                    }
                    /* Regardless, don't show old courses if the "show previous" isn't selected */
                    if(!$("#omnibar_showold").is(":checked")) {
                        $(".course_old").css("display","none");
                    }
                }
                
                /* give the results divs a fancy scrollbar */
                $("#results_left_div").jScrollPane({showArrows:true, hideFocus:true, autoReinitialise:true});
                $("#results_right_div").jScrollPane({showArrows:true, hideFocus:true, autoReinitialise:true});
                
                /* enable the sorting dropdown */
                if ($("#search_results_list").children().length > 0) {
                    $("#sortby_selector").css("display", "inline");
                }
                else if ($("#search_results_list").children().length <= 0) { 
                    $("#sortby_selector").attr("display","none");
                }
                /* set the behavior of the sortby dropdown */
                $("#sortby_selector").change(function() {
                    if ($("#search_results_list").children().length > 1) 
                        sort_results($(this).find("option:selected").val());
                });
                
                /* Enable showing cart courses */
                $(".coursecart").click(function(ev){
                    if ($(ev.target).attr("type") == "submit") return;
                    var course_id = this.id.split('_')[2];
                    display(course_id);
                });
                
                /* make the course's data show up when it is clicked */
                $(".course").click(function() {
                    var course_id = $(this).attr('id').split('_')[2];
                    display(course_id);  
                });
                
                /* set the behavior of the "load semester button" */
                $(".semester_menu>.term_selector>.term_dropdown").change(function() {
                    var params = $(this).find("option:selected").attr('class').split('_');
                    load_semester(params);
                });
                
                $(".semester_menu>.reviews_form").submit(function(ev) {
                    ev.preventDefault();
                    var course_id = $(this).find("input[name=course_id]").attr('value');
                    load_reviews(course_id);
                });
                
                /* set the behavior of the "save course to cart button" */
                $(".savecourse_form").submit(function(ev) {
                    ev.preventDefault();
                    /* Disable the submit button */
                    $("input[type=submit]", this).attr("disabled", "disabled").css("visibility","hidden");
                    
                    var posting = $.post("/course/add/", $(this).serialize(), function( data ) {
                        $("#cart_list").append(data);
                        
                        /* Hide cart empty message if necessary */
                        toggleCartEmptyMessage();
                        
                        /* redisplay course information when user selects it in his/her cart */
                        $(".coursecart").click(function(ev){
                            if ($(ev.target).attr("type") == "submit") return;
                            var course_id = this.id.split('_')[2];
                            display(course_id);
                        });
                        
                        /*set behavior of remove from cart button */
                        $(".removecourse_form").submit(function(e) {
                            e.preventDefault();
                            var course_id = $(this).parent().attr('id').split('_')[2];
                            /* Only send request if course is still in cart */
                            if ($("#remove_" + course_id).length == 1) { 
                               /* send post request to save that the user has removed the course from his/her cart */
                               var posting = $.post("/course/remove/", $(this).serialize());
                               /* remove the course from the cart list */
                               $("#cart_num_"+course_id).remove();
                               /* if in result list activate save button */
                               if ($("#result_num_"+course_id).length > 0) {
                                  $("#save_"+course_id+">input[type=submit]").removeAttr("disabled").css("visibility","visible");
                               }
                               /* Otherwise delete course result */
                               else {
                                  $("#detail_num_"+course_id).remove();
                               }
                               /* Show cart empty message if necessary */
                               toggleCartEmptyMessage();
                            }
                        });
                    });
                }); 
                
                //if only one course is returned, display the information
                if ($("#search_results_list li").length == 1) {
                    if (!$("#search_results_list li").hasClass("course_old") || $("#omnibar_showold").is(":checked")) {
                        var course_id = $("#search_results_list li").attr('id').split('_')[2];
                        display(course_id);
                    }                        
                }
                
                //stop the spinner 
                if (spinner_on) {
                    spinner.stop();
                    spinner_on = false;
                }
            });
    });
});
