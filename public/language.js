$(document).ready(function () {
    console.log("Document ready");
    var socket = io();

    $("#assessment_form").submit(function(e){
        console.log("Form submitted");
        var enteredText = $("#assessment_text").val();
        console.log("Entered text: " + enteredText);
        
        socket.emit('assessment', enteredText);
        $('#assessment_text').val('');

        // Do not reload page
        e.preventDefault();
    });
    
    socket.on('Temperature', function(msg){
        $('.result_temperature').html(msg);
    });
    socket.on('PupillaryResponse', function(msg){
        $('.result_pupillaryresponse').html(msg);
    });
    socket.on('Age', function(msg){
        $('.result_age').html(msg);
    });
});