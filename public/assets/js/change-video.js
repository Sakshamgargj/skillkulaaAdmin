
// for video
$(document).ready(function () {

    const videoInput = document.getElementById('video_file');
    console.log("videoInput ==>",videoInput);
    
    const videoPreviewVideo = document.getElementById('video-preview-video');
    console.log("videoPreviewVideo ==>",videoPreviewVideo);
    

    if (videoInput && videoPreviewVideo) {

        videoInput.addEventListener('change', (e) => {

            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = () => {

                const url = URL.createObjectURL(file);
                videoPreviewVideo.srcObject = null;
                videoPreviewVideo.src = url;
                videoPreviewVideo.load();
                videoPreviewVideo.play();

            };

            reader.readAsDataURL(file);

        });

    }
});


// Featured image
$(document).ready(function () {
    // Assuming your file input has the id "imageInput"
    $('#upload').change(function () {

        let input = this;

        if (input.files && input.files[0]) {
            let reader = new FileReader();

            reader.onload = function (e) {
                // Update the src attribute of the image with the new data URL
                $('#previewImage').attr('src', e.target.result);

                // // Update the background-image of the image-input-outline div
                // $('.image-input-outline').css('background-image', 'url(' + e.target.result + ')');
            };

            reader.readAsDataURL(input.files[0]);
        }
    });
});

