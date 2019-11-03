(function () {
    'use strict';
    app.mailer = {
        /**
         * селекторы модуля
         */
        _selectors: {
          container: '.header',
        },
        /**
         * _init - флаг инициализации модуля
         */
        _init: false,
        /**
         * Функция инициализации модуля
         */
        init: function () {
          var
            $container = $(this._selectors.container);
  
          if ($container.length) {
            this._init = true;
            this._listener();
          }
        },
        /**
         * Постановка обработчиков событий
         * @private
         */
        _listener: function () {
          $(document).ready(this.collectData.bind(this));
        },
        /**
         * Сбор значений в обьект
         * @private
         */
        _ajax: function(obj) {
            $.ajax({ 
                url: 'mailer.php', 
                dataType: 'json',
                data: {
                  name: obj.name,
                  city: obj.city,
                  tel: obj.tel,
                  email: obj.mail
                },
                type: 'POST',
                success: function (data) {
                    if(data.error){
                        console.error(data.error);
                    }
                }
            });
        },
        /**
         * Сбор значений в обьект
         * @public
         */
        collectData: function (data) {  
            var obj = {};
            _.each(data, function(el) {
              if(el.id) {
                switch(el.id) {
                  case 'name' : obj.name = $(el).val();
                      break
                  case 'city' : obj.city = $(el).val();
                      break
                  case 'tel' : obj.tel = $(el).val();
                      break
                  case 'email' : obj.mail = $(el).val();
                      break
                }
              }
            });
            
            this._ajax(obj);
        },
      // Utils
        /**
         * Отрабатываем ресайз браузера
         */
        resize: function () {
          if (this._init && app.vars.trueResize) {
          }
        }
    };
  })();  