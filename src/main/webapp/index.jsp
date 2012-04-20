
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Maven dependencies visualization</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">

    <!-- Le styles -->
    <link href="css/bootstrap.css" rel="stylesheet">
    <style>
      body {
        padding-top: 60px; /* 60px to make the container go all the way to the bottom of the topbar */
      }
    </style>
    <link href="css/bootstrap-responsive.css" rel="stylesheet">

    <!-- Le HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
      <script src="//html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

    <!-- Le fav and touch icons -->
    <link rel="shortcut icon" href="images/favicon.ico">
    <link rel="apple-touch-icon" href="images/apple-touch-icon.png">
    <link rel="apple-touch-icon" sizes="72x72" href="images/apple-touch-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="114x114" href="images/apple-touch-icon-114x114.png">
  </head>

  <body>

    <div class="navbar navbar-fixed-top">
      <div class="navbar-inner">
        <div class="container">
          <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </a>
          <a class="brand" href="#">Dependency viz</a>
          <div class="nav-collapse">
            <!--ul class="nav">
              <li class="active"><a href="#">Home</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul-->
            <form class="navbar-search pull-left">
                <input type="text" title="groupId" id="groupId" name="groupId" class="input-medium search-query" placeholder="groupId" data-bind="value: groupId"/> 
                <input type="text" title ="artifactId" id="artifactId" name="artifactId" class="input-medium search-query" placeholder="artifactId" data-bind="value: artifactId"/>
                <input type="text" title ="version" id="version" name="version" class="input-medium search-query" placeholder="version" data-bind="value: version"/>
                <i title="Display dependency tree for artifact." id="btDisplay" class="icon-search icon-white"></i>
            </form>
          </div><!--/.nav-collapse -->
        </div>
      </div>
    </div>

    <div class="container">
      <!--h1>Bootstrap starter template</h1>
      <p>Use this document as a way to quick start any new project.<br> All you get is this message and a barebones HTML document.</p-->
      <div id="viewport">
        <h3><span data-bind="text : artifactName"></span>
    		<span> <a title="direct link" href="./?groupId=art.groupId&artifactId=art.artifactId&version=+art.version"><i class="icon-tags"></i></a></span>
        </h3>
      </div> 
    </div> <!-- /container -->
    <!-- Le javascript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="js/jquery.min.js"></script>
    <script src="js/knockout-2.0.0.js"></script>
    <script src="js/bootstrap.js"></script>
    <script src="js/raw.js"></script>
  </body>
</html>

