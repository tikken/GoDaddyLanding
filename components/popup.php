<div class="order" id="test-form" class="white-popup-block mfp-hide">

    <div class="order__form--wrapper">
        <div class="heading">
            <span>Вы заказываете</span>
        </div>

        <?php require('./components/item.php'); ?>

        <div class="order__wrapper">
            <form class="order__wrapper--form" action="save.php" method="post">
                <div class="form-group">
                    <div class="heading_form"><span>Заполните, пожалуйста, поля</span></div>
                </div>
                <div class="form-group" data-ivalid-message="Это поле обязательно для заполнения">
                    <input
                        data-required
                        type="text"
                        class="form-control"
                        id="name"
                        placeholder="Имя, Фамилия"
                    />
                </div>
                <div class="form-group" data-ivalid-message="Это поле обязательно для заполнения">
                    <input
                        data-required  
                        type="text"
                        class="form-control"
                        id="city"
                        placeholder="Город"
                    />
                </div>
                <div class="form-group" data-ivalid-message="Это поле обязательно для заполнения">
                    <input
                        data-phone
                        type="tel"
                        class="form-control"
                        id="tel"
                        placeholder="Телефон"
                        />
                </div>
                <div class="form-group" data-ivalid-message="Это поле обязательно для заполнения">
                    <input
                        data-email 
                        type="email"
                        class="form-control"
                        id="email"
                        placeholder="E-mail"
                        />
                </div>
                <div class="form-group" data-ivalid-message="Это поле обязательно для заполнения">
                    <span class="checkbox">
                        <input 
                            data-checked
                            type="checkbox" 
                            id="agreement"
                            >
                        <label class="agreement">Согласен с условиями <span>обработки персональных данных</span></label>
                    </span>
                </div>
                <div class="form-group">
                    <div class="g-recaptcha" data-sitekey="6LfEUMAUAAAAAHpyVX_q-UkMoELufTbW2GTlMhXT"></div>
                </div>

                <div class="form-group">
                    <input type="submit" value="Отправить" class="button main_button">
                </div>
            </form>
        </div>
    </div>

    <div class="success__form as-none">
        <div class="success__form--content">
            <div class="success__form--heading">
                <h1>Спасибо за заказ</h1>
            </div>
            <div class="text">
                <span>Благодарим вас за заказ, мы свяжемся с вами для уточнения заказа. Будем рады видеть вас снова!</span>
            </div>
            <div class="close">
                <span>Закрыть</span>
            </div>
        </div>
        <div class="decor1"></div>
        <div class="decor2"></div>
        <div class="decor3"></div>
    </div>
</div>