// Global Vars
var accetableDiff = 20;

var objList = [
    {
        name: 'init-place-1',
        top:  0,
        left: 0,
        height: 100,
        width:100,
        imgUrl: './resources/white-square.png',
        type: 'dest',
        selectable: false,
        componentList: [],
        capacity: 1,
    },
    {
        name: 'init-place-2',
        top:  0,
        left: 100,
        height: 100,
        width:100,
        imgUrl: './resources/white-square.png',
        type: 'dest',
        selectable: false,
        componentList: [],
        capacity: 1,
    },{
        name: 'init-place-3',
        top:  0,
        left: 200,
        height: 100,
        width:100,
        imgUrl: './resources/white-square.png',
        type: 'dest',
        selectable: false,
        componentList: [],
        capacity: 1,
    },{
        name: 'init-place-4',
        top:  0,
        left: 300,
        height: 100,
        width:100,
        imgUrl: './resources/white-square.png',
        type: 'dest',
        selectable: false,
        componentList: [],
        capacity: 1,
    },
    {
        name: 'up-place',
        top:  200,
        left: 300,
        height: 100,
        width:100,
        imgUrl: './resources/white-square.png',
        type: 'dest',
        selectable: false,
        componentList: [],
        capacity: 1,
    },
    {
        name: 'left-place',
        top:  300,
        left: 200,
        height: 100,
        width:100,
        imgUrl: './resources/white-square.png',
        type: 'dest',
        selectable: false,
        componentList: [],
        capacity: 1,
    },
    {
        name: 'down-place',
        top:  300,
        left: 300,
        height: 100,
        width:100,
        imgUrl: './resources/white-square.png',
        type: 'dest',
        selectable: false,
        componentList: [],
        capacity: 1,
    },
    {
        name: 'right-place',
        top:  300,
        left: 400,
        height: 100,
        width:100,
        imgUrl: './resources/white-square.png',
        type: 'dest',
        selectable: false,
        componentList: [],
        capacity: 1,
    },
    {
        name: 'right-arrow',
        top:  25,
        left: 25,
        height: 50,
        width:50,
        imgUrl: './arrows/1.png',
        type: 'item',
        selectable: true,
    },
    {
        name: 'up-arrow',
        top:  25,
        left: 125,
        height: 50,
        width: 50,
        imgUrl: './arrows/2.png',
        type: 'item',
        selectable: true,
    },
    {
        name: 'left-arrow',
        top:  25,
        left: 225,
        height: 50,
        width: 50,
        imgUrl: './arrows/3.png',
        type: 'item',
        selectable: true,
    },
    {
        name: 'down-arrow',
        top:  25,
        left: 325,
        height: 50,
        width: 50,
        imgUrl: './arrows/4.png',
        type: 'item',
        selectable: true,
    }
]

var canvas = new fabric.Canvas('game-container',{
    backgroundColor: 'rgb(225,225,250)',
    selectionColor: 'blue',
    selectionLineWidth: 0,
    selection: false
});


function addImage(objIndex){
    var imgLink = objList[objIndex].imgUrl;
    fabric.Image.fromURL(imgLink,function(oImg){
        oImg.set({
            'hasControls':  false,
            'left':         objList[objIndex].left,
            'top':          objList[objIndex].top,
            'height':       objList[objIndex].height,
            'width':        objList[objIndex].width,
            'selectable':   objList[objIndex].selectable,
            'id':           objList[objIndex].name,
            'type':         objList[objIndex].type,
            'componentList':[],
            'capacity':     objList[objIndex].capacity,
            'stablePos':    new fabric.Point(objList[objIndex].left+objList[objIndex].width/2.0, objList[objIndex].top+objList[objIndex].height/2.0 ),
        });
        canvas.add(oImg);
    });
}

function isNear(obj1,obj2){
    var resultX,resultY = false;
    obj1.centerY = (obj1.top + obj1.height ) / 2.0;
    obj1.centerX = (obj1.left + obj1.width) / 2.0; 
    obj2.centerY = (obj2.top + obj2.height ) / 2.0;
    obj2.centerX = (obj2.left + obj2.width) / 2.0; 

    if(obj1.centerX - obj2.centerX > -accetableDiff && obj1.centerX - obj2.centerX < accetableDiff ) resultX = true;
    if(obj1.centerY - obj2.centerY > -accetableDiff && obj1.centerY - obj2.centerY < accetableDiff ) resultY = true;
    
    return resultX && resultY;
}

function putIn(item,dest){
    var dH = (dest.height - item.height) / 2.0;
    var dW = (dest.width - item.width) / 2.0;
    item.top = dest.top + dH;
    item.left = dest.left + dW;

    for(obj of dest.componentList){
        if(obj.id === item.id) return;
    }
    var canvasObjs = canvas.getObjects();

    // first remove item from its previous list
    for(obj of canvasObjs){
        if(obj.type==='dest'){
            for(var i=0;i<obj.componentList.length;i++){
                if(item.id === obj.componentList[i].id){
                    obj.componentList.splice(i,1);
                }
            }
        }
    }

    if( dest.componentList.length + 1 > dest.capacity){
        // we put dest.componentList[0] in item previous stablePos
        dest.componentList[0].setPositionByOrigin(item.stablePos,'center','center');
        dest.componentList[0].setCoords();
        for(obj of canvasObjs){
            if(obj.type==='dest' && isNear(dest.componentList[0],obj)){
                putIn(dest.componentList[0],obj);
                break;
            }
        }
    }
    dest.componentList.push(item);
    item.stablePos = dest.stablePos;

}

for(var i=0;i<objList.length;i++){
    addImage(i);
}
window.onload = function(){
    var canvasObjs = canvas.getObjects();
    
    for(var j=0;j<canvasObjs.length;j++){
        if(canvasObjs[j].type==='item'){
            for(i=0;i<canvasObjs.length;i++){
                if( canvasObjs[i].type==='dest' && isNear(canvasObjs[i],canvasObjs[j])){
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
        if(obj.type === 'dest'){
            if(isNear(p,obj)) {
                putIn(p,obj);
                nearAny = true;
            }
        }
    }

    // if moved to a place not near any dest it is returned
    if(!nearAny){
        p.setPositionByOrigin(p.stablePos,'center','center');
        p.setCoords();
        
    }

});


