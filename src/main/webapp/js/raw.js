(function($, ko){

    function formatArtifact (artifact){
        return artifact.groupId+':'+artifact.artifactId+':'+artifact.version;
    }

    function AppViewModel() {
        this.groupId = ko.observable("");
        this.artifactId = ko.observable("");
        this.version = ko.observable("");

        this.artifactName = ko.computed(function(){
            return this.groupId()+':'+this.artifactId()+':'+this.version();
        },this);

    }

   
    $(document).ready(function(){
        // Activates knockout.js
        ko.applyBindings(new AppViewModel());
    });
    
    function clearFilters() {
        $("input[type='checkbox']").each(function (){
            $(this)[0].checked = true;
        });
    }
    
    function title (art){
    	return '<h3>'+art.groupId+':'+art.artifactId+':'+art.version
    			+'<span> <a title="direct link" href="./?groupId='+art.groupId
    			+'&artifactId='+art.artifactId
    			+'&version='+art.version+'"><i class="icon-tags"></i></a></span>'+'</h3>';
    }
    
    function html(data){
        var res = '';
        if(data.children){
            res +='<ul>';
            data.children.forEach(function (art){
                res += '<li class="'+art.scope+'" title="scope :'+ art.scope +'">'+formatArtifact(art) +
                    '<span style="display:none"> <a title="show subtree starting from this artifact" href="./?groupId='+art.groupId+'&artifactId='+art.artifactId+'&version='+art.version+
                    '"><i class="icon-tags"></i></a></span>'
                    + '</li>';
                res += html(art);
            });
            res +='</ul>';
        }
        return res;
    }

})(this.jQuery,this.ko);
