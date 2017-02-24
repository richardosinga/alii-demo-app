(function($) {

	$.fn.exists = function () {
		return this.length !== 0;
	}
	
	function crossmarx(selector, container) {
		
		return {
			element: container == null ? $(selector) : $(selector, container),
			
			retainCollapse : function() {
				retainCollapse.apply(this.element);
			},
			
			loadReplace : function() { 
				loadReplace.apply(this.element, arguments);
			},
			
			calendar : function() {
				this.element.on("click", "a.cx_pick", setDate);
			},
			
			focusnext : function() {
				focusNext.apply(this.element);
			},
			
			taglist : function() {
				taglist.apply(this.element);
			},
			
			splitpane : function() {
				var self = this;
				crossmarx.using("splitpane", function() {
					crossmarx.splitpane.create.apply(self.element);
				});
			},
			
			upload : function(configuration) {
				var self = this;
				crossmarx.using("upload", function() {
					crossmarx.upload.create.call(self.element, configuration);
				});
			},
			
			chat : function() {
				var self = this;
				var widget = this;
				crossmarx.using("chat", function() {
					crossmarx.chat.init.apply(self.element);
				});
			},
			
			locationpicker : function(configuration) {
				var self = this;
				crossmarx.using("locationpicker", function() {
					crossmarx.locationpicker.create.call(self.element, configuration);
				});
			},
						
			imagecropper: function() {
				var self = this;
				crossmarx.using("imagecropper", function() {
					crossmarx.imagecropper.create.apply(self.element);
				});
			},
												
			editor: function() {
				var self = this;
				crossmarx.using("editor", function() { 
					new crossmarx.Editor(self.element);
				});
			},
			
			clear: function() {
				this.element.each(function() {
					$(this).val("");
				});
				$(this.element).first().change();
			},
			
			setConfiguration : function(configuration) {
				this.element.data("cx_configuration", configuration);
			},
			
			getConfiguration : function() {
				return this.element.data("cx_configuration");
			}			
			
		}
	}
	
	crossmarx.isAM = false;
	crossmarx.useAJAX = true;
	
	crossmarx.apikeys = {};
	crossmarx.tools = {};
	crossmarx.tools.supportsSvg = document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1");
	crossmarx.tools.isTouchDevice = ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
	crossmarx.tools.isFileApiSupported = !!('File' in window && 'FileReader' in window && 'FileList' in window && 'Blob' in window);
	crossmarx.tools.isCanvasSupported = !!(document.createElement('canvas').getContext && document.createElement('canvas').getContext('2d'));
	crossmarx.tools.MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
	crossmarx.tools.escape = escape;
	crossmarx.tools.breakpoint = {small: 768, medium: 992, large: 1200};

	crossmarx.ui = {};	
	crossmarx.ui.VERSION = "3.0";
 	crossmarx.ui.loadingSpinner = '<div class="cx_img-loading"><i class="fa fa-spinner fa-spin"></i></div>';	
	crossmarx.ui.tooltip = {selector: "[data-toggle=\"tooltip\"]"};
	crossmarx.ui.modal = {domId: "cx_modal", contentSelector: ".modal-content"};
	crossmarx.ui.modal.close = function() {
		$("#" + crossmarx.ui.modal.domId).modal("hide");
	}	
	crossmarx.ui.popover = {
		close : function() { 
				if (POPOVER) { 
					POPOVER.popover('destroy');
					POPOVER = null;
				}
		}
	}
	// todo deprecate (used by dropzone.js)
	crossmarx.events = {
		stop : function(event) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			event.stopped = true;
		}
	}
	
	crossmarx.htmleditor = {};

	/*
	 * Private variables
	 */
	var MODIFIED = false; // Should be form data attribute
	var POPOVER;
	
	function init(container) {
		if (container == null) {
			container = $(document.body);
		}
		
		// Tooltips
		if (!crossmarx.tools.isTouchDevice) {
			if (typeof container.tooltip === "function") {
				container.tooltip({
				    selector: crossmarx.ui.tooltip.selector,
				    delay: { "show": 500, "hide": 100 },
				    html: true,
				    container: "body"
				});
			}
		}
				
		if (crossmarx.useAJAX) {
			// Ajax with or without submit
			$(".cx_ajax", container).click(ajaxify);
			$(".cx_ask", container).click(dialogIfModified);
		}
		
		// Forms
		$(".cx_submit", container).click(submitOnClick);
		$(".cx_form", container).on("keydown", "input[type=text]:enabled, input[type=password]:enabled", submitOnEnter);
		$(".cx_form", container).on("change", "input, textarea, select", setAsModified);
		$(".cx_autosubmit", container).on("change", submitOnChange);
		$(".cx_autosubmitConditionally", container).on("change", submitOnChangeConditionally);
		
		$(".btn[data-confirm]:not(.cx_ajax)", container).click(confirm);
		
		// Layout 
		$(".cx_menu", container).each(menu);
		$(".cx_tabpanel", container).each(tabpanel);
		$(".cx_paragraph ", container).each(paragraph);
		$(".cx_tree", container).each(tree);
		
		// Tables 
		$(".cx_persist-table", container).each(persistTable);		
		$(".cx_table", container).each(table);
		
		// Widgets
		$(".cx_htmleditor", container).each(htmlEditor);
		$(".cx_doubleselectbox", container).each(doubleSelectBox);
		$(".cx_colorpicker", container).each(colorPicker);
		$(".cx_drop-zone", container).each(dropZone);
		$(".cx_taglist", container).each(taglist);
		$(".cx_focusnext", container).each(focusNext);
						
	}
	
	function ajaxify(event) {
		event.preventDefault();
		var link = $(this);
		var confirmed = confirm.apply(this);
		if (!confirmed) {
			return false;
		}
		var url = link.attr("href");
		var form = link.closest("form");
		if (!form.exists()) {
			form = $("#" + crossmarx.ui.modal.domId + " form");
		}
		var config = {};
		config.url = url;
		config.form = form;
		config.target = $(event.target);
		crossmarx.ajax(config);
		return false;
	}

	function dialogIfModified() {
		if (MODIFIED) {
			var link = $(this);
			var href = link.attr('href');
			var form = link.closest("form");
			var urlIfModified = form.data('urlifmodified');
			if (urlIfModified) {
				url = urlIfModified + "&url=" + encodeURIComponent(href);
				crossmarx.ajax(url, form.attr("name"));
				return false;
			}
		}
		return true;
	}
	
	function menu() {
		var menu = this;
		crossmarx.using("menu", function() {
			crossmarx.menu.create.apply(menu);
		});
	}
	
	function tabpanel() {
		var tabpanel = this;
		crossmarx.using("tabpanel", function() {
			crossmarx.tabpanel.create.apply(tabpanel);
		});
	}
	
	function paragraph() {
		var paragraph = this;
		crossmarx.using("paragraph", function() {
			crossmarx.paragraph.create.apply(paragraph);
		});
	}
	
	function table() {
		var table = this;
		crossmarx.using("table", function() {
			crossmarx.table.init.apply(table);
		});
	}
	
	function persistTable() {
		var table = $(this);
		crossmarx.using("persistTable", function() { 
			new crossmarx.PersistTable(table);
		});
	}
	
	function tree() {
		var tree = $(this);
		crossmarx.using("tree", function() { 
			new crossmarx.Tree(tree);
		});
	}
	
	function htmlEditor() {
		var widget = this;
		crossmarx.using("htmleditor", function() { 
			crossmarx.htmleditor.create.apply(widget);
		});		
	}
	
	function doubleSelectBox() {
		var widget = this;
		crossmarx.using("doubleselectbox", function() {
			crossmarx.doubleselectbox.init.apply(widget);
		});
	}
	
	function dropZone() {
		var widget = $(this);
		crossmarx.using("dropzone", function() { 
			new crossmarx.DropZone(widget);
		});
	}
	
	function colorPicker() {
		var widget = $(this);
		crossmarx.using(["/webresources/3.0/css/spectrum.css","/webresources/js/colorpicker/spectrum/spectrum.js"], function() {
			var auto = $(widget).data('autosubmit');
			var onchange;
			if (auto) {
				onchange = function(color) { submitOnChange(event, this) };
			}
			var color = $(widget).val() == "" ? "rgba(0,0,0,0)" : false;
			widget.spectrum({
				preferredFormat: "hex",
				showInput: true,
				color: color,
				showInitial: true,
				change : onchange
			});
		});
	}
		
	function confirm() {
		var confirmationText = $(this).data("confirm");
		if (confirmationText) {
			return window.confirm(confirmationText);
		}
		return true;
	}
	
	/* Retains toggles state for collapsible paragraphs and dashboard panels */
	function retainCollapse() {
		var collapsible = $(this);
		var stateKey = "crossmarx." + collapsible.attr("id") + ".collapse";
		var sessionState = sessionStorage.getItem(stateKey);		
		if (sessionState) {
			collapsible.collapse(sessionState);
		}
		collapsible.on("show.bs.collapse", function() {
			sessionStorage.setItem(stateKey, "show");
		});
		collapsible.on("hide.bs.collapse", function() {
			sessionStorage.setItem(stateKey, "hide");			
		});
	}
		
	function taglist() {
		var widget = $(this);
		var checkboxes = $("input", widget);
		$(".cx_checkAll", widget).click(function() {
			checkboxes.each(function() { 
				this.checked = true;
			});
		});
		$(".cx_uncheckAll", widget).click(function() {
			checkboxes.each(function() { 
				this.checked = false;
			});
		});
	}
	
	/*
	 * Bedoeld als variant op jQuery.load waarbij HTML middels AJAX in de geselecteerde
	 * elements gezet kan worden. Met deze methode worden de geselecteerde elements
	 * helemaal vervangen.
	 */
	function loadReplace(url, params) {
		var self = this;
		$.ajax(url, {
			data: params || {
				time: new Date().getTime()
			},
			dataType: "text",
			success: function(html) {
				self.each(function(e,i) {
					$(this).replaceWith(html);
				});
			},
			type: "POST"
		})
	}
				
	function focusNext() {
		$(this).keyup(function(event) {
			var ctrlCmd = event.metaKey === true || event.ctrlKey === true;
			var exceptions = [17, 16, 9]; // ctl, shift, tab
			if (jQuery.inArray( event.keyCode, exceptions) !== -1 || ctrlCmd ) {
				console.log('exeption');
			} else {
				if (this.value.length == this.getAttribute("maxLength")) {
					$(this).next().focus();
				}
			}
		});
	}
	
	function submitOnClick(event) {
		event.preventDefault();
		var button = $(event.target).closest("a");
		var url = button.attr('href');
		var target = button.attr('target');
		var form = $(button).closest("form");
		if (!form.exists()) {
			var modal = $(button).closest("#" + crossmarx.ui.modal.domId);
			form = modal.find("form");			
		}
		if (!form.exists()) {
			form = $("body .cx_form").first();
		}
		if (form.exists()) {
			if (url) {
				form.attr('action', url);
			}
			if (target) {
				form.attr('target', target);
			}
			form.submit();
		} else {
			console.warn('Submit service call on a button that is NOT on a form');
			if (url) {
				location.href = url;
			}
		}
	}
		
	function submitOnChange(event, element) {
		if (!element) {
			element = event.target;
		}
		var form = $(element).prop('form');
		var url = $(element).closest(".cx_widget").data('urlonchange');
		if (url) {
			crossmarx.ajax(url, form);
		} else {
			crossmarx.ajax(form.action, form);
		}
	}
	
	function submitOnChangeConditionally(event) {
		var widget = $(event.target).closest(".cx_widget");
		var url = widget.data('urlonchange');
		var elements = $("input:text, select", widget);
		var nrOfValues = 0;
		elements.each(function() {
			if ($(this).val() != "") {
				nrOfValues++;
			}
		});
		if (nrOfValues == 0 || nrOfValues == elements.length) {
			crossmarx.ajax(url, elements[0].form);
		}
	}
	
	function submitOnEnter(event) {
	    var keyCode = event.keyCode;
		if (keyCode == 13) {
			event.preventDefault();
			event.stopPropagation();
			var form = event.target.form;
			$(event.target).off("change");
			if ($(form).data('ajaxonenter')) {
				crossmarx.ajax(form.action, form);
			} else {
				form.submit();
			}
		} else {
			return true;
		}
	}
	
	function sendStayAlive() {
		var url = "/engine?service=session&cmd=stayalive";
		$.ajax(url,{type:"POST"});
	}
		
	function handleAJAXReply(data) {
		try {
			$(crossmarx.ui.tooltip.selector).tooltip("hide");			
			var response;
			if ((typeof data) === "string") {
				response = $.parseJSON(data);
			} else {
				response = data;						
			}
			var elements = response.elements;
			if (elements) {
				for (var i = 0; i < elements.length; i++) {
					var element = elements[i];
					var domId = element.domId;
					var selector = "#" + escape(domId);
					var	domElement = $(selector);
					var newHtml = element.html;
					if (domElement.exists()) {
						switch(element.action) {
							case "replace":
								if (domId == crossmarx.ui.modal.domId) {
									var newElement = $(newHtml);										
									var modalContent = $(crossmarx.ui.modal.contentSelector, newElement);
									$(crossmarx.ui.modal.contentSelector, domElement).replaceWith(modalContent);
								} else {
									domElement.replaceWith(newHtml);
								}
								init($(selector));											
								break;
							case "prepend":
								var newElement = $(newHtml);										
								domElement.prepend(newElement);
								init(newElement);
								break;
							case "append":
								var newElement = $(newHtml);
								domElement.append(newElement);
								domElement.trigger("crossmarx:append");
								init(newElement);
								break;
						}
					} else if (domId == crossmarx.ui.modal.domId) {
						var modal = $(newHtml);
						$(document.body).append(modal);
						modal.on('shown.bs.modal', function() {
							var formInModal = $(".cx_form", $(this));
							if (!formInModal.exists()) {
								$(".btn", $(this)).last().focus();
							} else {
								focusFirst.apply(formInModal);
							}
							init($(selector));
						});
						modal.on('hidden.bs.modal', function() {
							var urlOnClose = modal.data('urlonclose');
							if (urlOnClose) {
								crossmarx.ajax(urlOnClose);
							}
							$(this).remove();
						});
						modal.modal();
					} else {
						console.warn("Element id: " + domId + " not found in DOM.");
					}
				
				}
			}
			if (response.reloadUrl) {
				location.href = response.reloadUrl;
				return;
			}	
			if (response.closeModal) {
				crossmarx.ui.modal.close();
			}
			if (response.closePopover) {
				crossmarx.ui.popover.close();
			}
			if (response.modified) {
				setAsModified();
			}
			if (response.popover) {
				var selector = "#" + escape(response.popover.domId);
				var domElement = $(selector);
				var popoverId = domElement.attr('aria-describedby');
				var popover;
				if (popoverId) {
					$("#" + popoverId + " .popover-content").html(response.popover.content);
					popover = $("#" + popoverId);
				} else {
					crossmarx.ui.popover.close();
					domElement.popover({
						container: "body",
						trigger: "manual",
						title: response.popover.title,
						content: response.popover.content,
						html: true,
						placement: response.popover.placement}).popover("show");
					popover = $("#" + domElement.attr('aria-describedby'));
					POPOVER = popover;
					$(document).one("click", crossmarx.ui.popover.close);
				}
				init(popover);	
			}
		} catch(e) {
			if (crossmarx.isAM) {
				alert("AJAX error:" + e.message);
			} else {
				sendNotification("AJAX-ERROR: " + e.message, data);
			}
			location.href = "/engine";
		} finally {
			setCursorWaiting(false, this.target);
		}
		if (this.successCallBack) {
			this.successCallBack();
		}
	}
	
	function handleAJAXError(jqXHR, textStatus, errorThrown) {
		setCursorWaiting(false, this.target);
		if (jqXHR.status == 0) {
			// Call was aborted by superceding request
			return;
		}
		if (crossmarx.isAM) {
			alert("AJAX error:" + errorThrown);
		}
		console.log("jqXHR: " + jqXHR);		
		console.log("textStatus: " + textStatus);
		console.log("errorThrown:" + errorThrown);
		if (this.errorCallBack) {
			this.errorCallBack();
		}
	}
	
	function setAsModified() {
		MODIFIED = true;
		$(".cx_btn-save").addClass("btn-success");
	}
	
	function focusFirst() {
		$("input[type=text]:enabled, input[type=checkbox]:enabled, input[type=radio]:enabled", $(this)).first().focus();		
	}
	
	function escape(selector) {
		return selector.replace( /(:|\.|\[|\]|,)/g, "\\$1" );
	}
	
	function sendNotification(message, body) {
	    $.ajax("/engine", {
	    	data: {
	        	service: "engine",
	        	cmd: "notify",
	        	message: message,
	        	body: body,
	        	ajax: true
	        },
	    	dataType: "text",
	    	type: "POST"
	    });
	}
	
	// Fires a native event programmativally. Mainly used for (on)change events.
	function fire(type, element) {
		if (document.createEventObject) {
			element.fireEvent("on" + type, document.createEventObject());
		} else {
	        var evt = document.createEvent("HTMLEvents");
	        evt.initEvent(type, true, true); 
	        element.dispatchEvent(evt);
		}	
	}
	
	crossmarx.poll = function (url, interval, successCallBack) {	
		var callBack = function() {
			setTimeout(crossmarx.poll, interval, url, interval, successCallBack);
		}
		crossmarx.ajax({url: url, completeCallBack: callBack, successCallBack: successCallBack, silent: true});
	}
	
	crossmarx.ajax = function () {
		var url, form, extraParameters, completeCallBack, target, silent = false;
		if (arguments[0].url) {
			var config = arguments[0];
			url = config.url;
			form = config.form;
			extraParameters = config.extraParameters;
			completeCallBack = config.completeCallBack;
			target = config.target;
			if (config.silent) {
				silent = true;
			}
		} else {
			url = arguments[0];
			if (arguments.length > 1) {
				form = arguments[1];
			}
			if (arguments.length > 2) {
				extraParameters = arguments[2];
			}
			if (arguments.length > 3) {
				completeCallBack = arguments[3];
			}
		}
		if (!crossmarx.useAJAX) {
			if (form) {
				if (url) {
					$(form).attr('action', url);
					form.submit();
				}
			} else {
				location.href = url;
			}
			return;
		}
		if (!silent) {
			setCursorWaiting(true, target);
		}
		var params = new Array();
		if (form) {
			if (typeof(tinyMCE) != 'undefined') {
				tinyMCE.triggerSave();
			}
			// In case of form name is still passed
			if ((typeof form) === "string") {
				form = document.forms[form];
			}
			params = $(form).serializeArray();
		}
		if (extraParameters) {
			for (key in extraParameters) {
				params.push({name:key, value:extraParameters[key]});
			}
		}
		params.push({name:"currenttime", value: new Date().getTime()});
		$.ajax(url, {
			data: params,
			dataType: "json",
			type: "POST",
			context: config,
			success: handleAJAXReply,
			complete: completeCallBack,
			error: handleAJAXError
		});
	}
	
	function setCursorWaiting(waiting, target) {
		if (waiting) {
			document.body.style.cursor = "wait";
			if (target) {
				target.addClass("cx_wait");
			}
		} else {
			document.body.style.cursor = "default";			
			if (target) {
				target.removeClass("cx_wait");
			}
		}
	}
	
	// todo Deprecate
	crossmarx.set = function(inputValues) {
		var input;
		for (var name in inputValues) {
			input = $("[name='" + name + "']");
			input.val(inputValues[name]);
		};
		fire("change", input[0]);
	}
	    			
	crossmarx.startStayAlive = function (seconds) {
		setInterval("sendStayAlive()", seconds * 1000);
	}
 
	crossmarx.setFocus = function (selector) {
		if ($(document).width() < crossmarx.tools.breakpoint.large && crossmarx.tools.isTouchDevice){
			// No focus on mobile
		} else {
			var input = $(selector);
			if (input.exists() && !input[0].disabled) {
				input.focus();
			} else {
				focusFirst($('.cx_form'));
			}
		}
	}
		
	crossmarx.onWindowResize = function (callbackFunction, callbackTimer, scope) { 
		callbackTimer = callbackTimer || 250;
		var resizeTimer;
		$(window).on('resize', function(e) {	
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function() {
				if (scope){
					callbackFunction(scope);
				}else{
					callbackFunction();
				}
			}, callbackTimer);	
		});
	}
		
	// Expose
	crossmarx.setAsModified = setAsModified;
	crossmarx.submitOnChange = submitOnChange;
	crossmarx.handleAJAXReply = handleAJAXReply;
	crossmarx.init = init;
	
	// Temporary alias
	crossmarx.getChangedElements = crossmarx.ajax;
			
	$(document).ready(function() { init(); });
	
	// Expose object to global context
	window.crossmarx = crossmarx;
	// Temporary alias
	window.CX = crossmarx;
	
	
})(jQuery);

/*
 * Module loader
 */
(function(crossmarx) {
	
	var MODULES = {},
		ONREADYS = {},
		EXPORTED = {},
		STACK = [];
	
	/*
	 * Module handling functions, private 
	 */
	function exportModule(module, exports) {
		var parts = module.split("/"),
			obj = crossmarx;
		for (var i = 0; i < parts.length; i++) {
			obj[parts[i]] = obj[parts[i]] || {};
			obj = obj[parts[i]];
		}
		for (property in exports) {
			obj[property] = exports[property];
		}
	}
	
	function getSource(name) {
		if (isFilename(name) || isCSS(name)) {
			return name;
		} else if (isModule(name)) {
			return "/webresources/" + crossmarx.ui.VERSION + "/js/modules/" + name + ".js";; 
		} else {
			/*
			 * We proberen het gewoon
			 */
			return name;
		}
	}
	
	function isFilename(name) {
		return /^\/.+\.js$/i.test(name); 
	}
	
	function isCSS(name) {
		return /^\/.+\.css$/i.test(name);
	}
	
	function isModule(name) {
		return /^[a-z][a-z0-9\.\-_]*(\/[a-z][a-z0-9\.\-_]*)*$/i.test(name); 
	}

	function isReady(module) {
		if (EXPORTED[module]) {
			return true;
		} else if (MODULES[module] && MODULES[module].ready) {
			return true;
		}
		return false;
	}
	
	function loadScript(module) {
		var element;
		if (isCSS(module)) {
			element = document.createElement("link");
			element.rel = "stylesheet";
			element.href = getSource(module);
		} else {
			element = document.createElement("script");
			element.src = getSource(module);
		}
		if (!isModule(module)) {
			if (element.readyState) { // IE
				element.onreadystatechange = function() {
					if (element.readyState == "loaded" || element.readyState == "complete") {
						ready(module);
					}
				};
			} else {
				element.onload = function() {
					ready(module);
				};
			}
		}
		document.head.appendChild(element);
	}
	
	function onReady(module, foo) {
		if (isReady(module)) {
			foo.call();
		} else {
			if (!ONREADYS[module]) {
				ONREADYS[module] = [];
			}
			ONREADYS[module].push(foo);
		}
	}
	
	function ready(module) {
		if (!EXPORTED[module]) {
			EXPORTED[module] = true;
		}
		var onReadys = ONREADYS[module];
		if (onReadys) {
			for (var i = 0; i < onReadys.length; i++) {
				onReadys[i].call();
			}
		}
		delete ONREADYS[module];
	}
	
	var Module = function(name, dependencies, body) {
			this.name = name;
			this.dependencies = dependencies;
			this.body = body;
			this.ready = false;
			this.initialize();
		};
	
	Module.prototype.initialize = function() {
			MODULES[this.name] = this;			
			var self = this;
			for (var i = 0; i < this.dependencies.length; i++) {
				var dependency = this.dependencies[i];
				if (!isReady(dependency)) {
					load(dependency, function() {
						self.checkReady();
					});
				}
			}
			this.checkReady();
		};
	
	Module.prototype.checkReady = function() {
			for (var i = 0; i < this.dependencies.length; i++) {
				if (!isReady(this.dependencies[i])) {
					return;
				}
			}
			this.ready = true;
			var exports = {};
			this.body.call(exports);
			EXPORTED[this.name] = exports;
			exportModule(this.name, exports);
			ready(this.name);
		};
	

	/**
	 * Load a module or javascript source
	 * @module name of the module
	 * @ready callback after module has been loaded
	 */
	function load(module, ready) {
		if (isReady(module)) {
			ready.call();
		} else {
			onReady(module, ready);
			if (STACK.indexOf(module) < 0) {
				STACK.push(module);
				loadScript(module);
			} else if (MODULES[module]) {
				throw "Circular module dependency: " + module;
			}
		}
	}
	
	/**
	 * Define a module with given name and dependencies. Dependencies
	 * are loaded before body is executed.
	 * @name module name
	 * @dependencies a list of dependencies
	 * @body callback executed after all dependencies have been loaded
	 */
	function define(name, dependencies, body) {
		if (!(dependencies instanceof Array)) {
			dependencies = [dependencies];
		}
		if (MODULES[name]) {
			throw "Module already defined";
		}
		MODULES[name] = new Module(name, dependencies, body);
	};
	
	/**
	 * Execute a script depending on given dependencies
	 * @dependencies a list of dependencies
	 * @body callback executed after all dependencies have been loaded
	 */
	function using(dependencies, body) {
		if (!(dependencies instanceof Array)) {
			dependencies = [dependencies];
		}
		var rf = function() {
				for (var i = 0; i < dependencies.length; i++) {
					if (!isReady(dependencies[i])) {
						return;
					}
				}
				body.call();
			};
		for (var i = 0; i < dependencies.length; i++) {
			load(dependencies[i], rf);
		}
	};

	crossmarx.define = define;
	crossmarx.using = using;
		
})(window.crossmarx);
