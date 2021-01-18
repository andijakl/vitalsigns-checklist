$(document).ready(function () {
    // This method gets executed when the page DOM is ready
    console.log("Document ready");
    // Ensure the error message is hidden when the page is loaded
    $('.errormsg').hide();
    // Initialize the socket.io library
    const socket = io();

    $("#assessment_form").submit(function (e) {
        // Hide previous error message in case it's still visible
        $('.errormsg').hide();

        // Retrieve text entered into text box
        let enteredText = $("#assessment_text").val();
        console.log("Form submitted - entered text: " + enteredText);

        // Send the message to the server via socket.io
        socket.emit('assessment', enteredText);

        // Clear the entered text from the text box
        $('#assessment_text').val('');

        // Do not reload page
        e.preventDefault();
    });

    socket.on('Temperature', function (msg) {
        // Temperature intent was recognized - update UI with new entity value
        $('.result_temperature').html(msg);
    });
    socket.on('PupillaryResponse', function (msg) {
        // PupillaryResponse intent was recognized - update UI with new entity value
        $('.result_pupillaryresponse').html(msg);
    });
    socket.on('Age', function (msg) {
        // Age intent was recognized - update UI with new entity value
        $('.result_age').html(msg);
    });
    socket.on('Error', function (msg) {
        // Error message was received
        // Update UI with the error message and make sure the div is visible
        $('.errormsg').html(msg);
        $('.errormsg').show();
    });
});