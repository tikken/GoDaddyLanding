(function () {
  'use strict';
  app.map = {
      /**
       * селекторы модуля
       */
      _selectors: {
        container: '.map',
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
        $(document).ready(this._simpleMap.bind(this));
      },
    // Map
      /**
       * Инициализация карты
       * @private
       */
      _simpleMap: function () {  
        ymaps.ready(ymaps_init);
        function ymaps_init () {
          var myMap = new ymaps.Map(map, {
              center: [59.89, 30.42],
              zoom: 17,
              type: "yandex#map",
              behaviors: ["default", "scrollZoom"]
          });
          myMap.geoObjects.add(new ymaps.Placemark([59.89, 30.42], {
            // balloonContent: '<span>Позвонить</span><strong><br/><a href="tel:+79115551212">+7 911 555-12-12</a></strong>'
        }, {
            preset: 'islands#dotIcon',
            iconColor: '#FF0090'
        }))
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