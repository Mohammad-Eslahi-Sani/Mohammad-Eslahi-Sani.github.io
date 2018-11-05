/*
    In the name of God
    Puzzle prototype
    gandom.co
*/

// API functions
function game_load(_config,_width,_height,_result){
    //calculating cw,cy
    _config.cx = _width/1600;
    _config.cy = _height/900;

    // loading canvas
    var canvas = document.getElementById('game-container').fabric; 
    if(typeof(canvas)==="undefined"){
        canvas = initial_canvas(_config,set_place,_result);
    }
    else{
        set_place(canvas,_result);
    }
}

function game_reset(_config){
    game_load(_config,'');
}

function game_getResult(game_config){
    var GameFinalAnswer = '';
    var canvas = document.getElementById('game-container').fabric;
    var objs = canvas.getObjects();
    for(var i=0;i<game_config.positionList.length;i++){
        for(obj of objs){
            if(obj.type === 'dest' && obj.index===i){
                if(obj.component){
                    GameFinalAnswer += obj.component.index + ',' + (obj.component.angle/90)%4 + ';';
                }
                else{
                    GameFinalAnswer += 'null;';
                }
            }
        }
    }
    return GameFinalAnswer;
}

// Utility functions
function addPosition(__canvas,__config,__index,__cx,__cy){
    if(!__cx) __cx = 1;
    if(!__cy) __cy = 1;
    var rect = new fabric.Rect({
        left:       __config.left   *__cx,
        top:        __config.top    *__cy,
        height:     __config.height *__cy,
        width:      __config.width  *__cx,
        id:         'dest_'+__index,
        fill :      'transparent',
        selectable: false,
        hasControls:false,
        hasBorders: false,
        type:       'dest',
        component:  null,
        init:       !!__config.init,
        index:      __index,
        stablePos:  new fabric.Point(
                                        (__config.left+__config.width/2.0)  *__cx, 
                                        (__config.top+__config.height/2.0)  *__cy 
                                    ),
    })
    __canvas.add(rect);
    __canvas.sendToBack(rect);
    return rect;
}

function addImage(__canvas,__config,objIndex,_callback,_result){
    var image_config = __config.itemList[objIndex]
    var imgLink = image_config.imgUrl;
    var initPosition = {
        left:   image_config.left   *__config.cx,
        top:    image_config.top    *__config.cy,
        height: image_config.height *__config.cy,
        width:  image_config.width  *__config.cx,
        init:   true,
    }
    addPosition(__canvas,initPosition,-objIndex-1);
    
    fabric.Image.fromURL(imgLink,function(oImg){
        oImg.set({
            'hasControls':  false,
            'hasBorders':   false,
            'left':         image_config.left   *__config.cx,
            'top':          image_config.top    *__config.cy,
            'id':           'item_'+objIndex,
            'index':        objIndex,
            'selectable':   true,
            'type':         'item',
            'scaleX':       (image_config.width / oImg.width)   *__config.cx,
            'scaleY':       (image_config.height / oImg.height) *__config.cy,
            'container':    null,
            'stablePos':    new fabric.Point(
                (image_config.left+image_config.width/2.0)  *__config.cx, 
                (image_config.top+image_config.height/2.0)  *__config.cy 
                                            ),
        });
        // oImg.scaleToHeight(image_config.height);
        // oImg.scaleToWidth(image_config.width);
        __canvas.add(oImg);

        //if all of images added, we put them in their positions
        if(objIndex === __config.itemList.length-1){
            if(typeof(_callback) === 'function' ) _callback(__canvas,_result);
            else init_put(__canvas,_result);
        }
    });
    
}

function moveObject(__canvas,__obj,__point){
    __obj.setPositionByOrigin(__point,'center','center');
    __obj.setCoords();
    __canvas.renderAll();
}

function isNear(__canvas,item,dest){
    // item must be item and dest must be dest
    if( item.type!=='item' || dest.type!=='dest' ) return false;
    var resultX,resultY = false;
    
    var itemCenter = item.getPointByOrigin();
    resultX = (itemCenter.x > dest.left) && (itemCenter.x < dest.left + dest.width);
    resultY = (itemCenter.y > dest.top) && (itemCenter.y < dest.top + dest.height);

    return resultX && resultY;
}

function putIn(__canvas,item,dest){
    var dH = (dest.height - item.height) / 2.0;
    var dW = (dest.width - item.width) / 2.0;
    item.top = dest.top + dH;
    item.left = dest.left + dW;


    // possible bug: this line of code seems needed, but it makes bugs
    // if(!!(dest.component && (dest.component.id === item.id))) return;


    var canvasObjs = __canvas.getObjects();

    // first remove item from its previous container
    for(obj of canvasObjs){
        if(obj.type==='dest' && obj.component && obj.component.id === item.id ){
            obj.component = null;
        }
    }

    if(dest.component){
        // we put dest.component in item previous stablePos
        moveObject(__canvas,dest.component,item.stablePos);
        for(obj of canvasObjs){
            if(obj.type==='dest' && isNear(__canvas,dest.component,obj)){
                putIn(__canvas,dest.component,obj);
                break;
            }
        }
    }
    dest.component = item;
    item.stablePos = dest.stablePos;
    item.container = dest;
    moveObject(__canvas,item,dest.stablePos);
}

function rotateObject(__canvas,obj,angleOffset) {
    var resetOrigin = false;

    if (!obj) return;

    var angle = obj.angle + angleOffset;

    if ((obj.originX !== 'center' || obj.originY !== 'center') && obj.centeredRotation) {
        obj.setOriginToCenter && obj.setOriginToCenter();
        resetOrigin = true;
    }

    angle = angle > 360 ? 90 : angle < 0 ? 270 : angle;
    
    obj.rotate(angle);
    
    // change width & height
    var currentH = obj.scaleY;
    var currentW = obj.scaleX;

    if((angleOffset/90)%2 === 1 ){
        obj.set({
            scaleY: currentW,
            scaleX: currentH
        })
    }

    moveObject(__canvas,obj,obj.stablePos);
    
    if (resetOrigin) {
        obj.setCenterToOrigin && obj.setCenterToOrigin();
    }

    __canvas.renderAll();
}

function init_put(__canvas,_result){
    // when initially put is called it must move items to their initial places
    var canvasObjs = __canvas.getObjects();
    // initially put
    for(var j=0;j<canvasObjs.length;j++){
        if(canvasObjs[j].type==='item'){
            for(var i=0;i<canvasObjs.length;i++){
                if( canvasObjs[i].type==='dest' && isNear(__canvas,canvasObjs[j],canvasObjs[i])){
                    putIn(__canvas,canvasObjs[j],canvasObjs[i]);
                }
            }
        }
    }
}

function initial_canvas(__config,_callback,_result){
    var canvas = new fabric.Canvas('game-container',{
        selection: false,
    });
    var backImg = new fabric.Image.fromURL(__config.canvasBackground,function(backImg){
        backImg.set({
            'scaleX': canvas.width /  backImg.width ,
            'scaleY': canvas.height / backImg.height ,
        });
        canvas.setBackgroundImage(backImg);
        canvas.renderAll();
    });
    
    // initialize event listeners
    canvas.on('object:moved',function(e){
        var p = e.target;
        var objs = canvas.getObjects();
        var nearAny = false;
        for(obj of objs){
            if(obj.component && obj.component.id === p.id) continue;
            if(obj.type === 'dest'){
                if(isNear(canvas,p,obj)) {
                    putIn(canvas,p,obj);
                    nearAny = true;
                }
            }
        }
    
        // if moved to a place not near any dest it is returned
        if(!nearAny){
            moveObject(canvas,p,p.stablePos);
        }
    });
    
    canvas.on('mouse:down',function(e){
        try {
            var obj = e.target;
            if(obj.type === 'item'){

                if(obj.click)   obj.click += 1;
                else    obj.click = 1;

                if(obj.click === 2){
                    rotateObject(canvas,obj,90);
                    obj.click = 0;
                }
                
                setTimeout(function(){
                    obj.click = 0;
                },300)
            }    
        } catch (error) {
            
        }
    });
    
    document.getElementById('game-container').fabric = canvas;
    

    // create objects
    for(var j=0;j<__config.positionList.length;j++){
        addPosition(canvas,__config.positionList[j],j,__config.cx,__config.cy);
    }
    for(var i=0;i<__config.itemList.length;i++){
        addImage(canvas,__config,i,_callback,_result);
    }
    return canvas;
}

function set_place(__canvas,__setup){
    // move items to their places
    if(!__setup) __setup = '';

    var placesSetup = __setup.split(';');
    var itemInPlace = '';
    var canvasObjs = __canvas.getObjects();
    var inPlaceFlag = false;
    for(item of canvasObjs){
        if(item.type === 'item'){
            inPlaceFlag = false;
            for(var placeIndex=0;placeIndex<placesSetup.length;placeIndex++){
                var place = placesSetup[placeIndex];
                itemInPlace = place.split(',');
                if(itemInPlace[0]!== null && itemInPlace[0]!=='' && parseInt(itemInPlace[0])===item.index){
                    for(var i=0;i<canvasObjs.length;i++){
                        if(canvasObjs[i].type === 'dest' && canvasObjs[i].index === placeIndex){
                            putIn(__canvas,item,canvasObjs[i]);
                            break;
                        }
                    }
                    rotateObject(__canvas,item,-item.angle + parseInt(itemInPlace[1])*90);
                    inPlaceFlag = true;
                    break;
                }
            }
            if(!inPlaceFlag){
                for(var i=0;i<canvasObjs.length;i++){
                    if(canvasObjs[i].type === 'dest' && canvasObjs[i].id === 'dest_'+(-item.index-1)){
                        putIn(__canvas,item,canvasObjs[i]);
                        rotateObject(__canvas,item,-item.angle);                        
                        break;
                    }
                }
            }
        }
    }

    __canvas.renderAll();
}
