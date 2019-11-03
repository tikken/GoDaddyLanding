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