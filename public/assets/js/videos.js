const home =  document.getElementById('home_btn');
var userInformation = localStorage.getItem('user');
const startInput = document.getElementById('start');
const endInput = document.getElementById('end');

var brightnesss = "100", saturation = "100", invert = "0", grayscale = "0";
var rotate = 0, flipHorizontal = 1, flipVertical = 1;
var urlvideo= ''
const recibirFiltros = async (brillo,saturacion,inversion,escalaDeGrises,rotacion,espejoHorizontal,espejoVertical) =>{
this.brightnesss = brillo;
this.saturation = saturacion
this.invert = inversion;
this.grayscale =escalaDeGrises;
this.rotate=rotacion;
this.flipHorizontal= espejoHorizontal;
this.flipVertical=espejoVertical;

createGifFromVideo(urlvideo);

};

const createGifFromVideo = async (fetchvideo) => {
    urlvideo= fetchvideo;
    try {
        
        // Obtener el video mediante fetch
        let response = await fetch(fetchvideo);
        let blob = await response.blob();

        let videoBlobUrl = URL.createObjectURL(blob);
        let previewGif = document.getElementById("preview-gif");

    
        // Convertir el blob del video a una URL
        let videoUrl = URL.createObjectURL(blob);
        
        let frameCount =  await getFrameCountFromVideoBlobUrl(videoBlobUrl);
        
        
        gifshot.createGIF({
            
            video: videoUrl,
            numFrames: 80, // Número de fotogramas del GIF
            filter: `brightness(${brightnesss}%) saturate(${saturation}%) invert(${inversion}%) grayscale(${grayscale}%)`,
            frameDuration: 1, // Duración de cada fotograma en segundos
            gifWidth: 400, // Ancho del GIF en píxeles
            gifHeight: 400 // Alto del GIF en píxeles
        
        }, function (obj) {
            
            if (!obj.error) {
                previewGif.innerHTML = "";
                
                previewGif.innerHTML = `
                    <img src=${obj.image} id='preview'>
                `;

                imageElement_to_server('preview');
            }

        });
        
    } catch (error) {
        console.error('Error al obtener el video:', error);
    }

};

const getFrameCountFromVideoBlobUrl = async (videoBlobUrl) => {
    
    // Crear un elemento de video en memoria
    let video = document.createElement('video');
    video.src = videoBlobUrl;

    // Esperar a que el video se cargue
    await new Promise((resolve, reject) => {
        
        video.addEventListener('loadedmetadata', () => {
            resolve();
            
            
        });

        video.addEventListener('error', (error) => {
            reject(error);
        });

    });

    // Obtener el número de fotogramas del video
    let frameCount = video.duration * video.framerate;

    // Liberar recursos
    URL.revokeObjectURL(videoBlobUrl);
    
    return frameCount;
};

function pollVideoStatus(id) {

    $.get(apiEndpoint + '/' + id, function (response) {

        updateStatus(response.data.status);

        if (!(response.data.status === 'done' || response.data.status === 'failed')) {

            setTimeout(function () {

                pollVideoStatus(id);

            }, pollIntervalSeconds * 1000);

        } else if (response.data.status === 'failed') {

            updateStatus(response.data.status);

        } else {

            // initialiseVideo(response.data.url);

            // initialiseJson(response.data.data);

            // initialiseDownload(response.data.url);

            //  resetForm();



            // Guardar el video cortado en la ubicación deseada

            saveCutVideo(response.data.url, 'public/user-media/video-cortado/video_cortado.mp4');

        }

    });

}

startInput.addEventListener('keydown', (event) => {
    event.preventDefault();
});
endInput.addEventListener('keydown', (event) => {
    event.preventDefault();
});
// SIMPLIFICAR
function mostrarNotificacionVideo() {
    iziToast.success({
        title: 'Éxito',
        message: '¡Video Cortado Exitosamente!',
        position: 'topRight'
    });
}

async function submitVideoEdit() {
    try {
        const start = document.getElementById('start').value;
        const end = document.getElementById('end').value;

        const videoFile = await getSelectedVideoFile();
        
        
        const response = await fetch(`/submit/${userInformation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ start, end, video: videoFile }),
        });

        const data = await response.json();
        
        if ( data.status === 'success' ) {
            
            console.log('Video recortado:', data.video);
            mostrarNotificacionVideo();
            
            createGifFromVideo(`/video_recortado/${userInformation}`);
            

            // Aquí puedes agregar la lógica para manejar el video recortado (e.g., mostrarlo en el cliente)
        } else {
            console.error('Error al recortar el video:', data.message);
        }

    } catch (error) {
        console.error('Error al enviar los datos:', error);
    }
}

// SIMPLIFICAR ^^^

function updateStatus(status) {

    $('#status').removeClass('d-none');

    $('#instructions').addClass('d-none');
    if (progress <= 90)

        progress += progressIncrement;
    if (progress <= 90) {

        progress += progressIncrement;

    }
    if (status === 'submitted') {

        $('#status .fas').attr('class', 'fas fa-spinner fa-spin fa-2x');

        $('#status p').text('SUBMITTED');

    } else if (status === 'queued') {

        $('#status .fas').attr('class', 'fas fa-history fa-2x');

        $('#status p').text('QUEUED');

    } else if (status === 'fetching') {

        $('#status .fas').attr('class', 'fas fa-cloud-download-alt fa-2x');

        $('#status p').text('DOWNLOADING ASSETS');

    } else if (status === 'rendering') {

        $('#status .fas').attr('class', 'fas fa-server fa-2x');

        $('#status p').text('RENDERING VIDEO');

    } else if (status === 'saving') {

        $('#status .fas').attr('class', 'fas fa-save fa-2x');

        $('#status p').text('SAVING VIDEO');

    } else if (status === 'done') {

        $('#status .fas').attr('class', 'fas fa-check-circle fa-2x');

        $('#status p').text('READY');

        progress = 100;

    } else {

        $('#status .fas').attr('class', 'fas fa-exclamation-triangle fa-2x');

        $('#status p').text('SOMETHING WENT WRONG');

        $('#submit-video').prop('disabled', false);

        progress = 0;

    }

    $('.progress-bar')

        .css('width', progress + '%')

        .attr('aria-valuenow', progress);

}

const setVideoDurationFromFile = (url) => {

    var $sourceLengthValueField = $('#source-length-value');
    var $startField = $('#start');
    var $endField = $('#end');

    $.get(url, function (data, status) {

        var duration = data.duration;

        // duration ya está en segundos

        var maxVideoDuration = Math.round(duration * 10) / 10;



        $sourceLengthValueField.text(`${maxVideoDuration} sec`);

        $startField.val(0);

        $startField.prop('disabled', false);

        $startField.prop('max', maxVideoDuration - 1);

        $startField.prop('min', 0);

        $endField.val(maxVideoDuration);

        $endField.prop('disabled', false);

        $endField.prop('max', maxVideoDuration);

        $endField.prop('min', 1);

    }).fail(function () {

        var maxVideoDuration = 120;

        $sourceLengthValueField.text(`${maxVideoDuration} sec`);

        $startField.val(0);

        $startField.prop('disabled', false);

        $startField.prop('max', maxVideoDuration - 1);

        $startField.prop('min', 0);

        $endField.val(maxVideoDuration);

        $endField.prop('disabled', false);

        $endField.prop('max', maxVideoDuration);

        $endField.prop('min', 1);

    });

}

function saveCutVideo(videoUrl, savePath) {

    // Eliminar el archivo de video cortado si ya existe

    if (fs.existsSync(savePath)) {

        fs.unlinkSync(savePath);

    }



    // Descargar el video cortado desde la URL y guardarlo en la ubicación deseada

    $.ajax({

        url: videoUrl,

        xhrFields: {

            responseType: 'blob'

        },

        success: function (data) {

            var blob = new Blob([data], { type: 'video/mp4' });

            var url = window.URL.createObjectURL(blob);



            var a = document.createElement('a');

            a.style.display = 'none';

            a.href = url;

            a.download = savePath.split('/').pop();

            document.body.appendChild(a);

            a.click();

            window.URL.revokeObjectURL(url);

            document.body.removeChild(a);

        },

        error: function (error) {

            console.error('Error al descargar el video:', error);

        }

    });

}

document.addEventListener('DOMContentLoaded', async function () {
    
    if( type.includes("video") ) {
            
        document.getElementById('main-video').style.display = 'flex';
        document.getElementById('images-container').style.display ='none'
        document.getElementById('formulario').style.display ='none'
        //alert('INICIANDO EL FORMATEO DEL VIDEO');
        
        setVideoDurationFromFile(`/video-duration/${userInformation}`);
        createGifFromVideo(`/video/${userInformation}`);


        try {
            
           // initial_state_imageEditor_app();

            fetch(`/load-filters/${userInformation}`)
            .then(response => response.json())
            .then(data => {
                if (data) {
                    brightness = data.brightness || brightness;
                    saturation = data.saturation || saturation;
                    inversion = data.inversion || inversion;
                    grayscale = data.grayscale || grayscale;
                    rotate = data.rotate || rotate;
                    flipHorizontal = data.flipHorizontal || flipHorizontal;
                    flipVertical = data.flipVertical || flipVertical;
                    applyFilter();

                    filterSlider.value = brightness;
                    filterValue.innerText = `${brightness}%`;
                }
            })
            .catch((error) => {
                console.error('Error loading filter data:', error);
            });

        } catch (error) {
            console.error('Error al obtener las imágenes:', error);
        }

    

    }
});

home.addEventListener("click", () => {  
    request("/inicializar");
})

