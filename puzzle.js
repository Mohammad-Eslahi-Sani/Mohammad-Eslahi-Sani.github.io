// *** Global Vars *** //

var canvas = new fabric.Canvas('game-container',{
    selection: false,
});
var backImg = new fabric.Image.fromURL(canvasBackground,function(backImg){
    backImg.set({
        'scaleX': canvas.width /  backImg.width ,
        'scaleY': canvas.height / backImg.height ,
    });
    canvas.setBackgroundImage(backImg);
    canvas.renderAll();
});

//*** Functions *** //
function addPosition(__config){
    var rect = new fabric.Rect({
        left:       __config.left,
        top:        __config.top,
        height:     __config.height,
        width:      __config.width,
        id:         __config.name,
        fill :      'transparent',
        selectable: false,
        hasControls:false,
        type:       'dest',
        component:  null,
        stablePos:  new fabric.Point(
                                        __config.left+__config.width/2.0, 
                                        __config.top+__config.height/2.0 
                                    ),
    })
    canvas.add(rect);
    canvas.sendToBack(rect);
}

function addImage(objIndex){
    var __config = itemList[objIndex]
    var imgLink = __config.imgUrl;
    fabric.Image.fromURL(imgLink,function(oImg){
        oImg.set({
            'hasControls':  false,
            'left':         __config.left,
            'top':          __config.top,
            // 'height':       __config.height,
            // 'width':        __config.width,
            'id':           __config.name,
            'selectable':   true,
            'type':         'item',
            'scaleX': __config.width / oImg.width,
            'scaleY': __config.height / oImg.height,
            'stablePos':    new fabric.Point(
                                                __config.left+__config.width/2.0, 
                                                __config.top+__config.height/2.0 
                                            ),
        });
        // oImg.scaleToHeight(__config.height);
        // oImg.scaleToWidth(__config.width);
        canvas.add(oImg);
    });
    var initPosition = {
        left:   __config.left,
        top:    __config.top,
        height: __config.height,
        width:  __config.width,
        name:   'init_place_'+objIndex,
    }
    addPosition(initPosition);
}

function moveObject(__obj,__point){
    __obj.setPositionByOrigin(__point,'center','center');
    __obj.setCoords();
    canvas.renderAll();
}

function isNear(item,dest){
    // item must be item and dest must be dest
    if( item.type!=='item' || dest.type!=='dest' ) return false;
    var resultX,resultY = false;
    
    var itemCenter = item.getPointByOrigin();
    
    resultX = (itemCenter.x > dest.left) && (itemCenter.x < dest.left + dest.width);
    resultY = (itemCenter.y > dest.top) && (itemCenter.y < dest.top + dest.height);

    return resultX && resultY;
}

function putIn(item,dest){
    var dH = (dest.height - item.height) / 2.0;
    var dW = (dest.width - item.width) / 2.0;
    item.top = dest.top + dH;
    item.left = dest.left + dW;

    if(dest.component && dest.component.id === item.id) return;
    var canvasObjs = canvas.getObjects();

    // first remove item from its previous container
    for(obj of canvasObjs){
        if(obj.type==='dest' && obj.component && obj.component.id === item.id ){
            obj.component = null;
        }
    }

    if(dest.component){
        // we put dest.component in item previous stablePos
        moveObject(dest.component,item.stablePos);
        for(obj of canvasObjs){
            if(obj.type==='dest' && isNear(dest.component,obj)){
                putIn(dest.component,obj);
                break;
            }
        }
    }
    dest.component = item;
    item.stablePos = dest.stablePos;
    moveObject(item,dest.stablePos);
}

function rotateObject(obj,angleOffset) {
    var resetOrigin = false;

    if (!obj) return;

    var angle = obj.angle + angleOffset;

    if ((obj.originX !== 'center' || obj.originY !== 'center') && obj.centeredRotation) {
        obj.setOriginToCenter && obj.setOriginToCenter();
        resetOrigin = true;
    }

    angle = angle > 360 ? 90 : angle < 0 ? 270 : angle;
    
    obj.rotate(angle)
    moveObject(obj,obj.stablePos);
    
    if (resetOrigin) {
        obj.setCenterToOrigin && obj.setCenterToOrigin();
    }

    canvas.renderAll();
}

//*** main procedure *** //
for(var i=0;i<itemList.length;i++){
    addImage(i);
}
for(var j=0;j<positionList.length;j++){
    addPosition(positionList[j]);
}

window.onload = function(){
    var canvasObjs = canvas.getObjects();
    
    // initially put 
    for(var j=0;j<canvasObjs.length;j++){
        if(canvasObjs[j].type==='item'){
            for(i=0;i<canvasObjs.length;i++){
                if( canvasObjs[i].type==='dest' && isNear(canvasObjs[j],canvasObjs[i])){
                    putIn(canvasObjs[j],canvasObjs[i]);
                }
            }
        }
    }
}
canvas.on('object:moved',function(e){
    var p = e.target;
    var objs = canvas.getObjects();
    var nearAny = false;
    for(obj of objs){
        if(obj.component && obj.component.id === p.id) continue;
        if(obj.type === 'dest'){
            if(isNear(p,obj)) {
                putIn(p,obj);
                nearAny = true;
            }
        }
    }

    // if moved to a place not near any dest it is returned
    if(!nearAny){
        moveObject(p,p.stablePos);
    }
});

canvas.on('mouse:dblclick',function(e){
    var obj = e.target;
    if(obj.type === 'item'){
        rotateObject(obj,90);
    }
})


