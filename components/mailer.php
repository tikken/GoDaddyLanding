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
    $mail->setFrom('fastlol@support.com');
    $mail->Subject = 'Order fastlol';
    $mail->Body = 'Заказ от: <br/>' . $name . '<br/>' . $city . '<br/>' . $tel . '<br/>' . $email;

    $mail->send();
    if($mail->send()) 
        $res = "Email is sent";
    else
        try{
            // $to = 'support@fastlol.ru';
            $to = 'tikken23@gmail.com';
            $subject = 'order';
            $message = $mail->Body;

            $headers='From: noreply@rilburskryler.net \r\n';
            $headers.='X-Mailer: PHP/' . phpversion().'\r\n';
            $headers.= 'MIME-Version: 1.0' . "\r\n";
            $headers.= 'Content-type: text/html; charset=iso-8859-1 \r\n';

            mail($to, $subject, $message, $headers);
            
        } 
        catch (Exception $ex) {
            echo $ex->getMessage();
            $res = "something is wrong" . $mail->ErrorInfo;
        }
        
    exit(json_encode(array("response" => $res)));
?>