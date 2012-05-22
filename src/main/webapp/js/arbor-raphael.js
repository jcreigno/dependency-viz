//  A project template for using arbor.js
//

(function($){


    function formatArtifact (artifact){
        return artifact.groupId+':'+artifact.artifactId+':'+artifact.version;
    }
    
    function Context() {
        if (!(this instanceof Context)){
            return new Context();
        }
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
        };
    }

    function tree (art){
        var e = {}, n = {},i;
        var stack = [];
        var child;
        stack.push(art);
        n[formatArtifact(art)]={root:true};
        while(stack.length>0){
            var a = stack.pop();
            var name = formatArtifact(a);
            if(!e[name]){
                e[name] = {};
            }
            if(a.children){
                for(i=0;i<a.children.length;i++){
                    child = a.children[i];
                    stack.push(e[name][formatArtifact(child)] = a.children[i]);
                }        
            }
        }
        return {edges:e,nodes:n};
    }

  var Renderer = function(canvas){
    var domElement = $(canvas);
    var paper = Raphael(domElement[0], domElement.width(), domElement.height());
    //var ctx = canvas.getContext("2d");
    var particleSystem;
    
    

    var that = {
      init:function(system){
        //
        // the particle system will call the init function once, right before the
        // first frame is to be drawn. it's a good place to set up the canvas and
        // to pass the canvas size to the particle system
        //
        // save a reference to the particle system for use in the .redraw() loop
        particleSystem = system;

        // inform the system of the screen dimensions so it can map coords for us.
        // if the canvas is ever resized, screenSize should be called again with
        // the new dimensions
        particleSystem.screenSize(domElement.width(), domElement.height()); 
        particleSystem.screenPadding(40); // leave an extra 80px of whitespace per side
        // set up some event handlers to allow for node-dragging
        that.initMouseHandling();
      },
      

      edgesAtts : {
            def : {'stroke-width':2,'stroke':'#000','opacity':0.333},
            test : {'stroke-width':2,'stroke':'#7dc850','opacity':0.333,'stroke-dasharray':'. '},
            runtime : {'stroke-width':2,'stroke':'rgb(200,125,125)','opacity':0.333}
      },
      nodesAtts : {
            def : {'stroke-width':2,'stroke':'#000','fill':'#ff8a00'},
            root: {'stroke-width':2,'stroke':'#000','fill':'#000'}
      },
      clear : function(){
        paper.clear();
      },
      redraw:function(){
        // 
        // redraw will be called repeatedly during the run whenever the node positions
        // change. the new positions for the nodes can be accessed by looking at the
        // .p attribute of a given node. however the p.x & p.y values are in the coordinates
        // of the particle system rather than the screen. you can either map them to
        // the screen yourself, or use the convenience iterators .eachNode (and .eachEdge)
        // which allow you to step through the actual node objects but also pass an
        // x,y point in the screen's coordinate system
        // 
        //ctx.fillStyle = "white"
        //ctx.fillRect(0,0, canvas.width, canvas.height)
        //ctx.shadowColor="#ddd";
        //ctx.shadowOffsetX="-2";
        //ctx.shadowOffsetY="2";
        //ctx.shadowBlur = "2"
        //paper.clear();
       
        particleSystem.eachNode(function(node, pt){
          var w = 5;
          // node: {mass:#, p:{x,y}, name:"", data:{}}
          // pt:   {x:#, y:#}  node position in screen coords
          if(!node.g){
              // draw a rectangle centered at pt
              var s = {
                'circle' : paper.circle(pt.x,pt.y,w).attr(node.data.root ? that.nodesAtts.root : that.nodesAtts.def),
                'text' :   paper.text(pt.x,pt.y-(w*2), node.name.split(':').join('\n'))
              };
              node.g = s;
          }else{
              node.g.circle.attr({cx: pt.x,cy:pt.y});
              node.g.text.attr({x: pt.x, y: pt.y-(w*2)});
          }
        });
        
        particleSystem.eachEdge(function(edge, pt1, pt2){
          // edge: {source:Node, target:Node, length:#, data:{}}
          // pt1:  {x:#, y:#}  source position in screen coords
          // pt2:  {x:#, y:#}  target position in screen coords
          if(edge.g){
              edge.g.remove();
          }
          var atts = that.edgesAtts[edge.data.scope] || that.edgesAtts.def;
          edge.g = paper.path(new Context().moveTo(pt1).lineTo(pt2).path()).attr(atts);
        });
      },
      
      initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        var dragged = null;

        // set up a handler object that will initially listen for mousedowns then
        // for moves and mouseups while dragging
        var handler = {
          clicked:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top);
            dragged = particleSystem.nearest(_mouseP);

            if (dragged && dragged.node !== null){
              // while we're dragging, don't let physics move the node
              dragged.node.fixed = true;
            }

            $(canvas).bind('mousemove', handler.dragged);
            $(window).bind('mouseup', handler.dropped);

            return false;
          },
          dragged:function(e){
            var pos = $(canvas).offset();
            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top);

            if (dragged && dragged.node !== null){
              var p = particleSystem.fromScreen(s);
              dragged.node.p = p;
            }

            return false;
          },
          dropped:function(e){
            if (dragged===null || dragged.node===undefined) {
                return;
            }
            if (dragged.node !== null) {
                dragged.node.fixed = false;
            }
            dragged.node.tempMass = 1000;
            dragged = null;
            $(canvas).unbind('mousemove', handler.dragged);
            $(window).unbind('mouseup', handler.dropped);
            _mouseP = null;
            return false;
          },
          doresize:function(e){
            var el = $(canvas);
            particleSystem.screenSize(el.width(), el.height()); 
            paper.setSize(el.width(), el.height());
            particleSystem.renderer.redraw();
            return false;
          },
          resizeTimeout: false,
          resized:function(e){
            if(handler.resizeTimeout !== false){
               clearTimeout(handler.resizeTimeout); 
            }
            handler.resizeTimeout = setTimeout(handler.doresize, 300);
          }
          
        };
        
        // start listening
        $(canvas).mousedown(handler.clicked);
        $(window).resize(handler.resized);
      }
    };
    return that;
  };
  
    

  $(document).ready(function(){
    var sys = arbor.ParticleSystem(); // create the system with sensible repulsion/stiffness/friction
    sys.parameters({stiffness:100, repulsion:200, gravity:false, dt:0.015}); // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#graph"); // our newly created renderer will have its .init() method called shortly by sys...
    document.system = sys;

    $('#viewport').on('treechanged', function(event, data) {
        //$('#graph').height(Math.max(500,data.children.length*50));
        document.system.graft(tree(data));
    }).on('loading',function(){
        document.system.renderer.clear();
        document.system.prune(function(){return true;});
    });

    //sys.graft({edges:artifact});
    //var graph = {edges:sys.renderer.tree(artifact)};
    //sys.graft(sys.renderer.tree(artifact));

    // or, equivalently:
    //
    //sys.graft({
    //   edges:{
    //    'commons-digester:commons-digester:1.6':{ 
    //         'commons-beanutils:commons-beanutils:1.5':{},
    //         'commons-logging:commons-logging:1.0.1':{},
    //         'commons-collections:commons-collections:2.3':{},
    //         'xml-apis:xml-apis:1.1':{}
    //     },
    //     'commons-beanutils:commons-beanutils:1.5':{
    //            'commons-lang:commons-lang:1.0':{}
    //     }
    //   }
    //})
    
  });

})(this.jQuery);
