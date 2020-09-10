<?php
    session_start();
    
    $session_id = session_id();
    $uploadOK = false;
    if(isset($_FILES["doc"])) {
        $t = time();
        $ext = pathinfo($_FILES["doc"]["name"],PATHINFO_EXTENSION);
        $target_dir = "../docs/";
        $target_file = $target_dir . $session_id . $t .".". $ext;
        $doc_path = $session_id . $t .".". $ext;
        if(move_uploaded_file($_FILES["doc"]["tmp_name"],$target_file))
            $uploadOK = true;
        else
            $uploadOK = false;
    }
    require "../connection.php";
    
    $roll = $conn->real_escape_string($_POST["roll"]);
    $name = $conn->real_escape_string($_POST["name"]);
    $dept = $conn->real_escape_string($_POST["department"]);
    $course = $conn->real_escape_string($_POST["course"]);
    $sem = $conn->real_escape_string($_POST["sem"]); 
    //echo $uploadOK;
    if($uploadOK == true) {
        
        $sql = "INSERT INTO `student` (`rollno`,`name`,`department`,`programme`,`semester`,`status`,`docpath`) VALUES('$roll','$name','$dept','$course','$sem','Disabled','$doc_path')";
        $result = $conn->query($sql);
        if($result) {
            $sql = "INSERT INTO `hostel_fee_reciept` VALUES ('$roll','$sem','$doc_path')";
            $conn->query($sql);
            echo '<html><body><script>window.location="acknowledge.html"</script></body></html>';
        }
        else {
            unlink($target_file);
            echo '<html><body><script>window.location="acknowledge.html"</script></body></html>';
        } 
    }
    else {
        header("Location : err.html");
    }
?>