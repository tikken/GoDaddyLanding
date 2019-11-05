(function () {
    'use strict';
    app.stat = {
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
        _listener: function () {},
        /**
         * Инициализация
         * @public
         */
        simpleStat: function (id) {
          try {
            window.ym(56056423, 'reachGoal', 'preorder');
            console.log('ya+');
          } catch(e) {
            console.error('yandex counter stat failed');
          }
          try {
            gtag('event','preorder', {
              'event_category': 'preorder',
              'event_label': 'preorder',
              'value': '1'
            });
            console.log('ga+');
          } catch(e) {
            console.error('google analytics failed');
          }
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