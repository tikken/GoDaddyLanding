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
