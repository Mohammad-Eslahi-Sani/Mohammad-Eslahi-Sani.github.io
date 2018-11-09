/*
    In the name of God
    Image Map Generator
    gandom.co
*/
var GENERATOR_VARIABLES = {
    width:          1600,
    height:         900,
    cx:             1,
    cy:             1,
    canvas:         null,
    initItemSize:   200,
    itemList:       [],
    itemIdCounter:  0,
    backgroundUrl:  '',
}
// API functions
function generator_load(_width,_height,_data){
    // loading canvas, inputs and variables with default values
    $("#restriction-number").val(5);
    $("#restriction-error-message").val("خطای محدودیت");
    $("#item-container").empty();
    
    var canvas = GENERATOR_VARIABLES.canvas;
    if(canvas === null){
        canvas = new fabric.Canvas('game-container',{
            selection:          false,
        });
    }
    canvas.clear();
    GENERATOR_VARIABLES = {
        width:          _width,
        height:         _height,
        cx:             _width/1600,
        cy:             _height/900,
        itemList:       [],
        itemIdCounter:  0,
        backgroundUrl:  '',
        initItemSize:   200,
        canvas:         canvas
    }
    
    generator_removeBackground();

   
    if(typeof(_data)=== "string"){
        restore(_data);
    }

    canvas.on('object:moved',function(e){
        var object = e.target;
        updateItemInfo(object)
    });
    
    canvas.on('object:scaled',function(e){
        var object = e.target;
        updateItemInfo(object)
    });

    canvas.on('mouse:down',function(e){
        try {
            var obj = e.target;
            if(obj.click)   obj.click += 1;
            else    obj.click = 1;
            
            if(obj.click === 2){
                changeImage(obj);
                obj.click = 0;
            }
            
            setTimeout(function(){
                obj.click = 0;
            },300)

        } catch (error) {
            
        }
    });
}

function generator_reset(){
    generator_load(GENERATOR_VARIABLES.width,GENERATOR_VARIABLES.height);
}

function generator_restore(_data){
    generator_load(GENERATOR_VARIABLES.width, GENERATOR_VARIABLES.height, _data)
}

function generator_getResult(){
    var result_config = {
        restrictNumber: Number($("#restriction-number").val()),
        errorMessage:   $("#restriction-error-message").val(),
        canvasBackground:   GENERATOR_VARIABLES.backgroundUrl,
        objList: [],
    };

    for(obj of GENERATOR_VARIABLES.canvas.getObjects()){
        result_config.objList.push({
            top:        convertToRealSize(obj, 'top', 'y'),
            left:       convertToRealSize(obj, 'left','x'),
            height:     convertToRealSize(obj, 'height','y'),
            width:      convertToRealSize(obj, 'width','x'),
            imgUrlList: obj.imgList,
        })
    }
    result_config = JSON.stringify(result_config);
    console.log(result_config);
    return result_config;
}

function generator_setBackground(_url){
    var canvas = GENERATOR_VARIABLES.canvas;
    try
    {
        var backImg = new fabric.Image.fromURL(_url,function(backImg){
            backImg.set({
                'scaleX': canvas.width /  backImg.width ,
                'scaleY': canvas.height / backImg.height ,
            });
            canvas.setBackgroundImage(backImg);
            canvas.renderAll();
        });
        $('#set-background').hide();
        $('#remove-background').show();
        GENERATOR_VARIABLES.backgroundUrl = _url;
    }
    catch(e){
        console.log('background image not available');
    }
}

function generator_removeBackground(){
    var canvas = GENERATOR_VARIABLES.canvas;
    canvas.setBackgroundImage(0);
    canvas.renderAll();    
    GENERATOR_VARIABLES.backgroundUrl = '';    
    $('#set-background').show();
    $('#remove-background').hide();
}

function generator_addItem(_url, _dest, _data){
    var canvas = GENERATOR_VARIABLES.canvas;
    var initItemSize = GENERATOR_VARIABLES.initItemSize;
    var itemConfig = {};
    var newItem = fabric.Image.fromURL(_url,function(itemImage){
        if(_data){
            itemConfig = {
                left:           _data.left * GENERATOR_VARIABLES.cx,
                top:            _data.top  * GENERATOR_VARIABLES.cy,
                scaleX:         (_data.width / itemImage.width) * GENERATOR_VARIABLES.cx ,
                scaleY:         (_data.height/itemImage.height) * GENERATOR_VARIABLES.cy,
                imgList:        [_url],
                id:                 GENERATOR_VARIABLES.itemIdCounter,
                displayCounter: 0,
                lockRotation:   true,
            }
        }
        else{
            itemConfig = {
                left:               GENERATOR_VARIABLES.width / 2,
                top:                GENERATOR_VARIABLES.height / 2,
                scaleX:             (initItemSize / itemImage.width)   * GENERATOR_VARIABLES.cx,
                scaleY:             (initItemSize / itemImage.height)  * GENERATOR_VARIABLES.cy,
                id:                 GENERATOR_VARIABLES.itemIdCounter,
                imgList:            [_url],
                displayCounter:     0,
                lockRotation:       true
                
            };
        }
        itemImage.set(itemConfig);
        canvas.add(itemImage);
        canvas.renderAll();
        for(obj of canvas.getObjects()){
            if(obj.id === itemConfig.id){ 
                itemConfig = obj;
                break;
            }
        }
        addItemRow(_dest, itemConfig);
        GENERATOR_VARIABLES.itemList.push(newItem);
        GENERATOR_VARIABLES.itemIdCounter += 1;
        
        if(_data && _data.imgUrlList){
            for(var j=1;j<_data.imgUrlList.length;j++){
                addImage(_data.imgUrlList[j],""+itemConfig.id);
            }
        }

        return itemConfig;
    });
}

// Utility functions
function restore(_data){
    try {
        _data = JSON.parse(_data);
        $("#restriction-number").val(Number(_data.restrictNumber));
        $("#restriction-error-message").val(_data.errorMessage);
        generator_setBackground(_data.canvasBackground);
        
        for(var i=0;i<_data.objList.length;i++){
            var item = _data.objList[i];
            generator_addItem(item.imgUrlList[0],"item-container",item);
        }    
    } catch (error) {
        console.log('unable to restore from input config');
        generator_reset();
    }
}

function addItemRow(_dest, _item){
    var buttonId = "item-add-image-"+_item.id;
    var inputId = "item-add-file-input-"+_item.id
    $('#'+_dest).append(`
        <div id="item-`+_item.id+`" class="row" >
            <div class="col col-sm-2"> آیتم: `+_item.id+`</div>
            <button class="col col-sm-2 add-image-button btn btn-success" id="`+buttonId+`" > افزودن عکس </button>
            <input type="file" style="display:none;" id="`+inputId+`" />
            <div class="col col-sm-8"> </div> 
        </div>
    `);
    addButtonListener(buttonId, inputId);
    updateItemInfo(_item);
    updateItemImages(_item);
}

function addImage(_url, _id){
    _id = _id.split('-');
    _id = Number(_id[_id.length-1]);
    var objs = GENERATOR_VARIABLES.canvas.getObjects();
    for(obj of objs){
        if(obj.id === _id){
            obj.imgList.push(_url);
            updateItemImages(obj);
            break;
        }
    }
}

function updateItemInfo(_item){
    updateColumnInfo('width',   'عرض',      _item,  'x');
    updateColumnInfo('height',  'ارتفاع',   _item,  'y');
    updateColumnInfo('left',    'چپ',       _item,  'x');
    updateColumnInfo('top',     'بالا',     _item,  'y');
}

function updateColumnInfo(_type, _fa, _item, _direction, _colSize){
    if(!_colSize) _colSize = '2';
    var inputId = 'item-'+_type+'-'+_item.id;
    var inputSelector = '#'+inputId;
    
    var newInfo = convertToRealSize(_item, _type, _direction);
    
    if($(inputSelector).length>0){
        $(inputSelector).val(newInfo); 
    }
    else{
        $('#item-'+_item.id).append(`
            <div class="col col-sm-`+_colSize+`">
                `+_fa+': '+` <input class="form-control" type="number" id="`+inputId+`" value="`+newInfo+`" />
            </div>
        `);
        inputListener(inputId);
    }
}

function updateItemImages(_item){
    var imageContainerId = 'item-images-container-'+_item.id;
    var imageContainerSelector = '#' + imageContainerId;
    if($(imageContainerSelector).length===0){
        $('#item-'+_item.id).append(`
            <div class="row col col-sm-12" id="`+imageContainerId+`"> </div>
        `)
    }

    $(imageContainerSelector).empty();
    for(var i=0;i<_item.imgList.length;i++){
        var img = _item.imgList[i];
        var imgId = "remove-image-"+_item.id+"-"+i;
        $(imageContainerSelector).append(`
            <div class="col col-sm-2" >
                <img height="100" width="100" src=`+img+` />
                <button class="remove-image btn btn-danger" id="`+imgId+`" > X </button>
            </div>
        `);
        removeButtonListener(imgId);
    }
}

function removeButtonListener(_imgId){
    $("#"+_imgId).on('click',function(e){
        removeImage(e.target.id);
    });
}

function convertToRealSize(_item, _type, _direction){
    var c,scale,result;
    
    if(_direction === 'x')  {
        c = GENERATOR_VARIABLES.cx;
        scale = _item.scaleX;
    }
    else if(_direction === 'y') {
        c = GENERATOR_VARIABLES.cy;
        scale = _item.scaleY;
    }
    else{
        return _item[_type];
    }
    result = (_item[_type] / c);
    
    if(_type === 'width' || _type === 'height') result *= scale;

    return result.toFixed(0);
}

function changeImage(_item){
    var canvas = GENERATOR_VARIABLES.canvas;
    _item.displayCounter += 1;
    if(_item.displayCounter >= _item.imgList.length) _item.displayCounter = 0;

    var c = _item.displayCounter;
    fabric.Image.fromURL(_item.imgList[c],function(){
        _item._element.src = _item.imgList[c];
        var tempConf = {
            width: _item._element.naturalWidth,
            height: _item._element.naturalHeight,
            scaleX: ((_item.width * _item.scaleX ) / _item._element.naturalWidth),
            scaleY: ((_item.height * _item.scaleY) / _item._element.naturalHeight)
        }
        _item.set(tempConf)
        _item.dirty = true;
        canvas.renderAll();
    })
}

function removeImage(_elementId){
    _elementId = _elementId.split('-');
    var itemId = Number(_elementId[_elementId.length-2]);
    var imageIndex = Number(_elementId[_elementId.length-1]);
    var objs = GENERATOR_VARIABLES.canvas.getObjects();

    for(obj of objs){
        if(obj.id === itemId){
            obj.imgList.splice(imageIndex,1);
            updateItemImages(obj);
            if(obj.imgList.length === 0) removeItem(obj);
            else if(imageIndex === obj.displayCounter) changeImage(obj);
            break;
        }
    }
}

function removeItem(_item){
    GENERATOR_VARIABLES.canvas.remove(_item);
    $('#item-'+_item.id).remove();
}

function applyChanges(_id,_value){
    _value = Number(_value);
    _id = _id.split('-');
    var itemId = Number(_id[_id.length-1]);
    var type = _id[_id.length-2];
    var c = GENERATOR_VARIABLES.cy;
    if(type === 'width' || type === 'left') c = GENERATOR_VARIABLES.cx; 

    var canvas = GENERATOR_VARIABLES.canvas;
    var objs = canvas.getObjects();
    var tempConf = {};
    for(obj of objs){
        if(obj.id === itemId){
            if(type==='width') tempConf['scaleX'] = (_value*c / obj._element.naturalWidth);
            else if(type==='height') tempConf['scaleY'] = (_value*c / obj._element.naturalHeight );
            else tempConf[type] = _value *c;
            obj.set(tempConf);
            obj.setCoords();
            break;
        }
    }
    canvas.renderAll();
}

function uploadHandler(_file, _inputId, _callback, _other){
    var fd = new FormData();
    fd.append('file', _file);
    fd.append('type','image');
    $.ajax({
        url: 'http://bebras-api.gandom.co/api/v1/upload',
        data: fd,
        contentType: false,
        processData: false,
        headers: {'Secret-Key':'95521150-ee59-4492-82af-c90e34c4b48e'},
        type: 'POST',
        success: function(data){
            if(typeof(_callback) === "function"){
                _callback(data.url,_other);
            }
            $("#"+_inputId)[0].value = "";
        },
        error: function(error){
            $("#"+_inputId)[0].value = "";
        }
    })
}

// Listeners
function inputListener(_inputId){
    $('#'+_inputId).on('change',function(e){
        applyChanges(e.target.id,e.target.value);
    })
}

function addButtonListener(_buttonId,_inputId){
    $("#"+_buttonId).on('click',function(){
        $("#"+_inputId).click();
    });

    $("#"+_inputId).on('change',function(e){
        var file = $("#"+_inputId)[0].files[0];
        uploadHandler(file, _inputId, addImage, e.target.id);
    })
}
