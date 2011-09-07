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
    
    $(document).ready(function(){
    
        $("#btDisplay").click(function(){
            var el = $("#viewport");
            var r = Raphael(el[0], el.width(), el.height());
            clearFilters();
            //el.html($('<h3>'+$("#groupId").val()+':'+$("#artifactId").val()+':'+$("#version").val()+'</h3>'));
            el.append($('<div id="loading"><p><img src="imgs/ajax-loader.gif" /> Please Wait</p></div>'));
            $.getJSON('api/tree/'+$("#groupId").val()+'/'+$("#artifactId").val()+'/'+$("#version").val(), function(data) {
                r.clear();
                render(data,r);
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
    var w = 5,radius=100;
    var atts = {'stroke-width':2,'stroke':'#000','opacity':0.333};
    function render(data, paper,point){
        pt = point ||{x:paper.width/2,y:paper.height/2};
        drawNode(paper,data,pt);
        if(data.children){
            var n = data.children.length;
            data.children.forEach(function (art,index){
                var pt1 = {x:pt.x + radius * Math.cos((2*index*Math.PI)/n),y:pt.y+ radius * Math.sin((2*index*Math.PI)/n)};
                drawNode(paper,art,pt1);
                drawEdge(paper,art,pt,pt1);
                //res += html(art);
            });
        }
    }
    
    function drawNode(paper,node,pt){
        paper.circle(pt.x,pt.y,w).attr({'stroke-width':2,'stroke':'#000','fill':'#ff8a00'});
        paper.text(pt.x,pt.y-(w*2),formatArtifact(node));
    }
    function drawEdge(paper,node,from,to){
        paper.path(new Context().moveTo(from).lineTo(to).path()).attr(atts);
    }

})(this.jQuery)
