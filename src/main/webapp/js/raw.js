(function($, ko){

    function formatArtifact (artifact){
        return artifact.groupId+':'+artifact.artifactId+':'+artifact.version;
    }

    function AppViewModel(g,a,v,deps) {
        var self = this;
        self.groupId = ko.observable(g || '');
        self.artifactId = ko.observable(a || '');
        self.version = ko.observable(v || '');
        self.scope = '';
        self.dependencies = ko.observableArray(deps || []);
        self.defined = ko.computed(function(){
            return self.groupId() && self.artifactId() && self.version();
        });

        self.artifactName = ko.computed(function(){
            return [self.groupId(),self.artifactId(),self.version()].join(':');
        },self);

        self.url = ko.computed(function(){
            if(self.defined()){
                return [self.groupId(),self.artifactId(),self.version()].join('/');
            }
            return "";
        },self);

        self.gotoArtifact = function(){
            return location.hash = self.url();
        };
    }

    function createViewModel(art) {
        var res = new AppViewModel(art.groupId,art.artifactId,art.version);
        res.scope = art.scope;
        if(art.children && art.children.length>0){
           res.dependencies($.map(art.children,function(dep){
                return createViewModel(dep);
           }));
        }
        return res;
    }

    $(document).ready(function(){
        // Activates knockout.js
        var model = new AppViewModel();
        ko.applyBindings(model);
        var $viewport = $('#viewport');
        // handle apps events
        $viewport.on('treechanged', function(viewport) {
            $("li").each(function(e){
                var next =  $(this).next('ul');
				if(next.children('li').length>0){
					$(this).addClass('animateable').click(function(){next.slideToggle(400);});
				}else{ // cleanup dom...
					next.remove();
				}
            });
        }).on('loading', function() {
            $viewport.append($('<div id="loading"><p><img src="img/ajax-loader.gif" /> Downloading the Internet. Please Wait...</p></div>'));
        }).on('error', function(evt, data) {
            var msg = '<div id="error"><p class="error"><span class="label label-important">';
            if(data.status == 404){
                msg += 'Artifact not found ('+data.status+')</span>';
            }else{
                msg += data.statusText+' ('+data.status+'): </span>'+ data.responseText;
            }
            msg += '</p></div>';
            $viewport.append($(msg));
        });

        // Client-side routes    
        Sammy(function() {
            this.get('#:groupId/:artifactId/:version', function() {
                $viewport.trigger('loading');
                model.groupId(this.params.groupId);
                model.artifactId(this.params.artifactId);
                model.version(this.params.version);
                model.dependencies([]);
                if($('#error')){
                    $('#error').remove();
                }
                $.getJSON('api/tree/'+model.url(), function(data) {
				if(data.children){
					model.dependencies($.map(data.children,createViewModel));
				}
                $viewport.trigger('treechanged',data);

                }).error(function(data){
                    $viewport.trigger('error',data);
                }).complete(function(){
                    $('#loading').remove();
                });
            });
            this.get('',function(){});
        }).run();
    });

})(this.jQuery,this.ko);
