$(document).ready(function () {
    // Get the select element
    const videoTypeSelect = $('#upload_type');

    // Add an event listener to the select element
    videoTypeSelect.on('change', function () {
        // Hide all input fields and the video preview by default
        $('#input_video_url, #input_video_file, #input_video_youtube, #video-preview').addClass('d-none');

        // Show the corresponding input fields based on the selected value
        switch ($(this).val()) {
            case 'Video':
                $('#input_video_file').removeClass('d-none');
                $('#video-preview').removeClass('d-none'); // Show the current video preview
                break;
            case 'URL':
                $('#input_video_url').removeClass('d-none');
                break;
            case 'YouTube':
                $('#input_video_youtube').removeClass('d-none');
                break;
        }
    });

    // Trigger change event on page load to set the initial state
    videoTypeSelect.trigger('change');
});
