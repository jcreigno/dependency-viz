(function($){

    function formatArtifact (artifact){
        return artifact.groupId+':'+artifact.artifactId+':'+artifact.version;
    }
    
    function Context() {
        if (!(this instanceof Context)) return new Context();
        var self = this;
        var path = '';
        this.moveTo = function(point){
            path+='M'+point.x+' '+point.y;
            return self;
        };
        this.lineTo = function(point){
            path+='L'+point.x+' '+point.y;
            return self;
        };
        this.path = function(){
            return path;
        }
    };
    
    function Renderer(element,graph) {
        if (!(this instanceof Renderer)) return new Renderer();
        var self = this;
        self.el = $(element);
        self.paper = Raphael(self.el[0], self.el.width(), self.el.height());
        self.data = graph;
        
        var w = 7,radius=75;
        var atts = {'stroke-width':2,'stroke':'#000'};
        
        self.render = function (point){
            self.paper.clear();
            pt = point ||{x:self.paper.width/2,y:self.paper.height/2};
            if(self.data.children){
                var N = 8;
                var rad = (2*Math.PI)/N;
                var SQRT_5 = Math.sqrt(5);
                var phi = (1 + SQRT_5)/2;
                self.data.children.forEach(function (art,index){
                    var r = radius * Math.pow(phi,Math.floor(index/N)/SQRT_5);
                    var angle = (index%N)*rad + rad / (Math.floor(index/N)%2+1);
                    var pt1 = {x:pt.x + r * Math.cos(angle),y:pt.y+ r * Math.sin(angle)};
                    drawEdge(self.paper,art,pt,pt1);
                    drawNode(self.paper,art,pt1);
                    //render(paper,art,pt1);
                });
            }
            drawNode(self.paper,self.data,pt);
        }
        
        function drawNode(paper,node,pt){
            var c = paper.circle(pt.x,pt.y,w).attr({'stroke-width':2,'stroke':'#000','fill':'#ff8a00',cursor:'pointer'});
            var t = paper.text(pt.x,pt.y-(w*2),formatArtifact(node)).attr({stroke:'none',opacity:0.333,'font-size':'10px'});
            c.mouseover(function () {
                c.animate({scale: [1.2, 1.2, pt.x,pt.y]}, 100, "elastic");
                t.animate({opacity: 1}, 100, "elastic");
            }).mouseout(function () {
                c.animate({scale: [1, 1, pt.x,pt.y]}, 100, "elastic");
                t.animate({opacity: 0.333}, 100);
            });
        }
        function drawEdge(paper,node,from,to){
            paper.path(new Context().moveTo(from).lineTo(to).path()).attr(atts);
        }
        
        self.handler = {
          doresize:function(e){
            self.paper.setSize(self.el.width(), self.el.height());
            self.render();
            return false;
          },
          resizeTimeout: false,
          resized:function(e){
            if(self.handler.resizeTimeout !== false){
               clearTimeout(self.handler.resizeTimeout); 
            }
            self.handler.resizeTimeout = setTimeout(self.handler.doresize, 100);
          },
        }
    };
    
    $(document).ready(function(){
    
        $("#btDisplay").click(function(){
            var el = $("#viewport");
            var r = Raphael(el[0], el.width(), el.height());
            clearFilters();
            el.html('');
            el.append($('<div id="loading"><p><img src="imgs/ajax-loader.gif" /> Please Wait</p></div>'));
            $.getJSON('api/tree/'+$("#groupId").val()+'/'+$("#artifactId").val()+'/'+$("#version").val(), function(data) {
                document.renderer = new Renderer("#viewport",data);
                $(window).resize(document.renderer.handler.resized);
                document.renderer.render();
            }).error(function(data){
                if(data.status == 404){
                    el.append($('<p class="error"><span> Artifact not found ('+data.status+')</span></p>'));
                }else{
                    el.append($('<p class="error"><span>'+data.statusText+' ('+data.status+'): </span>'+ data.responseText+'</p>'));
                }
            }).complete(function(){
                $('#loading').remove();
            });
            
        });
        $("#btClear").click(function(){
            $("#viewport").html('');
            clearFilters();
        });
        
        $("#scopetest").click(function(){
            $('.test').slideToggle(400);
        });
        
        $("#scoperuntime").click(function(){
            $('.runtime').slideToggle(400);
        });
        if($("#groupId").val && $("#artifactId").val() && $("#version").val()){
            // submit user data.
            $("#btDisplay").click();
        }
    })
    
    function clearFilters() {
        $("input[type='checkbox']").each(function (){
            $(this)[0].checked = true;
        });
    }

})(this.jQuery)
