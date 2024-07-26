const proyectos_container = document.getElementById('proyectos_index');
const file_selector = document.getElementById('selector_archivo');
var lastImage = "";
let userInformation = "";

/**
 * Obtiene los archivos del servidor especificado.
 * @param {string} url - La URL del servidor desde donde se obtendrán los archivos.
 * @returns {Promise<Array>} - Retorna una promesa que resuelve en un array de archivos obtenidos del servidor.
 * @references Esta función es referenciada en la función cargar_proyectos para obtener la lista de proyectos desde el servidor.
 */
const get_server_files = async (url) => {
    let response = await fetch(url);
    return response.json();
}

/**
 * Carga la lista de proyectos desde el servidor y los muestra en el contenedor de proyectos.
 * @returns {void}
 * @references Esta función es invocada en el contexto de la interfaz de usuario para cargar dinámicamente los proyectos disponibles.
 */
const cargar_proyectos = async () => {
    
    let proyect_list = "";
    proyect_list = await get_server_files('/proyects');
    
    let array = []
    array = proyect_list.file;
    
    
    let x = 0;
    
    proyectos_container.innerHTML = "";

    array.sort();

    array.forEach(element => {
        
        proyectos_container.innerHTML += `
            <div id='gifGen_${x}' class="GIFGenerated" style=background-image:url("./proyects/${element}/gif/gif.gif" onmouseover="onHover_index(this.id, 1)" onmouseout="onHover_index(this.id, 2)" onclick="cargar_proyecto(this.id)")>
            </div>
        `;

        x++;
    });

    for ( let index = 0; index <  8 - array.length; index++) {
        
        proyectos_container.innerHTML += `
            <div id='gifGen' class="GIFGenerated" style='background-image:url("./assets/images/preview.gif")' ></div>
        `;  
    }

} 


/**
 * Maneja el evento hover sobre un elemento.
 * @param {string} id - El ID del elemento sobre el cual se está aplicando el evento hover.
 * @param {number} condition - La condición del evento hover (1 para mouseover, 2 para mouseout).
 * @returns {void}
 * @references Esta función es invocada en los atributos onmouseover y onmouseout de los elementos de proyecto para cambiar la apariencia y comportamiento del elemento en respuesta al hover.
 */
const onHover_index = (id, condition) => {
    let modElement = document.getElementById(id);
    
    if(condition == 1 ){
        lastImage = modElement.style.backgroundImage;
        //CL"background image= " + lastImage);
        modElement.removeAttribute('style');
        modElement.style.backgroundColor = "white";
        modElement.innerHTML += "ABRIR";
    }

    if(condition == 2 ){
        //CLlastImage);
        modElement.style.backgroundImage = lastImage;
        modElement.style.backgroundColor = "white";
        modElement.innerHTML = "";
    }
}


/**
 * Realiza una solicitud fetch a la URL especificada con los datos proporcionados.
 * @param {string} url - La URL a la cual se realizará la solicitud fetch.
 * @param {Object} data - Objeto que contiene las opciones para la solicitud fetch (método, headers, body, etc.).
 * @returns {void}
 * @references Esta función puede ser utilizada para realizar solicitudes HTTP genéricas al servidor.
 */
const request = (url, data) => {
    
    fetch(url, data);

}



/**
 * Carga un proyecto específico basado en su ID.
 * @param {string} id - El ID del proyecto a cargar.
 * @returns {void}
 * @references Esta función es invocada al hacer clic en un proyecto para abrirlo en el editor correspondiente.
 */
const cargar_proyecto = (id) => {
    let filter = "";
    
    filter = lastImage.replace('url("./proyects/',"");
    filter = filter.replace('/gif/gif.gif")',"");
    
    request(`abrir_proyecto/${filter}/${userInformation}`);

    if(filter.includes('IMAGE')) {
        window.location.href = `editor.html?type=image`;
    }

    if(filter.includes("VIDEO")) {
        window.location.href = `editor.html?type=video`;
    }
    
}

/**
 * Crea una nueva sesión de usuario y la almacena en el localStorage.
 * @returns {void}
 * @references Esta función es invocada durante la carga inicial de la página para asegurar que haya una sesión de usuario activa.
 */
const create_session = () => {
    let user = "USER-" + Math.round( Math.random() * 10000);
    localStorage.setItem("user", user);
    request("/session/" + localStorage.getItem('user') );
}



/**
 * Muestra una notificación de error utilizando iziToast.
 * @returns {void}
 * @references Esta función es invocada cuando ocurre un error al subir un archivo no admitido.
 */
function mostrarNotificacionError() {
    iziToast.error({
        title: 'Archivo No Admitido',
        message: '¡Intntente Denuevo! Solo Imagenes y Videos',
        position: 'topCenter'
    });
}


/**
 * Maneja el evento de cambio en el selector de archivos, sube el archivo seleccionado al servidor y redirige al editor correspondiente.
 * @param {Event} event - El evento de cambio del selector de archivos.
 * @returns {void}
 * @references Esta función es invocada cuando el usuario selecciona un archivo para subirlo al servidor.
 */
file_selector.addEventListener('change', async (event) => {
        
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {

        const response = await fetch(`/upload/${userInformation}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.fileType.includes("video") || data.fileType.includes("image")) {
            window.location.href = `editor.html?type=${data.fileType}`;
        }else{
           mostrarNotificacionError();
        }

    } catch (error) {
        console.error('Error al subir archivo:', error);
    }

    
});



/**
 * Maneja la carga inicial del documento, asegurando que haya una sesión de usuario activa y cargando los proyectos disponibles.
 * @returns {void}
 * @references Esta función es invocada cuando el documento ha terminado de cargarse.
 */
document.addEventListener('DOMContentLoaded', async () => {
    
    if( !localStorage.getItem('user') ){
        create_session();
    }else {
        userInformation = localStorage.getItem('user');
        request("/session/" +  userInformation);
    }

    cargar_proyectos();

    
});


