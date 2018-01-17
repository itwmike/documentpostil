var _fileId = "";//getUrlParam("fileId");
var _fileviewguid ="";// getUrlParam("fileViewGuid");
var remarkCanvas = document.getElementById("remarkCanvas");
var bjCanvas = document.getElementById("bjCanvas");
var remarkContext = remarkCanvas.getContext("2d");
var bjContext = bjCanvas.getContext("2d");
var $remarkCanvas = $("#remarkCanvas");
var pageObj = {
    imgw : 2479 //图片的最大宽度（原始图片）
    ,imgh : 3508 //图片的最大高度（原始图片）
    ,scaleW:595  //图片缩放宽度 ，默认为 A4 像素大小
    ,scaleH:842  //图片缩放高度 ，默认为 A4 像素大小
    ,postilType:1//1 ：手写标注 2 ： 文字批注 3：矩形 4：椭圆 5：箭头 6：橡皮擦 7：拖拽快捷 8:放大快捷
    ,handPostilXYArray : [] //保存手写批注的坐标
    ,textPostilXYArrary:[]//保存绘制当前文字批注的坐标
    ,anewPostilXYArrary:[]//保存 图片与批注合并时 绘制文字批注的坐标
    ,dragXYArray:[]// 保存 拖拽坐标
    ,drawRectXYArray:[]//保存 矩形绘制坐标
    ,drawShapeXYArray:[]//保存 椭圆绘制坐标
    ,drawArrowsXYArray:[]// 保存 箭头绘制坐标
    ,rectImgData:null
    ,Pen : {
        fillStyle: "#000000"//指定 填充颜色
        ,strokeStyle: "#000000"//指定画笔颜色
        , lineJoin: "round"//线条交点的类型
        , lineCap: "round"//线条结束端样式
        , lineWidth: 1//指定画笔宽度
        , colors: ["#000000", "#8a8985", "#d0cdc8", "#d0cdc8", "#8e0000", "#f93b3b", "#fa923d", "#348d33"] //可用画笔颜色
    }
    ,scale:1//放大倍数
    ,ctrlStatus:false//ctrl键是否被按下
    ,altStatus:false//alt 键是否被按下
};

//loadData();

$(".body-right-box").on("click", "li", function () {
    saveRemarkImg();
    $(this).siblings().removeClass("focus");
    $(this).addClass("focus");
    $("#meetImg").attr("src", $(this).find("img").attr("src"));
    clearCanvas(remarkContext);
});
//鼠标滚动事件
$(".postilContent-box").on("mousewheel", function (event) {
    if(pageObj.ctrlStatus){
        mousewheelScale(event);
    }else{
        imgPaging($(this),event);
    }
});
//鼠标+快捷键 缩放
function mousewheelScale(event) {
    if (event.deltaY > 0) {//向上
        $(".scale-big").click();
    }else{
        $(".scale-small").click();
    }
    event.preventDefault();
    event.returnValue=false;
}
//图片 翻页 上一页 下一页
function imgPaging($this,event) {
    //判断是否滚动到底部或顶部
    var meetImgH=$("#meetImg").height();
    var postilContentH=$this.height();
    if(meetImgH>postilContentH){
        var postilContentScrollH=$this.scrollTop();
        if(postilContentScrollH+postilContentH<meetImgH&&event.deltaY <= 0){
            return;
        }else if(event.deltaY > 0&&postilContentScrollH>0){
            return;
        }else{
            $this.scrollTop(0);
        }
    }
    var currentLi = $(".body-right-box li.focus");
    if (currentLi == undefined || currentLi.length <= 0) return;
    if (event.deltaY > 0) {//向上
        var preLi = currentLi.prev();
        changeThumb(preLi);
    } else {//向下
        var nextLi = currentLi.next();
        changeThumb(nextLi);
    }
}
//保存并并关闭
$(".saveRemarkImg").on("click", function () {
    saveToData();
});
//重新批注
$(".resetPostil").on("click", function () {
    loadData();
});
$.each(pageObj.Pen.colors, function (index, item) {
    if (index == 0) {
        $(".pen-color-box").append("<a class=\"pen-color focus\" style='background-color:" + item + ";' color='" + item + "'> </a>");
    } else {
        $(".pen-color-box").append("<a class=\"pen-color\" style='background-color:" + item + ";' color='" + item + "'> </a>");
    }
})
$(".pen-linewidth").on("click", function () {
    $(this).siblings().removeClass("focus");
    $(this).addClass("focus");
    pageObj.Pen.lineWidth = $(this).attr("linewidth");
});
$(".pen-color-box a").on("click", function () {
    $(this).siblings().removeClass("focus");
    $(this).addClass("focus");
    pageObj.Pen.strokeStyle = $(this).attr("color");
    pageObj.Pen.fillStyle=$(this).attr("color");
})
$(".postilType-box a").on("click",function () {
    $(this).siblings().removeClass("focus").find("span").html("关闭");
    $(this).addClass("focus").find("span").html("开启");
    pageObj.postilType=$(this).attr("postilType");
    setMouseCursor();
})
//放大
$(".scale-big").on("click",function () {
    pageObj.scale+=0.2;
    postilScale();
})
//还原
$(".scale-reset").on("click",function () {
    pageObj.scale=1;
    postilScale();
})
//缩小
$(".scale-small").on("click",function () {
    pageObj.scale-=0.2;
    postilScale();
})
//重新加载批注区域的图片 ，从服务器获取
$(".scale-reload").on("click",function () {
    //清楚当前批注信息
    clearCanvas(remarkContext);
    pageObj.handPostilXYArray = [];
    pageObj.anewPostilXYArrary=[];
    //获取图片
    var imgurl="/GB/LK/ODM/PdfToImg/"+_fileviewguid+"/"+$(".body-right-box li.focus").attr("pageNum")+".jpg";
    $("#meetImg").attr("src",imgurl);
    $(".body-right-box li.focus img").attr("src",imgurl);
})
//橡皮擦
$(".scale-eraser").on("click",function () {
   pageObj.postilType=6;
    setMouseCursor();
})
//绘制矩形
$(".shape-rect").on("click",function () {
    pageObj.postilType=3;
    $(this).siblings().removeClass("focus");
    $(this).addClass("focus");
    setMouseCursor();
})
//绘制椭圆
$(".shape-ellipse").on("click",function () {
    pageObj.postilType=4;
    $(this).siblings().removeClass("focus");
    $(this).addClass("focus");
    setMouseCursor();
})
//绘制箭头
$(".shape-arrows").on("click",function () {
    pageObj.postilType=5;
    $(this).siblings().removeClass("focus");
    $(this).addClass("focus");
    setMouseCursor();
})
//复原鼠标样式
function setMouseCursor () {
    //复原鼠标样式
    if(pageObj.postilType==1){
        $("#remarkCanvas").removeClass().addClass("handCursor");
    }else if(pageObj.postilType==2){
        $("#remarkCanvas").removeClass().addClass("textCursor");
    }else if(pageObj.postilType==3){
        $("#remarkCanvas").removeClass().addClass("textCursor");
    }else if(pageObj.postilType==4){
        $("#remarkCanvas").removeClass().addClass("textCursor");
    }else if(pageObj.postilType==5){
        $("#remarkCanvas").removeClass();
    }else if(pageObj.postilType==6){
        $("#remarkCanvas").removeClass().addClass("eraserCursor");
    }else if(pageObj.postilType==7){
        $("#remarkCanvas").removeClass().addClass("dragCursor");
    }else if(pageObj.postilType==8){
        $("#remarkCanvas").removeClass().addClass("scaleCursor");
    }else{
        $("#remarkCanvas").removeClass();
    }
}
//缩放 快捷键
$(window).on("keydown",function (event) {
    if(event.keyCode!=17&&event.keyCode!=18)return;
    if(event.keyCode==17){
        //用户按下ctrl 键
        pageObj.ctrlStatus=true;
        pageObj.postilType=8;
    }else if(event.keyCode==18){
        //用户按下 alt 键
        pageObj.altStatus=true;
        pageObj.postilType=7;
    }
    setMouseCursor();
    event.preventDefault();
    event.returnValue=false;
}).on("keyup",function (event) {
    if(event.keyCode!=17&&event.keyCode!=18)return;
    if(event.keyCode==17){
        pageObj.ctrlStatus=false;
    }else if(event.keyCode==18){
        pageObj.altStatus=false;
    }
    pageObj.postilType=1;
    setMouseCursor();
    event.preventDefault();
    event.returnValue=false;
})
//缩放 批注区域
function  postilScale() {
    //在图片原有 宽高 比例上 缩放
    var scaleH=pageObj.scaleH*pageObj.scale;
    var scaleW=pageObj.scaleW*pageObj.scale;
    saveRemarkImg();//保存一次
    //重新加载当前批注区域的图片
    $("#meetImg").attr("src",$(".body-right-box li.focus img").attr("src"));
    setScaleWH(scaleW,scaleH);
}
//设置图片和canvas的宽高
function  setScaleWH(scaleW,scaleH) {
    //设置图片和canvas 的样式
    $("#meetImg").css({  width: scaleW ,height:scaleH });
    $remarkCanvas.css({  width: scaleW ,height:scaleH });
    remarkCanvas.width=scaleW;
    remarkCanvas.height=scaleH;
}
//
$remarkCanvas.on({
    mousedown: function (e) {
        if(pageObj.postilType==1){
            handPostil_Down(e);//手写批注
        }else if(pageObj.postilType==2){
            textPostil_Down(e);//文字批注
        }else if(pageObj.postilType==3){
            rectDraw_Down(e);
        }else if(pageObj.postilType==4){
            shapeDraw_Down(e);
        }else if(pageObj.postilType==5){
            arrowsDraw_Down(e);
        }else if (pageObj.postilType==6){
            eraser_Down(e);//当前为橡皮擦
        }else if(pageObj.postilType==7){
            drag_Down(e);//当前为 拖拽操作
        }else if(pageObj.postilType==8){
            //放大
        }
    }
    , mousemove: function (e) {
        if(pageObj.postilType==1){
            handPostil_Move(e);//手写批注
        }else if(pageObj.postilType==2){
            textPostil_Move(e);//文字批注
        }else if(pageObj.postilType==3){
            rectDraw_Move(e);//矩形
        }else if(pageObj.postilType==4){
            shapeDraw_Move(e);
        }else if(pageObj.postilType==5){
            arrowsDraw_Move(e);
        }else if (pageObj.postilType==6){
            eraser_Move(e);//当前为橡皮擦
        }else if(pageObj.postilType==7){
            drag_Move(e);//当前为 拖拽操作
        }else if(pageObj.postilType==8){
            //放大
        }
    }
    , mouseup: function (e) {
        if(pageObj.postilType==1){
            handPostil_Up(e);//手写批注
        }else if(pageObj.postilType==2){
            textPostil_Up(e);//文字批注
        }else if(pageObj.postilType==3){
            rectDraw_Up(e);//矩形
        }else if(pageObj.postilType==4){
            shapeDraw_Up(e);
        }else if(pageObj.postilType==5){
            arrowsDraw_Up(e);
        }else if (pageObj.postilType==6){
            eraser_Up(e);//当前为橡皮擦
        }else if(pageObj.postilType==7){
            drag_Up(e);//当前为 拖拽操作
        }else if(pageObj.postilType==8){
            //放大
        }
    }
    , mouseleave: function (e) {
        if(pageObj.postilType==1){
            handPostil_Leave(e);//手写批注
        }else if(pageObj.postilType==2){
            textPostil_Leave(e);//文字批注
        }else if(pageObj.postilType==3){
            rectDraw_Leave(e);//矩形
        }else if(pageObj.postilType==4){
            shapeDraw_Leave(e);
        }else if(pageObj.postilType==5){
            arrowsDraw_Leave(e);
        }else if (pageObj.postilType==6){
            eraser_Leave(e);//当前为橡皮擦
        }else if(pageObj.postilType==7){
            drag_Leave(e);//当前为 拖拽操作
        }else if(pageObj.postilType==8){
            //放大
        }
    }
});
//绘制箭头
function arrowsDraw_Down(e) {
    if(pageObj.isStart )return;
    pageObj.isStart=true;
    var x = e.pageX - remarkCanvas.offsetLeft+$(".postilContent-box").scrollLeft(),
        y =  e.pageY-42+$(".postilContent-box").scrollTop();
    pageObj.drawArrowsXYArray.push({ "index":pageObj.drawArrowsXYArray.length,"data": [{"x":x,"y":y,"ratioX":setX(x,remarkCanvas),"ratioY":setY(y,remarkCanvas) }]});
    pageObj.rectImgData= remarkContext.getImageData(0,0, remarkCanvas.width,remarkCanvas.height);
}
function arrowsDraw_Move(e) {
}
function arrowsDraw_Up(e) {
    if(!pageObj.isStart)return;
    pageObj.isStart=false;
    var x = e.pageX - remarkCanvas.offsetLeft+$(".postilContent-box").scrollLeft(),
        y =  e.pageY-42+$(".postilContent-box").scrollTop();
    var currentArray=pageObj.drawArrowsXYArray[pageObj.drawArrowsXYArray.length-1].data;
    currentArray.push({"x":x,"y":y,"ratioX":setX(x,remarkCanvas),"ratioY":setY(y,remarkCanvas) });
    drawArrows(currentArray,remarkContext);
}
function arrowsDraw_Leave(e) {
    if(!pageObj.isStart)return;
    pageObj.isStart=false;
}
//绘制箭头
function drawArrows(currentArray,canvasContext) {
    var polygonVertex=[];
    var CONST = { edgeLen: 50,  angle: 25 };
    var angle="";
    polygonVertex[0] = currentArray[0].x;
    polygonVertex[1] = currentArray[0].y;
    polygonVertex[6] = currentArray[currentArray.length-1].x;
    polygonVertex[7] = currentArray[currentArray.length-1].y;
    angle = Math.atan2(currentArray[currentArray.length-1].y - currentArray[0].y, currentArray[currentArray.length-1].x - currentArray[0].x) / Math.PI * 180;
    CONST.edgeLen = 50;
    CONST.angle = 25;
    var x = currentArray[currentArray.length-1].x - currentArray[0].x,
        y = currentArray[currentArray.length-1].y - currentArray[0].y,
        length = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    if (length < 250) {
        CONST.edgeLen = CONST.edgeLen/2;
        CONST.angle = CONST.angle/2;
    }
    else if(length<500){
        CONST.edgeLen=CONST.edgeLen*length/500;
        CONST.angle=CONST.angle*length/500;
    }
    polygonVertex[8] = currentArray[currentArray.length-1].x - CONST.edgeLen * Math.cos(Math.PI / 180 * (angle + CONST.angle));
    polygonVertex[9] = currentArray[currentArray.length-1].y - CONST.edgeLen * Math.sin(Math.PI / 180 * (angle + CONST.angle));
    polygonVertex[4] = currentArray[currentArray.length-1].x - CONST.edgeLen * Math.cos(Math.PI / 180 * (angle - CONST.angle));
    polygonVertex[5] = currentArray[currentArray.length-1].y - CONST.edgeLen * Math.sin(Math.PI / 180 * (angle - CONST.angle));
    var midpointX=(polygonVertex[4]+polygonVertex[8])/2;
    var midpointY=(polygonVertex[5]+polygonVertex[9])/2;
    polygonVertex[2] = (polygonVertex[4] + midpointX) / 2;
    polygonVertex[3] = (polygonVertex[5] + midpointY) / 2;
    polygonVertex[10] = (polygonVertex[8] + midpointX) / 2;
    polygonVertex[11] = (polygonVertex[9] + midpointY) / 2;

    canvasContext.fillStyle = "red";
    canvasContext.beginPath();
    canvasContext.moveTo(polygonVertex[0], polygonVertex[1]);
    canvasContext.lineTo(polygonVertex[2], polygonVertex[3]);
    canvasContext.lineTo(polygonVertex[4], polygonVertex[5]);
    canvasContext.lineTo(polygonVertex[6], polygonVertex[7]);
    canvasContext.lineTo(polygonVertex[8], polygonVertex[9]);
    canvasContext.lineTo(polygonVertex[10], polygonVertex[11]);
    canvasContext.closePath();
    canvasContext.fill();
}
//绘制椭圆
function shapeDraw_Down(e) {
    if(pageObj.isStart )return;
    pageObj.isStart=true;
    var x = e.pageX - remarkCanvas.offsetLeft+$(".postilContent-box").scrollLeft(),
        y =  e.pageY-42+$(".postilContent-box").scrollTop();
    pageObj.drawShapeXYArray.push({ "index":pageObj.drawShapeXYArray.length,"data": [{"x":x,"y":y,"ratioX":setX(x,remarkCanvas),"ratioY":setY(y,remarkCanvas) }]});
    pageObj.rectImgData= remarkContext.getImageData(0,0, remarkCanvas.width,remarkCanvas.height);
}
function shapeDraw_Move(e) {
    if(!pageObj.isStart)return;
    var x = e.pageX - remarkCanvas.offsetLeft+$(".postilContent-box").scrollLeft(),
        y =  e.pageY-42+$(".postilContent-box").scrollTop();
    if(pageObj.drawShapeXYArray.length>=2){
        // var clearSX=0;
        // var clearSY=0;
        // var clearW=0;
        // var clearH=0;
        // var diffX=pageObj.drawRectXYArray[pageObj.drawRectXYArray.length-1].x-pageObj.drawRectXYArray[0].x;
        // var diffY=pageObj.drawRectXYArray[pageObj.drawRectXYArray.length-1].y-pageObj.drawRectXYArray[0].y;
        // remarkContext.beginPath();
        // if(diffX>0){
        //     //向右的滑动
        //     clearSX=pageObj.drawRectXYArray[0].x-1;
        //     clearW=pageObj.drawRectXYArray[pageObj.drawRectXYArray.length-1].x-pageObj.drawRectXYArray[0].x+2;
        // }else{
        //     //向左的滑动
        //     clearSX=pageObj.drawRectXYArray[0].x+1;
        //     clearW=pageObj.drawRectXYArray[pageObj.drawRectXYArray.length-1].x-pageObj.drawRectXYArray[0].x-2;
        // }
        // if(diffY>0){
        //     //向下
        //     clearSY=pageObj.drawRectXYArray[0].y-1;
        //     clearH=pageObj.drawRectXYArray[pageObj.drawRectXYArray.length-1].y-pageObj.drawRectXYArray[0].y+2;
        // }else{
        //     //向上
        //     clearSY=pageObj.drawRectXYArray[0].y+1;
        //     clearH=pageObj.drawRectXYArray[pageObj.drawRectXYArray.length-1].y-pageObj.drawRectXYArray[0].y-2;
        // }
        // remarkContext.clearRect(clearSX,clearSY,clearW,clearH);
    }
    clearCanvas(remarkContext);
    remarkContext.putImageData(pageObj.rectImgData,0,0);
    remarkContext.save();
    var currentArray=pageObj.drawShapeXYArray[pageObj.drawShapeXYArray.length-1].data;
    currentArray.push(  {"x":x,"y":y,"ratioX":setX(x,remarkCanvas),"ratioY":setY(y,remarkCanvas) }  );

    remarkContext.beginPath();
    remarkContext.lineWidth=pageObj.Pen.lineWidth;
    remarkContext.strokeStyle=pageObj.Pen.strokeStyle;
    remarkContext.arc(  currentArray[0].x + (Math.abs(currentArray[currentArray.length-1].x-currentArray[0].x) /2),
        currentArray[0].y+ (Math.abs(currentArray[currentArray.length-1].x-currentArray[0].x) /2),
        Math.abs(currentArray[currentArray.length-1].x-currentArray[0].x), 0,2*Math.PI);
    remarkContext.closePath();
    remarkContext.stroke();
}
function shapeDraw_Up(e) {
    if(!pageObj.isStart)return;
    pageObj.isStart=false;
}
function shapeDraw_Leave(e) {
    if(!pageObj.isStart)return;
    pageObj.isStart=false;
}
//绘制矩形
function rectDraw_Down(e) {
    if(pageObj.isStart )return;
    pageObj.isStart=true;
    var x = e.pageX - remarkCanvas.offsetLeft+$(".postilContent-box").scrollLeft(),
        y =  e.pageY-42+$(".postilContent-box").scrollTop();
    pageObj.drawRectXYArray.push({ "index":pageObj.drawRectXYArray.length,"data": [{"x":x,"y":y,"ratioX":setX(x,remarkCanvas),"ratioY":setY(y,remarkCanvas) }]});
    pageObj.rectImgData= remarkContext.getImageData(0,0, remarkCanvas.width,remarkCanvas.height);
}
function rectDraw_Move(e) {
    if(!pageObj.isStart)return;
    var x = e.pageX - remarkCanvas.offsetLeft+$(".postilContent-box").scrollLeft(),
        y =  e.pageY-42+$(".postilContent-box").scrollTop();
    if(pageObj.drawRectXYArray.length>=2){
        // var clearSX=0;
        // var clearSY=0;
        // var clearW=0;
        // var clearH=0;
        // var diffX=pageObj.drawRectXYArray[pageObj.drawRectXYArray.length-1].x-pageObj.drawRectXYArray[0].x;
        // var diffY=pageObj.drawRectXYArray[pageObj.drawRectXYArray.length-1].y-pageObj.drawRectXYArray[0].y;
        // remarkContext.beginPath();
        // if(diffX>0){
        //     //向右的滑动
        //     clearSX=pageObj.drawRectXYArray[0].x-1;
        //     clearW=pageObj.drawRectXYArray[pageObj.drawRectXYArray.length-1].x-pageObj.drawRectXYArray[0].x+2;
        // }else{
        //     //向左的滑动
        //     clearSX=pageObj.drawRectXYArray[0].x+1;
        //     clearW=pageObj.drawRectXYArray[pageObj.drawRectXYArray.length-1].x-pageObj.drawRectXYArray[0].x-2;
        // }
        // if(diffY>0){
        //     //向下
        //     clearSY=pageObj.drawRectXYArray[0].y-1;
        //     clearH=pageObj.drawRectXYArray[pageObj.drawRectXYArray.length-1].y-pageObj.drawRectXYArray[0].y+2;
        // }else{
        //     //向上
        //     clearSY=pageObj.drawRectXYArray[0].y+1;
        //     clearH=pageObj.drawRectXYArray[pageObj.drawRectXYArray.length-1].y-pageObj.drawRectXYArray[0].y-2;
        // }
        // remarkContext.clearRect(clearSX,clearSY,clearW,clearH);
    }
    clearCanvas(remarkContext);
    remarkContext.putImageData(pageObj.rectImgData,0,0);
    remarkContext.save();
    var currentArray=pageObj.drawRectXYArray[pageObj.drawRectXYArray.length-1].data;
    currentArray.push(  {"x":x,"y":y,"ratioX":setX(x,remarkCanvas),"ratioY":setY(y,remarkCanvas) }  );

    remarkContext.beginPath();
    remarkContext.lineWidth=pageObj.Pen.lineWidth;
    remarkContext.strokeStyle=pageObj.Pen.strokeStyle;
    remarkContext.strokeRect(  currentArray[0].x,currentArray[0].y,
        currentArray[currentArray.length-1].x-currentArray[0].x,
        currentArray[currentArray.length-1].y-currentArray[0].y);
    remarkContext.closePath();
    remarkContext.stroke();
}
function  rectDraw_Up(e) {
    if(!pageObj.isStart)return;
    pageObj.isStart=false;
}
function rectDraw_Leave(e) {
    if(!pageObj.isStart)return;
    pageObj.isStart=false;
}
//橡皮擦
function eraser_Down(e) {
    if(pageObj.isStart )return;
    pageObj.isStart=true;
}
function eraser_Up(e) {
    if(!pageObj.isStart)return;
    pageObj.isStart=false;
}
function eraser_Move(e) {
    if(!pageObj.isStart)return;
    var x = e.pageX - remarkCanvas.offsetLeft+$(".postilContent-box").scrollLeft(),
        y =  e.pageY-42+$(".postilContent-box").scrollTop();
    remarkContext.clearRect(x, y,15,15);
}
function eraser_Leave(e) {
    if(!pageObj.isStart)return;
    pageObj.isStart=false;
}
//拖拽
function  drag_Down(e) {
    if( !pageObj.altStatus|| pageObj.isStart)return;
    pageObj.isStart=true;
    pageObj.dragXYArray=[];
    var x = e.pageX - remarkCanvas.offsetLeft,
        y =  e.pageY-42+$(".postilContent-box").scrollTop();
    pageObj.dragXYArray.push({ "x":x,"y":y});
}
function  drag_Up(e) {
    if(!pageObj.isStart || !pageObj.altStatus)return;
    pageObj.isStart=false;
    dragScroll(e);
}
function  drag_Move(e) {
    if(!pageObj.isStart || !pageObj.altStatus)return;
    dragScroll(e);
}
function  drag_Leave(e) {
    pageObj.isStart=false;
}
function dragScroll(e) {
    var $postilContent=$(".postilContent-box");
    var x = e.pageX - remarkCanvas.offsetLeft,
        y =  e.pageY-42+$postilContent.scrollTop();
    pageObj.dragXYArray.push({ "x":x,"y":y});
    //判断是否 有滚动条 ， 只有存在滚动条才能拖拽
    var meetImgH=$("#meetImg").height();
    var meetImgW=$("#meetImg").width();
    var postilContentH=$postilContent.height();
    var postilContentW=$postilContent.width();
    if(meetImgH>postilContentH){
        //起始坐标 - 终点坐标
        var ah=pageObj.dragXYArray[pageObj.dragXYArray.length-2].y-pageObj.dragXYArray[pageObj.dragXYArray.length-1].y;
        //存在Y轴滚动条 ，计算需要向上或向下滚动的距离
        if(ah>0){
            //向上拖拽，向下滚动
            $postilContent.scrollTop(  $postilContent.scrollTop()+ Math.abs(ah) );
        }else{
            //向下拖拽，向上滚动
            $postilContent.scrollTop(  $postilContent.scrollTop()- Math.abs(ah) );
        }
    }
    if(meetImgW>postilContentW){
        //起始坐标 - 终点坐标
        var aw=pageObj.dragXYArray[pageObj.dragXYArray.length-2].x-pageObj.dragXYArray[pageObj.dragXYArray.length-1].x;
        //存在X轴滚动条 ，计算需要向左或向右滚动的距离
        if(aw>0){
            //向左拖拽，向 右滚动
            $postilContent.scrollLeft(  $postilContent.scrollLeft()+ Math.abs(aw) );
        }else{
            //向右拖拽，向左滚动
            $postilContent.scrollLeft(  $postilContent.scrollLeft()-Math.abs(aw)  );
        }
    }
}
//手写批注
function handPostil_Down(e) {
    //计算鼠标指针在文档中的位置
    pageObj.isStart = true;
    var x = e.pageX - remarkCanvas.offsetLeft+$(".postilContent-box").scrollLeft(),
        y =  e.pageY-42+$(".postilContent-box").scrollTop();
    remarkContext.beginPath();
    remarkContext.lineCap = pageObj.Pen.lineCap;
    remarkContext.lineJoin = pageObj.Pen.lineJoin;
    remarkContext.strokeStyle = pageObj.Pen.strokeStyle;
    remarkContext.lineWidth = pageObj.Pen.lineWidth;
    remarkContext.moveTo(x, y);
    x = setX(x, remarkCanvas);
    y = setY(y, remarkCanvas);
    pageObj.handPostilXYArray.push({ index: pageObj.handPostilXYArray.length, data: [{ "x": x, "y": y, "color": pageObj.Pen.strokeStyle, "line": pageObj.Pen.lineWidth}] });
}
//
function  handPostil_Move(e) {
    if (!pageObj.isStart) return;
    var x = e.pageX - remarkCanvas.offsetLeft+$(".postilContent-box").scrollLeft(),
        y = e.pageY-42+$(".postilContent-box").scrollTop();
    //记录坐标参数，方便数据存储
    remarkContext.lineTo(x, y);
    remarkContext.stroke();
    x = setX(x, remarkCanvas);
    y = setY(y, remarkCanvas);
    pageObj.handPostilXYArray[pageObj.handPostilXYArray.length - 1].data.push({ "x": x, "y": y, "color": pageObj.Pen.strokeStyle, "line": pageObj.Pen.lineWidth });
}
//
function  handPostil_Up(e) {
    pageObj.isStart = false;
    remarkContext.save(); //保存当前环境状态
}
//
function handPostil_Leave(e) {
    pageObj.isStart = false;
    remarkContext.save(); //保存当前环境状态
}
//文字批注 事件
function  textPostil_Down(e) {
    if(pageObj.isStart)return;
    pageObj.isStart=true;
    pageObj.textPostilXYArrary=[];
    pushTotextPostilXYArrary(e);
}
function  textPostil_Move(e) {

}
function  textPostil_Up(e) {
    if (!pageObj.isStart) return;
    pushTotextPostilXYArrary(e);
    buildTextarea();
}
function  textPostil_Leave(e) {
    if (!pageObj.isStart) return;
    pushTotextPostilXYArrary(e);
    buildTextarea();
}
//将鼠标坐标点推入数组中保存
function pushTotextPostilXYArrary(e) {
    var x = e.pageX - remarkCanvas.offsetLeft+$(".postilContent-box").scrollLeft(),
        y =  e.pageY-42+$(".postilContent-box").scrollTop();
    var ratioX = setX(x, remarkCanvas);
    var ratioY = setY(y, remarkCanvas);
    pageObj.textPostilXYArrary.push({"x": x, "y": y,"mx":e.pageX,"my":e.pageY,"ratioX":ratioX,"ratioY":ratioY});
}
//创建 文字输入框
function buildTextarea() {
    $("#postilContent_box").remove();
    var postilContent_box=$("<div id='postilContent_box' contenteditable='true'></div>");
    postilContent_box.css({
        left:pageObj.textPostilXYArrary[0].mx+4
        ,top:pageObj.textPostilXYArrary[0].y+3
        ,"min-height":pageObj.textPostilXYArrary[1].y-pageObj.textPostilXYArrary[0].y-6
        ,width:pageObj.textPostilXYArrary[1].x-pageObj.textPostilXYArrary[0].x-6
        ,"color":pageObj.Pen.fillStyle
    });
    //文本框失去焦点的时候 绘制文字
    postilContent_box.on("blur",function () {
        var txt=$(this).text().trim();
        $("#postilContent_box").remove();
        pageObj.isStart = false;
        if(!txt)return;
        var par={
            "index":pageObj.anewPostilXYArrary.length
            ,"fillStyle":pageObj.Pen.fillStyle
            ,"maxWidth":pageObj.textPostilXYArrary[1].x-pageObj.textPostilXYArrary[0].x
            ,"ratioMaxWidth": setX(pageObj.textPostilXYArrary[1].x-pageObj.textPostilXYArrary[0].x,remarkCanvas)
            ,"initX":pageObj.textPostilXYArrary[0].x
            ,"initY":pageObj.textPostilXYArrary[0].y
            ,"ratioX":pageObj.textPostilXYArrary[0].ratioX
            ,"ratioY":pageObj.textPostilXYArrary[0].ratioY
            ,"lineHeight":16
            ,"fontSize":setX(14,remarkCanvas)
            ,"font":"14px  arial"
            ,"txt":txt
        };
        drawText( remarkContext,par);
        par.lineHeight=setY(16,remarkCanvas);
        pageObj.anewPostilXYArrary.push(par);
    });
    $(".dCanvas").append(postilContent_box);
    postilContent_box.focus();
}
//绘制文字
function  drawText(canvasContext,par) {
    canvasContext.font =par.font;
    canvasContext.textAlign = 'left';
    canvasContext.textBaseline = 'top';
    canvasContext.fillStyle =par.fillStyle ;
    var lastSubStrIndex= 0;
    var lineWidth=0;
    var lineHeight=par.lineHeight;
    var initX=par.initX;
    var initY=par.initY;
    var maxWidth=par.maxWidth;
    for(var i=0;i<par.txt.length;i++){
        lineWidth+=canvasContext.measureText(par.txt[i]).width;
        if(lineWidth>maxWidth){
            canvasContext.fillText(par.txt.substring(lastSubStrIndex,i),initX,initY);
            initY+=lineHeight;
            lineWidth=0;
            lastSubStrIndex=i;
        }
        if(i==par.txt.length-1){
            canvasContext.fillText(par.txt.substring(lastSubStrIndex,i+1),initX,initY);
        }
    }
}
//切换右侧缩略图
function changeThumb(selectLi) {
    if (selectLi && selectLi.length > 0) {
        saveRemarkImg();
        $(".body-right-box li").removeClass("focus");
        selectLi.addClass("focus");
        $("#meetImg").attr("src", selectLi.find("img").attr("src"));
        clearCanvas(remarkContext);
        var index = selectLi.index();
        var hg_li = selectLi.height();
        var boxHd = $(".body-left-box").height();
        var realH = (index + 1) * hg_li + (index + 1) * 6;
        if (realH > boxHd) {
            var scrollH = realH - boxHd;
            $(".body-right-box").scrollTop(scrollH);
        } else {
            $(".body-right-box").scrollTop(0);
        }
    }
}
//保存 合并标注和图片为一张图
function saveRemarkImg() {
    if ( (pageObj.handPostilXYArray == undefined || pageObj.handPostilXYArray.length <= 0 ) &&
        (pageObj.anewPostilXYArrary == undefined || pageObj.anewPostilXYArrary.length <= 0) &&
        (pageObj.drawRectXYArray == undefined || pageObj.drawRectXYArray.length <= 0)&&
        (pageObj.drawRectXYArray == undefined || pageObj.drawShapeXYArray.length <= 0)&&
        (pageObj.drawRectXYArray == undefined || pageObj.drawArrowsXYArray.length <= 0))  return;
    var img = document.getElementById("meetImg");
    bjContext.restore();
    clearCanvas(bjContext);
    bjContext.drawImage(img, 0, 0, bjCanvas.width, bjCanvas.height);
    //绘制 手写批注
    $.each(pageObj.handPostilXYArray, function (index, item) {
        bjContext.beginPath();
        $.each(item.data, function (index1, item2) {
            var x = getX(item2.x, bjCanvas);
            var y = getY(item2.y, bjCanvas);
            if (index1 == 0) {
                bjContext.lineCap = pageObj.Pen.lineCap;
                bjContext.lineJoin = pageObj.Pen.lineJoin;
                bjContext.strokeStyle = item2.color;
                bjContext.lineWidth = item2.line*6;
                bjContext.moveTo(x, y);
            } else {
                bjContext.lineTo(x, y);
            }
        });
        bjContext.stroke();
    })
    //绘制 文字批注
    $.each(pageObj.anewPostilXYArrary,function (index,item) {
        item.initX=getX(item.ratioX, bjCanvas);
        item.initY=getY(item.ratioY, bjCanvas);
        item.maxWidth=getX(item.ratioMaxWidth,bjCanvas);
        item.lineHeight=getY(item.lineHeight,bjCanvas)  ;
        var fontSize=getX(item.fontSize,bjCanvas);
        item.font=fontSize+"px  arial";
        drawText( bjContext ,item);
    })
    //绘制 矩形
    $.each(pageObj.drawRectXYArray,function (index,item) {
        if(item.data==null||item.data.length<=0)return true;
        var currentArray=item.data;
        bjContext.beginPath();
        bjContext.lineWidth=pageObj.Pen.lineWidth*2;
        bjContext.strokeStyle=pageObj.Pen.strokeStyle;
        bjContext.strokeRect(getX(currentArray[0].ratioX,bjCanvas)  ,getY(currentArray[0].ratioY,bjCanvas),
          getX(currentArray[currentArray.length-1].ratioX-currentArray[0].ratioX,bjCanvas)  ,
            getY(currentArray[currentArray.length-1].ratioY-currentArray[0].ratioY,bjCanvas) );
        bjContext.closePath();
        bjContext.stroke();
    })
    //绘制 椭圆
    $.each(pageObj.drawShapeXYArray,function (index,item) {
        if(item.data==null||item.data.length<=0)return true;
        var currentArray=item.data;
        bjContext.beginPath();
        bjContext.lineWidth=pageObj.Pen.lineWidth*2;
        bjContext.strokeStyle=pageObj.Pen.strokeStyle;
        currentArray[0].x=getX(currentArray[0].ratioX,bjCanvas);
        currentArray[0].y=getY(currentArray[0].ratioY,bjCanvas);
        currentArray[currentArray.length-1].x=getX(currentArray[currentArray.length-1].ratioX,bjCanvas);

        bjContext.arc(  currentArray[0].x + (Math.abs(currentArray[currentArray.length-1].x-currentArray[0].x) /2),
            currentArray[0].y+ (Math.abs(currentArray[currentArray.length-1].x-currentArray[0].x) /2),
            Math.abs(currentArray[currentArray.length-1].x-currentArray[0].x), 0,2*Math.PI);

        bjContext.closePath();
        bjContext.stroke();
    })
    //绘制箭头
    $.each(pageObj.drawArrowsXYArray,function (index,item) {
        if(item.data==null||item.data.length<=0)return true;
        var currentArray=item.data;
        currentArray[0].x=getX(currentArray[0].ratioX,bjCanvas);
        currentArray[0].y=getY(currentArray[0].ratioY,bjCanvas);
        currentArray[currentArray.length-1].x=getX(currentArray[currentArray.length-1].ratioX,bjCanvas);
        currentArray[currentArray.length-1].y=getY(currentArray[currentArray.length-1].ratioY,bjCanvas);
        drawArrows(currentArray,bjContext);
    })
    bjContext.save();
    pageObj.handPostilXYArray = [];
    pageObj.anewPostilXYArrary=[];
    pageObj.drawRectXYArray=[];
    pageObj.drawShapeXYArray=[];
    pageObj.drawArrowsXYArray=[];
    var base64img = bjCanvas.toDataURL("image/jpeg", 1);
    $(".body-right-box li.focus img").attr("src", base64img);
}
//清空画布
function clearCanvas(canvasContext) {
    canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height); //清空画布
}
//后端服务器保存
function saveToData() {
    saveRemarkImg();
    $(".modal-mask-box span").html("保存中，请稍后...");
    $(".modal-mask-box").show();
    var postData = new FormData(); //组装formdata
    postData.append("gwid", getUrlParam("gwid"));
    postData.append("fileViewGuid", _fileviewguid);
    postData.append("fileId", _fileId);
    postData.append("taskId", getUrlParam("taskId"));
    //遍历 缩略图，找出被修改后的图片，上传到服务器 重新生成pdf 文件。
    var thumbList = $(".body-right-box li");
    $.each(thumbList, function (index, item) {
        var blob = dataURLToBlob($(item).find("img").attr("src"));
        if (blob && blob.size > 0)
            postData.append("FilePage_" + (index + 1), blob);
    })
    //ajax上传，ajax的形式随意，JQ的写法也没有问题
    //需要注意的是服务端需要设定，允许跨域请求。数据接收的方式和<input type="file"/> 上传的文件没有区别
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "/GB/LK/ODM/GWYY/PdfPostilPage/SaveCompositeImgHandler.ashx", true);
    xmlHttp.send(postData);
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            if (xmlHttp.responseText && xmlHttp.responseText.length > 0) {
                //赋值给父窗口
                window.opener.$G.Page.refreshGWZW_Handler(xmlHttp.responseText);
            }
            $(".modal-mask-box").hide();
            window.close();
        }
    }
}
///
function dataURLToBlob(dataurl) {
    // data:image/jpeg;base64,xxxxxx
    if (dataurl.indexOf(",") == -1) return;
    var arr = dataurl.split(',');
    var mime = arr[0].match(/:(.*?);/)[1];
    var bstr = atob(arr[1]);
    var n = bstr.length;
    var u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}
//初始化数据
function loadData() {
    $(".modal-mask-box").show();
    $(".body-right-box ul li").remove();
    clearCanvas(remarkContext);
    var postData = {
        controller: 'GB.LK.ODM.GWYY.GWYYPage'
        , action: 'GetPdfImgs'
        , args: [_fileId, _fileviewguid]
    };
    $.ajax({
        url: '/action.ashx?modulecode=GB.LK.ODM.GWYY.ODQFormBill&_dc=1500604748297'
        , type: 'POST'
        , dataType: 'JSON'
        , contentType: 'application/json; charset=UTF-8'
        , data: JSON.stringify(postData)
        , success: function (res) {
            if (res == null || res == undefined || res.Data == undefined || res.Data.length == 0) return;
            $.each(res.Data, function (index, item) {
                if (index == 0) {
                    $("#meetImg").attr("src", item);
                    $(".body-right-box ul").append("<li class='focus' pageNum='FilePage_"+(index+1)+"'><img src=\"" + item + "\"></li>");
                } else {
                    $(".body-right-box ul").append("<li pageNum='FilePage_"+(index+1)+"'><img src=\"" + item + "\"></li>");
                }
            });
        }
        , complete: function () {
            $(".modal-mask-box").hide();
        }
    });
}
//获取url中的参数
function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg);  //匹配目标参数
    if (r != null) return unescape(r[2]); return null; //返回参数值
}
//
function setX(x, referCanvas) {
    if (isNaN(x)) {
        return 0;
    }
    var imgwidth = referCanvas.width; //画布宽度
    if (imgwidth === 0) {
        imgwidth = pageObj.imgw;
    }
    return numberFormat((x / imgwidth), "0,0.000");
}
function setY(y, referCanvas) {
    if (isNaN(y)) {
        return 0;
    }
    var imgheight = referCanvas.height; //画布高度
    if (imgheight === 0) {
        imgheight = pageObj.imgh;
    }
    return numberFormat((y / imgheight), "0,0.000");
}
//根据指定宽度进行x值还原转换
function getX(x, referCanvas) {
    if (isNaN(x)) {
        return 0;
    }
    var imgWidth = referCanvas.width; //画布宽度
    return parseFloat(x) * imgWidth;
}
//根据指定高度进行y值还原转换
function getY(y, referCanvas) {
    if (isNaN(y)) {
        return 0;
    }
    var imgHeight = referCanvas.height; //画布高度
    return parseFloat(y) * imgHeight;
}
//
function numberFormat(n, t) {
    var s, i, r, u;
    if (n = parseFloat(n), s = -1 < t.indexOf(","), i = t.split("."), n = i.length > 1 ? n.toFixed(i[1].length) : n.toFixed(0), r = n.toString(), s) {
        i = r.split(".");
        var f = i[0], e = [], h = f.length, c = Math.floor(h / 3), o = f.length % 3 || 3;
        for (u = 0; u < h; u += o)
            u !== 0 && (o = 3), e[e.length] = f.substr(u, o), c -= 1;
        r = e.join(",");
        i[1] && (r += "." + i[1])
    }
    return r;
}
