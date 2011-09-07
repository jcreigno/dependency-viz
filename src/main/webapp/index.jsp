<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"
   "http://www.w3.org/TR/html4/strict.dtd">

<html lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title>Maven dependencies visualization</title>
	<link rel="stylesheet" href="css/common.css" type="text/css">
	<link rel="stylesheet" href="css/style.css" type="text/css">
</head>
<body>
  <div id="header">
    <input type="text" title ="groupId" id="groupId" name="groupId" value="${param.groupId}"/> 
    <input type="text" title ="artifactId" id="artifactId" name="artifactId" value="${param.artifactId}"/> 
    <input type="text" title ="version" id="version" name="version" value="${param.version}"/>
    <button type="button" name="btDisplay" id="btDisplay">Go !</button>
    <button type="button" name="btClear" id="btClear">Clear</button>
    <div id="filters">
        <span>filters &gt;</span>
        <div>
            <label for="scopecompile">compile</label>
            <input type="checkbox" id="scopecompile" name="scopecompile" disabled="disabled" checked="checked"></input>
        </div>
        <div>
            <label for="scopetest">test</label>
            <input type="checkbox" id="scopetest" name="scopetest" checked="checked"></input>
        </div>
        <div>
            <label for="scoperuntime">runtime</label>
            <input type="checkbox" id="scoperuntime" name="scoperuntime" checked="checked"></input>
        </div>
    </div>
  </div>
  <!--canvas id="viewport" width="800" height="600"></canvas-->
  <div id="viewport"> 
  </div> 
  <div id="footer">
  </div>
  <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js"></script>
  <!--script src="js/raphael-min.js"></script-->
  <script src="js/raw.js"></script>
</body>
</html>
