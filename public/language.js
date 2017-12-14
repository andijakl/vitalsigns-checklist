$(document).ready(function () {
    console.log("Document ready");
    $('.errormsg').hide();
    var socket = io();

    $("#assessment_form").submit(function(e){
        // Hide previous error message in case it's still visible
        $('.errormsg').hide();

        // Retrieve text entered into text box
        var enteredText = $("#assessment_text").val();
        console.log("Form submitted - entered text: " + enteredText);
        
        // Send the message to the server via socket.io
        socket.emit('assessment', enteredText);

        // Clear the entered text from the text box
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
    socket.on('Error', function(msg){
        $('.errormsg').html(msg);
        $('.errormsg').show();
    });
});