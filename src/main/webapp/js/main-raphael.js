//  A project template for using arbor.js
//

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
        particleSystem = system

        // inform the system of the screen dimensions so it can map coords for us.
        // if the canvas is ever resized, screenSize should be called again with
        // the new dimensions
        particleSystem.screenSize(domElement.width(), domElement.height()); 
        particleSystem.screenPadding(80) // leave an extra 80px of whitespace per side
        
        // set up some event handlers to allow for node-dragging
        that.initMouseHandling()
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
        paper.clear();
        particleSystem.eachEdge(function(edge, pt1, pt2){
          // edge: {source:Node, target:Node, length:#, data:{}}
          // pt1:  {x:#, y:#}  source position in screen coords
          // pt2:  {x:#, y:#}  target position in screen coords
          var atts = {'stroke-width':2,'stroke':'#000','opacity':0.333};
          if(edge.data.scope=='test'){
            atts.stroke = "#7dc850";
            atts["stroke-dasharray"] = ". ";
          }else if (edge.data.scope=='runtime'){
            atts.stroke = "rgb(200,125,125)";
          }else{
            //ctx.strokeStyle = "rgba(0,0,0, .333)";
          }
          //ctx.lineWidth = 2
          //ctx.beginPath()
          //ctx.moveTo(pt1.x, pt1.y)
          //ctx.lineTo(pt2.x, pt2.y)
          //ctx.stroke()
          paper.path(new Context().moveTo(pt1).lineTo(pt2).path()).attr(atts);
        })

        particleSystem.eachNode(function(node, pt){
          // node: {mass:#, p:{x,y}, name:"", data:{}}
          // pt:   {x:#, y:#}  node position in screen coords

          // draw a rectangle centered at pt
          var w = 5
          //ctx.beginPath();
          //ctx.fillStyle = (node.data.root) ? "black":"orange";
          //ctx.strokeStyle = "rgba(0,0,0, .333)";
          //ctx.lineWidth = 2;
          //ctx.fillRect(pt.x-w/2, pt.y-w/2, w,w)
          //ctx.arc(pt.x, pt.y, w/2, 0, Math.PI * 2, false);
          //ctx.closePath();
          //ctx.fill();
          //ctx.fillText(node.name, pt.x-(ctx.measureText(node.name).width/2), pt.y-w);
          //ctx.stroke();
          paper.circle(pt.x,pt.y,w).attr({'stroke-width':2,'stroke':'#000','fill':(node.data.root) ? '#000':'#ff8a00'});
          paper.text(pt.x,pt.y-(w*2),node.name.split(':').join('\n'));
        })    			
      },
      
      initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        var dragged = null;

        // set up a handler object that will initially listen for mousedowns then
        // for moves and mouseups while dragging
        var handler = {
          clicked:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            dragged = particleSystem.nearest(_mouseP);

            if (dragged && dragged.node !== null){
              // while we're dragging, don't let physics move the node
              dragged.node.fixed = true
            }

            $(canvas).bind('mousemove', handler.dragged)
            $(window).bind('mouseup', handler.dropped)

            return false
          },
          dragged:function(e){
            var pos = $(canvas).offset();
            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

            if (dragged && dragged.node !== null){
              var p = particleSystem.fromScreen(s)
              dragged.node.p = p
            }

            return false
          },
          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
            if (dragged.node !== null) dragged.node.fixed = false
            dragged.node.tempMass = 1000
            dragged = null
            $(canvas).unbind('mousemove', handler.dragged)
            $(window).unbind('mouseup', handler.dropped)
            _mouseP = null
            return false
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
            handler.resizeTimeout = setTimeout(handler.doresize, 200);
          },
          
        }
        
        // start listening
        $(canvas).mousedown(handler.clicked);
        $(window).resize(handler.resized);

      },
    
      // build graph from dependencies...
      tree:function(art){
        var e = {}, n = {};
        var stack = [];
        stack.push(art);
        n[formatArtifact(art)]={root:true};
        while(stack.length>0){
            var a = stack.pop();
            var name = formatArtifact(a);
            if(!e[name]){
                e[name] = {};
            }
            if(a.children){
                for(var i=0;i<a.children.length;i++){
                    var child = a.children[i];
                    stack.push(e[name][formatArtifact(child)] = a.children[i]);
                }        
            }
        }
        return {edges:e,nodes:n};
      }
    }
    return that
  }    

  $(document).ready(function(){
    var sys = arbor.ParticleSystem() // create the system with sensible repulsion/stiffness/friction
    sys.parameters({stiffness:1000, repulsion:200, gravity:false, dt:0.015}) // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...
    document.system = sys;

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
    
  })
  
  $("#btDisplay").click(function(){
    $.getJSON('api/tree/'+$("#groupId").val()+'/'+$("#artifactId").val()+'/'+$("#version").val(), function(data) {
        document.system.graft(document.system.renderer.tree(data));
    });
  });
  $("#btClear").click(function(){
    document.system.prune(function(node){return true;});
  });

})(this.jQuery)
