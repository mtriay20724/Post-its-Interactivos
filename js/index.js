import { db } from "./firebase_config.js";
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
 
let BotonMas = document.getElementById("crearNota");
let modalNota = document.getElementById("modalNota");
let tablero = document.querySelector(".tablero");
let titulo = document.getElementById("titulo");
let area = document.getElementById("area");
let botonGuardar = document.getElementById("guardar");
let botonCancelar = document.getElementById("cancelar");
 
let mover = false;
let colorPost = "#fff475";
let offsetX, offsetY;
let idEditar = null; // si es null estamos creando una nota nueva
 
 
BotonMas.addEventListener("touchstart", (e)=>{
    e.preventDefault();
 
    offsetX = e.touches[0].clientX - BotonMas.offsetLeft;
    offsetY = e.touches[0].clientY - BotonMas.offsetTop;
    mover = false;
});
 
BotonMas.addEventListener("touchmove", (e)=>{
    e.preventDefault();
    let toque = e.touches[0];
 
    BotonMas.style.right = "auto";
    BotonMas.style.bottom = "auto";
    BotonMas.style.top = `${toque.clientY - offsetY}px`;
    BotonMas.style.left = `${toque.clientX - offsetX}px`;
    mover = true;
});
 
BotonMas.addEventListener("touchend", (e)=>{
    e.preventDefault();
    if(mover == false){
        abrirModal();
    }
});
 
function abrirModal(){
    idEditar = null;
    titulo.textContent = "Nueva nota";
    area.value = "";
    colorFondo("#fff475");
    modalNota.classList.remove("oculto");
}
 
 
document.getElementById("negro").addEventListener("click", function() {
    colorFondo("black");
});
document.getElementById("blanco").addEventListener("click", function() {
    colorFondo("white");
});
document.getElementById("verde").addEventListener("click", function() {
    colorFondo("#b8f2a0");
});
document.getElementById("amarillo").addEventListener("click", function() {
    colorFondo("#fff475");
});
document.getElementById("azul").addEventListener("click", function() {
    colorFondo("#9fd3f5");
});
 
function colorFondo(color){
    colorPost = color;
    area.style.backgroundColor = color;
 
    if(color == "black"){
        area.style.color = "white";
    }else{
        area.style.color = "black";
    }
}
 
 
botonGuardar.addEventListener("click", guardarNota);
 
botonCancelar.addEventListener("click", ()=>{
    modalNota.classList.add("oculto");
});
 
async function guardarNota(){
    let texto = area.value;
 
    if(texto == ""){
        alert("Escribe algo en la nota");
        return;
    }
 
    modalNota.classList.add("oculto");
 
    if(idEditar == null){
        // Crear: la nota aparece en el centro de la pantalla
        let nuevoPostIt = {
            texto: texto,
            color: colorPost,
            coordenadasX: window.innerWidth / 2 - 75,
            coordenadasY: window.innerHeight / 2 - 75,
            fechaCreacion: new Date()
        };
 
        let docRef = await addDoc(collection(db, "post-it"), nuevoPostIt);
        // guardamos tambien el id dentro del documento
        await updateDoc(docRef, { id: docRef.id });
    }else{
        // Editar: solo cambiamos texto y color
        await updateDoc(doc(db, "post-it", idEditar), {
            texto: texto,
            color: colorPost
        });
    }
}
 
 
// Cada vez que cambia algo en Firebase se borran los post-its y se vuelven a pintar
onSnapshot(collection(db, "post-it"), (datos)=>{
    document.querySelectorAll(".postit").forEach((p)=> p.remove());
 
    datos.forEach((documento)=>{
        crearPostIt(documento.id, documento.data());
    });
});
 
function crearPostIt(id, nota){
    let postit = document.createElement("div");
    postit.classList.add("postit");
    postit.textContent = nota.texto;
    postit.style.backgroundColor = nota.color;
    postit.style.left = nota.coordenadasX + "px";
    postit.style.top = nota.coordenadasY + "px";
 
    if(nota.color == "black"){
        postit.style.color = "white";
    }
 
    tablero.appendChild(postit);
    eventosPostIt(postit, id, nota);
}
 
 
function eventosPostIt(postit, id, nota){
    let inicioX, inicioY, inicioTiempo;
    let posX, posY;           // donde estaba la nota al empezar
    let offX, offY;           // distancia del dedo a la esquina de la nota
    let movido = false;
    let ultimoToque = 0;
 
    postit.addEventListener("touchstart", (e)=>{
        e.preventDefault();
        let toque = e.touches[0];
 
        inicioX = toque.clientX;
        inicioY = toque.clientY;
        inicioTiempo = Date.now();
 
        posX = postit.offsetLeft;
        posY = postit.offsetTop;
        offX = toque.clientX - posX;
        offY = toque.clientY - posY;
 
        movido = false;
        postit.classList.add("arrastrando");
    });
 
    postit.addEventListener("touchmove", (e)=>{
        e.preventDefault();
        let toque = e.touches[0];
 
        // si el dedo se mueve un poco ya cuenta como arrastrar
        if(Math.abs(toque.clientX - inicioX) > 5 || Math.abs(toque.clientY - inicioY) > 5){
            movido = true;
        }
 
        if(movido){
            postit.style.left = `${toque.clientX - offX}px`;
            postit.style.top = `${toque.clientY - offY}px`;
        }
    });
 
    postit.addEventListener("touchend", (e)=>{
        e.preventDefault();
        postit.classList.remove("arrastrando");
 
        let toque = e.changedTouches[0];
        let distanciaX = toque.clientX - inicioX;
        let distanciaY = toque.clientY - inicioY;
        let tiempo = Date.now() - inicioTiempo;
 
        // Toque sin moverse -> miramos si es doble tap
        if(movido == false){
            let ahora = Date.now();
            if(ahora - ultimoToque < 300){
                editarNota(id, nota);
                ultimoToque = 0;
            }else{
                ultimoToque = ahora;
            }
            return;
        }
 
        // Swipe: rapido, largo y horizontal
        let velocidad = Math.abs(distanciaX) / tiempo;
 
        if(Math.abs(distanciaX) > 80 && Math.abs(distanciaY) < 50 && velocidad > 0.5){
            borrarNota(postit, id, posX, posY);
        }else{
            // Arrastre normal -> guardamos la nueva posicion
            updateDoc(doc(db, "post-it", id), {
                coordenadasX: postit.offsetLeft,
                coordenadasY: postit.offsetTop
            });
        }
    });
}
 
function editarNota(id, nota){
    idEditar = id;
    titulo.textContent = "Editar nota";
    area.value = nota.texto;
    colorFondo(nota.color);
    modalNota.classList.remove("oculto");
}
 
function borrarNota(postit, id, posX, posY){
    postit.classList.add("deslizando");
 
    // esperamos un poco para que se vea la nota transparente antes del confirm
    setTimeout(async ()=>{
        if(confirm("¿Seguro que quieres borrar esta nota?")){
            await deleteDoc(doc(db, "post-it", id));
        }else{
            // vuelve a su sitio con la transicion de .volviendo
            postit.classList.remove("deslizando");
            postit.classList.add("volviendo");
            postit.style.left = posX + "px";
            postit.style.top = posY + "px";
 
            setTimeout(()=>{
                postit.classList.remove("volviendo");
            }, 300);
        }
    }, 100);
}

