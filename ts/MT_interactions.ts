import { FSM } from "./FSM";
import * as transfo from "./transfo";

function multiTouch(element: HTMLElement) : void {
    let pointerId_1 : number, Pt1_coord_element : SVGPoint, Pt1_coord_parent : SVGPoint,
        pointerId_2 : number, Pt2_coord_element : SVGPoint, Pt2_coord_parent : SVGPoint,
        originalMatrix : SVGMatrix,
        getRelevantDataFromEvent = (evt : TouchEvent) : Touch => {
            for(let i=0; i<evt.changedTouches.length; i++) {
                let touch = evt.changedTouches.item(i);
                if(touch.identifier === pointerId_1 || touch.identifier === pointerId_2) {
                    return touch;
                }
            }
            return null;
        };
    enum MT_STATES {Inactive, Translating, Rotozooming}
    let fsm = FSM.parse<MT_STATES>( {
        initialState: MT_STATES.Inactive,
        states: [MT_STATES.Inactive, MT_STATES.Translating, MT_STATES.Rotozooming],
        transitions : [
            { from: MT_STATES.Inactive, to: MT_STATES.Translating,
                eventTargets: [element],
                eventName: ["touchstart"],
                useCapture: false,
                action: (evt : TouchEvent) : boolean => {
                    // Récupération de la touche et des informations utiles
                    let touch = evt.changedTouches.item(0);
                    originalMatrix = transfo.getMatrixFromElement(element);
                    pointerId_1 = touch.identifier;
                    // (Pour obtenir les coordonées selon l'élément et non l'HTML, on utilise la matrice inverse de l'élément)
                    let inv = originalMatrix.inverse();
                    Pt1_coord_element = transfo.getPoint(touch.clientX * inv.a + touch.clientY * inv.c + inv.e, touch.clientX * inv.b + touch.clientY * inv.d + inv.f);
                    Pt1_coord_parent = transfo.getPoint(touch.clientX, touch.clientY);
                    return true;
                }
            },
            { from: MT_STATES.Translating, to: MT_STATES.Translating,
                eventTargets: [document],
                eventName: ["touchmove"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    // On vérifie que la touche déplacée est celle prise en compte pour la translation
                    let touch = getRelevantDataFromEvent(evt);
                    if (touch != null){
                        // On met à jour la coordonée du mouvement dans le repère HTML
                        Pt1_coord_parent = transfo.getPoint(touch.clientX, touch.clientY);
                        // On déplace l'élément
                        transfo.drag(element, originalMatrix, Pt1_coord_element, Pt1_coord_parent);
                        return true;
                    }

                    return false;
                }
            },
            { from: MT_STATES.Translating,
                to: MT_STATES.Inactive,
                eventTargets: [document],
                eventName: ["touchend"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    // On vérifie que la touche relachée est celle prise en compte pour la translation
                    let touch = getRelevantDataFromEvent(evt);
                    if(touch != null){
                        // On retire la touche des touches utilisées
                        pointerId_1 = null;
                        return true;
                    }
                    return false;
                }
            },
            { from: MT_STATES.Translating, to: MT_STATES.Rotozooming,
                eventTargets: [element],
                eventName: ["touchstart"],
                useCapture: false,
                action: (evt : TouchEvent) : boolean => {
                    // Récupération de la nouvelle touche et des informations utiles
                    let touch = evt.changedTouches.item(0);
                    pointerId_2 = touch.identifier;
                    // (Pour obtenir les coordonées selon l'élément et non l'HTML, on utilise la matrice inverse de l'élément)
                    let inv = originalMatrix.inverse();
                    Pt2_coord_element = transfo.getPoint(touch.clientX * inv.a + touch.clientY * inv.c + inv.e, touch.clientX * inv.b + touch.clientY * inv.d + inv.f);
                    Pt2_coord_parent = transfo.getPoint(touch.clientX, touch.clientY);
                    return true;
                }
            },
            { from: MT_STATES.Rotozooming, to: MT_STATES.Rotozooming,
                eventTargets: [document],
                eventName: ["touchmove"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    // On vérifie que la touche déplacée est l'une de celles prises en compte pour le rotozoom
                    let touch = getRelevantDataFromEvent(evt);
                    if (touch != null){
                        // On met à jour la coordonée du mouvement de la bonne touche dans le repère HTML
                        if(touch.identifier === pointerId_1)
                            Pt1_coord_parent = transfo.getPoint(touch.clientX, touch.clientY);
                        else
                            Pt2_coord_parent = transfo.getPoint(touch.clientX, touch.clientY);

                        // On rotozoom l'élément
                        transfo.rotozoom(element, originalMatrix, Pt1_coord_element, Pt1_coord_parent, Pt2_coord_element, Pt2_coord_parent);
                        return true;
                    }

                    return false;
                }
            },
            { from: MT_STATES.Rotozooming,
                to: MT_STATES.Translating,
                eventTargets: [document],
                eventName: ["touchend"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    // On vérifie que la touche relachée est l'une de celles prises en compte pour le rotozoom
                    let touch = getRelevantDataFromEvent(evt);
                    if(touch != null){
                        // Si la touche relachée est la première à avoir été cliquée,on considère maintenant la seconde touche comme la première, pour la translation
                        if(touch.identifier === pointerId_1){
                            pointerId_1 = pointerId_2;
                            Pt1_coord_element = Pt2_coord_element;
                            Pt1_coord_parent = Pt2_coord_parent;
                        }
                        // On retire la seconde touche des touches utilisées
                        pointerId_2 = null;

                        return true
                    }

                    return false;
                }
            }
        ]
    } );
    fsm.start();
}

//______________________________________________________________________________________________________________________
//______________________________________________________________________________________________________________________
//______________________________________________________________________________________________________________________
function isString(s : any) : boolean {
    return typeof(s) === "string" || s instanceof String;
}

export let $ = (sel : string | Element | Element[]) : void => {
    let L : Element[] = [];
    if( isString(sel) ) {
        L = Array.from( document.querySelectorAll(<string>sel) );
    } else if(sel instanceof Element) {
        L.push( sel );
    } else if(sel instanceof Array) {
        L = sel;
    }
    L.forEach( multiTouch );
};
