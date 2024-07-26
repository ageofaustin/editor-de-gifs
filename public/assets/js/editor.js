//const { text } = require("express");

//const { format } = require("express/lib/response");

// editor.js
var apiUrl = 'http://localhost:3000/demo/'; // 'https://vanhnt5aid.execute-api.ap-southeast-2.amazonaws.com/demo/';
var apiEndpoint = apiUrl + 'shotstack';
var urlEndpoint = apiUrl + 'upload/sign';
var probeEndpoint = 'https://api.shotstack.io/stage/probe/';
var s3Bucket = 'https://shotstack-demo-storage.s3-ap-southeast-2.amazonaws.com/';
var progress = 0;
var progressIncrement = 10;
var pollIntervalSeconds = 10;
var unknownError = 'An error has occurred, please try again later.';
var player;
var maxVideoDuration = 120;
var lastImage = "";
var userInformation = localStorage.getItem('user');
let formatoSelec = 'gif'; // Valor predeterminado
const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get('type');
const filename = urlParams.get('filename');
const contButton = document.getElementById('cont');
const fileInput = document.querySelector(".file-input")
const filterOptions = document.querySelectorAll(".filter button")
const filterName = document.querySelector(".filter-info .name")
const filterValue = document.querySelector(".filter-info .value")
const filterSlider = document.querySelector(".slider input")
const rotateOptions = document.querySelectorAll(".rotate button")
const selectorArchivo = document.getElementById('selector_archivo_2')
const previewImgdiv = document.getElementById('preview')
const resetFilterBtn = document.querySelector(".reset-filter")
const chooseImgBtn = document.querySelector(".choose-img")
const saveImgBtn = document.getElementById('descarga');
const intervalRange = document.getElementById('interval-range');
const imgLoaded = document.getElementsByClassName('imgElement');

const startVideo = document.getElementById('start');
const endVideo = document.getElementById('end');

const previewImg = document.getElementById('preview-gif')
const previewGif = document.getElementById('preview-gif');
var intervalRage= 0

const guardar_proyecto = document.getElementById('GUARDAR_PROYECTO');
const DESCARGAR_ARCHIVO = document.getElementById('DESCARGAR_ARCHIVO');
const close_video_preview = document.getElementById('close-video-preview');
const open_video_preview = document.getElementById('previw-btn-video');

var brightness = "100", saturation = "100", inversion = "0", grayscale = "0";
var rotate = 0, flipHorizontal = 1, flipVertical = 1;

const gifPath = `/get-gif/${userInformation}`;

filterOptions.forEach(option => {
    option.addEventListener("click", () => {
        document.querySelector(".active").classList.remove("active");
        option.classList.add("active");
        filterName.innerText = option.innerText;

        if (option.id === "brightness") {
            filterSlider.max = "200";
            filterSlider.value = brightness;
            filterValue.innerText = `${brightness}%`;
        } else if (option.id === "saturation") {
            filterSlider.max = "200";
            filterSlider.value = saturation;
            filterValue.innerText = `${saturation}%`
        } else if (option.id === "inversion") {
            filterSlider.max = "100";
            filterSlider.value = inversion;
            filterValue.innerText = `${inversion}%`;
        } else {
            filterSlider.max = "100";
            filterSlider.value = grayscale;
            filterValue.innerText = `${grayscale}%`;
        }
    });
});

rotateOptions.forEach(option => {
    option.addEventListener("click", () => {
        if (option.id === "left") {
            rotate -= 90;
        } else if (option.id === "right") {
            rotate += 90;
        } else if (option.id === "horizontal") {
            flipHorizontal = flipHorizontal === 1 ? -1 : 1;
        } else {
            flipVertical = flipVertical === 1 ? -1 : 1;
        }
        applyFilter();
    });
});

const applyFilter = () => {

   // previewImg.style.transform = `rotate(${rotate}deg) scale(${flipHorizontal}, ${flipVertical})`;
   // previewImg.style.filter = `brightness(${brightness}%) saturate(${saturation}%) invert(${inversion}%) grayscale(${grayscale}%)`;
    const filterData = {
        brightness,
        saturation,
        inversion,
        grayscale,
        rotate,
        flipHorizontal,
        flipVertical,
        userInformation
    };

    if(window.location.href.includes("type=image")){
        initial_state_imageEditor_app();
    }else if(window.location.href.includes("type=video")){
        recibirFiltros(brightness,saturation,inversion,grayscale,rotate,flipHorizontal,flipVertical)
    }

   //
      // Enviar el objeto JSON al servidor
      guardarFiltrosData(filterData);

      
    // applyFiltersAndOverwriteGIF(filterData);

}
async function applyFiltersAndOverwriteGIF(filters) {
    try {
        const response = await axios.post('http://localhost:3000/apply-filters', filters);
        if (response.data.success) {
            console.log('Filtros aplicados y GIF sobrescrito correctamente');
        }
    } catch (error) {
        console.error('Error al aplicar filtros y sobrescribir el GIF:', error);
    }
};


const guardarFiltrosData = (filterData) => {
    fetch(`/save-filters/${userInformation}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(filterData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

const resetFilter = () => {
    brightness = "100"; saturation = "100"; inversion = "0"; grayscale = "0";
    rotate = 0; flipHorizontal = 1; flipVertical = 1;
    filterOptions[0].click();
    applyFilter();
}

const fetchGif = async () => {
    const response = await fetch(`/get-gif/${userInformation}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return url;
};
function mostrarNotificacionDescargaExitosa() {
    iziToast.success({
        title: 'Éxito',
        message: '¡Descarga Exitosa!',
        position: 'topRight'
    });
}

function mostrarNotificacionDescargaFallida() {
    iziToast.error({
        title: 'Error',
        message: '¡Problemas en la descarga. Intenta otra vez!',
        position: 'topRight'
    });
}
const saveImage = async(formato) => {
    try{
        const downloadUrl = `/download?format=${formato}&userInformation=${userInformation}`;
        window.location.href = downloadUrl;
        mostrarNotificacionDescargaExitosa();
    }catch{
        mostrarNotificacionDescargaFallida();

    }
    
};
const updateFilter = () => {
    filterValue.innerText = `${filterSlider.value}%`;
    const selectedFilter = document.querySelector(".filter .active");

    if (selectedFilter.id === "brightness") {
        brightness = filterSlider.value;
    } else if (selectedFilter.id === "saturation") {
        saturation = filterSlider.value;
    } else if (selectedFilter.id === "inversion") {
        inversion = filterSlider.value;
    } else {
        grayscale = filterSlider.value;
    }
    applyFilter();
}

function calculateTrimLength() {
    var trimLengthValueField = document.getElementById('trim-length-value');
    var trimLengthField = document.getElementById('trim-length');
    var startFieldValue = document.getElementById('start').value;
    var endFieldValue = document.getElementById('end').value;
    var trimLength = endFieldValue - startFieldValue;

    trimLengthValueField.textContent = trimLength >= 2 ? `${trimLength.toFixed(1)} sec` : trimLength.toFixed(1);

    trimLengthField.style.width = `${(trimLength * 100) / maxVideoDuration}%`;
    trimLengthField.style.marginLeft = `${(startFieldValue * 100) / maxVideoDuration}%`;
}

function getSelectedVideoFile() {
    return new Promise((resolve, reject) => {
        $.get(`/videoNombre/${userInformation}`)
            .done(function (data, status) {
                if (status === 'success' && data.video) {
                    resolve(data.video);
                } else {
                    reject(new Error('No se pudo obtener el video'));
                }
            })
            .fail(function () {
                reject(new Error('Error al obtener el video'));
            });
    });
}

function displayError(error) {

    if (typeof error === 'string') {

        $('#errors').text(error).removeClass('d-hide').addClass('d-block');

        return;

    }



    updateStatus(null);



    if (error.status === 400) {

        var response = error.responseJSON;

        if (typeof response.data === 'string') {

            $('#errors').text(response.data).removeClass('d-hide').addClass('d-block');

        } else {

            $('#errors').text(unknownError).removeClass('d-hide').addClass('d-block');

        }

    } else {

        $('#errors').text(unknownError).removeClass('d-hide').addClass('d-block');

    }

}

let imprimir_img_cargadas_servidor = async (images) => {
   
    let x = 0;
    console.log(images)
    
    let imagesContainer = document.getElementById('images-container');
    
    imagesContainer.innerHTML = "";
            
    images.forEach(image => {
        
        let imgElement = `
            <div class="imgElement" id="imgElement_${x}" onmouseover="onHover_imgLoaded(this.id, 1)" onmouseout="onHover_imgLoaded(this.id, 2)" onclick="remove_imgLoaded(this.id)" style="background-image:url('${image}')"> 
        
            </div>
        `;
                
        imagesContainer.innerHTML += imgElement;
        x++;
        
    });

}

let onHover_imgLoaded = (id, condition) => {

    let modElement = document.getElementById(id);
    
    if(condition == 1 ){
        lastImage = modElement.style.backgroundImage;
        //CL"background image= " + lastImage);
        modElement.removeAttribute('style');
        modElement.style.backgroundColor = "white";
        modElement.innerHTML += "ELIMINAR";
    }

    if(condition == 2 ){
        //CLlastImage);
        modElement.style.backgroundImage = lastImage;
        modElement.style.backgroundColor = "white";
        modElement.innerHTML = "";
    }


}

const get_server_files = async (url) => {
    let response = await fetch(url);
    return response.json();
}

let remove_imgLoaded = (id) => {
    
    let delImage = lastImage;
    delImage = delImage.replace('url("/files/images/',"");
    delImage = delImage.replace('")',"");

    fetch(`./delete/${delImage}`).then( async () => {
        
        initial_state_imageEditor_app();
        
    });
}

const createGif = (images, interval) => {
    intervalRage = interval
    console.log("gifshot")
    gifshot.createGIF({
        
        images: images,
        filter: `brightness(${brightness}%) saturate(${saturation}%) invert(${inversion}%) grayscale(${grayscale}%)`,
        interval: interval, // Convertir el valor a segundos
        numFrames: 10, // Número de fotogramas del GIF
        frameDuration: 1, // Duración de cada fotograma en segundos
        gifWidth: 400, // Ancho del GIF en píxeles
        gifHeight: 400,// Alto del GIF en píxeles
       
    
    }, function (obj) {   
        if (!obj.error) {
           previewGif.innerHTML = "";
            
            previewGif.innerHTML = `
                <img src=${obj.image} id='preview' alt="preview-gifImage">
            `;
            
            imageElement_to_server('preview');
        }

        
    });

}

const imageElement_to_server = async (imageID) =>{

    let imagenElement = document.getElementById(imageID);
    let imagenSrc = imagenElement.src;

    fetch(imagenSrc).then(res => res.blob()).then(blob => {
    
        let file = new File([blob], 'imagen.gif', { type: 'image/gif' }); // Cambiar el tipo MIME a image/gif
        let formData = new FormData();

        formData.append('file', file);
      
        // Enviar el formulario al servidor
        fetch(`/uploadBLOB/${userInformation}`, {

          method: 'POST',
          body: formData

        }).then(response => {

          if (!response.ok) {
            throw new Error('Error al enviar la imagen');
          }
          
        }).catch(error => {
          console.error('Error:', error);
        });
    });
    
}

const request = (url, data) => {
    
    fetch(url, data);

}

let initial_state_imageEditor_app = async () => {
    console.log("inital")
    let url = `./images/${userInformation}`
    let images = get_server_files(url);
    
    imprimir_img_cargadas_servidor(await images);
    
    setTimeout(async () => {

        
        createGif( await images, ( intervalRange.value / 100) * 1 )
    },1000);
}



intervalRange.addEventListener('change', async () => {
   
    try {

        initial_state_imageEditor_app();
        intervalRange.addEventListener('input', createGif);
        await saveInterval();
        
    } catch (error) {
        console.error('Error al obtener las imágenes:', error);
    } 


});

const saveInterval = async () => {
    const interval = (intervalRange.value / 100) * 1;
    const filters = {
        userInformation: userInformation,
        interval: interval
    };

    try {
        const response = await axios.post('http://localhost:3000/save-interval', filters);
        if (response.data.success) {
            console.log(response.data.message);
        }
    } catch (error) {
        console.error('Error al guardar intervalo.json:', error);
    }
}


open_video_preview.addEventListener('click', async () => {   
    document.getElementById('video-preview-page').style.display = 'flex';
    
    let response = await fetch(`/video-url/${userInformation}`).then(DATA => {
        return DATA.json()
    }).then( data => {
        document.getElementById('video-reproductor').innerHTML = `
            <video class='video-preview-20' controls muted>
                <source src="files/${userInformation}/videos/${data}" type="video/mp4">
                <source src="movie.ogg" type="video/ogg">
                Your browser does not support the video tag.
            </video>
        
        `
    });
    

   
});

close_video_preview.addEventListener('click',async  ()=> {
    document.getElementById('video-preview-page').style.display = 'none';
});

DESCARGAR_ARCHIVO.addEventListener('click', () => {
    iziToast.question({
        rtl: false,
        layout: 1,
        drag: false,
        timeout: 200000,
        close: true,
        closeOnEscape: true,
        overlay: true,
        displayMode: 1,
        id: 'question',
        progressBar: true,
        title: 'Descargar GIF',
        message: 'Selecciona el formato en que deseas descargar el GIF:',
        position: 'center',
        inputs: [
            ['<select id="formatSelect"><option value="gif">GIF</option><option value="mp4">MP4</option></select>', 'change', function (instance, toast, select, e) {
                formatoSelec = select.options[select.selectedIndex].value;
            }]
        
        ],

        buttons:[['<button>Descargar</button>', function (instance, toast) {
            saveImage(formatoSelec);
            instance.hide({
                transitionOut: 'fadeOutUp',
                onClosing: function(instance, toast, closedBy){
                    console.info('closedBy: ' + closedBy); // The return will be: 'closedBy: buttonName'
                }
            }, toast, 'buttonName');
        }]

        ],
        onClosing: function(instance, toast, closedBy){
            // console.info('Closing | closedBy: ' + closedBy);
        },
        onClosed: function(instance, toast, closedBy){
            // console.info('Closed | closedBy: ' + closedBy);
        }
    });

   // window.open(`/download/${userInformation}`, '_blank');
});

function mostrarNotificacion() {
    iziToast.success({
        title: 'Éxito',
        message: '¡Proyecto guardado exitosamente!',
        position: 'topRight'
    });
}
guardar_proyecto.addEventListener('click', () => {
    request(`/safe-proyect/${userInformation}`);

    mostrarNotificacion()
});
contButton.addEventListener('click', function () {

    // Aquí va tu código para manejar el clic del botón

    if(contButton.innerHTML == "Filtros"){
        
        document.getElementById('main-video').style.display = 'none';
        document.getElementById('info-imagenes').style.display = 'none';
        document.getElementById('info-filtros').style.display = 'flex';
        setTimeout(() =>{
            contButton.innerHTML = "Tiempo";
        }, 200);

    }

    if( contButton.innerHTML == "Tiempo" && type.includes("image")){
        
        document.getElementById('main-video').style.display = 'none';
        document.getElementById('info-imagenes').style.display = 'flex';
        document.getElementById('info-filtros').style.display = 'none';
        setTimeout(() =>{
            contButton.innerHTML = "Filtros";
            
        }, 200);
    }

    if( contButton.innerHTML == "Tiempo" && type.includes("video")){
        
        document.getElementById('main-video').style.display = 'flex';
        document.getElementById('info-imagenes').style.display = 'none';
        document.getElementById('info-filtros').style.display = 'none';
        setTimeout(() =>{
            contButton.innerHTML = "Filtros";
            
        }, 200);
    }


});

document.getElementById('start').addEventListener('change', function (event) {
    var newValue = Number(event.target.value);
    var endField = document.getElementById('end');
    var endFieldValue = endField.value;
    endField.min = newValue + 1;
    
    if (newValue > endFieldValue) {
        this.value = (Number(endFieldValue) - 1).toFixed(1);
        endField.min = endFieldValue;
    }
    if (newValue < 0) {
        this.value = 0;
        endField.min = 1;
    }
    calculateTrimLength();
});

document.getElementById('end').addEventListener('change', function (event) {
    var newValue = Number(event.target.value);
    var startField = document.getElementById('start');
    var startFieldValue = startField.value;
    startField.max = newValue - 1;
    
    if (newValue > maxVideoDuration) {
        this.value = maxVideoDuration;
        startField.max = maxVideoDuration - 1;
    }
    if (newValue < startFieldValue) {
        this.value = (Number(startFieldValue) + 1).toFixed(1);
        startField.max = startFieldValue;
    }
    calculateTrimLength();
});

document.getElementById('submit-video').addEventListener('click', function (event) {
    event.preventDefault();
    
    try {
        submitVideoEdit();
        
        previewGif.innerHTML = `<img src="/assets/images/preview.gif" style="width: 400px; height: 400px;">`;
        
        count = 3;
    } catch (error) {
        console.error(error);  // Optionally log the error for debugging
    }
});

selectorArchivo.addEventListener('change', async function (event) {
            
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    let  formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`/upload/${userInformation}`, {
            method: 'POST',
            body: formData
        });
    } catch (error) {
        console.error('Error al subir archivo:', error);
    }

    location.reload();
});

document.addEventListener('DOMContentLoaded', async function () {
    
    if ( type.includes("image") ) {

        
        document.getElementById('info-imagenes').style.display = 'flex';
        document.getElementById('previw-btn-video').style.display = 'none';

        

        try {
            
            initial_state_imageEditor_app();

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

        try {
            const response = await axios.get(`http://localhost:3000/get-interval/${userInformation}`);
            if (response.data.success) {
                const interval = response.data.interval;
                intervalRange.value = interval * 100; // Convertir a la escala del input range
            }
        } catch (error) {
            console.error('Error al obtener intervalo:', error);
        }


    }  
    

    resetFilterBtn.addEventListener("click", resetFilter);
    

});

document.getElementById('filter-apply-btn').addEventListener('click', () =>{

    updateFilter();

});

