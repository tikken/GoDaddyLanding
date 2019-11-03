<?php 
    use PHPMailer\PHPMailer\PHPMailer;

    if(isset($_POST['name']) && isset($_POST['email'])) {
        $name = $_POST['name'];
        $city = $_POST['city'];
        $tel = $_POST['tel'];
        $email = $_POST['email'];
    }
    require_once('components/PHPMailer/PHPMailer.php');
    require_once('components/PHPMailer/SMTP.php');
    require_once('components/PHPMailer/Exception.php');

    $mail = new PHPMailer();

    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'tikken23@gmail.com';
    $mail->Password = '';
    $mail->Port = 465;
    $mail->SMTPSecure = 'ssl';
    $mail->isHTML(true);
    $mail->AddAddress('support@fastlol.ru');
    $mail->setFrom('customer');
    $mail->Subject = 'Order fastlol';
    $mail->Body = 'Заказ от: <br/>' . $name . '<br/>' . $city . '<br/>' . $tel . '<br/>' . $email;

    $mail->send();
    if($mail->send()) 
        $res = "Email is sent via smtp";
    else
        try{
            $headers  = "From: fastlol < support@fastlol.ru >\n";
            $headers .= "X-Sender: fastlol < support@fastlol.ru >\n";
            $headers .= 'X-Mailer: PHP/' . phpversion();
            $headers .= "X-Priority: 1\n"; // Urgent message!
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=iso-8859-1\n";

            mail('support@fastlol.ru', 'customer', $mail->Body, $headers);
            $res = "Email is sent via mail()";
        } 
        catch (Exception $ex) {
            echo $ex->getMessage();
            $res = "something is wrong" . $mail->ErrorInfo;
        }
        
    exit(json_encode(array("response" => $res)));
?>