const express = require ('express');
const app = express();
const multer  = require('multer');
const path = require('path');
const fs = require('fs')

const fse = require('fs-extra')
//const { createCanvas, loadImage } = require('canvas');
//const GIFEncoder = require('gifencoder');

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const { Console } = require('console');
const { resolve } = require('dns');
const { rejects } = require('assert');
const PORT = 3000;

let tipo_proyecto = "";
let UserInformation = "";

const MULTER_OBJ = {
  destination: function (req, file, cb) {
    
    let user = req.params.userID
    

    if(req.path == `/uploadBLOB/${user}`){
      cb(null, `public/files/${user}/gif`)
   
    }else{

      if(file.mimetype.startsWith("image")){
        cb(null,`public/files/${user}/images/`)
        tipo_proyecto = "IMAGE";

      } else {  
        cb(null, `public/files/${user}/videos/`)
        tipo_proyecto = "VIDEO";
      }

    }    
  },

  filename: function (req, file, cb) {
    
    let user = req.params.userID
    
    if(req.path == `/uploadBLOB/${user}`){

      cb( null,   "gif." + file.mimetype.substring( file.mimetype.indexOf("/") + 1) );

   
    }else{
      cb( null,   "image - " + Date.now() + "." + file.mimetype.substring( file.mimetype.indexOf("/") + 1) );

    }

  }
}

let safe = 0;

const storage = multer.diskStorage(MULTER_OBJ);
const upload = multer({ storage: storage });

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

/*** 
 * ESTO ES REQUERIDO PARA SUBIR LOS VIDEO E IMAGENES
 * */

  app.post('/upload/:userID', upload.single('file'), (req, res) => {
    
    res.json({ fileType: req.file.mimetype });

  });

  app.post('/uploadBLOB/:userID', upload.single('file'), (req, res) => {
   
    res.json({ fileType: req.file});

  });

/***
 * NECESARIAS PARA LOS PROCESOS DE RECUPERACION DE VIDEOS E IMAGENES
*/

  app.get('/images/:userID', (req, res) => {
    // Leer el directorio de imágenes y devolver solo los archivos de imagen
    let userInformation = req.params.userID
    fs.readdir(`./public/files/${userInformation}/images`, (err, files) => {
      
      if (err) {
        console.error('Error al leer el directorio de imágenes:', err);
        res.status(500).send('Error al leer el directorio de imágenes');
        return;
      }

      let imageFiles = files.filter(file => {
        return file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.gif');
      });

      const imageUrls = imageFiles.map( file => `/files/${userInformation}/images/${file}`);

      res.json(imageUrls);
    });
  });

  app.get('/video/:userID', (req, res) => {
    let userInformation = req.params.userID;
    const videoDir = path.join(__dirname, `public/files/${userInformation}/videos`);
    
    fs.readdir(videoDir, (err, files) => {
        
      if (err) {
            res.status(500).send('Error reading video directory');
            return;
        }

        let videoFile = files.find( file => file.endsWith('.mp4'));
        
        // console.log(videoFile);
        
        if (!videoFile) {
            res.status(404).send('No video found');
            return;
        }
        
        const videoPath = path.join(videoDir, videoFile);
       
        res.sendFile(videoPath);

    });
  });

  app.get('/video-url/:userID', (req, res) => {

    let userInformation = req.params.userID;
    
    const videoDir = path.join(__dirname, `public/files/${userInformation}/videos`);
    
    fs.readdir(videoDir, (err, files) => {
        
      if (err) {
            res.status(500).send('Error reading video directory');
            return;
        }

        let videoFile = files.find( file => file.endsWith('.mp4'));
        
        if (!videoFile) {
            res.status(404).send('No video found');
            return;
        }
        
        const videoPath = path.join(videoDir, videoFile);
        res.json(videoFile);
    });
  });

  app.get('/video_recortado/:userID', (req, res) => {
    let userInformation = req.params.userID
    const videoDir = path.join(__dirname, `public/files/${userInformation}/videos/video-cortado`);

    
    fs.readdir(videoDir, (err, files) => {
        
      if (err) {
            res.status(500).send('Error reading video directory');
            return;
        }

        let videoFile = files.find( file => file.endsWith('.mp4'));
        
        // console.log(videoFile);
        
        if (!videoFile) {
            res.status(404).send('No video found');
            return;
        }
        
        const videoPath = path.join(videoDir, videoFile);
       
        res.sendFile(videoPath);

    });

  });

  app.get('/session/:userID', async (req, res) => {
    
    UserInformation = req.params.userID;
    
    iniciarProyecto(UserInformation);
    
    res.send({
      "respuesta": "session creada: " + UserInformation
    })

  })

  app.get('/videoNombre/:userID', (req, res) => {
    
    let userInformation = req.params.userID
    const videoDir = path.join(__dirname, `./public/files/${userInformation}/videos`);

    fs.readdir(videoDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading video directory');
            return;
        }

        const videoFile = files.find(file => file.endsWith('.mp4'));
        if (!videoFile) {
            res.status(404).send('No video found');
            return;
        }

        res.json({ video: videoFile });
    });
  });

  app.get('/download/:userID', (req, res) => {
    let userInformation = req.params.userID
    let filePath = path.join(__dirname, `./public/files/${userInformation}/gif/gif.gif`);

    res.download(filePath, (err) => {
        if (err) {
            console.error('Error al descargar el archivo:', err);
            res.status(500).send('Error al descargar el archivo');
        }
    });
  });

  app.get('/download', (req, res) => {
    const { format, userInformation } = req.query;
    const inputGifPath = path.join(__dirname, 'public', 'files', userInformation, 'gif', 'gif.gif');
    const outputFilePath = path.join(__dirname, 'public', 'files', userInformation, 'gif', `output.${format}`);

    if (fs.existsSync(outputFilePath)) {
        fs.unlinkSync(outputFilePath); // Elimina el archivo si ya existe
    }

    const formatSpecificOptions = (format) => {
        switch (format) {
            case 'png':
                return ['-vf', 'scale=320:240'];
            case 'jpg':
                return ['-vf', 'scale=320:240', '-q:v', '2'];
            case 'mp4':
                return ['-c:v', 'libx264', '-pix_fmt', 'yuv420p'];
            default:
                return [];
        }
    };

    ffmpeg(inputGifPath)
        .outputOptions(formatSpecificOptions(format))
        .save(outputFilePath)
        .on('end', () => {
            res.download(outputFilePath, `download.${format}`, (err) => {
                if (err) {
                    console.error('Error al descargar el archivo:', err);
                    res.status(500).send('Error al descargar el archivo.');
                }
                fs.unlinkSync(outputFilePath); // Elimina el archivo después de descargarlo
            });
        })
        .on('error', (err) => {
            console.error('Error al convertir el archivo:', err);
            res.status(500).send('Error al convertir el archivo.');
        });
});


  app.get('/delete/:delImage', (req, res) => {

    const delImage = req.params.delImage;
    
  
    
  
    let msg = deleteFile('./public/files/images/', delImage);

    res.send(`borrando: 'public/files/images/' msg: ${msg}`);
    
  });

  app.get('/safe-proyect/:userID', async (req, res) => { 
    let userInformation = req.params.userID

    try {
      copy_files(`./public/files/${userInformation}`,"./public/proyects/" + Date.now() + "-" + tipo_proyecto );
      
      res.send({
        msg : "Archivos copiados con exito"
      });
    }catch(e) {
      res.send({
        msg : "no se pudo copiar correctamente",
        error : e
      });
    }
  });

  app.get('/proyects', async (req, res) => { 
    
    try {
      
      //console.log("operando normal");
      getFileList("public/proyects").then((data) => {
        res.send({
          "file" : data
        });
        // console.log(data);
      });

    }catch(e) {
      res.send({
        msg : "no se pudo copiar correctamente",
        error : e
      });
    }


  });

  app.get('/abrir_proyecto/:idProyecto/:userID', async (req, res) => {
    let userInformation = req.params.userID
    copy_files(`public/proyects/${req.params.idProyecto}`, `public/files/${userInformation}`);

    if( req.params.idProyecto.includes("VIDEO")){
      tipo_proyecto = "VIDEO";
    }

    if( req.params.idProyecto.includes("IMAGE")){
      tipo_proyecto = "IMAGE";
    }

    deleteFolderRecursively(`./public/files/${userInformation}/images/`);
    deleteFolderRecursively(`./public/files/${userInformation}/videos/`);
    deleteFolderRecursively(`./public/files/${userInformation}/gif/`); 
    
    res.send({
      "respuesta": req.params.idProyecto
    })

  })

/***
 * NECESARIAS PARA LOS PROCESOS DE RECUPERACION DE VIDEOS E IMAGENES
*/

  app.get('/nuevovid', (req, res) => {
    const videoDir = path.join(__dirname, 'public/user-media/video-cortado');
    fs.readdir(videoDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading video directory');
            return;
        }
        const videoFile = files.find(file => file.endsWith('.mp4'));
        if (!videoFile) {
            res.status(404).send('No video found');
            return;
        }
        const videoPath = path.join(videoDir, videoFile);
        res.sendFile(videoPath);
    });
  });

  app.get('/video-duration/:userID', (req, res) => {
    let userInformation = req.params.userID
    let videoDir = path.join(__dirname, `./public/files/${userInformation}/videos`);
    
    fs.readdir(videoDir, (err, files) => {
      if (err) {
        return res.status(500).send('Error al leer la carpeta de videos');
      }
      const videos = files.filter(file => file.endsWith('.mp4') || file.endsWith('.avi') || file.endsWith('.mov') || file.endsWith('.mkv'));
      if (videos.length === 0) {
        return res.status(404).send('No se encontraron videos');
      }
      const latestVideo = videos.sort((a, b) => fs.statSync(path.join(videoDir, b)).mtime - fs.statSync(path.join(videoDir, a)).mtime)[0];
      const inputVideo = path.join(videoDir, latestVideo);

      console.log(`Procesando video: ${inputVideo}`);

      ffmpeg.ffprobe(inputVideo, (err, metadata) => {
        if (err) {
          console.error(`Error ejecutando ffprobe: ${err.message}`);
          return res.status(500).send('Error al obtener la duración del video');
        }

        const duration = metadata.format.duration;
        
        if (duration) {
          res.json({ 
          
            duration: Math.round(duration) 
          
          }); 
        } else {
          console.error('No se pudo extraer la duración del video');
          res.status(500).send('No se pudo obtener la duración del video');
        }

      });
    });
  });

  app.get('/get-latest-video', (req, res) => {
    const videoDir = path.join(__dirname, 'public/files/videos');
    fs.readdir(videoDir, (err, files) => {
        if (err) {
            return res.status(500).send('Error al leer la carpeta de videos');
        }
        const videos = files.filter(file => file.endsWith('.mp4') || file.endsWith('.avi') || file.endsWith('.mov') || file.endsWith('.mkv'));
        if (videos.length === 0) {
            return res.status(404).send('No se encontraron videos');
        }
        const latestVideo = videos.sort((a, b) => fs.statSync(path.join(videoDir, b)).mtime - fs.statSync(path.join(videoDir, a)).mtime)[0];
        res.json({ video: latestVideo });
    });
  });

  app.post('/submit/:userID', (req, res) => {
    let userInformation = req.params.userID
    const { start, end, video } = req.body;
    const videoDir = path.join(__dirname, `./public/files/${userInformation}/videos`, video);
    const outputFolderPath = path.join(__dirname, `./public/files/${userInformation}/videos/video-cortado`);
    const outputFilePath = path.join(outputFolderPath, 'video_cortado.mp4');
    
    if (!fs.existsSync(outputFolderPath)) {
      fs.mkdirSync(outputFolderPath, { recursive: true });
  }
    ffmpeg(videoDir)
        .setStartTime(start)
        .setDuration(end - start)
        .output(outputFilePath)
        .on('end', function() {
            console.log('Recorte completado');
            res.json({ status: 'success', video: 'video_cortado.mp4' });
        })
        .on('error', function(err) {
            console.error('Error al recortar el video:', err);
            res.status(500).json({ status: 'error', message: 'Error al recortar el video' });
        })
        .run();
  });

  const deleteFolderRecursively = function (directory_path) {

    if ( fs.existsSync(directory_path) ) {
      
        fs.readdirSync(directory_path).forEach( function (file, index) {
            
            var currentPath = path.join(directory_path, file);
            
            if (fs.lstatSync(currentPath).isDirectory()) {
                deleteFolderRecursively(currentPath);
            } else {
                
                fs.unlinkSync(currentPath); // delete file
            }
        });

        fs.rmdirSync(directory_path); // delete folder/directories
    }else {
      console.log('path no encontrado' + directory_path);

    }
  };

  const  deleteFile = ( directoryPath, filename ) => {
    
    let filePath = path.join(directoryPath, filename);

    if ( fs.existsSync(filePath) ) {
      try {
        fs.unlinkSync(filePath);
    
      } catch (err) {
        console.error("Error deleting file: ", filePath, err);
        
      }

      return "borrado exitosamente";
    
    }else {
      return "error al borrar";
    }

  }

  const copy_files = async ( source, destination) => {
    
      if (!source || !destination) {
          return res.status(400).send('Se requiere la ruta de origen y destino.');
      }

      try {
          // Asegúrate de que las rutas sean absolutas
          const sourcePath = path.resolve(source);
          const destinationPath = path.resolve(destination);

          // Verifica si la carpeta de origen existe
          if (!await fse.pathExists(sourcePath)) {
              return 'La carpeta de origen no existe.';
          }

          // Copia la carpeta de origen al destino
          await fse.copy(sourcePath, destinationPath);
          return 'Carpeta copiada exitosamente.';
      } catch (error) {
          console.error(error);
          return 'Ocurrió un error al copiar la carpeta.';
      }


  }

  const getFileList = (url) => {
    
    return new Promise((resolve, reject) => {
      
      fs.readdir(url, (err, files) => {
        let data = [];

        if (err) {
            return reject('Unable to scan directory: ' + err);
        }

        pending = files.length;

        if (pending === 0) {
          resolve(data); // If there are no files, resolve immediately
        }

        files.forEach((file) => {
            
          const filePath = path.join(url, file);

          fs.stat(filePath, (err, stats) => {
            
            if (err) {
                console.log(`Unable to get stats of file ${file}: ` + err);
                if (!--pending) {
                  resolve(data);
                }
            } else {
                
              if (stats.isFile() || stats.isDirectory()) {
                data.push(file);
              }

              if (!--pending) {
                resolve(data);
              }
              
            }
          });

        });

      });

    });
  }

  const iniciarProyecto = (userInformation) => {
    
    deleteFolderRecursively(`./public/files/${userInformation}/images/`);
    deleteFolderRecursively(`./public/files/${userInformation}/videos/`);
    deleteFolderRecursively(`./public/files/${userInformation}/gif/`); 
    deleteFolderRecursively(`./public/files/${userInformation}/metadatos/`); 


    fs.mkdirSync(`./public/files/${userInformation}/images`,{recursive:true});
    fs.mkdirSync(`./public/files/${userInformation}/videos`,{recursive:true});
    fs.mkdirSync(`./public/files/${userInformation}/gif`,{recursive:true});
    fs.mkdirSync(`./public/files/${userInformation}/metadatos`,{recursive:true});

  }

  app.post('/save-filters/:userInformation', (req, res) => {
    const userInformation = req.params.userInformation;
    const filterData = req.body;

    const dirPath = path.join(__dirname, 'public', 'files', userInformation, 'metadatos');
    const filePath = path.join(dirPath, 'filtros.json');

    // Crear el directorio si no existe
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    // Guardar los datos de los filtros en un archivo JSON
    fs.writeFile(filePath, JSON.stringify(filterData, null, 2), (err) => {
        if (err) {
            console.error('Error writing file:', err);
            res.status(500).json({ status: 'error', message: 'Error saving filter data' });
        } else {
            res.status(200).json({ status: 'success', message: 'Filter data saved successfully' });
        }
    });
});



app.get('/load-filters/:userInformation', (req, res) => {
  const userInformation = req.params.userInformation;
  const filePath = path.join(__dirname, 'public', 'files', userInformation, 'metadatos', 'filtros.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading file:', err);
          res.status(500).json({ status: 'error', message: 'Error loading intervalo data' });
      } else {
          res.status(200).json(JSON.parse(data));
      }
  });
});


app.post('/save-interval', (req, res) => {
  const { userInformation, interval } = req.body;
  const dirPath = path.join(__dirname, 'public', 'files', userInformation, 'metadatos');
  const filePath = path.join(dirPath, 'intervalo.json');

  if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
  }

  const intervalData = {
      interval: interval,
      updatedAt: new Date()
  };

  fs.writeFile(filePath, JSON.stringify(intervalData, null, 2), (err) => {
      if (err) {
          return res.status(500).json({ success: false, message: 'Error al guardar intervalo.json' });
      }
      res.json({ success: true, message: 'intervalo.json guardado correctamente' });
  });
});


app.get('/get-interval/:userInformation', (req, res) => {
  const { userInformation } = req.params;
  const filePath = path.join(__dirname, 'public', 'files', userInformation, 'metadatos', 'intervalo.json');

  if (fs.existsSync(filePath)) {
      fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
              return res.status(500).json({ success: false, message: 'Error al leer intervalo.json' });
          }
          res.json({ success: true, interval: JSON.parse(data).interval });
      });
  } else {
      res.json({ success: false, message: 'intervalo.json no encontrado' });
  }
});


app.post('/apply-filters', async (req, res) => {
  const {
    brightness,
    saturation,
    inversion,
    grayscale,
    rotate,
    flipHorizontal,
    flipVertical,
    userInformation
} = req.body;

const inputGifPath = path.join(__dirname, 'public', 'files', userInformation, 'gif', 'gif.gif');
const outputGifPath = path.join(__dirname, 'public', 'files', userInformation, 'gif', 'gif.gif');

// Construir la cadena de filtros
let filterComplex = `eq=brightness=${brightness / 100 - 1}:saturation=${saturation / 100}`;

if (parseFloat(inversion) !== 0) {
  filterComplex += `,hue=s=${parseFloat(inversion)/100}`;
}

// Aplicar grayscale si es diferente de cero
if (parseFloat(grayscale) !== 0) {
  filterComplex += `,colorchannelmixer=0.3:0.59:0.11:0:0.3:0.59:0.11:0:0.3:0.59:0.11:0`;
}
if (rotate !== 0) {
  filterComplex += `,rotate=${rotate}*PI/180`;
}

if (flipHorizontal === -1) {
  filterComplex += ',hflip'; // Aplica espejo horizontal
}

if (flipVertical === -1) {
  filterComplex += ',vflip'; // Aplica espejo vertical
}

ffmpeg(inputGifPath)
    .outputOptions('-vf', filterComplex)
    .on('end', () => {
        console.log('Filtros aplicados y GIF sobrescrito correctamente');
        res.json({ success: true, message: 'Filtros aplicados y GIF sobrescrito correctamente' });
    })
    .on('error', (err) => {
        console.error('Error al aplicar filtros:', err);
        res.status(500).json({ success: false, message: 'Error al aplicar filtros', error: err });
    })
    .save(outputGifPath);
});

app.get('/get-gif/:userInformation', (req, res) => {
  const { userInformation } = req.params;
  const gifPath = path.join(__dirname, 'public', 'files', userInformation, 'gif', 'gif.gif');

  if (fs.existsSync(gifPath)) {
      res.sendFile(gifPath);
  } else {
      res.status(404).send('GIF no encontrado');
  }
});
  // INICIO DEL SERVIDOR
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
  });


  


