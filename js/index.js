import { db, auth } from "./firebase_config.js";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
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
    // el boton tampoco puede salirse de la pantalla
    let x = limitar(toque.clientX - offsetX, 0, window.innerWidth - BotonMas.offsetWidth);
    let y = limitar(toque.clientY - offsetY, 0, window.innerHeight - BotonMas.offsetHeight);
    BotonMas.style.top = `${y}px`;
    BotonMas.style.left = `${x}px`;
    mover = true;
});
 
BotonMas.addEventListener("touchend", (e)=>{
    e.preventDefault();
    if(mover == false){
        abrirModal();
    }
});
 
// devuelve el valor dentro del rango [min, max]
function limitar(valor, min, max){
    return Math.max(min, Math.min(valor, max));
}

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
 
// id del boton de cada color, para marcar cual esta seleccionado
let botonesColor = {
    "white": "blanco",
    "black": "negro",
    "#b8f2a0": "verde",
    "#fff475": "amarillo",
    "#9fd3f5": "azul"
};

function colorFondo(color){
    colorPost = color;

    document.querySelectorAll("#colores button").forEach((b)=> b.classList.remove("seleccionado"));
    if(botonesColor[color]){
        document.getElementById(botonesColor[color]).classList.add("seleccionado");
    }

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
    let texto = area.value.trim();
 
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
            coordenadaX: window.innerWidth / 2 - 75,
            coordenadaY: window.innerHeight / 2 - 75,
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
 
 
// ===================== LOGIN =====================
let pantallaLogin = document.getElementById("pantallaLogin");
let pantallaPostits = document.getElementById("pantallaPostits");
let formLogin = document.getElementById("formLogin");
let inputEmail = document.getElementById("email");
let inputContrasena = document.getElementById("contrasena");
let mensajeError = document.getElementById("mensajeError");
let usuarioActual = document.getElementById("usuarioActual");
let dejarDeEscuchar = null; // funcion que devuelve onSnapshot para parar de escuchar

// Se ejecuta solo al cargar la pagina y cada vez que alguien entra o sale.
// Gracias a esto, si recargas la pagina sigues con la sesion iniciada.
onAuthStateChanged(auth, (usuario)=>{
    if(usuario){
        usuarioActual.textContent = usuario.email;
        pantallaLogin.classList.add("oculto");
        pantallaPostits.classList.remove("oculto");
        escucharPostIts();
    }else{
        pararDeEscuchar();
        pantallaPostits.classList.add("oculto");
        pantallaLogin.classList.remove("oculto");
    }
});

// Un solo formulario con dos botones: e.submitter dice cual se ha pulsado
formLogin.addEventListener("submit", async (e)=>{
    e.preventDefault();
    mensajeError.textContent = "";

    let email = inputEmail.value.trim();
    let contrasena = inputContrasena.value;

    try{
        if(e.submitter && e.submitter.id == "btnRegistro"){
            await createUserWithEmailAndPassword(auth, email, contrasena);
        }else{
            await signInWithEmailAndPassword(auth, email, contrasena);
        }
        formLogin.reset(); // el cambio de pantalla lo hace onAuthStateChanged
    }catch(error){
        mensajeError.textContent = traducirError(error.code);
    }
});

document.getElementById("btnGoogle").addEventListener("click", async ()=>{
    mensajeError.textContent = "";
    try{
        await signInWithPopup(auth, new GoogleAuthProvider());
    }catch(error){
        if(error.code != "auth/popup-closed-by-user"){
            mensajeError.textContent = traducirError(error.code);
        }
    }
});

document.getElementById("btnSalir").addEventListener("click", ()=>{
    signOut(auth);
});

function traducirError(codigo){
    switch(codigo){
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Correo o contraseña incorrectos.";
        case "auth/email-already-in-use":
            return "Ya existe una cuenta con ese correo. Pulsa Entrar.";
        case "auth/invalid-email":
            return "El correo no es válido.";
        case "auth/weak-password":
            return "La contraseña debe tener al menos 6 caracteres.";
        case "auth/too-many-requests":
            return "Demasiados intentos. Espera un poco y vuelve a probar.";
        case "auth/network-request-failed":
            return "No hay conexión a internet.";
        case "auth/popup-blocked":
            return "El navegador ha bloqueado la ventana de Google.";
        default:
            return "Ha ocurrido un error (" + codigo + ").";
    }
}

// ===================== LEER (tiempo real) =====================
// Solo escuchamos Firebase cuando hay un usuario con sesion iniciada
function escucharPostIts(){
    if(dejarDeEscuchar != null) return; // ya estamos escuchando

    // Cada vez que cambia algo en Firebase se borran los post-its y se vuelven a pintar
    dejarDeEscuchar = onSnapshot(collection(db, "post-it"), (datos)=>{
        document.querySelectorAll(".postit").forEach((p)=> p.remove());

        datos.forEach((documento)=>{
            crearPostIt(documento.id, documento.data());
        });
    });
}

function pararDeEscuchar(){
    if(dejarDeEscuchar != null){
        dejarDeEscuchar();
        dejarDeEscuchar = null;
    }
    document.querySelectorAll(".postit").forEach((p)=> p.remove());
    modalNota.classList.add("oculto");
}
 
function crearPostIt(id, nota){
    let postit = document.createElement("div");
    postit.classList.add("postit");
    postit.textContent = nota.texto;
    postit.style.backgroundColor = nota.color;
    postit.style.left = nota.coordenadaX + "px";
    postit.style.top = nota.coordenadaY + "px";
 
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
            // la nota no puede salirse del tablero
            let x = limitar(toque.clientX - offX, 0, tablero.clientWidth - postit.offsetWidth);
            let y = limitar(toque.clientY - offY, 0, tablero.clientHeight - postit.offsetHeight);
            postit.style.left = `${x}px`;
            postit.style.top = `${y}px`;
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
                coordenadaX: postit.offsetLeft,
                coordenadaY: postit.offsetTop
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

