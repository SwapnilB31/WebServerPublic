function createLoader() {
    var pre = document.createElement("DIV");
    pre.setAttribute("class","preloader");
    var load = document.createElement("DIV");
    load.setAttribute("class","loader");
    pre.appendChild(load);
    document.querySelector('body').appendChild(pre);
}
function destroyLoader() {
    body = document.querySelector('body');
    pre = document.querySelector('.preloader');
    body.removeChild(pre);
}
