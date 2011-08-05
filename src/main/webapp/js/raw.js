(function($){

    function formatArtifact (artifact){
        return artifact.groupId+':'+artifact.artifactId+':'+artifact.version;
    }
    
    $(document).ready(function(){
    
        $("#btDisplay").click(function(){
            clearFilters();
            var el = $("#viewport");
            el.html($('<h3>'+$("#groupId").val()+':'+$("#artifactId").val()+':'+$("#version").val()+'</h3>'));
            $.getJSON('api/tree/'+$("#groupId").val()+'/'+$("#artifactId").val()+'/'+$("#version").val(), function(data) {
                el.append($(html(data)));
                $("li").each(function(e){
                    var next =  $(this).next();
                    if(next && next[0] && next[0].localName =='ul'){     
                        $(this).addClass('animateable').click(function(){next.slideToggle(400);});
                    }
                });
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
    })
    
    function clearFilters() {
        $("input[type='checkbox']").each(function (){
            $(this)[0].checked = true;
        });
    }
    
    function html(data){
        var res = '';
        if(data.children){
            res +='<ul>';
            data.children.forEach(function (art){
                res += '<li class="'+art.scope+'" title="scope :'+ art.scope +'">'+formatArtifact(art) +'</li>';
                res += html(art);
            });
            res +='</ul>';
        }
        return res;
    }

})(this.jQuery)
