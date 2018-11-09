let re_matrix = /^matrix\((.*), (.*), (.*), (.*), (.*), (.*)\)$/;

let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
let idM	= svg.createSVGMatrix();
idM.a=1; idM.b=0; idM.c=0; idM.d=1; idM.e=0; idM.f=0;

//______________________________________________________________________________________________________________________
export let setMatrixCoordToElement =    ( element: HTMLElement
                                        , a : number
                                        , b : number
                                        , c : number
                                        , d : number
                                        , e : number
                                        , f : number
                                        ) => {
    element.style.transform = "matrix(" + a +"," + b +"," + c +"," + d +"," + e +"," + f +")";
};

//______________________________________________________________________________________________________________________
export let setMatrixToElement = (element: HTMLElement, M: SVGMatrix) => {
    setMatrixCoordToElement(element, M.a, M.b, M.c, M.d, M.e, M.f);
};

//______________________________________________________________________________________________________________________
export let getMatrixFromString = (str: string) : SVGMatrix => {
    let res		= re_matrix.exec( str )
      , matrix	= svg.createSVGMatrix()
      ;
    matrix.a = parseFloat(res[1]) || 1;
    matrix.b = parseFloat(res[2]) || 0;
    matrix.c = parseFloat(res[3]) || 0;
    matrix.d = parseFloat(res[4]) || 1;
    matrix.e = parseFloat(res[5]) || 0;
    matrix.f = parseFloat(res[6]) || 0;

    return matrix;
};

//______________________________________________________________________________________________________________________
export let getPoint = (x: number, y: number) : SVGPoint => {
    let point = svg.createSVGPoint();
    point.x = x || 0;
    point.y = y || 0;
    return point;
};

//______________________________________________________________________________________________________________________
export let getMatrixFromElement = (element: Element) : SVGMatrix => {
	return getMatrixFromString( window.getComputedStyle(element).transform || "matrix(1,1,1,1,1,1)" );
};

//______________________________________________________________________________________________________________________
export let drag =       ( element               : HTMLElement
                        , originalMatrix        : SVGMatrix
                        , Pt_coord_element      : SVGPoint
                        , Pt_coord_parent       : SVGPoint
                        ) => {
    // e = P’.x - aP.x - cP.y
    originalMatrix.e = Pt_coord_parent.x - originalMatrix.a * Pt_coord_element.x - originalMatrix.c * Pt_coord_element.y;
    //f = P’.y - bP.x - dP.y
    originalMatrix.f = Pt_coord_parent.y - originalMatrix.b * Pt_coord_element.x - originalMatrix.d * Pt_coord_element.y;
    setMatrixToElement(element, originalMatrix);
};

//______________________________________________________________________________________________________________________
export let rotozoom =   ( element           : HTMLElement
                        , originalMatrix    : SVGMatrix
                        , Pt1_coord_element : SVGPoint
                        , Pt1_coord_parent  : SVGPoint
                        , Pt2_coord_element : SVGPoint
                        , Pt2_coord_parent  : SVGPoint
                        ) => {
    // dx = P2.x - P1.x
    let dx = Pt2_coord_element.x - Pt1_coord_element.x;
    // dy = P2.y - P1.y
    let dy = Pt2_coord_element.y - Pt1_coord_element.y;
    // dx’ = P2’.x - P1’.x
    let dxp = Pt2_coord_parent.x - Pt1_coord_parent.x;
    // dy’ = P2’.y - P1’.y
    let dyp = Pt2_coord_parent.y - Pt1_coord_parent.y;

    if(dx != dy){
        if(dx == 0){
            // s = -dx’/dy && c=dy’/dy
            originalMatrix.b = -dxp/dy;
            originalMatrix.a = dyp/dy;
        }
        if(dy == 0){
            // s = dy’/dx && c=dx’/dx
            originalMatrix.b = dyp/dx;
            originalMatrix.a = dxp/dx;
        }
        if(dx != 0 && dy != 0) {
            // s = (dy’/dy - dx’/dx) / (dy/dx + dx / dy)
            // c = (dy’ - sdx) /dy
            originalMatrix.b = (dyp/dy - dxp/dx) / (dy/dx + dx/dy);
            originalMatrix.a = (dyp - originalMatrix.b*dx/dy) / dy;
        }

        originalMatrix.c = -originalMatrix.b;
        originalMatrix.d = originalMatrix.a;

        // e = P1’.x - cP1.x + sP1.y
        // f = P1’.y - sP1.x - cP1.y
        originalMatrix.e = Pt1_coord_parent.x - originalMatrix.a*Pt1_coord_element.x + originalMatrix.b*Pt1_coord_element.y;
        originalMatrix.f = Pt1_coord_parent.y - originalMatrix.b*Pt1_coord_element.x - originalMatrix.a*Pt1_coord_element.y
    }

    setMatrixToElement(element, originalMatrix);
};

