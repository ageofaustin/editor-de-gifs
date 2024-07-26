document.addEventListener('DOMContentLoaded', async function () {

    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const filename = urlParams.get('filename');

    if (type.includes("image")) {
        document.getElementById('info-imagenes').style.display = 'block';

        try {
            const response = await fetch('/images');
            const images = await response.json();

            const imagesContainer = document.getElementById('images-container');
            images.forEach(image => {
                const imgElement = document.createElement('img');
                imgElement.id = "imgElement";
                imgElement.src = image;
                imagesContainer.appendChild(imgElement);
            });
        } catch (error) {
            console.error('Error al obtener las imágenes:', error);
        }
        try {
            const response = await fetch('/images');
            const images = await response.json();

            const intervalRange = document.getElementById('interval-range');
            const previewGif = document.getElementById('preview-gif');

            // Función para crear el GIF
            const createGif = () => {
                gifshot.createGIF({
                    images: images,
                    text: 'DSV5',
                    interval: parseFloat(intervalRange.value) / 100, // Convertir el valor a segundos
                    numFrames: 10, // Número de fotogramas del GIF
                    frameDuration: 1, // Duración de cada fotograma en segundos
                    gifWidth: 400, // Ancho del GIF en píxeles
                    gifHeight: 400 // Alto del GIF en píxeles
                }, function (obj) {
                    if (!obj.error) {
                        while (previewGif.firstChild) {
                            previewGif.removeChild(previewGif.firstChild);
                        }
                        const animatedImage = document.createElement('img');
                        animatedImage.id = "preview";
                        animatedImage.src = obj.image;
                        previewGif.appendChild(animatedImage);
                    }
                });
            };

            // Llamar a la función cuando se carga la página y cuando cambia el valor del input
            createGif();
            intervalRange.addEventListener('input', createGif);
        } catch (error) {
            console.error('Error al obtener las imágenes:', error);
        }


        //  document.getElementById('image').src = `public/user-media/${filename}`;
    } else if (type.includes("video")) {
        document.getElementById('main-video').style.display = 'block';
        setVideoDurationFromFile('/video-duration');

        $('#start').change(function (event) {
            var newValue = Number(event.target.value);
            var endFieldValue = $('#end')[0].value;
            $('#end').prop('min', newValue + 1);
            if (newValue > endFieldValue) {
                $('#start').val((Number(endFieldValue) - 1).toFixed(1));
                $('#end').prop('min', endFieldValue);
            }
            if (newValue < 0) {
                $('#start').val(0);
                $('#end').prop('min', 1);
            }
            calculateTrimLength();
        });

        $('#end').change(function (event) {
            var newValue = Number(event.target.value);
            var startFieldValue = $('#start')[0].value;
            $('#start').prop('max', newValue - 1);
            if (newValue > maxVideoDuration) {
                $('#end').val(maxVideoDuration);
                $('#start').prop('max', maxVideoDuration - 1);
            }
            if (newValue < startFieldValue) {
                $('#end').val((Number(startFieldValue) + 1).toFixed(1));
                $('#start').prop('max', startFieldValue);
            }
            calculateTrimLength();
        });

        $(document).ready(function () {
            $('#submit-video').on('click', function (event) {
                event.preventDefault(); // Evita que el formulario se envíe si el botón está en un formulario
                submitVideoEdit();
            });
        });
        try {
            const response = await fetch('/video');
            if (!response.ok) throw new Error('Video not found');
            const videoBlob = await response.blob();
            const videoURL = URL.createObjectURL(videoBlob);

            const video = document.createElement('video');
            video.src = videoURL;
            video.crossOrigin = "anonymous";
            video.load();

            video.onloadeddata = () => {
                extractFrames(video);
            };
        } catch (error) {
            console.error('Error loading video:', error);
        }
    }
});
