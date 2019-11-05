var
  app = {};

(function () {
  'use strict';
  // vars
    var
      resizeTimeout = 0,
      _heightResize = 0,
      _widthResize = 0,
      _init = false;
    var
      $window;
    /**
     *
     * @type {{windowWidth: number, windowHeight: number, breakpointState: number, trueResize: boolean}}
     */
    app.vars = {
      windowWidth: 0,
      windowHeight: 0,
      breakpointState: 1,
      trueResize: false,
      heightResize: false,
      scroll_width: 0,
      hasStorage: false
    };
    app.EVENTS = {
      INIT_COMPLETE: 'init_complete',

      AMOUNT_CHANGE: 'amount_change',
      CHECKBOX_CHANGE: 'checkbox-change',
      CLIENT_LOADED: 'client-loaded',
      CLIENT_PHOTOS_LOADED: 'client-photos-loaded',
      CLIENT_UPDATED: 'client-updated',
      HEADER_ATTR_RECALC: 'header_attr_recalc',
      POPUP_OPENED: 'popup-opened',
      TAB_CHANGE: 'tab_change',
      VISIT_ADDED: 'visit-added',
      INIT_LOADED_CONTENT: 'init-loaded-content',
      CABINET_FORM_SUBMIT: 'cabinet-form-submit'
    };
    /**
     *
     * @type {{body: string, header: string, main: string, footer: string}}
     */
    app.selectors = {
      body: 'body',
      header: '.header',
      main: '.main',
      footer: '.footer'
    };
    /**
     * @type {{body: jQuery, header: jQuery, main: jQuery, footer: jQuery}}
     *
     */
    app.elements = {};
    app.breakpoints = {
      tablet: 768,
      laptop: 1240,
      desktop: 1440
    };
    app.modules = [];

  // Initializing
    app.init = function () {
      if (!_init) {
        _init = true;
        $window = $(window);
        this.elements = this.elementsParse(this.selectors);
        this.vars.langGuid = this.elements.body.data('langGuid');

        this.vars.windowWidth = $window.outerWidth();

        if (this.vars.windowWidth >= app.breakpoints.tablet) {
          this.vars.breakpointState = 2;
        }
        if (this.vars.windowWidth >= app.breakpoints.laptop) {
          this.vars.breakpointState = 3;
        }
        if (this.vars.windowWidth >= app.breakpoints.desktop) {
          this.vars.breakpointState = 4;
        }

        if ('sessionStorage' in window && window.sessionStorage) {
          this.vars.hasStorage = true;
        }

        this.modulesInit();
        this.listener();
        this.resize();
        this._loadState();
      }
    };
    app.listener = function () {
      var
        $body = $('body');

      $window.resize(this._handleResize.bind(this));
      $body.on('submit', '.api-form', this.apiFormSubmit.bind(this));
    };
    app.modulesInit = function () {
      var
        that = this;

      _.each(app, function (item, module) {
        if (_.has(app, module)) {
          if ((_.isObject(app[module]) || _.isFunction(app[module])) && _.isFunction(app[module].init)) {
            that.modules.push(app[module]);
          }
        }
      });
      this.modules = _.sortBy(this.modules, function (modulesItem) {
        return modulesItem.moduleOrder;
      });
      _.each(this.modules, function (modulesItem) {
        modulesItem.init();
      });
    };
    app.initLoadedContent = function () {
      _.each(this.modules, function (module) {
        if (_.isFunction(module.initLoadedContent)) {
          module.initLoadedContent();
        }
      });
    };

  // Browser utils
    app._handleResize = function () {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(function () {
        app.resize();
      }, 100);
    };
    app.resize = function () {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(function () {
        this.vars.scroll_width = app.getScrollbarWidth();
        this.vars.windowWidth = $window.outerWidth();
        this.vars.windowHeight = $window.outerHeight();

        if (app.vars.windowHeight - _heightResize >= 100 || app.vars.windowHeight - _heightResize <= -100 || _widthResize !== app.vars.windowWidth) {
          app.vars.trueResize = true;
        }
        if (_widthResize === app.vars.windowWidth && _heightResize !== app.vars.windowHeight) {
          app.vars.heightResize = true;
        }
        _heightResize = app.vars.windowHeight;
        _widthResize = app.vars.windowWidth;

        this.vars.breakpointState = 1;
        if (this.vars.windowWidth >= app.breakpoints.tablet) {
          this.vars.breakpointState = 2;
        }
        if (this.vars.windowWidth >= app.breakpoints.laptop) {
          this.vars.breakpointState = 3;
        }
        if (this.vars.windowWidth >= app.breakpoints.desktop) {
          this.vars.breakpointState = 4;
        }
        this.setMainBlockMinHeight();
        _.each(app, function (module) {
          if (_.has(app, module)) {
            if ((_.isObject(app[module]) || _.isFunction(app[module])) && _.isFunction(app[module].resize)) {
              app[module].resize();
            }
          }
        });
        app.vars.trueResize = false;
        app.vars.heightResize = false;
      }.bind(this), 100);
    };
    app.getScrollbarWidth = function () {
      var
        outer = document.createElement('div');
      var
        widthNoScroll,
        inner,
        widthWithScroll;

      outer.style.visibility = 'hidden';
      outer.style.width = '100px';
      outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps

      document.body.appendChild(outer);

      widthNoScroll = outer.offsetWidth;
      // force scrollbars
      outer.style.overflow = 'scroll';

      // add innerdiv
      inner = document.createElement('div');
      inner.style.width = '100%';
      outer.appendChild(inner);

      widthWithScroll = inner.offsetWidth;

      // remove divs
      outer.parentNode.removeChild(outer);

      return widthNoScroll - widthWithScroll;
    };
    /**
     *
     * @returns {boolean}
     */
    app.isMobile = function () {

      return this.vars.breakpointState === 1;
    };
    /**
     *
     * @returns {boolean}
     */
    app.isTablet = function () {

      return this.vars.breakpointState === 2;
    };
    /**
     *
     * @returns {boolean}
     */
    app.isLaptop = function () {

      return this.vars.breakpointState >= 3;
    };
    /**
     *
     * @returns {boolean}
     */
    app.isDesktop = function () {

      return this.vars.breakpointState === 4;
    };

  // Forms utils
    app.formParse = function ($el) {
      var
        formData = {},
        serializedData = $el.serializeArray();

      _.each(serializedData, function (item) {
        formData[item.name] = item.value;
      });
      return formData;
    };

    /**
     * Отправка API запроса со сбором данных из формы
     * @param e
     */
    app.apiFormSubmit = function (e, params) {
      var
        config = params || {},
        $form = config.$form || $(e.currentTarget),
        requestData = {
          type: 'POST',
          url: '/',
          beforeSend: this.apiFormBeforeSend.bind(this, $form)
        };

      if (e && e.preventDefault) {
        e.preventDefault();
      }
      $form.find('.api__form__message').html('');
      requestData.dataType = config.dataType || '';
      requestData.success = config.success ? config.success.bind(this, $form) : this.apiFormOnSuccess.bind(this, $form);
      requestData.error = config.error ? config.error.bind(this, $form) : this.apiFormOnError.bind(this, $form);
      requestData.complete = config.complete ? config.complete.bind(this, $form) : null;

      $form.find('input.phone, [name="form[Телефон]"]').each(function () {
        var
          $input = $(this),
          value = $input.val();

        if ($input.data('mask-init') && value) {
          $input.data('mask-init', false);
          $input.inputmask('remove');
          $input.val('+7' + value);
        }
      });
      if (config.files_present) {
        requestData.data = new FormData($form[0]);
        requestData.cache = false;
        requestData.processData = false;
        requestData.contentType = false;
      } else {
        requestData.data = app.formParse($form);
      }

      $.ajax(requestData);
    };
    /**
     * Проверяем заполнены ли необходимые поля в форме
     * @param $form
     * @returns {boolean}
     * @private
     */
    app.apiFormBeforeSend = function ($form) {
      var
        state = app.validator.formValidate([], $form);

      if (!state) {
        return false;
      }
      $form.addClass('preloader');

      return true;
    };
    app.apiFormOnSuccess = function ($form, data) {
      var
        event = $form.data('event');

      if (_.isObject(data)) {
        $form.find('.api__form__message').html('<div class="error__message">При отправке запроса произошла ошибка:' + data.response.message + '</div>');
        $form.removeClass('preloader');
        return;
      }
      if (event) {
        $('body').trigger(event);
      }
      $form.replaceWith(data);
    };
    app.apiFormOnError = function ($form, data) {
      var
        message = 'При отправке формы произошла ошибка: ' + JSON.stringify(data),
        messageBlock = ('<div class="error__message">' + message + '</div>');

      $form.removeClass('preloader');
      $form.find('.api__form__message').html(messageBlock);
    };

  // DOM utils
    /**
     *
     * find DOM elements
     * @param selectors {{}}
     * @param [parent] {*|jQuery|HTMLElement}
     * @returns {{any}}
     */
    app.elementsParse = function (selectors, parent) {
      var
        _parent = $(parent).length ? $(parent) : $('body'),
        _result = {};

      _.each(selectors, function (val, key) {
        var
          $item = _parent.find(val);

        if ($item.length) {
          _result[key] = $item;
        } else if (_parent.is(val)) {
          _result[key] = _parent;
        } else {
          _result[key] = $item;
        }
      });
      return _result;
    };
    /**
     * calculate summary width of element's children
     * @param parent {jQuery}
     */
    app.getChildrenWidth = function ($parent) {
      var
        width = 0,
        $children = $parent.children();

      $children.each(function (id, element) {
        var
          elemWidth = $(element).outerWidth();

        width += elemWidth;
      });
      return width;
    };
    app.setMainBlockMinHeight = function () {
      var
        $header = $(app.selectors.header),
        $main = $(app.selectors.main),
        $footer = $(app.selectors.footer),
        headerHeight = $header.outerHeight(true),
        footerHeight = $footer.outerHeight(true);

      if ($main.attr('data-no-calc')) {
        return;
      }

      $main.css('min-height', 'calc(100vh - ' + (headerHeight + footerHeight) + ('px)'));
    };

  // CMS utils

  // Style utils
    /**
     * Предзагружаем прелоадер
     */
    app.preloader = function () {
      var
        img = document.createElement('img');

      img.src = '/content/img/preloader.svg';
    };

  // Formatting utils
    /**
     *
     * @returns {String}
     */
    app.padNum = function (number, size) {
      var
        result = number.toString();

      while (result.length < size) {
        result = '0' + result;
      }
      return result;
    };

  // Chuncks
    app.messageBox = function (data, extraClass) {
      var
        message = data,
        popupClass = 'message';

      if (extraClass.length) {
        popupClass += ' ' + extraClass;
      }
      if (_.isString(message)) {
        message = $('<div class="' + popupClass + '">' + message + '</div>');
      }
      $.magnificPopup.open({
        items: {
          src: message,
          type: 'inline',
          midClick: true,
          closeBtnInside: true
        }
      });
    };
    /**
     * Проверка авторизации
     * @param {Object} data
     * @private
     */
    app.checkStatus = function (data) {
      var
        promise;

      promise = new Promise(function (resolve, reject) {
        var
          _data;
        var
          reload = false;

        try {
          _data = JSON.parse(data);
        } catch (e) {
          _data = data;
        }

        if (_.isObject(_data)) {

          if (_data.status) {
            //console.log('status', data.status);
            if (_data.status === 401 || _data.status === 403 || _data.status === 408) {
              reload = true;
            }
          }
          if (_data.response) {
            //console.log('response', data.response);
            if (_data.response.code) {
              if (_data.response.code === 400) {
                reload = true;
              }
            }
          }

          if (reload) {
            window.location.reload();
          }

          resolve(_data);
        } else {
          resolve(_data);
        }

      });
      return promise;
    };
    /**
     * Возврат данных из storage
     * @param {String} storageKey - ключ
     */
    app.getFromStorage = function (storageKey) {
      var
        promise;

      promise = new Promise(function (resolve, reject) {
        var
          storageData = false;
        var
          now,
          expiration;

        try {
          if (app.vars.hasStorage) {
            if (sessionStorage.getItem(storageKey)) {
              storageData = JSON.parse(sessionStorage.getItem(storageKey));

              now = new Date();
              expiration = new Date(storageData.timestamp);
              expiration.setMinutes(expiration.getMinutes() + 60);

              // clear too old data
                if (now.getTime() > expiration.getTime()) {
                  storageData = false;
                  sessionStorage.removeItem(storageKey);
                }
            }
          }
        } catch (e) {
          storageData = false;
        }

        resolve(storageData);
      });
      return promise;
    };
    /**
     * Возврат опредленного ключа из JSON, полученного из API
     * @param {Object} data
     * @param {*} data.response
     * @param {String} data.key
     * @param {String} data.storage
     */
    app.prepareDataFromAPI = function (data) {
      var
        promise;

      promise = new Promise(function (resolve, reject) {

        app.checkStatus(data.response).then(function (_result) {

          if (!_.isObject(_result)) {
            reject();
          }

          if (_result.status === 'error') {
            if (data.storageKey && app.vars.hasStorage) {
              sessionStorage.removeItem(data.storageKey);
            }
            reject();
          } else {
            if (data.storageKey && app.vars.hasStorage) {
              try {
                sessionStorage.setItem(data.storageKey, JSON.stringify({
                  timestamp: new Date(),
                  content: _result[data.key]
                }));
              } catch (e) {
                // do nothing
              }
            }
            resolve(_result[data.key]);
          }
        });

      });
      return promise;
    };

  // Module factory
    /**
     * Конструктор модулей в которых предусмотрено наличие нескольких независимых друг от друга "контейнеров"
     *
     * @param ModuleFactory - конструктор в котором содержится основная логика модуля
     * @constructor
     */
    app.Module = function (ModuleFactory) {
      this._init = false;
      this._instances = [];
      this._container_selector = ModuleFactory.prototype._selectors.container;
      this.ModuleFactory = ModuleFactory;
    };

    app.Module.prototype = {
      init: function ($contentContainers) {
        var
          $containers = $contentContainers;

        if (!$contentContainers) {
          $containers = $(this._container_selector);
        }

        if ($containers.length) {
          this._init = true;
          $containers.each(function (i, item) {
            var
              instance = new this.ModuleFactory($(item));
            this._instances.push(instance);
          }.bind(this));
        }
      },

      /**
       * Инициализируем контент который не был инициализирован ранее, например подгруженный аяксом
       */
      initLoadedContent: function () {
        var
          $nonInitialized = $(this._container_selector).filter(function () {
            return $(this).data('initialized') !== true;
          });

        if ($nonInitialized.length) {
          this.init($nonInitialized);
        }
      },
      resize: function () {
        if (this._init) {
          _.each(this._instances, function (item) {
            if (_.isFunction(item.resize)) {
              item.resize();
            }
          });
        }
      }
    };

  // State
    /**
     *
     * Выставляем флаг загрузки приложения
     * @private
     */
    app._loadState = function () {
      $('body').trigger(app.EVENTS.INIT_COMPLETE);
      $('body').addClass('app-load');
    };

})();

$(document).ready(function () {
 app.init();
});

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
(function () {
	'use strict';
	app.popup = {
		/**
		 * селекторы модуля
		 */
		_selectors: {
		  container: '.header',
		  menuTrigger: '.menu-icon',
		  closePopup: '.close',
		  submit: '.main_button',
		  form: '#test-form',
		  input: '.form-control',
		  popup_trigger: '.popup-with-form'
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
		  $(document).ready(this._initialization.bind(this));
		  
		  $(this._selectors.popup_trigger).on('click', this._getSelectedItem.bind(this));
		  $(this._selectors.menuTrigger).on('click', this._blockScroll.bind(this));
		  $(this._selectors.closePopup).on('click', this._handle_close.bind(this));
		  $(this._selectors.submit).on('click', this._validateFields.bind(this));
		  $(this._selectors.input).on('focus', this._removeBorder.bind(this));
		},
		//utils
		_getSelectedItem: function(e) {
			
			var item = e.target.dataset.image;
			var destionation = $('#test-form').find('.image')[0];
			destionation.style.backgroundImage = 'url(' + item + ')';

			var price = e.target.dataset.price;	
			var oldPrice = e.target.dataset.priceold;

			$('#test-form').find('.price__new')[0].children[0].textContent = price;
			$('#test-form').find('.price__old')[0].children[0].textContent = oldPrice;

			var title = e.target.dataset.title;
			$('#test-form').find('.heading__popup')[0].children[0].textContent = title;
		},
		_removeBorder: function(e) {
			$(e.target).css('border', '');
		},
		_validateFields: function(e) {
			e.preventDefault();
			var form = $('.order__wrapper--form')[0];
			var state;
			try {
				app.validator.formValidate([], form);
				state = true;

			} catch(e) {
				state = false;
				
				if(e.message.indexOf('required') > 0) {
					var inputs = $(form).find('.form-control');
					_.each(inputs, function(el) {
						if($(el).val() === '') {
							$(el).css('border', '1px solid red');
						}
					})
				}
				if(e.message.indexOf('phone') > 0) {
					$('#tel').css('border', '1px solid red');
				}
				if(e.message.indexOf('email') > 0) {
					$('#email').css('border', '1px solid red');
				} 
				if(e.message.indexOf('checked') > 0) {
					var checkbox = $(form).find('.agreement')[0];
					$(checkbox).css('color', 'red');
				}
			}
			if(state) {
				var inputs = $(form).find('.form-control');
				app.mailer.collectData(inputs);
				this._changeContent();
			}
		},
		_changeContent: function() {
			var item = $('.order__form--wrapper');
					   $(item).toggleClass('as-none');
	
			var thankYou = $('.success__form');
						   $(thankYou).toggleClass('as-none');
				
				app.stat.simpleStat();
		},	
		_handle_close: function() {
			$.magnificPopup.close();
		},
		_blockScroll: function() {
			var item = document.body;
				$(item).toggleClass('completly_block');
		},
		/**
		 * Инициализация модуля
		 * @private
		 */
		_initialization: function () {  
			$('.popup-with-form').magnificPopup({
				type: 'inline',
				preloader: false,
				focus: '#name',
				callbacks: {
					close: function() {
						var item = document.body
							$(item).removeClass('block_scroll');
					},
					beforeClose: function() {
						$('.order__form--wrapper').removeClass('as-none');
						$('.success__form').addClass('as-none');
					},
					beforeOpen: function() {
						var item = document.body
							$(item).addClass('block_scroll');
							
						if($(window).width() < 700) {
							this.st.focus = false;
						} else {
							this.st.focus = '#name';
						}
					}
				}
			});
		},
		/**
		 * Отрабатываем ресайз браузера
		 */
		resize: function () {
		  if (this._init && app.vars.trueResize) {
		  }
		}
	};
  })();  
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
(function () {
    'use strict';
  
    app.validator = {
      validateMessage: '',
      config: {
        selectorFieldItem: '.form-group, .form-control',
        classInvalid: 'invalid',
        classValid: 'valid'
      },
      validArray: {},
      /**
       *
       * @param data
       * @param config
       */
      validate: function (data, config) {
        var
          result = true;

          console.warn(data, config);
        
        app.validator.parseMessage();
        _.each(config, function (rules, name) {
          var
            validate;

            if (data.hasOwnProperty(name)) {
              validate = this.parseRules(rules);
            if (!this.valid(validate, data[name])) {
              result = false;
            }
          }
        }.bind(this));
  
        return result;
      },
      valid: function(rules, data) {
        var
          result = true;
  
        app.validator.parseMessage();
        _.each(rules, function(rule) {
          if (!rule(data)) {
            result = false;
          }
        });
        return result;
      },
      parseMessage: function() {
        if (!app.validator.validateMessage) {
          app.validator.validateMessage = $('.validate-message').data();
        }
      },
      parseRules: function (rulesStr) {
        var
          rules = rulesStr.trim().split(' '),
          resultRulles = [];
  
        _.each(rules, function (rule) {
          resultRulles.push(this.parseRule(rule));
        }.bind(this));
        return resultRulles;
      },
      parseRule: function(rule) {
        var
          _rule,
          _val;
  
        if (rule.indexOf('(') > -1) {
          _rule = rule.substring(0, rule.indexOf('('));
          _val = rule.substring(rule.indexOf('(') + 1, rule.indexOf(')') -1);
          if(_.isFunction(this.validateFunction[_rule])){
            return this.validateFunction[_rule].bind(this, _val);
          } else {
            console.warn('Функция валидации не найдена - ' + _rule);
            return this.defaultFunction;
          }
        } else {
          if (_.isFunction(this.validateFunction[rule])) {
            return this.validateFunction[rule];
          } else {
            console.warn('Функция валидации не найдена - ' + rule);
            return this.defaultFunction;
          }
        }
      },
      validateFunction: {
        date: function (val) {
          return _.isDate(val);
        },
        float: function (val) {
          return validator.isFloat(val);
        },
        int: function (val) {
          return validator.isInt(val);
        },
        number: function (val) {
          return validator.isNumeric(val);
        },
        string: function (val) {
          return _.isString(val);
        },
        noEmpty: function (val) {
          return !_.isEmpty(val);
        },
        boolean: function (val) {
          return _.isBoolean(val);
        },
        required: function (val) {
          if (_.isString(val)) {
            val = val.trim();
          }
          return !!val;
        },
        email: function (val) {
          var
            pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
  
          return pattern.test(val);
        },
        phone: function (val) {
          var
            checkedString = val.replace(/[- )(]/g,''),
            regex = /^((\+7|7|8|)+([0-9]){10,12})$/; // {10,12} - допустимое количество цифр в номере
          var
            result;
  
          result = regex.test(checkedString);
          return result;
        },
        valid: function(val, dataVal){
          return dataVal;
        },
        checked: function (val, dataVal, el) {
          return $(el).prop('checked');
        },
        orRequired: function(val, dataVal, el){
          var
            result = app.validator.validateFunction.required(val, dataVal, el);
          var
            item;
          if (!result) {
            item = _.findWhere(app.validator.validArray, {name: dataVal});
            if (item) {
              result = app.validator.validateFunction.required(item.value);
            }
          }
          return result;
        }
      },
      invalidTextFunction: {
        date: function (val) {
          return app.validator.validateMessage.date;
        },
        float: function (val) {
          return app.validator.validateMessage.float;
        },
        int: function (val) {
          return app.validator.validateMessage.int;
        },
        number: function (val) {
          return app.validator.validateMessage.number;
        },
        string: function (val) {
          return app.validator.validateMessage.string;
        },
        noEmpty: function (val) {
          return app.validator.validateMessage.notEmpty;
        },
        boolean: function (val) {
          return app.validator.validateMessage.boolean;
        },
        required: function (val) {
          return  app.validator.validateMessage.required;
        },
        checked: function (val) {
          return app.validator.validateMessage.checked;
        },
        email: function (val) {
          return app.validator.validateMessage.email;
        },
        phone: function (val){
          return app.validator.validateMessage.phone;
        },
        orRequired: function(value, ruleVal, elem)  {
          return $(elem).data('orRequiredMessage');
        }
      },
      defaultFunction: function() {
        return true;
      },
      formValidate: function(array, $form, silent) {
        var
          that = this,
          allValid = true;
  
        app.validator.parseMessage();
        that.validArray = [];
        $($form).find('input, select, textarea').each(function() {
          var
            $elem = $(this);
  
          that.validArray.push({
            elem: $elem,
            rules: $elem.data(),
            value: $elem.val(),
            name: $elem.attr('name')
          });
        });
        _.each(that.validArray, function(el) {
          var
            _elemValid = true;
  
          _.each(el.rules, function (ruleVal, ruleName) {
            var
              $parent = el.elem.parents(that.config.selectorFieldItem);
            var
              text;
  
            if (_.isFunction(that.validateFunction[ruleName]) && _elemValid) {
              _elemValid = that.validateFunction[ruleName](el.value, ruleVal, el.elem);
  
              if (!_elemValid) {
                allValid = false;
                if (!silent) {
                  text = that.invalidTextFunction[ruleName](el.value, ruleVal, el.elem);
                  $parent.addClass(that.config.classInvalid).removeClass(that.config.classValid).attr('data-ivalid-message', text);
                }
              } else {
                $parent.removeClass(that.config.classInvalid).addClass(that.config.classValid);
              }
            }
          });
          if (!_elemValid) {
          }
        });
        return allValid;
      },
      inputValidate: function($input) {
        var
          that = this,
          valid = true;

        app.validator.parseMessage();
        this.validArray = [];
  
        this.validArray.push({
          elem: $input,
          rules: $input.data(),
          value: $input.val(),
          name: $input.attr('name')
        });
  
        _.each(that.validArray, function(el) {
          var
            _elemValid = true;
  
          _.each(el.rules, function (ruleVal, ruleName) {
            var
              $parent = el.elem.parents(that.config.selectorFieldItem);
            var
              text;
  
            if (_.isFunction(that.validateFunction[ruleName]) && _elemValid) {
              _elemValid = that.validateFunction[ruleName](el.value, ruleVal, el.elem);
  
              if (!_elemValid) {
                valid = false;
                  text = that.invalidTextFunction[ruleName](el.value, ruleVal, el.elem);
                  $parent.addClass(that.config.classInvalid).removeClass(that.config.classValid).attr('data-ivalid-message', text);
              } else {
                $parent.removeClass(that.config.classInvalid).addClass(that.config.classValid);
              }
            }
          });
        });
        return valid;
      }
    };
  })();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4vaW5kZXguanMiLCJtYWluL21vZHVsZXMvbWFpbGVyLmpzIiwibWFpbi9tb2R1bGVzL21hcC5qcyIsIm1haW4vbW9kdWxlcy9wb3B1cC5qcyIsIm1haW4vbW9kdWxlcy9zdGF0aXN0aWNzLmpzIiwibWFpbi9tb2R1bGVzL3ZhbGlkYXRvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXJcbiAgYXBwID0ge307XG5cbihmdW5jdGlvbiAoKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gdmFyc1xuICAgIHZhclxuICAgICAgcmVzaXplVGltZW91dCA9IDAsXG4gICAgICBfaGVpZ2h0UmVzaXplID0gMCxcbiAgICAgIF93aWR0aFJlc2l6ZSA9IDAsXG4gICAgICBfaW5pdCA9IGZhbHNlO1xuICAgIHZhclxuICAgICAgJHdpbmRvdztcbiAgICAvKipcbiAgICAgKlxuICAgICAqIEB0eXBlIHt7d2luZG93V2lkdGg6IG51bWJlciwgd2luZG93SGVpZ2h0OiBudW1iZXIsIGJyZWFrcG9pbnRTdGF0ZTogbnVtYmVyLCB0cnVlUmVzaXplOiBib29sZWFufX1cbiAgICAgKi9cbiAgICBhcHAudmFycyA9IHtcbiAgICAgIHdpbmRvd1dpZHRoOiAwLFxuICAgICAgd2luZG93SGVpZ2h0OiAwLFxuICAgICAgYnJlYWtwb2ludFN0YXRlOiAxLFxuICAgICAgdHJ1ZVJlc2l6ZTogZmFsc2UsXG4gICAgICBoZWlnaHRSZXNpemU6IGZhbHNlLFxuICAgICAgc2Nyb2xsX3dpZHRoOiAwLFxuICAgICAgaGFzU3RvcmFnZTogZmFsc2VcbiAgICB9O1xuICAgIGFwcC5FVkVOVFMgPSB7XG4gICAgICBJTklUX0NPTVBMRVRFOiAnaW5pdF9jb21wbGV0ZScsXG5cbiAgICAgIEFNT1VOVF9DSEFOR0U6ICdhbW91bnRfY2hhbmdlJyxcbiAgICAgIENIRUNLQk9YX0NIQU5HRTogJ2NoZWNrYm94LWNoYW5nZScsXG4gICAgICBDTElFTlRfTE9BREVEOiAnY2xpZW50LWxvYWRlZCcsXG4gICAgICBDTElFTlRfUEhPVE9TX0xPQURFRDogJ2NsaWVudC1waG90b3MtbG9hZGVkJyxcbiAgICAgIENMSUVOVF9VUERBVEVEOiAnY2xpZW50LXVwZGF0ZWQnLFxuICAgICAgSEVBREVSX0FUVFJfUkVDQUxDOiAnaGVhZGVyX2F0dHJfcmVjYWxjJyxcbiAgICAgIFBPUFVQX09QRU5FRDogJ3BvcHVwLW9wZW5lZCcsXG4gICAgICBUQUJfQ0hBTkdFOiAndGFiX2NoYW5nZScsXG4gICAgICBWSVNJVF9BRERFRDogJ3Zpc2l0LWFkZGVkJyxcbiAgICAgIElOSVRfTE9BREVEX0NPTlRFTlQ6ICdpbml0LWxvYWRlZC1jb250ZW50JyxcbiAgICAgIENBQklORVRfRk9STV9TVUJNSVQ6ICdjYWJpbmV0LWZvcm0tc3VibWl0J1xuICAgIH07XG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAdHlwZSB7e2JvZHk6IHN0cmluZywgaGVhZGVyOiBzdHJpbmcsIG1haW46IHN0cmluZywgZm9vdGVyOiBzdHJpbmd9fVxuICAgICAqL1xuICAgIGFwcC5zZWxlY3RvcnMgPSB7XG4gICAgICBib2R5OiAnYm9keScsXG4gICAgICBoZWFkZXI6ICcuaGVhZGVyJyxcbiAgICAgIG1haW46ICcubWFpbicsXG4gICAgICBmb290ZXI6ICcuZm9vdGVyJ1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQHR5cGUge3tib2R5OiBqUXVlcnksIGhlYWRlcjogalF1ZXJ5LCBtYWluOiBqUXVlcnksIGZvb3RlcjogalF1ZXJ5fX1cbiAgICAgKlxuICAgICAqL1xuICAgIGFwcC5lbGVtZW50cyA9IHt9O1xuICAgIGFwcC5icmVha3BvaW50cyA9IHtcbiAgICAgIHRhYmxldDogNzY4LFxuICAgICAgbGFwdG9wOiAxMjQwLFxuICAgICAgZGVza3RvcDogMTQ0MFxuICAgIH07XG4gICAgYXBwLm1vZHVsZXMgPSBbXTtcblxuICAvLyBJbml0aWFsaXppbmdcbiAgICBhcHAuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghX2luaXQpIHtcbiAgICAgICAgX2luaXQgPSB0cnVlO1xuICAgICAgICAkd2luZG93ID0gJCh3aW5kb3cpO1xuICAgICAgICB0aGlzLmVsZW1lbnRzID0gdGhpcy5lbGVtZW50c1BhcnNlKHRoaXMuc2VsZWN0b3JzKTtcbiAgICAgICAgdGhpcy52YXJzLmxhbmdHdWlkID0gdGhpcy5lbGVtZW50cy5ib2R5LmRhdGEoJ2xhbmdHdWlkJyk7XG5cbiAgICAgICAgdGhpcy52YXJzLndpbmRvd1dpZHRoID0gJHdpbmRvdy5vdXRlcldpZHRoKCk7XG5cbiAgICAgICAgaWYgKHRoaXMudmFycy53aW5kb3dXaWR0aCA+PSBhcHAuYnJlYWtwb2ludHMudGFibGV0KSB7XG4gICAgICAgICAgdGhpcy52YXJzLmJyZWFrcG9pbnRTdGF0ZSA9IDI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMudmFycy53aW5kb3dXaWR0aCA+PSBhcHAuYnJlYWtwb2ludHMubGFwdG9wKSB7XG4gICAgICAgICAgdGhpcy52YXJzLmJyZWFrcG9pbnRTdGF0ZSA9IDM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMudmFycy53aW5kb3dXaWR0aCA+PSBhcHAuYnJlYWtwb2ludHMuZGVza3RvcCkge1xuICAgICAgICAgIHRoaXMudmFycy5icmVha3BvaW50U3RhdGUgPSA0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCdzZXNzaW9uU3RvcmFnZScgaW4gd2luZG93ICYmIHdpbmRvdy5zZXNzaW9uU3RvcmFnZSkge1xuICAgICAgICAgIHRoaXMudmFycy5oYXNTdG9yYWdlID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubW9kdWxlc0luaXQoKTtcbiAgICAgICAgdGhpcy5saXN0ZW5lcigpO1xuICAgICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgICAgICB0aGlzLl9sb2FkU3RhdGUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGFwcC5saXN0ZW5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhclxuICAgICAgICAkYm9keSA9ICQoJ2JvZHknKTtcblxuICAgICAgJHdpbmRvdy5yZXNpemUodGhpcy5faGFuZGxlUmVzaXplLmJpbmQodGhpcykpO1xuICAgICAgJGJvZHkub24oJ3N1Ym1pdCcsICcuYXBpLWZvcm0nLCB0aGlzLmFwaUZvcm1TdWJtaXQuYmluZCh0aGlzKSk7XG4gICAgfTtcbiAgICBhcHAubW9kdWxlc0luaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXJcbiAgICAgICAgdGhhdCA9IHRoaXM7XG5cbiAgICAgIF8uZWFjaChhcHAsIGZ1bmN0aW9uIChpdGVtLCBtb2R1bGUpIHtcbiAgICAgICAgaWYgKF8uaGFzKGFwcCwgbW9kdWxlKSkge1xuICAgICAgICAgIGlmICgoXy5pc09iamVjdChhcHBbbW9kdWxlXSkgfHwgXy5pc0Z1bmN0aW9uKGFwcFttb2R1bGVdKSkgJiYgXy5pc0Z1bmN0aW9uKGFwcFttb2R1bGVdLmluaXQpKSB7XG4gICAgICAgICAgICB0aGF0Lm1vZHVsZXMucHVzaChhcHBbbW9kdWxlXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMubW9kdWxlcyA9IF8uc29ydEJ5KHRoaXMubW9kdWxlcywgZnVuY3Rpb24gKG1vZHVsZXNJdGVtKSB7XG4gICAgICAgIHJldHVybiBtb2R1bGVzSXRlbS5tb2R1bGVPcmRlcjtcbiAgICAgIH0pO1xuICAgICAgXy5lYWNoKHRoaXMubW9kdWxlcywgZnVuY3Rpb24gKG1vZHVsZXNJdGVtKSB7XG4gICAgICAgIG1vZHVsZXNJdGVtLmluaXQoKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgYXBwLmluaXRMb2FkZWRDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgXy5lYWNoKHRoaXMubW9kdWxlcywgZnVuY3Rpb24gKG1vZHVsZSkge1xuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKG1vZHVsZS5pbml0TG9hZGVkQ29udGVudCkpIHtcbiAgICAgICAgICBtb2R1bGUuaW5pdExvYWRlZENvbnRlbnQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAvLyBCcm93c2VyIHV0aWxzXG4gICAgYXBwLl9oYW5kbGVSZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAocmVzaXplVGltZW91dCkge1xuICAgICAgICBjbGVhclRpbWVvdXQocmVzaXplVGltZW91dCk7XG4gICAgICB9XG4gICAgICByZXNpemVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFwcC5yZXNpemUoKTtcbiAgICAgIH0sIDEwMCk7XG4gICAgfTtcbiAgICBhcHAucmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHJlc2l6ZVRpbWVvdXQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHJlc2l6ZVRpbWVvdXQpO1xuICAgICAgfVxuICAgICAgcmVzaXplVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnZhcnMuc2Nyb2xsX3dpZHRoID0gYXBwLmdldFNjcm9sbGJhcldpZHRoKCk7XG4gICAgICAgIHRoaXMudmFycy53aW5kb3dXaWR0aCA9ICR3aW5kb3cub3V0ZXJXaWR0aCgpO1xuICAgICAgICB0aGlzLnZhcnMud2luZG93SGVpZ2h0ID0gJHdpbmRvdy5vdXRlckhlaWdodCgpO1xuXG4gICAgICAgIGlmIChhcHAudmFycy53aW5kb3dIZWlnaHQgLSBfaGVpZ2h0UmVzaXplID49IDEwMCB8fCBhcHAudmFycy53aW5kb3dIZWlnaHQgLSBfaGVpZ2h0UmVzaXplIDw9IC0xMDAgfHwgX3dpZHRoUmVzaXplICE9PSBhcHAudmFycy53aW5kb3dXaWR0aCkge1xuICAgICAgICAgIGFwcC52YXJzLnRydWVSZXNpemUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfd2lkdGhSZXNpemUgPT09IGFwcC52YXJzLndpbmRvd1dpZHRoICYmIF9oZWlnaHRSZXNpemUgIT09IGFwcC52YXJzLndpbmRvd0hlaWdodCkge1xuICAgICAgICAgIGFwcC52YXJzLmhlaWdodFJlc2l6ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgX2hlaWdodFJlc2l6ZSA9IGFwcC52YXJzLndpbmRvd0hlaWdodDtcbiAgICAgICAgX3dpZHRoUmVzaXplID0gYXBwLnZhcnMud2luZG93V2lkdGg7XG5cbiAgICAgICAgdGhpcy52YXJzLmJyZWFrcG9pbnRTdGF0ZSA9IDE7XG4gICAgICAgIGlmICh0aGlzLnZhcnMud2luZG93V2lkdGggPj0gYXBwLmJyZWFrcG9pbnRzLnRhYmxldCkge1xuICAgICAgICAgIHRoaXMudmFycy5icmVha3BvaW50U3RhdGUgPSAyO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnZhcnMud2luZG93V2lkdGggPj0gYXBwLmJyZWFrcG9pbnRzLmxhcHRvcCkge1xuICAgICAgICAgIHRoaXMudmFycy5icmVha3BvaW50U3RhdGUgPSAzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnZhcnMud2luZG93V2lkdGggPj0gYXBwLmJyZWFrcG9pbnRzLmRlc2t0b3ApIHtcbiAgICAgICAgICB0aGlzLnZhcnMuYnJlYWtwb2ludFN0YXRlID0gNDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldE1haW5CbG9ja01pbkhlaWdodCgpO1xuICAgICAgICBfLmVhY2goYXBwLCBmdW5jdGlvbiAobW9kdWxlKSB7XG4gICAgICAgICAgaWYgKF8uaGFzKGFwcCwgbW9kdWxlKSkge1xuICAgICAgICAgICAgaWYgKChfLmlzT2JqZWN0KGFwcFttb2R1bGVdKSB8fCBfLmlzRnVuY3Rpb24oYXBwW21vZHVsZV0pKSAmJiBfLmlzRnVuY3Rpb24oYXBwW21vZHVsZV0ucmVzaXplKSkge1xuICAgICAgICAgICAgICBhcHBbbW9kdWxlXS5yZXNpemUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBhcHAudmFycy50cnVlUmVzaXplID0gZmFsc2U7XG4gICAgICAgIGFwcC52YXJzLmhlaWdodFJlc2l6ZSA9IGZhbHNlO1xuICAgICAgfS5iaW5kKHRoaXMpLCAxMDApO1xuICAgIH07XG4gICAgYXBwLmdldFNjcm9sbGJhcldpZHRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyXG4gICAgICAgIG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICB2YXJcbiAgICAgICAgd2lkdGhOb1Njcm9sbCxcbiAgICAgICAgaW5uZXIsXG4gICAgICAgIHdpZHRoV2l0aFNjcm9sbDtcblxuICAgICAgb3V0ZXIuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgICAgb3V0ZXIuc3R5bGUud2lkdGggPSAnMTAwcHgnO1xuICAgICAgb3V0ZXIuc3R5bGUubXNPdmVyZmxvd1N0eWxlID0gJ3Njcm9sbGJhcic7IC8vIG5lZWRlZCBmb3IgV2luSlMgYXBwc1xuXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG91dGVyKTtcblxuICAgICAgd2lkdGhOb1Njcm9sbCA9IG91dGVyLm9mZnNldFdpZHRoO1xuICAgICAgLy8gZm9yY2Ugc2Nyb2xsYmFyc1xuICAgICAgb3V0ZXIuc3R5bGUub3ZlcmZsb3cgPSAnc2Nyb2xsJztcblxuICAgICAgLy8gYWRkIGlubmVyZGl2XG4gICAgICBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgaW5uZXIuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gICAgICBvdXRlci5hcHBlbmRDaGlsZChpbm5lcik7XG5cbiAgICAgIHdpZHRoV2l0aFNjcm9sbCA9IGlubmVyLm9mZnNldFdpZHRoO1xuXG4gICAgICAvLyByZW1vdmUgZGl2c1xuICAgICAgb3V0ZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChvdXRlcik7XG5cbiAgICAgIHJldHVybiB3aWR0aE5vU2Nyb2xsIC0gd2lkdGhXaXRoU2Nyb2xsO1xuICAgIH07XG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBhcHAuaXNNb2JpbGUgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIHJldHVybiB0aGlzLnZhcnMuYnJlYWtwb2ludFN0YXRlID09PSAxO1xuICAgIH07XG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBhcHAuaXNUYWJsZXQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIHJldHVybiB0aGlzLnZhcnMuYnJlYWtwb2ludFN0YXRlID09PSAyO1xuICAgIH07XG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBhcHAuaXNMYXB0b3AgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIHJldHVybiB0aGlzLnZhcnMuYnJlYWtwb2ludFN0YXRlID49IDM7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGFwcC5pc0Rlc2t0b3AgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIHJldHVybiB0aGlzLnZhcnMuYnJlYWtwb2ludFN0YXRlID09PSA0O1xuICAgIH07XG5cbiAgLy8gRm9ybXMgdXRpbHNcbiAgICBhcHAuZm9ybVBhcnNlID0gZnVuY3Rpb24gKCRlbCkge1xuICAgICAgdmFyXG4gICAgICAgIGZvcm1EYXRhID0ge30sXG4gICAgICAgIHNlcmlhbGl6ZWREYXRhID0gJGVsLnNlcmlhbGl6ZUFycmF5KCk7XG5cbiAgICAgIF8uZWFjaChzZXJpYWxpemVkRGF0YSwgZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgZm9ybURhdGFbaXRlbS5uYW1lXSA9IGl0ZW0udmFsdWU7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmb3JtRGF0YTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog0J7RgtC/0YDQsNCy0LrQsCBBUEkg0LfQsNC/0YDQvtGB0LAg0YHQviDRgdCx0L7RgNC+0Lwg0LTQsNC90L3Ri9GFINC40Lcg0YTQvtGA0LzRi1xuICAgICAqIEBwYXJhbSBlXG4gICAgICovXG4gICAgYXBwLmFwaUZvcm1TdWJtaXQgPSBmdW5jdGlvbiAoZSwgcGFyYW1zKSB7XG4gICAgICB2YXJcbiAgICAgICAgY29uZmlnID0gcGFyYW1zIHx8IHt9LFxuICAgICAgICAkZm9ybSA9IGNvbmZpZy4kZm9ybSB8fCAkKGUuY3VycmVudFRhcmdldCksXG4gICAgICAgIHJlcXVlc3REYXRhID0ge1xuICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgICBiZWZvcmVTZW5kOiB0aGlzLmFwaUZvcm1CZWZvcmVTZW5kLmJpbmQodGhpcywgJGZvcm0pXG4gICAgICAgIH07XG5cbiAgICAgIGlmIChlICYmIGUucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuICAgICAgJGZvcm0uZmluZCgnLmFwaV9fZm9ybV9fbWVzc2FnZScpLmh0bWwoJycpO1xuICAgICAgcmVxdWVzdERhdGEuZGF0YVR5cGUgPSBjb25maWcuZGF0YVR5cGUgfHwgJyc7XG4gICAgICByZXF1ZXN0RGF0YS5zdWNjZXNzID0gY29uZmlnLnN1Y2Nlc3MgPyBjb25maWcuc3VjY2Vzcy5iaW5kKHRoaXMsICRmb3JtKSA6IHRoaXMuYXBpRm9ybU9uU3VjY2Vzcy5iaW5kKHRoaXMsICRmb3JtKTtcbiAgICAgIHJlcXVlc3REYXRhLmVycm9yID0gY29uZmlnLmVycm9yID8gY29uZmlnLmVycm9yLmJpbmQodGhpcywgJGZvcm0pIDogdGhpcy5hcGlGb3JtT25FcnJvci5iaW5kKHRoaXMsICRmb3JtKTtcbiAgICAgIHJlcXVlc3REYXRhLmNvbXBsZXRlID0gY29uZmlnLmNvbXBsZXRlID8gY29uZmlnLmNvbXBsZXRlLmJpbmQodGhpcywgJGZvcm0pIDogbnVsbDtcblxuICAgICAgJGZvcm0uZmluZCgnaW5wdXQucGhvbmUsIFtuYW1lPVwiZm9ybVvQotC10LvQtdGE0L7QvV1cIl0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyXG4gICAgICAgICAgJGlucHV0ID0gJCh0aGlzKSxcbiAgICAgICAgICB2YWx1ZSA9ICRpbnB1dC52YWwoKTtcblxuICAgICAgICBpZiAoJGlucHV0LmRhdGEoJ21hc2staW5pdCcpICYmIHZhbHVlKSB7XG4gICAgICAgICAgJGlucHV0LmRhdGEoJ21hc2staW5pdCcsIGZhbHNlKTtcbiAgICAgICAgICAkaW5wdXQuaW5wdXRtYXNrKCdyZW1vdmUnKTtcbiAgICAgICAgICAkaW5wdXQudmFsKCcrNycgKyB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKGNvbmZpZy5maWxlc19wcmVzZW50KSB7XG4gICAgICAgIHJlcXVlc3REYXRhLmRhdGEgPSBuZXcgRm9ybURhdGEoJGZvcm1bMF0pO1xuICAgICAgICByZXF1ZXN0RGF0YS5jYWNoZSA9IGZhbHNlO1xuICAgICAgICByZXF1ZXN0RGF0YS5wcm9jZXNzRGF0YSA9IGZhbHNlO1xuICAgICAgICByZXF1ZXN0RGF0YS5jb250ZW50VHlwZSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxdWVzdERhdGEuZGF0YSA9IGFwcC5mb3JtUGFyc2UoJGZvcm0pO1xuICAgICAgfVxuXG4gICAgICAkLmFqYXgocmVxdWVzdERhdGEpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICog0J/RgNC+0LLQtdGA0Y/QtdC8INC30LDQv9C+0LvQvdC10L3RiyDQu9C4INC90LXQvtCx0YXQvtC00LjQvNGL0LUg0L/QvtC70Y8g0LIg0YTQvtGA0LzQtVxuICAgICAqIEBwYXJhbSAkZm9ybVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgYXBwLmFwaUZvcm1CZWZvcmVTZW5kID0gZnVuY3Rpb24gKCRmb3JtKSB7XG4gICAgICB2YXJcbiAgICAgICAgc3RhdGUgPSBhcHAudmFsaWRhdG9yLmZvcm1WYWxpZGF0ZShbXSwgJGZvcm0pO1xuXG4gICAgICBpZiAoIXN0YXRlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgICRmb3JtLmFkZENsYXNzKCdwcmVsb2FkZXInKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBhcHAuYXBpRm9ybU9uU3VjY2VzcyA9IGZ1bmN0aW9uICgkZm9ybSwgZGF0YSkge1xuICAgICAgdmFyXG4gICAgICAgIGV2ZW50ID0gJGZvcm0uZGF0YSgnZXZlbnQnKTtcblxuICAgICAgaWYgKF8uaXNPYmplY3QoZGF0YSkpIHtcbiAgICAgICAgJGZvcm0uZmluZCgnLmFwaV9fZm9ybV9fbWVzc2FnZScpLmh0bWwoJzxkaXYgY2xhc3M9XCJlcnJvcl9fbWVzc2FnZVwiPtCf0YDQuCDQvtGC0L/RgNCw0LLQutC1INC30LDQv9GA0L7RgdCwINC/0YDQvtC40LfQvtGI0LvQsCDQvtGI0LjQsdC60LA6JyArIGRhdGEucmVzcG9uc2UubWVzc2FnZSArICc8L2Rpdj4nKTtcbiAgICAgICAgJGZvcm0ucmVtb3ZlQ2xhc3MoJ3ByZWxvYWRlcicpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgJCgnYm9keScpLnRyaWdnZXIoZXZlbnQpO1xuICAgICAgfVxuICAgICAgJGZvcm0ucmVwbGFjZVdpdGgoZGF0YSk7XG4gICAgfTtcbiAgICBhcHAuYXBpRm9ybU9uRXJyb3IgPSBmdW5jdGlvbiAoJGZvcm0sIGRhdGEpIHtcbiAgICAgIHZhclxuICAgICAgICBtZXNzYWdlID0gJ9Cf0YDQuCDQvtGC0L/RgNCw0LLQutC1INGE0L7RgNC80Ysg0L/RgNC+0LjQt9C+0YjQu9CwINC+0YjQuNCx0LrQsDogJyArIEpTT04uc3RyaW5naWZ5KGRhdGEpLFxuICAgICAgICBtZXNzYWdlQmxvY2sgPSAoJzxkaXYgY2xhc3M9XCJlcnJvcl9fbWVzc2FnZVwiPicgKyBtZXNzYWdlICsgJzwvZGl2PicpO1xuXG4gICAgICAkZm9ybS5yZW1vdmVDbGFzcygncHJlbG9hZGVyJyk7XG4gICAgICAkZm9ybS5maW5kKCcuYXBpX19mb3JtX19tZXNzYWdlJykuaHRtbChtZXNzYWdlQmxvY2spO1xuICAgIH07XG5cbiAgLy8gRE9NIHV0aWxzXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBmaW5kIERPTSBlbGVtZW50c1xuICAgICAqIEBwYXJhbSBzZWxlY3RvcnMge3t9fVxuICAgICAqIEBwYXJhbSBbcGFyZW50XSB7KnxqUXVlcnl8SFRNTEVsZW1lbnR9XG4gICAgICogQHJldHVybnMge3thbnl9fVxuICAgICAqL1xuICAgIGFwcC5lbGVtZW50c1BhcnNlID0gZnVuY3Rpb24gKHNlbGVjdG9ycywgcGFyZW50KSB7XG4gICAgICB2YXJcbiAgICAgICAgX3BhcmVudCA9ICQocGFyZW50KS5sZW5ndGggPyAkKHBhcmVudCkgOiAkKCdib2R5JyksXG4gICAgICAgIF9yZXN1bHQgPSB7fTtcblxuICAgICAgXy5lYWNoKHNlbGVjdG9ycywgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICAgIHZhclxuICAgICAgICAgICRpdGVtID0gX3BhcmVudC5maW5kKHZhbCk7XG5cbiAgICAgICAgaWYgKCRpdGVtLmxlbmd0aCkge1xuICAgICAgICAgIF9yZXN1bHRba2V5XSA9ICRpdGVtO1xuICAgICAgICB9IGVsc2UgaWYgKF9wYXJlbnQuaXModmFsKSkge1xuICAgICAgICAgIF9yZXN1bHRba2V5XSA9IF9wYXJlbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX3Jlc3VsdFtrZXldID0gJGl0ZW07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIF9yZXN1bHQ7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBjYWxjdWxhdGUgc3VtbWFyeSB3aWR0aCBvZiBlbGVtZW50J3MgY2hpbGRyZW5cbiAgICAgKiBAcGFyYW0gcGFyZW50IHtqUXVlcnl9XG4gICAgICovXG4gICAgYXBwLmdldENoaWxkcmVuV2lkdGggPSBmdW5jdGlvbiAoJHBhcmVudCkge1xuICAgICAgdmFyXG4gICAgICAgIHdpZHRoID0gMCxcbiAgICAgICAgJGNoaWxkcmVuID0gJHBhcmVudC5jaGlsZHJlbigpO1xuXG4gICAgICAkY2hpbGRyZW4uZWFjaChmdW5jdGlvbiAoaWQsIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyXG4gICAgICAgICAgZWxlbVdpZHRoID0gJChlbGVtZW50KS5vdXRlcldpZHRoKCk7XG5cbiAgICAgICAgd2lkdGggKz0gZWxlbVdpZHRoO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gd2lkdGg7XG4gICAgfTtcbiAgICBhcHAuc2V0TWFpbkJsb2NrTWluSGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyXG4gICAgICAgICRoZWFkZXIgPSAkKGFwcC5zZWxlY3RvcnMuaGVhZGVyKSxcbiAgICAgICAgJG1haW4gPSAkKGFwcC5zZWxlY3RvcnMubWFpbiksXG4gICAgICAgICRmb290ZXIgPSAkKGFwcC5zZWxlY3RvcnMuZm9vdGVyKSxcbiAgICAgICAgaGVhZGVySGVpZ2h0ID0gJGhlYWRlci5vdXRlckhlaWdodCh0cnVlKSxcbiAgICAgICAgZm9vdGVySGVpZ2h0ID0gJGZvb3Rlci5vdXRlckhlaWdodCh0cnVlKTtcblxuICAgICAgaWYgKCRtYWluLmF0dHIoJ2RhdGEtbm8tY2FsYycpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgJG1haW4uY3NzKCdtaW4taGVpZ2h0JywgJ2NhbGMoMTAwdmggLSAnICsgKGhlYWRlckhlaWdodCArIGZvb3RlckhlaWdodCkgKyAoJ3B4KScpKTtcbiAgICB9O1xuXG4gIC8vIENNUyB1dGlsc1xuXG4gIC8vIFN0eWxlIHV0aWxzXG4gICAgLyoqXG4gICAgICog0J/RgNC10LTQt9Cw0LPRgNGD0LbQsNC10Lwg0L/RgNC10LvQvtCw0LTQtdGAXG4gICAgICovXG4gICAgYXBwLnByZWxvYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhclxuICAgICAgICBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcblxuICAgICAgaW1nLnNyYyA9ICcvY29udGVudC9pbWcvcHJlbG9hZGVyLnN2Zyc7XG4gICAgfTtcblxuICAvLyBGb3JtYXR0aW5nIHV0aWxzXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgICAqL1xuICAgIGFwcC5wYWROdW0gPSBmdW5jdGlvbiAobnVtYmVyLCBzaXplKSB7XG4gICAgICB2YXJcbiAgICAgICAgcmVzdWx0ID0gbnVtYmVyLnRvU3RyaW5nKCk7XG5cbiAgICAgIHdoaWxlIChyZXN1bHQubGVuZ3RoIDwgc2l6ZSkge1xuICAgICAgICByZXN1bHQgPSAnMCcgKyByZXN1bHQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgLy8gQ2h1bmNrc1xuICAgIGFwcC5tZXNzYWdlQm94ID0gZnVuY3Rpb24gKGRhdGEsIGV4dHJhQ2xhc3MpIHtcbiAgICAgIHZhclxuICAgICAgICBtZXNzYWdlID0gZGF0YSxcbiAgICAgICAgcG9wdXBDbGFzcyA9ICdtZXNzYWdlJztcblxuICAgICAgaWYgKGV4dHJhQ2xhc3MubGVuZ3RoKSB7XG4gICAgICAgIHBvcHVwQ2xhc3MgKz0gJyAnICsgZXh0cmFDbGFzcztcbiAgICAgIH1cbiAgICAgIGlmIChfLmlzU3RyaW5nKG1lc3NhZ2UpKSB7XG4gICAgICAgIG1lc3NhZ2UgPSAkKCc8ZGl2IGNsYXNzPVwiJyArIHBvcHVwQ2xhc3MgKyAnXCI+JyArIG1lc3NhZ2UgKyAnPC9kaXY+Jyk7XG4gICAgICB9XG4gICAgICAkLm1hZ25pZmljUG9wdXAub3Blbih7XG4gICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgc3JjOiBtZXNzYWdlLFxuICAgICAgICAgIHR5cGU6ICdpbmxpbmUnLFxuICAgICAgICAgIG1pZENsaWNrOiB0cnVlLFxuICAgICAgICAgIGNsb3NlQnRuSW5zaWRlOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG4gICAgLyoqXG4gICAgICog0J/RgNC+0LLQtdGA0LrQsCDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGFwcC5jaGVja1N0YXR1cyA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICB2YXJcbiAgICAgICAgcHJvbWlzZTtcblxuICAgICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdmFyXG4gICAgICAgICAgX2RhdGE7XG4gICAgICAgIHZhclxuICAgICAgICAgIHJlbG9hZCA9IGZhbHNlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgX2RhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgX2RhdGEgPSBkYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8uaXNPYmplY3QoX2RhdGEpKSB7XG5cbiAgICAgICAgICBpZiAoX2RhdGEuc3RhdHVzKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzdGF0dXMnLCBkYXRhLnN0YXR1cyk7XG4gICAgICAgICAgICBpZiAoX2RhdGEuc3RhdHVzID09PSA0MDEgfHwgX2RhdGEuc3RhdHVzID09PSA0MDMgfHwgX2RhdGEuc3RhdHVzID09PSA0MDgpIHtcbiAgICAgICAgICAgICAgcmVsb2FkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKF9kYXRhLnJlc3BvbnNlKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdyZXNwb25zZScsIGRhdGEucmVzcG9uc2UpO1xuICAgICAgICAgICAgaWYgKF9kYXRhLnJlc3BvbnNlLmNvZGUpIHtcbiAgICAgICAgICAgICAgaWYgKF9kYXRhLnJlc3BvbnNlLmNvZGUgPT09IDQwMCkge1xuICAgICAgICAgICAgICAgIHJlbG9hZCA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocmVsb2FkKSB7XG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzb2x2ZShfZGF0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzb2x2ZShfZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqINCS0L7Qt9Cy0YDQsNGCINC00LDQvdC90YvRhSDQuNC3IHN0b3JhZ2VcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RvcmFnZUtleSAtINC60LvRjtGHXG4gICAgICovXG4gICAgYXBwLmdldEZyb21TdG9yYWdlID0gZnVuY3Rpb24gKHN0b3JhZ2VLZXkpIHtcbiAgICAgIHZhclxuICAgICAgICBwcm9taXNlO1xuXG4gICAgICBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXJcbiAgICAgICAgICBzdG9yYWdlRGF0YSA9IGZhbHNlO1xuICAgICAgICB2YXJcbiAgICAgICAgICBub3csXG4gICAgICAgICAgZXhwaXJhdGlvbjtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChhcHAudmFycy5oYXNTdG9yYWdlKSB7XG4gICAgICAgICAgICBpZiAoc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShzdG9yYWdlS2V5KSkge1xuICAgICAgICAgICAgICBzdG9yYWdlRGF0YSA9IEpTT04ucGFyc2Uoc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShzdG9yYWdlS2V5KSk7XG5cbiAgICAgICAgICAgICAgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbiA9IG5ldyBEYXRlKHN0b3JhZ2VEYXRhLnRpbWVzdGFtcCk7XG4gICAgICAgICAgICAgIGV4cGlyYXRpb24uc2V0TWludXRlcyhleHBpcmF0aW9uLmdldE1pbnV0ZXMoKSArIDYwKTtcblxuICAgICAgICAgICAgICAvLyBjbGVhciB0b28gb2xkIGRhdGFcbiAgICAgICAgICAgICAgICBpZiAobm93LmdldFRpbWUoKSA+IGV4cGlyYXRpb24uZ2V0VGltZSgpKSB7XG4gICAgICAgICAgICAgICAgICBzdG9yYWdlRGF0YSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShzdG9yYWdlS2V5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgc3RvcmFnZURhdGEgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmUoc3RvcmFnZURhdGEpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqINCS0L7Qt9Cy0YDQsNGCINC+0L/RgNC10LTQu9C10L3QvdC+0LPQviDQutC70Y7Rh9CwINC40LcgSlNPTiwg0L/QvtC70YPRh9C10L3QvdC+0LPQviDQuNC3IEFQSVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHBhcmFtIHsqfSBkYXRhLnJlc3BvbnNlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGRhdGEua2V5XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGRhdGEuc3RvcmFnZVxuICAgICAqL1xuICAgIGFwcC5wcmVwYXJlRGF0YUZyb21BUEkgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgdmFyXG4gICAgICAgIHByb21pc2U7XG5cbiAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgYXBwLmNoZWNrU3RhdHVzKGRhdGEucmVzcG9uc2UpLnRoZW4oZnVuY3Rpb24gKF9yZXN1bHQpIHtcblxuICAgICAgICAgIGlmICghXy5pc09iamVjdChfcmVzdWx0KSkge1xuICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKF9yZXN1bHQuc3RhdHVzID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5zdG9yYWdlS2V5ICYmIGFwcC52YXJzLmhhc1N0b3JhZ2UpIHtcbiAgICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShkYXRhLnN0b3JhZ2VLZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChkYXRhLnN0b3JhZ2VLZXkgJiYgYXBwLnZhcnMuaGFzU3RvcmFnZSkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oZGF0YS5zdG9yYWdlS2V5LCBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICAgICAgICBjb250ZW50OiBfcmVzdWx0W2RhdGEua2V5XVxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb2x2ZShfcmVzdWx0W2RhdGEua2V5XSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9O1xuXG4gIC8vIE1vZHVsZSBmYWN0b3J5XG4gICAgLyoqXG4gICAgICog0JrQvtC90YHRgtGA0YPQutGC0L7RgCDQvNC+0LTRg9C70LXQuSDQsiDQutC+0YLQvtGA0YvRhSDQv9GA0LXQtNGD0YHQvNC+0YLRgNC10L3QviDQvdCw0LvQuNGH0LjQtSDQvdC10YHQutC+0LvRjNC60LjRhSDQvdC10LfQsNCy0LjRgdC40LzRi9GFINC00YDRg9CzINC+0YIg0LTRgNGD0LPQsCBcItC60L7QvdGC0LXQudC90LXRgNC+0LJcIlxuICAgICAqXG4gICAgICogQHBhcmFtIE1vZHVsZUZhY3RvcnkgLSDQutC+0L3RgdGC0YDRg9C60YLQvtGAINCyINC60L7RgtC+0YDQvtC8INGB0L7QtNC10YDQttC40YLRgdGPINC+0YHQvdC+0LLQvdCw0Y8g0LvQvtCz0LjQutCwINC80L7QtNGD0LvRj1xuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGFwcC5Nb2R1bGUgPSBmdW5jdGlvbiAoTW9kdWxlRmFjdG9yeSkge1xuICAgICAgdGhpcy5faW5pdCA9IGZhbHNlO1xuICAgICAgdGhpcy5faW5zdGFuY2VzID0gW107XG4gICAgICB0aGlzLl9jb250YWluZXJfc2VsZWN0b3IgPSBNb2R1bGVGYWN0b3J5LnByb3RvdHlwZS5fc2VsZWN0b3JzLmNvbnRhaW5lcjtcbiAgICAgIHRoaXMuTW9kdWxlRmFjdG9yeSA9IE1vZHVsZUZhY3Rvcnk7XG4gICAgfTtcblxuICAgIGFwcC5Nb2R1bGUucHJvdG90eXBlID0ge1xuICAgICAgaW5pdDogZnVuY3Rpb24gKCRjb250ZW50Q29udGFpbmVycykge1xuICAgICAgICB2YXJcbiAgICAgICAgICAkY29udGFpbmVycyA9ICRjb250ZW50Q29udGFpbmVycztcblxuICAgICAgICBpZiAoISRjb250ZW50Q29udGFpbmVycykge1xuICAgICAgICAgICRjb250YWluZXJzID0gJCh0aGlzLl9jb250YWluZXJfc2VsZWN0b3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCRjb250YWluZXJzLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuX2luaXQgPSB0cnVlO1xuICAgICAgICAgICRjb250YWluZXJzLmVhY2goZnVuY3Rpb24gKGksIGl0ZW0pIHtcbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICBpbnN0YW5jZSA9IG5ldyB0aGlzLk1vZHVsZUZhY3RvcnkoJChpdGVtKSk7XG4gICAgICAgICAgICB0aGlzLl9pbnN0YW5jZXMucHVzaChpbnN0YW5jZSk7XG4gICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiDQmNC90LjRhtC40LDQu9C40LfQuNGA0YPQtdC8INC60L7QvdGC0LXQvdGCINC60L7RgtC+0YDRi9C5INC90LUg0LHRi9C7INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvSDRgNCw0L3QtdC1LCDQvdCw0L/RgNC40LzQtdGAINC/0L7QtNCz0YDRg9C20LXQvdC90YvQuSDQsNGP0LrRgdC+0LxcbiAgICAgICAqL1xuICAgICAgaW5pdExvYWRlZENvbnRlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyXG4gICAgICAgICAgJG5vbkluaXRpYWxpemVkID0gJCh0aGlzLl9jb250YWluZXJfc2VsZWN0b3IpLmZpbHRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJCh0aGlzKS5kYXRhKCdpbml0aWFsaXplZCcpICE9PSB0cnVlO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIGlmICgkbm9uSW5pdGlhbGl6ZWQubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5pbml0KCRub25Jbml0aWFsaXplZCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByZXNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2luaXQpIHtcbiAgICAgICAgICBfLmVhY2godGhpcy5faW5zdGFuY2VzLCBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihpdGVtLnJlc2l6ZSkpIHtcbiAgICAgICAgICAgICAgaXRlbS5yZXNpemUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgLy8gU3RhdGVcbiAgICAvKipcbiAgICAgKlxuICAgICAqINCS0YvRgdGC0LDQstC70Y/QtdC8INGE0LvQsNCzINC30LDQs9GA0YPQt9C60Lgg0L/RgNC40LvQvtC20LXQvdC40Y9cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGFwcC5fbG9hZFN0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgJCgnYm9keScpLnRyaWdnZXIoYXBwLkVWRU5UUy5JTklUX0NPTVBMRVRFKTtcbiAgICAgICQoJ2JvZHknKS5hZGRDbGFzcygnYXBwLWxvYWQnKTtcbiAgICB9O1xuXG59KSgpO1xuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG4gYXBwLmluaXQoKTtcbn0pO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYXBwLm1haWxlciA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqINGB0LXQu9C10LrRgtC+0YDRiyDQvNC+0LTRg9C70Y9cbiAgICAgICAgICovXG4gICAgICAgIF9zZWxlY3RvcnM6IHtcbiAgICAgICAgICBjb250YWluZXI6ICcuaGVhZGVyJyxcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIF9pbml0IC0g0YTQu9Cw0LMg0LjQvdC40YbQuNCw0LvQuNC30LDRhtC40Lgg0LzQvtC00YPQu9GPXG4gICAgICAgICAqL1xuICAgICAgICBfaW5pdDogZmFsc2UsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDQpNGD0L3QutGG0LjRjyDQuNC90LjRhtC40LDQu9C40LfQsNGG0LjQuCDQvNC+0LTRg9C70Y9cbiAgICAgICAgICovXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXJcbiAgICAgICAgICAgICRjb250YWluZXIgPSAkKHRoaXMuX3NlbGVjdG9ycy5jb250YWluZXIpO1xuICBcbiAgICAgICAgICBpZiAoJGNvbnRhaW5lci5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuX2luaXQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fbGlzdGVuZXIoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDQn9C+0YHRgtCw0L3QvtCy0LrQsCDQvtCx0YDQsNCx0L7RgtGH0LjQutC+0LIg0YHQvtCx0YvRgtC40LlcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIF9saXN0ZW5lcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICQoZG9jdW1lbnQpLnJlYWR5KHRoaXMuY29sbGVjdERhdGEuYmluZCh0aGlzKSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDQodCx0L7RgCDQt9C90LDRh9C10L3QuNC5INCyINC+0LHRjNC10LrRglxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX2FqYXg6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgJC5hamF4KHsgXG4gICAgICAgICAgICAgICAgdXJsOiAnbWFpbGVyLnBocCcsIFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgbmFtZTogb2JqLm5hbWUsXG4gICAgICAgICAgICAgICAgICBjaXR5OiBvYmouY2l0eSxcbiAgICAgICAgICAgICAgICAgIHRlbDogb2JqLnRlbCxcbiAgICAgICAgICAgICAgICAgIGVtYWlsOiBvYmoubWFpbFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGRhdGEuZXJyb3Ipe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihkYXRhLmVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICog0KHQsdC+0YAg0LfQvdCw0YfQtdC90LjQuSDQsiDQvtCx0YzQtdC60YJcbiAgICAgICAgICogQHB1YmxpY1xuICAgICAgICAgKi9cbiAgICAgICAgY29sbGVjdERhdGE6IGZ1bmN0aW9uIChkYXRhKSB7ICBcbiAgICAgICAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgICAgICAgIF8uZWFjaChkYXRhLCBmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgICBpZihlbC5pZCkge1xuICAgICAgICAgICAgICAgIHN3aXRjaChlbC5pZCkge1xuICAgICAgICAgICAgICAgICAgY2FzZSAnbmFtZScgOiBvYmoubmFtZSA9ICQoZWwpLnZhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlICdjaXR5JyA6IG9iai5jaXR5ID0gJChlbCkudmFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgJ3RlbCcgOiBvYmoudGVsID0gJChlbCkudmFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgJ2VtYWlsJyA6IG9iai5tYWlsID0gJChlbCkudmFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLl9hamF4KG9iaik7XG4gICAgICAgIH0sXG4gICAgICAvLyBVdGlsc1xuICAgICAgICAvKipcbiAgICAgICAgICog0J7RgtGA0LDQsdCw0YLRi9Cy0LDQtdC8INGA0LXRgdCw0LnQtyDQsdGA0LDRg9C30LXRgNCwXG4gICAgICAgICAqL1xuICAgICAgICByZXNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAodGhpcy5faW5pdCAmJiBhcHAudmFycy50cnVlUmVzaXplKSB7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgfSkoKTsgICIsIihmdW5jdGlvbiAoKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgYXBwLm1hcCA9IHtcbiAgICAgIC8qKlxuICAgICAgICog0YHQtdC70LXQutGC0L7RgNGLINC80L7QtNGD0LvRj1xuICAgICAgICovXG4gICAgICBfc2VsZWN0b3JzOiB7XG4gICAgICAgIGNvbnRhaW5lcjogJy5tYXAnLFxuICAgICAgfSxcbiAgICAgIC8qKlxuICAgICAgICogX2luaXQgLSDRhNC70LDQsyDQuNC90LjRhtC40LDQu9C40LfQsNGG0LjQuCDQvNC+0LTRg9C70Y9cbiAgICAgICAqL1xuICAgICAgX2luaXQ6IGZhbHNlLFxuICAgICAgLyoqXG4gICAgICAgKiDQpNGD0L3QutGG0LjRjyDQuNC90LjRhtC40LDQu9C40LfQsNGG0LjQuCDQvNC+0LTRg9C70Y9cbiAgICAgICAqL1xuICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXJcbiAgICAgICAgICAkY29udGFpbmVyID0gJCh0aGlzLl9zZWxlY3RvcnMuY29udGFpbmVyKTtcblxuICAgICAgICBpZiAoJGNvbnRhaW5lci5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLl9pbml0ID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLl9saXN0ZW5lcigpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgLyoqXG4gICAgICAgKiDQn9C+0YHRgtCw0L3QvtCy0LrQsCDQvtCx0YDQsNCx0L7RgtGH0LjQutC+0LIg0YHQvtCx0YvRgtC40LlcbiAgICAgICAqIEBwcml2YXRlXG4gICAgICAgKi9cbiAgICAgIF9saXN0ZW5lcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAkKGRvY3VtZW50KS5yZWFkeSh0aGlzLl9zaW1wbGVNYXAuYmluZCh0aGlzKSk7XG4gICAgICB9LFxuICAgIC8vIE1hcFxuICAgICAgLyoqXG4gICAgICAgKiDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDQutCw0YDRgtGLXG4gICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICovXG4gICAgICBfc2ltcGxlTWFwOiBmdW5jdGlvbiAoKSB7ICBcbiAgICAgICAgeW1hcHMucmVhZHkoeW1hcHNfaW5pdCk7XG4gICAgICAgIGZ1bmN0aW9uIHltYXBzX2luaXQgKCkge1xuICAgICAgICAgIHZhciBteU1hcCA9IG5ldyB5bWFwcy5NYXAobWFwLCB7XG4gICAgICAgICAgICAgIGNlbnRlcjogWzU5Ljg5LCAzMC40Ml0sXG4gICAgICAgICAgICAgIHpvb206IDE3LFxuICAgICAgICAgICAgICB0eXBlOiBcInlhbmRleCNtYXBcIixcbiAgICAgICAgICAgICAgYmVoYXZpb3JzOiBbXCJkZWZhdWx0XCIsIFwic2Nyb2xsWm9vbVwiXVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIG15TWFwLmdlb09iamVjdHMuYWRkKG5ldyB5bWFwcy5QbGFjZW1hcmsoWzU5Ljg5LCAzMC40Ml0sIHtcbiAgICAgICAgICAgIC8vIGJhbGxvb25Db250ZW50OiAnPHNwYW4+0J/QvtC30LLQvtC90LjRgtGMPC9zcGFuPjxzdHJvbmc+PGJyLz48YSBocmVmPVwidGVsOis3OTExNTU1MTIxMlwiPis3IDkxMSA1NTUtMTItMTI8L2E+PC9zdHJvbmc+J1xuICAgICAgICB9LCB7XG4gICAgICAgICAgICBwcmVzZXQ6ICdpc2xhbmRzI2RvdEljb24nLFxuICAgICAgICAgICAgaWNvbkNvbG9yOiAnI0ZGMDA5MCdcbiAgICAgICAgfSkpXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgLy8gVXRpbHNcbiAgICAgIC8qKlxuICAgICAgICog0J7RgtGA0LDQsdCw0YLRi9Cy0LDQtdC8INGA0LXRgdCw0LnQtyDQsdGA0LDRg9C30LXRgNCwXG4gICAgICAgKi9cbiAgICAgIHJlc2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5faW5pdCAmJiBhcHAudmFycy50cnVlUmVzaXplKSB7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgfTtcbn0pKCk7ICAiLCIoZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cdGFwcC5wb3B1cCA9IHtcblx0XHQvKipcblx0XHQgKiDRgdC10LvQtdC60YLQvtGA0Ysg0LzQvtC00YPQu9GPXG5cdFx0ICovXG5cdFx0X3NlbGVjdG9yczoge1xuXHRcdCAgY29udGFpbmVyOiAnLmhlYWRlcicsXG5cdFx0ICBtZW51VHJpZ2dlcjogJy5tZW51LWljb24nLFxuXHRcdCAgY2xvc2VQb3B1cDogJy5jbG9zZScsXG5cdFx0ICBzdWJtaXQ6ICcubWFpbl9idXR0b24nLFxuXHRcdCAgZm9ybTogJyN0ZXN0LWZvcm0nLFxuXHRcdCAgaW5wdXQ6ICcuZm9ybS1jb250cm9sJyxcblx0XHQgIHBvcHVwX3RyaWdnZXI6ICcucG9wdXAtd2l0aC1mb3JtJ1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogX2luaXQgLSDRhNC70LDQsyDQuNC90LjRhtC40LDQu9C40LfQsNGG0LjQuCDQvNC+0LTRg9C70Y9cblx0XHQgKi9cblx0XHRfaW5pdDogZmFsc2UsXG5cdFx0LyoqXG5cdFx0ICog0KTRg9C90LrRhtC40Y8g0LjQvdC40YbQuNCw0LvQuNC30LDRhtC40Lgg0LzQvtC00YPQu9GPXG5cdFx0ICovXG5cdFx0aW5pdDogZnVuY3Rpb24gKCkge1xuXHRcdCAgdmFyXG5cdFx0XHQkY29udGFpbmVyID0gJCh0aGlzLl9zZWxlY3RvcnMuY29udGFpbmVyKTtcbiAgXG5cdFx0ICBpZiAoJGNvbnRhaW5lci5sZW5ndGgpIHtcblx0XHRcdHRoaXMuX2luaXQgPSB0cnVlO1xuXHRcdFx0dGhpcy5fbGlzdGVuZXIoKTtcblx0XHQgIH1cblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqINCf0L7RgdGC0LDQvdC+0LLQutCwINC+0LHRgNCw0LHQvtGC0YfQuNC60L7QsiDRgdC+0LHRi9GC0LjQuVxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0X2xpc3RlbmVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0ICAkKGRvY3VtZW50KS5yZWFkeSh0aGlzLl9pbml0aWFsaXphdGlvbi5iaW5kKHRoaXMpKTtcblx0XHQgIFxuXHRcdCAgJCh0aGlzLl9zZWxlY3RvcnMucG9wdXBfdHJpZ2dlcikub24oJ2NsaWNrJywgdGhpcy5fZ2V0U2VsZWN0ZWRJdGVtLmJpbmQodGhpcykpO1xuXHRcdCAgJCh0aGlzLl9zZWxlY3RvcnMubWVudVRyaWdnZXIpLm9uKCdjbGljaycsIHRoaXMuX2Jsb2NrU2Nyb2xsLmJpbmQodGhpcykpO1xuXHRcdCAgJCh0aGlzLl9zZWxlY3RvcnMuY2xvc2VQb3B1cCkub24oJ2NsaWNrJywgdGhpcy5faGFuZGxlX2Nsb3NlLmJpbmQodGhpcykpO1xuXHRcdCAgJCh0aGlzLl9zZWxlY3RvcnMuc3VibWl0KS5vbignY2xpY2snLCB0aGlzLl92YWxpZGF0ZUZpZWxkcy5iaW5kKHRoaXMpKTtcblx0XHQgICQodGhpcy5fc2VsZWN0b3JzLmlucHV0KS5vbignZm9jdXMnLCB0aGlzLl9yZW1vdmVCb3JkZXIuYmluZCh0aGlzKSk7XG5cdFx0fSxcblx0XHQvL3V0aWxzXG5cdFx0X2dldFNlbGVjdGVkSXRlbTogZnVuY3Rpb24oZSkge1xuXHRcdFx0XG5cdFx0XHR2YXIgaXRlbSA9IGUudGFyZ2V0LmRhdGFzZXQuaW1hZ2U7XG5cdFx0XHR2YXIgZGVzdGlvbmF0aW9uID0gJCgnI3Rlc3QtZm9ybScpLmZpbmQoJy5pbWFnZScpWzBdO1xuXHRcdFx0ZGVzdGlvbmF0aW9uLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICd1cmwoJyArIGl0ZW0gKyAnKSc7XG5cblx0XHRcdHZhciBwcmljZSA9IGUudGFyZ2V0LmRhdGFzZXQucHJpY2U7XHRcblx0XHRcdHZhciBvbGRQcmljZSA9IGUudGFyZ2V0LmRhdGFzZXQucHJpY2VvbGQ7XG5cblx0XHRcdCQoJyN0ZXN0LWZvcm0nKS5maW5kKCcucHJpY2VfX25ldycpWzBdLmNoaWxkcmVuWzBdLnRleHRDb250ZW50ID0gcHJpY2U7XG5cdFx0XHQkKCcjdGVzdC1mb3JtJykuZmluZCgnLnByaWNlX19vbGQnKVswXS5jaGlsZHJlblswXS50ZXh0Q29udGVudCA9IG9sZFByaWNlO1xuXG5cdFx0XHR2YXIgdGl0bGUgPSBlLnRhcmdldC5kYXRhc2V0LnRpdGxlO1xuXHRcdFx0JCgnI3Rlc3QtZm9ybScpLmZpbmQoJy5oZWFkaW5nX19wb3B1cCcpWzBdLmNoaWxkcmVuWzBdLnRleHRDb250ZW50ID0gdGl0bGU7XG5cdFx0fSxcblx0XHRfcmVtb3ZlQm9yZGVyOiBmdW5jdGlvbihlKSB7XG5cdFx0XHQkKGUudGFyZ2V0KS5jc3MoJ2JvcmRlcicsICcnKTtcblx0XHR9LFxuXHRcdF92YWxpZGF0ZUZpZWxkczogZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dmFyIGZvcm0gPSAkKCcub3JkZXJfX3dyYXBwZXItLWZvcm0nKVswXTtcblx0XHRcdHZhciBzdGF0ZTtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGFwcC52YWxpZGF0b3IuZm9ybVZhbGlkYXRlKFtdLCBmb3JtKTtcblx0XHRcdFx0c3RhdGUgPSB0cnVlO1xuXG5cdFx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdFx0c3RhdGUgPSBmYWxzZTtcblx0XHRcdFx0XG5cdFx0XHRcdGlmKGUubWVzc2FnZS5pbmRleE9mKCdyZXF1aXJlZCcpID4gMCkge1xuXHRcdFx0XHRcdHZhciBpbnB1dHMgPSAkKGZvcm0pLmZpbmQoJy5mb3JtLWNvbnRyb2wnKTtcblx0XHRcdFx0XHRfLmVhY2goaW5wdXRzLCBmdW5jdGlvbihlbCkge1xuXHRcdFx0XHRcdFx0aWYoJChlbCkudmFsKCkgPT09ICcnKSB7XG5cdFx0XHRcdFx0XHRcdCQoZWwpLmNzcygnYm9yZGVyJywgJzFweCBzb2xpZCByZWQnKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKGUubWVzc2FnZS5pbmRleE9mKCdwaG9uZScpID4gMCkge1xuXHRcdFx0XHRcdCQoJyN0ZWwnKS5jc3MoJ2JvcmRlcicsICcxcHggc29saWQgcmVkJyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoZS5tZXNzYWdlLmluZGV4T2YoJ2VtYWlsJykgPiAwKSB7XG5cdFx0XHRcdFx0JCgnI2VtYWlsJykuY3NzKCdib3JkZXInLCAnMXB4IHNvbGlkIHJlZCcpO1xuXHRcdFx0XHR9IFxuXHRcdFx0XHRpZihlLm1lc3NhZ2UuaW5kZXhPZignY2hlY2tlZCcpID4gMCkge1xuXHRcdFx0XHRcdHZhciBjaGVja2JveCA9ICQoZm9ybSkuZmluZCgnLmFncmVlbWVudCcpWzBdO1xuXHRcdFx0XHRcdCQoY2hlY2tib3gpLmNzcygnY29sb3InLCAncmVkJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmKHN0YXRlKSB7XG5cdFx0XHRcdHZhciBpbnB1dHMgPSAkKGZvcm0pLmZpbmQoJy5mb3JtLWNvbnRyb2wnKTtcblx0XHRcdFx0YXBwLm1haWxlci5jb2xsZWN0RGF0YShpbnB1dHMpO1xuXHRcdFx0XHR0aGlzLl9jaGFuZ2VDb250ZW50KCk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRfY2hhbmdlQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgaXRlbSA9ICQoJy5vcmRlcl9fZm9ybS0td3JhcHBlcicpO1xuXHRcdFx0XHRcdCAgICQoaXRlbSkudG9nZ2xlQ2xhc3MoJ2FzLW5vbmUnKTtcblx0XG5cdFx0XHR2YXIgdGhhbmtZb3UgPSAkKCcuc3VjY2Vzc19fZm9ybScpO1xuXHRcdFx0XHRcdFx0ICAgJCh0aGFua1lvdSkudG9nZ2xlQ2xhc3MoJ2FzLW5vbmUnKTtcblx0XHRcdFx0XG5cdFx0XHRcdGFwcC5zdGF0LnNpbXBsZVN0YXQoKTtcblx0XHR9LFx0XG5cdFx0X2hhbmRsZV9jbG9zZTogZnVuY3Rpb24oKSB7XG5cdFx0XHQkLm1hZ25pZmljUG9wdXAuY2xvc2UoKTtcblx0XHR9LFxuXHRcdF9ibG9ja1Njcm9sbDogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgaXRlbSA9IGRvY3VtZW50LmJvZHk7XG5cdFx0XHRcdCQoaXRlbSkudG9nZ2xlQ2xhc3MoJ2NvbXBsZXRseV9ibG9jaycpO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICog0JjQvdC40YbQuNCw0LvQuNC30LDRhtC40Y8g0LzQvtC00YPQu9GPXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHRfaW5pdGlhbGl6YXRpb246IGZ1bmN0aW9uICgpIHsgIFxuXHRcdFx0JCgnLnBvcHVwLXdpdGgtZm9ybScpLm1hZ25pZmljUG9wdXAoe1xuXHRcdFx0XHR0eXBlOiAnaW5saW5lJyxcblx0XHRcdFx0cHJlbG9hZGVyOiBmYWxzZSxcblx0XHRcdFx0Zm9jdXM6ICcjbmFtZScsXG5cdFx0XHRcdGNhbGxiYWNrczoge1xuXHRcdFx0XHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciBpdGVtID0gZG9jdW1lbnQuYm9keVxuXHRcdFx0XHRcdFx0XHQkKGl0ZW0pLnJlbW92ZUNsYXNzKCdibG9ja19zY3JvbGwnKTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGJlZm9yZUNsb3NlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdCQoJy5vcmRlcl9fZm9ybS0td3JhcHBlcicpLnJlbW92ZUNsYXNzKCdhcy1ub25lJyk7XG5cdFx0XHRcdFx0XHQkKCcuc3VjY2Vzc19fZm9ybScpLmFkZENsYXNzKCdhcy1ub25lJyk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRiZWZvcmVPcGVuOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciBpdGVtID0gZG9jdW1lbnQuYm9keVxuXHRcdFx0XHRcdFx0XHQkKGl0ZW0pLmFkZENsYXNzKCdibG9ja19zY3JvbGwnKTtcblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRpZigkKHdpbmRvdykud2lkdGgoKSA8IDcwMCkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0LmZvY3VzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0LmZvY3VzID0gJyNuYW1lJztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICog0J7RgtGA0LDQsdCw0YLRi9Cy0LDQtdC8INGA0LXRgdCw0LnQtyDQsdGA0LDRg9C30LXRgNCwXG5cdFx0ICovXG5cdFx0cmVzaXplOiBmdW5jdGlvbiAoKSB7XG5cdFx0ICBpZiAodGhpcy5faW5pdCAmJiBhcHAudmFycy50cnVlUmVzaXplKSB7XG5cdFx0ICB9XG5cdFx0fVxuXHR9O1xuICB9KSgpOyAgIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYXBwLnN0YXQgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiDRgdC10LvQtdC60YLQvtGA0Ysg0LzQvtC00YPQu9GPXG4gICAgICAgICAqL1xuICAgICAgICBfc2VsZWN0b3JzOiB7XG4gICAgICAgICAgY29udGFpbmVyOiAnLmhlYWRlcicsXG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBfaW5pdCAtINGE0LvQsNCzINC40L3QuNGG0LjQsNC70LjQt9Cw0YbQuNC4INC80L7QtNGD0LvRj1xuICAgICAgICAgKi9cbiAgICAgICAgX2luaXQ6IGZhbHNlLFxuICAgICAgICAvKipcbiAgICAgICAgICog0KTRg9C90LrRhtC40Y8g0LjQvdC40YbQuNCw0LvQuNC30LDRhtC40Lgg0LzQvtC00YPQu9GPXG4gICAgICAgICAqL1xuICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyXG4gICAgICAgICAgICAkY29udGFpbmVyID0gJCh0aGlzLl9zZWxlY3RvcnMuY29udGFpbmVyKTtcbiAgXG4gICAgICAgICAgaWYgKCRjb250YWluZXIubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLl9pbml0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX2xpc3RlbmVyKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICog0J/QvtGB0YLQsNC90L7QstC60LAg0L7QsdGA0LDQsdC+0YLRh9C40LrQvtCyINGB0L7QsdGL0YLQuNC5XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBfbGlzdGVuZXI6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICAvKipcbiAgICAgICAgICog0JjQvdC40YbQuNCw0LvQuNC30LDRhtC40Y9cbiAgICAgICAgICogQHB1YmxpY1xuICAgICAgICAgKi9cbiAgICAgICAgc2ltcGxlU3RhdDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHdpbmRvdy55bSg1NjA1NjQyMywgJ3JlYWNoR29hbCcsICdwcmVvcmRlcicpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3lhKycpO1xuICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcigneWFuZGV4IGNvdW50ZXIgc3RhdCBmYWlsZWQnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGd0YWcoJ2V2ZW50JywncHJlb3JkZXInLCB7XG4gICAgICAgICAgICAgICdldmVudF9jYXRlZ29yeSc6ICdwcmVvcmRlcicsXG4gICAgICAgICAgICAgICdldmVudF9sYWJlbCc6ICdwcmVvcmRlcicsXG4gICAgICAgICAgICAgICd2YWx1ZSc6ICcxJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZ2ErJyk7XG4gICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdnb29nbGUgYW5hbHl0aWNzIGZhaWxlZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIC8vIFV0aWxzXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDQntGC0YDQsNCx0LDRgtGL0LLQsNC10Lwg0YDQtdGB0LDQudC3INCx0YDQsNGD0LfQtdGA0LBcbiAgICAgICAgICovXG4gICAgICAgIHJlc2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmICh0aGlzLl9pbml0ICYmIGFwcC52YXJzLnRydWVSZXNpemUpIHtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICB9KSgpOyAgIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gIFxuICAgIGFwcC52YWxpZGF0b3IgPSB7XG4gICAgICB2YWxpZGF0ZU1lc3NhZ2U6ICcnLFxuICAgICAgY29uZmlnOiB7XG4gICAgICAgIHNlbGVjdG9yRmllbGRJdGVtOiAnLmZvcm0tZ3JvdXAsIC5mb3JtLWNvbnRyb2wnLFxuICAgICAgICBjbGFzc0ludmFsaWQ6ICdpbnZhbGlkJyxcbiAgICAgICAgY2xhc3NWYWxpZDogJ3ZhbGlkJ1xuICAgICAgfSxcbiAgICAgIHZhbGlkQXJyYXk6IHt9LFxuICAgICAgLyoqXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIGRhdGFcbiAgICAgICAqIEBwYXJhbSBjb25maWdcbiAgICAgICAqL1xuICAgICAgdmFsaWRhdGU6IGZ1bmN0aW9uIChkYXRhLCBjb25maWcpIHtcbiAgICAgICAgdmFyXG4gICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcblxuICAgICAgICAgIGNvbnNvbGUud2FybihkYXRhLCBjb25maWcpO1xuICAgICAgICBcbiAgICAgICAgYXBwLnZhbGlkYXRvci5wYXJzZU1lc3NhZ2UoKTtcbiAgICAgICAgXy5lYWNoKGNvbmZpZywgZnVuY3Rpb24gKHJ1bGVzLCBuYW1lKSB7XG4gICAgICAgICAgdmFyXG4gICAgICAgICAgICB2YWxpZGF0ZTtcblxuICAgICAgICAgICAgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICAgICAgdmFsaWRhdGUgPSB0aGlzLnBhcnNlUnVsZXMocnVsZXMpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnZhbGlkKHZhbGlkYXRlLCBkYXRhW25hbWVdKSkge1xuICAgICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gIFxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSxcbiAgICAgIHZhbGlkOiBmdW5jdGlvbihydWxlcywgZGF0YSkge1xuICAgICAgICB2YXJcbiAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICBcbiAgICAgICAgYXBwLnZhbGlkYXRvci5wYXJzZU1lc3NhZ2UoKTtcbiAgICAgICAgXy5lYWNoKHJ1bGVzLCBmdW5jdGlvbihydWxlKSB7XG4gICAgICAgICAgaWYgKCFydWxlKGRhdGEpKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSxcbiAgICAgIHBhcnNlTWVzc2FnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghYXBwLnZhbGlkYXRvci52YWxpZGF0ZU1lc3NhZ2UpIHtcbiAgICAgICAgICBhcHAudmFsaWRhdG9yLnZhbGlkYXRlTWVzc2FnZSA9ICQoJy52YWxpZGF0ZS1tZXNzYWdlJykuZGF0YSgpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgcGFyc2VSdWxlczogZnVuY3Rpb24gKHJ1bGVzU3RyKSB7XG4gICAgICAgIHZhclxuICAgICAgICAgIHJ1bGVzID0gcnVsZXNTdHIudHJpbSgpLnNwbGl0KCcgJyksXG4gICAgICAgICAgcmVzdWx0UnVsbGVzID0gW107XG4gIFxuICAgICAgICBfLmVhY2gocnVsZXMsIGZ1bmN0aW9uIChydWxlKSB7XG4gICAgICAgICAgcmVzdWx0UnVsbGVzLnB1c2godGhpcy5wYXJzZVJ1bGUocnVsZSkpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICByZXR1cm4gcmVzdWx0UnVsbGVzO1xuICAgICAgfSxcbiAgICAgIHBhcnNlUnVsZTogZnVuY3Rpb24ocnVsZSkge1xuICAgICAgICB2YXJcbiAgICAgICAgICBfcnVsZSxcbiAgICAgICAgICBfdmFsO1xuICBcbiAgICAgICAgaWYgKHJ1bGUuaW5kZXhPZignKCcpID4gLTEpIHtcbiAgICAgICAgICBfcnVsZSA9IHJ1bGUuc3Vic3RyaW5nKDAsIHJ1bGUuaW5kZXhPZignKCcpKTtcbiAgICAgICAgICBfdmFsID0gcnVsZS5zdWJzdHJpbmcocnVsZS5pbmRleE9mKCcoJykgKyAxLCBydWxlLmluZGV4T2YoJyknKSAtMSk7XG4gICAgICAgICAgaWYoXy5pc0Z1bmN0aW9uKHRoaXMudmFsaWRhdGVGdW5jdGlvbltfcnVsZV0pKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRlRnVuY3Rpb25bX3J1bGVdLmJpbmQodGhpcywgX3ZhbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybign0KTRg9C90LrRhtC40Y8g0LLQsNC70LjQtNCw0YbQuNC4INC90LUg0L3QsNC50LTQtdC90LAgLSAnICsgX3J1bGUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVmYXVsdEZ1bmN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHRoaXMudmFsaWRhdGVGdW5jdGlvbltydWxlXSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRlRnVuY3Rpb25bcnVsZV07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybign0KTRg9C90LrRhtC40Y8g0LLQsNC70LjQtNCw0YbQuNC4INC90LUg0L3QsNC50LTQtdC90LAgLSAnICsgcnVsZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZWZhdWx0RnVuY3Rpb247XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgdmFsaWRhdGVGdW5jdGlvbjoge1xuICAgICAgICBkYXRlOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgcmV0dXJuIF8uaXNEYXRlKHZhbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZsb2F0OiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbGlkYXRvci5pc0Zsb2F0KHZhbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGludDogZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgIHJldHVybiB2YWxpZGF0b3IuaXNJbnQodmFsKTtcbiAgICAgICAgfSxcbiAgICAgICAgbnVtYmVyOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbGlkYXRvci5pc051bWVyaWModmFsKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RyaW5nOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgcmV0dXJuIF8uaXNTdHJpbmcodmFsKTtcbiAgICAgICAgfSxcbiAgICAgICAgbm9FbXB0eTogZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgIHJldHVybiAhXy5pc0VtcHR5KHZhbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGJvb2xlYW46IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICByZXR1cm4gXy5pc0Jvb2xlYW4odmFsKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICBpZiAoXy5pc1N0cmluZyh2YWwpKSB7XG4gICAgICAgICAgICB2YWwgPSB2YWwudHJpbSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gISF2YWw7XG4gICAgICAgIH0sXG4gICAgICAgIGVtYWlsOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgdmFyXG4gICAgICAgICAgICBwYXR0ZXJuID0gbmV3IFJlZ0V4cCgvXigoXCJbXFx3LVxcc10rXCIpfChbXFx3LV0rKD86XFwuW1xcdy1dKykqKXwoXCJbXFx3LVxcc10rXCIpKFtcXHctXSsoPzpcXC5bXFx3LV0rKSopKShAKCg/OltcXHctXStcXC4pKlxcd1tcXHctXXswLDY2fSlcXC4oW2Etel17Miw2fSg/OlxcLlthLXpdezJ9KT8pJCl8KEBcXFs/KCgyNVswLTVdXFwufDJbMC00XVswLTldXFwufDFbMC05XXsyfVxcLnxbMC05XXsxLDJ9XFwuKSkoKDI1WzAtNV18MlswLTRdWzAtOV18MVswLTldezJ9fFswLTldezEsMn0pXFwuKXsyfSgyNVswLTVdfDJbMC00XVswLTldfDFbMC05XXsyfXxbMC05XXsxLDJ9KVxcXT8kKS9pKTtcbiAgXG4gICAgICAgICAgcmV0dXJuIHBhdHRlcm4udGVzdCh2YWwpO1xuICAgICAgICB9LFxuICAgICAgICBwaG9uZTogZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgIHZhclxuICAgICAgICAgICAgY2hlY2tlZFN0cmluZyA9IHZhbC5yZXBsYWNlKC9bLSApKF0vZywnJyksXG4gICAgICAgICAgICByZWdleCA9IC9eKChcXCs3fDd8OHwpKyhbMC05XSl7MTAsMTJ9KSQvOyAvLyB7MTAsMTJ9IC0g0LTQvtC/0YPRgdGC0LjQvNC+0LUg0LrQvtC70LjRh9C10YHRgtCy0L4g0YbQuNGE0YAg0LIg0L3QvtC80LXRgNC1XG4gICAgICAgICAgdmFyXG4gICAgICAgICAgICByZXN1bHQ7XG4gIFxuICAgICAgICAgIHJlc3VsdCA9IHJlZ2V4LnRlc3QoY2hlY2tlZFN0cmluZyk7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcbiAgICAgICAgdmFsaWQ6IGZ1bmN0aW9uKHZhbCwgZGF0YVZhbCl7XG4gICAgICAgICAgcmV0dXJuIGRhdGFWYWw7XG4gICAgICAgIH0sXG4gICAgICAgIGNoZWNrZWQ6IGZ1bmN0aW9uICh2YWwsIGRhdGFWYWwsIGVsKSB7XG4gICAgICAgICAgcmV0dXJuICQoZWwpLnByb3AoJ2NoZWNrZWQnKTtcbiAgICAgICAgfSxcbiAgICAgICAgb3JSZXF1aXJlZDogZnVuY3Rpb24odmFsLCBkYXRhVmFsLCBlbCl7XG4gICAgICAgICAgdmFyXG4gICAgICAgICAgICByZXN1bHQgPSBhcHAudmFsaWRhdG9yLnZhbGlkYXRlRnVuY3Rpb24ucmVxdWlyZWQodmFsLCBkYXRhVmFsLCBlbCk7XG4gICAgICAgICAgdmFyXG4gICAgICAgICAgICBpdGVtO1xuICAgICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgICBpdGVtID0gXy5maW5kV2hlcmUoYXBwLnZhbGlkYXRvci52YWxpZEFycmF5LCB7bmFtZTogZGF0YVZhbH0pO1xuICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gYXBwLnZhbGlkYXRvci52YWxpZGF0ZUZ1bmN0aW9uLnJlcXVpcmVkKGl0ZW0udmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgaW52YWxpZFRleHRGdW5jdGlvbjoge1xuICAgICAgICBkYXRlOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgcmV0dXJuIGFwcC52YWxpZGF0b3IudmFsaWRhdGVNZXNzYWdlLmRhdGU7XG4gICAgICAgIH0sXG4gICAgICAgIGZsb2F0OiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgcmV0dXJuIGFwcC52YWxpZGF0b3IudmFsaWRhdGVNZXNzYWdlLmZsb2F0O1xuICAgICAgICB9LFxuICAgICAgICBpbnQ6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICByZXR1cm4gYXBwLnZhbGlkYXRvci52YWxpZGF0ZU1lc3NhZ2UuaW50O1xuICAgICAgICB9LFxuICAgICAgICBudW1iZXI6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICByZXR1cm4gYXBwLnZhbGlkYXRvci52YWxpZGF0ZU1lc3NhZ2UubnVtYmVyO1xuICAgICAgICB9LFxuICAgICAgICBzdHJpbmc6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICByZXR1cm4gYXBwLnZhbGlkYXRvci52YWxpZGF0ZU1lc3NhZ2Uuc3RyaW5nO1xuICAgICAgICB9LFxuICAgICAgICBub0VtcHR5OiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgcmV0dXJuIGFwcC52YWxpZGF0b3IudmFsaWRhdGVNZXNzYWdlLm5vdEVtcHR5O1xuICAgICAgICB9LFxuICAgICAgICBib29sZWFuOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgcmV0dXJuIGFwcC52YWxpZGF0b3IudmFsaWRhdGVNZXNzYWdlLmJvb2xlYW47XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgcmV0dXJuICBhcHAudmFsaWRhdG9yLnZhbGlkYXRlTWVzc2FnZS5yZXF1aXJlZDtcbiAgICAgICAgfSxcbiAgICAgICAgY2hlY2tlZDogZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgIHJldHVybiBhcHAudmFsaWRhdG9yLnZhbGlkYXRlTWVzc2FnZS5jaGVja2VkO1xuICAgICAgICB9LFxuICAgICAgICBlbWFpbDogZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgIHJldHVybiBhcHAudmFsaWRhdG9yLnZhbGlkYXRlTWVzc2FnZS5lbWFpbDtcbiAgICAgICAgfSxcbiAgICAgICAgcGhvbmU6IGZ1bmN0aW9uICh2YWwpe1xuICAgICAgICAgIHJldHVybiBhcHAudmFsaWRhdG9yLnZhbGlkYXRlTWVzc2FnZS5waG9uZTtcbiAgICAgICAgfSxcbiAgICAgICAgb3JSZXF1aXJlZDogZnVuY3Rpb24odmFsdWUsIHJ1bGVWYWwsIGVsZW0pICB7XG4gICAgICAgICAgcmV0dXJuICQoZWxlbSkuZGF0YSgnb3JSZXF1aXJlZE1lc3NhZ2UnKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRGdW5jdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICAgIGZvcm1WYWxpZGF0ZTogZnVuY3Rpb24oYXJyYXksICRmb3JtLCBzaWxlbnQpIHtcbiAgICAgICAgdmFyXG4gICAgICAgICAgdGhhdCA9IHRoaXMsXG4gICAgICAgICAgYWxsVmFsaWQgPSB0cnVlO1xuICBcbiAgICAgICAgYXBwLnZhbGlkYXRvci5wYXJzZU1lc3NhZ2UoKTtcbiAgICAgICAgdGhhdC52YWxpZEFycmF5ID0gW107XG4gICAgICAgICQoJGZvcm0pLmZpbmQoJ2lucHV0LCBzZWxlY3QsIHRleHRhcmVhJykuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXJcbiAgICAgICAgICAgICRlbGVtID0gJCh0aGlzKTtcbiAgXG4gICAgICAgICAgdGhhdC52YWxpZEFycmF5LnB1c2goe1xuICAgICAgICAgICAgZWxlbTogJGVsZW0sXG4gICAgICAgICAgICBydWxlczogJGVsZW0uZGF0YSgpLFxuICAgICAgICAgICAgdmFsdWU6ICRlbGVtLnZhbCgpLFxuICAgICAgICAgICAgbmFtZTogJGVsZW0uYXR0cignbmFtZScpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBfLmVhY2godGhhdC52YWxpZEFycmF5LCBmdW5jdGlvbihlbCkge1xuICAgICAgICAgIHZhclxuICAgICAgICAgICAgX2VsZW1WYWxpZCA9IHRydWU7XG4gIFxuICAgICAgICAgIF8uZWFjaChlbC5ydWxlcywgZnVuY3Rpb24gKHJ1bGVWYWwsIHJ1bGVOYW1lKSB7XG4gICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgJHBhcmVudCA9IGVsLmVsZW0ucGFyZW50cyh0aGF0LmNvbmZpZy5zZWxlY3RvckZpZWxkSXRlbSk7XG4gICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgdGV4dDtcbiAgXG4gICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHRoYXQudmFsaWRhdGVGdW5jdGlvbltydWxlTmFtZV0pICYmIF9lbGVtVmFsaWQpIHtcbiAgICAgICAgICAgICAgX2VsZW1WYWxpZCA9IHRoYXQudmFsaWRhdGVGdW5jdGlvbltydWxlTmFtZV0oZWwudmFsdWUsIHJ1bGVWYWwsIGVsLmVsZW0pO1xuICBcbiAgICAgICAgICAgICAgaWYgKCFfZWxlbVZhbGlkKSB7XG4gICAgICAgICAgICAgICAgYWxsVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAoIXNpbGVudCkge1xuICAgICAgICAgICAgICAgICAgdGV4dCA9IHRoYXQuaW52YWxpZFRleHRGdW5jdGlvbltydWxlTmFtZV0oZWwudmFsdWUsIHJ1bGVWYWwsIGVsLmVsZW0pO1xuICAgICAgICAgICAgICAgICAgJHBhcmVudC5hZGRDbGFzcyh0aGF0LmNvbmZpZy5jbGFzc0ludmFsaWQpLnJlbW92ZUNsYXNzKHRoYXQuY29uZmlnLmNsYXNzVmFsaWQpLmF0dHIoJ2RhdGEtaXZhbGlkLW1lc3NhZ2UnLCB0ZXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHBhcmVudC5yZW1vdmVDbGFzcyh0aGF0LmNvbmZpZy5jbGFzc0ludmFsaWQpLmFkZENsYXNzKHRoYXQuY29uZmlnLmNsYXNzVmFsaWQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKCFfZWxlbVZhbGlkKSB7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFsbFZhbGlkO1xuICAgICAgfSxcbiAgICAgIGlucHV0VmFsaWRhdGU6IGZ1bmN0aW9uKCRpbnB1dCkge1xuICAgICAgICB2YXJcbiAgICAgICAgICB0aGF0ID0gdGhpcyxcbiAgICAgICAgICB2YWxpZCA9IHRydWU7XG5cbiAgICAgICAgYXBwLnZhbGlkYXRvci5wYXJzZU1lc3NhZ2UoKTtcbiAgICAgICAgdGhpcy52YWxpZEFycmF5ID0gW107XG4gIFxuICAgICAgICB0aGlzLnZhbGlkQXJyYXkucHVzaCh7XG4gICAgICAgICAgZWxlbTogJGlucHV0LFxuICAgICAgICAgIHJ1bGVzOiAkaW5wdXQuZGF0YSgpLFxuICAgICAgICAgIHZhbHVlOiAkaW5wdXQudmFsKCksXG4gICAgICAgICAgbmFtZTogJGlucHV0LmF0dHIoJ25hbWUnKVxuICAgICAgICB9KTtcbiAgXG4gICAgICAgIF8uZWFjaCh0aGF0LnZhbGlkQXJyYXksIGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgdmFyXG4gICAgICAgICAgICBfZWxlbVZhbGlkID0gdHJ1ZTtcbiAgXG4gICAgICAgICAgXy5lYWNoKGVsLnJ1bGVzLCBmdW5jdGlvbiAocnVsZVZhbCwgcnVsZU5hbWUpIHtcbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAkcGFyZW50ID0gZWwuZWxlbS5wYXJlbnRzKHRoYXQuY29uZmlnLnNlbGVjdG9yRmllbGRJdGVtKTtcbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICB0ZXh0O1xuICBcbiAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odGhhdC52YWxpZGF0ZUZ1bmN0aW9uW3J1bGVOYW1lXSkgJiYgX2VsZW1WYWxpZCkge1xuICAgICAgICAgICAgICBfZWxlbVZhbGlkID0gdGhhdC52YWxpZGF0ZUZ1bmN0aW9uW3J1bGVOYW1lXShlbC52YWx1ZSwgcnVsZVZhbCwgZWwuZWxlbSk7XG4gIFxuICAgICAgICAgICAgICBpZiAoIV9lbGVtVmFsaWQpIHtcbiAgICAgICAgICAgICAgICB2YWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgdGV4dCA9IHRoYXQuaW52YWxpZFRleHRGdW5jdGlvbltydWxlTmFtZV0oZWwudmFsdWUsIHJ1bGVWYWwsIGVsLmVsZW0pO1xuICAgICAgICAgICAgICAgICAgJHBhcmVudC5hZGRDbGFzcyh0aGF0LmNvbmZpZy5jbGFzc0ludmFsaWQpLnJlbW92ZUNsYXNzKHRoYXQuY29uZmlnLmNsYXNzVmFsaWQpLmF0dHIoJ2RhdGEtaXZhbGlkLW1lc3NhZ2UnLCB0ZXh0KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkcGFyZW50LnJlbW92ZUNsYXNzKHRoYXQuY29uZmlnLmNsYXNzSW52YWxpZCkuYWRkQ2xhc3ModGhhdC5jb25maWcuY2xhc3NWYWxpZCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWxpZDtcbiAgICAgIH1cbiAgICB9O1xuICB9KSgpOyJdfQ==
