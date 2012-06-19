(function($, ko){

    function AppViewModel() {
        var self = this;
        self.artifact = new ArtifactViewModel();
        self.config = new Config();
    }

    function Config(){
        var self = this;
        self.scopes = { 'compile': ko.observable(true)
            , 'test':ko.observable(true)
            , 'runtime':ko.observable(true) 
        };
    }

    function ArtifactViewModel(g,a,v,deps) {
        var self = this;
        self.groupId = ko.observable(g || '');
        self.artifactId = ko.observable(a || '');
        self.version = ko.observable(v || '');
        self.scope = ko.observable('compile');
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
        var res = new ArtifactViewModel(art.groupId,art.artifactId,art.version);
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
        model = new AppViewModel();
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

        $("#scopetest").click(function(){
            $('li.test').slideToggle(400);
        });
        
        $("#scoperuntime").click(function(){
            $('li.runtime').slideToggle(400);
        });


        // Client-side routes    
        Sammy(function() {
            this.get('#:groupId/:artifactId/:version', function() {
                $viewport.trigger('loading');
                model.artifact.groupId(this.params.groupId);
                model.artifact.artifactId(this.params.artifactId);
                model.artifact.version(this.params.version);
                model.artifact.dependencies([]);
                if($('#error')){
                    $('#error').remove();
                }
                $.getJSON('api/tree/'+model.artifact.url(), function(data) {
				    if(data.children){
					    model.artifact.dependencies($.map(data.children,createViewModel));
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

        //setup typehead : thanks @geuis
    var autocomplete = $('#version').typeahead({source:[],items:15
        }).on('keyup', function(ev){
            ev.stopPropagation();
            ev.preventDefault();

            //filter out up/down, tab, enter, and escape keys
            if( $.inArray(ev.keyCode,[40,38,9,13,27]) === -1 ){
                var self = $(this);
                //set typeahead source to empty
                self.data('typeahead').source = [];
                //active used so we aren't triggering duplicate keyup events
                if( !self.data('active') && self.val().length > 0){

                    self.data('active', true);

                    //Do data request. Insert your own API logic here.
                    $.getJSON('api/tree/'+model.artifact.groupId()+'/'+model.artifact.artifactId(),{
                        q: $(this).val()
                    }, function(data) {

                        //set this to true when your callback executes
                        self.data('active',true);

                        //Filter out your own parameters. Populate them into an array, since this is what typeahead's source requires
                        //var arr = [],
                        //    i=data.results.length;
                        //while(i--){
                        //    arr[i] = data.results[i].text
                        //}
                        var group = model.artifact.groupId();
                        var artifact = model.artifact.artifactId();
                        self.data('typeahead').select = function () {
                          var val = this.$menu.find('.active').attr('data-value')
                          this.$element
                            .val(this.updater(val))
                            .change();
                          this.hide();
                          model.artifact.gotoArtifact();
                          return this;
                        };
                        //set your results into the typehead's source 
                        self.data('typeahead').source = data;

                        //trigger keyup on the typeahead to make it search
                        self.trigger('keyup');

                    }).complete(function(){
                        //All done, set to false to prepare for the next remote query.
                        self.data('active', false);
                    });

                }
            }
        });


    });

})(this.jQuery,this.ko);
