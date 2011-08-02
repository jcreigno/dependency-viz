(function($){

    function formatArtifact (artifact){
        return artifact.groupId+':'+artifact.artifactId+':'+artifact.version;
    }
    
    $(document).ready(function(){
    })
    
    function html(data){
        var res = '';
        if(data.children){
            res +='<ul>';
            data.children.forEach(function (art){
                res += '<li class='+art.scope+'>'+formatArtifact(art) +'</li>';
                res += html(art);
            });
            res +='</ul>';
        }
        return res;
    }
  
    $("#btDisplay").click(function(){
        var el = $("#viewport");
        el.html($('<h3>'+$("#groupId").val()+':'+$("#artifactId").val()+':'+$("#version").val()+'</h3>'));
        $.getJSON('api/tree/'+$("#groupId").val()+'/'+$("#artifactId").val()+'/'+$("#version").val(), function(data) {
            el.append($(html(data)));
        });
    });
    $("#btClear").click(function(){
        $("#viewport").html('');
    });

})(this.jQuery)
