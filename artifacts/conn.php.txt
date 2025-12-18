<?php
$conexion = mysql_connect($_SESSION['dbhost'].":".$_SESSION['dbport'], $_SESSION['dbuser'], $_SESSION['dbpass']) or die ("Error connecting database");
mysql_set_charset("utf8",$conexion);
mysql_select_db($_SESSION['dbname']);
?>