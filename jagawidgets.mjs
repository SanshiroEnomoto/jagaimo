// jagawidgets.mjs //
// Author: Sanshiro Enomoto <sanshiro@uw.edu> //
// Created on 2 November 2017 //


import { JG as $, JGElement } from './jagaimo.mjs';


export class JGWidget {
    constructor(obj, options) {
        this.obj = $(obj);
        
        if (typeof $.widgetList == 'undefined') {
            $.widgetList = [ null ];
            $.registerWidget = function(widget, obj) {
                $(obj).data('jagaimo-widget-index', $.widgetList.length);
                $.widgetList.push(widget);
            };
            $.findWidgetByElement = function (obj) {
                return $.widgetList[$(obj).data('jagaimo-widget-index')];
            };
            $widget = $.findWidgetByElement;
        }
        $.registerWidget(this, this.obj);
    }

    element() {
        return this.obj;
    }
};
let $widget = function(obj) { return undefined; };


export class JGTabWidget extends JGWidget {

    /***** DOM Structure *****
      <div id="ObjId">
          <+++div class="jaga-tabLabelBox">
            <+++span class="jaga-tabLabel">Label 1</span>
            <+++span class="jaga-tabLabel">Label 2</span>
            <+++span class="jaga-tabLabel">Label 3</span>
          <+++/div>
          <div class="jaga-tabPage" label="Page 1"></div>
          <div class="jaga-tabPage" label="Page 2"></div>
          <div class="jaga-tabPage" label="Page 3"></div>
      </div>
    /******/
    
    constructor(obj, options={}) {
        const defaults = {
            // properties //
            // callbacks //
            openPage: null
        };
        
        super(obj, options);
        this.options = $.extend({}, defaults, options);
        this.obj.addClass('jaga-tabWidet');

        let labelbox = $('<div>').addClass('jaga-tabLabelBox');
        this.obj.prepend(labelbox);
        
        this.pages = this.obj.find('.jaga-tabPage');
        for (let pageNumber = 0; pageNumber < this.pages.length; pageNumber++) {
            let label = $('<span>');
            label.addClass('jaga-tabLabel');
            labelbox.append(label);
            label.text(this.pages.at(pageNumber).attr('label'));
            label.click(e => this.openPage($(e.target).closest('.jaga-tabLabel').text()));
            label.onkeypress = (e => e.target.click());
            label.attr({'tabindex': '0'});
        }
        this.labels = labelbox.find('.jaga-tabLabel');
        if (this.pages.length > 0) {
            this.openPage(0);
        }
    }

    openPage(page) {
        let pageNumber = null;
        if (typeof page == 'number') {
            pageNumber = page;
        }
        else if (typeof page == 'string') {
            for (let i = 0; i < this.pages.length; i++) {
                if (this.labels.at(i).text() == page) {
                    pageNumber = i;
                    break;
                }
            }
        }
        if (pageNumber === null) {
            return;
        }
        if (pageNumber < 0) {
            pageNumber = this.pages.length + pageNumber;
        }
        
        for (let i = 0; i < this.pages.length; i++) {
            if (i == pageNumber) {
                this.labels.at(i).addClass('selected');
                this.pages.at(i).addClass('selected');
                this.pages.at(i).css('display', 'block');
            }
            else {
                this.labels.at(i).removeClass('selected');
                this.pages.at(i).removeClass('selected');
                this.pages.at(i).css('display', 'none');
            }
        }
        if (this.options.openPage) {
            if (pageNumber < this.pages.length) {
                this.options.openPage(this.pages.at(pageNumber));
            }
        }
    }

    appendPage(label) {
        let newPage = $('<div>').addClass('jaga-tabPage').attr('label', label).text("hello");;
        this.obj.append(newPage);
        this.pages = this.obj.find('.jaga-tabPage');
        
        let labelSpan = $('<span>').addClass('jaga-tabLabel').text(label);
        this.obj.find('.jaga-tabLabelBox').append(labelSpan);
        this.labels = this.obj.find('.jaga-tabLabel');
        
        let pageNumber = this.pages.length-1;
        labelSpan.click(e => this.openPage($(e.target).closest('.jaga-tabLabel').text()));
        labelSpan.onkeypress = (e => e.target.click());
        labelSpan.attr({'tabindex': '0'});

        this.openPage(pageNumber);
    }

    removePage(page=null) {
        let currentPage = null;
        for (let i = 0; i < this.pages.length; i++) {
            this.labels.at(i).hasClass('selected');
            currentPage = i;
            break;
        }
        let pageNumber = null;
        if (page === null) {
            pageNumber = currentPage;
        }
        else if (typeof page == 'number') {
            pageNumber = page;
        }
        else if (typeof page == 'string') {
            for (let i = 0; i < this.pages.length; i++) {
                if (this.labels.at(i).text() == page) {
                    pageNumber = i;
                    break;
                }
            }
        }
        if (pageNumber === null) {
            return;
        }
        this.pages.at(pageNumber).remove();
        this.labels.at(pageNumber).remove();
        this.pages = this.obj.find('.jaga-tabPage');
        this.labels = this.obj.find('.jaga-tabLabel');
        if (pageNumber >= this.pages.length) {
            pageNumber = this.pages.length - 1;
        }
        if (pageNumber >= 0) {
            this.openPage(pageNumber);
        }
    }
};



export class JGPopupWidget extends JGWidget {

    constructor(obj, options={}) {
        const defaults = {
            // properties //
            x: null, y: null,
            zIndex: 1000,
            closeButtons: null,  // JGElement or array of JGElement
            closeOnGlobalClick: false,
            closeOnEscapeKey: true,
            // callbacks //
            open: null,
            close: null
        };
        
        super(obj, options);
        this.options = $.extend({}, defaults, options);
        this.obj.addClass('jaga-popup');

        this.obj.css({
            display: 'none',
            position: 'fixed',
            zIndex: this.options.zIndex,
            width: 'fit-content',
            height: 'fit-content',
        });
        
        this.position = { x: this.options.x, y: this.options.y };
        this.moveTo(this.position.x, this.position.y);

        if (this.options.closeButtons instanceof Array) {
            for (let button of this.options.closeButtons) {
                $(button).get().addEventListener('click', e => this.close());
            }
        }
        else if (this.options.closeButtons instanceof JGElement) {
            for (let button of this.options.closeButtons.enumerate()) {
                button.get().addEventListener('click', e => this.close());
            }
        }
    }

    setPosition(x, y) {  // set null for default positioning
        this.position.x = x;
        this.position.y = y;
        if (this.obj.hasClass('jaga-popup-open')) {
            this.open();
        }
    }
    
    moveTo(x=null, y=null) {
        if (x !== null) {
            this.position.x = x;
            this.obj.css('left', x + 'px');
        }
        if (y !== null) {
            this.position.y = y;
            this.obj.css('top', y + 'px');
        }
    }

    static listenToGlobalClick(e) {
        for (let popup of $('.jaga-popup-closeOnClick').enumerate()) {
            $widget(popup).close();
        }
    }
    
    static listenToGlobalKeydown(e) {
        if (e.keyCode && e.keyCode == 27) {
            for (let popup of $('.jaga-popup-closeOnEscapeKey').enumerate()) {
                $widget(popup).close();
            }
        }
    }
    
    open() {
        if (this.obj.hasClass('jaga-popup-open')) {
            this.close();
        }
        
        if (this.options.open) {
            this.options.open(this);
        }
        
        this.obj.show();
        this.obj.addClass('jaga-popup-open');
        
        if (this.position.x === null) {
            let x = (window.innerWidth - this.obj.boundingClientWidth()) / 2;
            if (x < 50) {
                x = 50;
            }
            this.moveTo(x, null);
        }
        if (this.position.y === null) {
            let y = (window.innerHeight - this.obj.boundingClientHeight()) / 2;
            if (y < 50) {
                y = 50;
            }
            this.moveTo(null, y);
        }

        if (this.options.closeOnGlobalClick) {
            this.obj.addClass('jaga-popup-closeOnClick');
            // do not close by clicks within this pop-up
            this.obj.get().addEventListener('click', ev => {
                ev.stopPropagation();
            });
            // open() might be called by a click event, causing this handler immediately called after open()..
            setTimeout(e=>{
                document.addEventListener('click', JGPopupWidget.listenToGlobalClick)
            }, 100);
        }
        if (this.options.closeOnEscapeKey) {
            this.obj.addClass('jaga-popup-closeOnEscapeKey');
            document.addEventListener('keydown', JGPopupWidget.listenToGlobalKeydown);
        }        
    }
    
    openNear(x, y) {
        this.open();
        let [w,h] = [this.obj.boundingClientWidth(), this.obj.boundingClientHeight()];
        let [widthLimit, heightLimit] = [0.98*window.innerWidth, 0.98*window.innerHeight];
        if (x + w > widthLimit) x = widthLimit - w;
        if (y + h > heightLimit) y = heightLimit - h;
        this.moveTo(x, y);
    }
    
    close() {
        this.obj.hide();
        document.removeEventListener('click', JGPopupWidget.listenToGlobalClick);
        document.removeEventListener('keydown', JGPopupWidget.listenToGlobalKeydown);
        this.obj.removeClass(
            'jaga-popup-open jaga-popup-closeOnClick jaga-popup-closeOnEscapeKey'
        );

        if (this.options.close) {
            this.options.close(this);
        }
    }
};



export class JGDraggable {
    constructor(obj, options={}) {
        const defaults = {
            handle: null,
            preventDefault: false,
            stopPropagation: false,
        };
        options = $.extend({}, defaults, options);
        obj.addClass('jaga-draggable');

        let target = obj;
        let handle = options.handle ?? target;
        handle.css('cursor', 'grab');
        handle.bind('mousedown', startDrag);
        
        function transformFromViewport(domPoint, dom) {
            let parent = dom.parentNode;
            if (parent) {
                if (parent.tagName == 'HTML') {
                    return domPoint;
                }
                domPoint = transformFromViewport(domPoint, parent);
            }
            const transform = getComputedStyle(dom).getPropertyValue('transform');
            if (transform == 'none') {
                return domPoint;
            }
            const matrix = new DOMMatrix(transform);
            if (matrix.isIdentity) {
                return domPoint;
            }
            
            //...BUG: this assumes the transform-origin is (0, 0)
            const rect = dom.getBoundingClientRect();
            domPoint.x -= rect.left; domPoint.y -= rect.top;
            domPoint = domPoint.matrixTransform(matrix.inverse());
            domPoint.x += rect.left; domPoint.y += rect.top;
            
            return domPoint;
        }
        
        let left, top;
        let originPoint = null;
            
        function stopDrag(event) {
            $(window).unbind('mousemove', processDrag);
            $(window).unbind('mouseup', stopDrag);
            event.stopPropagation();
            event.preventDefault();
            handle.css('cursor', 'grab');
        }

        function processDrag(event) {
            const x1 = parseInt(event.clientX);
            const y1 = parseInt(event.clientY);
            const currentPoint = transformFromViewport(new DOMPoint(x1, y1), target.get());
            const dx = currentPoint.x - originPoint.x;
            const dy = currentPoint.y - originPoint.y;
            target.css('left', left+dx + 'px');
            target.css('top', top+dy + 'px');
            event.stopPropagation();
            event.preventDefault();
        }
        
        function startDrag(event) {
            if (event.button != 0) {
                return;
            }
            const x0 = parseInt(event.clientX);
            const y0 = parseInt(event.clientY);
            left = parseInt(target.css('left'));
            top = parseInt(target.css('top'));
            originPoint = transformFromViewport(new DOMPoint(x0, y0), target.get());
            $(window).bind('mousemove', processDrag);
            $(window).bind('mouseup', stopDrag);
            handle.css('cursor', 'grabbing');
            if (options.stopPropagation) {
                event.stopPropagation();
            }
            if (options.prevantDefault) {
                event.preventDefault();
            }
        }
    }
};


export class JGDialogWidget extends JGPopupWidget {

    /***** DOM Structure *****
      <div id="ObjId">
          <+++div class="jaga-dialog-header"></div>
          <+++div class="jaga-dialog-content"></div>
          <+++div class="jaga-dialog-button-pane"></div>
      </div>
    /******/
    
    constructor(obj, options={}) {
        const defaults = {
            // properties //
            title: null,
            x: null, y: null,
            zIndex: 1000,
            closeOnGlobalClick: false,
            closeOnEscapeKey: true,
            closeButton: false,
            // callbacks //
            open: null,
            close: null,
            buttons: {}  // {Label: Callback, ...}
        };
        let this_options = $.extend({}, defaults, options);        
        super(obj, this_options);
        this.obj.addClass('jaga-dialog');

        let titleBar = obj.find('.jaga-dialog-title');
        let contentDiv = obj.find('.jaga-dialog-content');
        let buttonPane = obj.find('.jaga-dialog-button-pane');
        if ((this.options.title !== null) && (titleBar.size() == 0)) {
            titleBar = $('<div>').addClass('jaga-dialog-title').prependTo(obj);
        }
        if (contentDiv.size() == 0) {
            contentDiv = $('<div>').addClass('jaga-dialog-content').appendTo(obj);
        }
        if ((Object.keys(this.options.buttons).length > 0) && (buttonPane.size() == 0)) {
            buttonPane = $('<div>').addClass('jaga-dialog-button-pane').appendTo(obj);
        }
        if (titleBar.size() != 0) {
            titleBar.css({display:'flex'});
            if (this.options.title != null) {
                titleBar.append($('<span>').text(this.options.title));
            }
            if (this.options.closeButton) {
                let closeBtn = $('<button>').html("&#x274c;").css({'font-size': '70%', 'filter': 'grayscale(100%)'}).bind(
                    'click', e => this.close()
                );
                titleBar.append(closeBtn.css('margin-left','auto'));
            }
            
            this.draggable = new JGDraggable(this.obj, {
                handle: titleBar,
                preventDefault: true,
                stopPropagation: true,
            });
        }
        
        for (let label in this.options.buttons) {
            let button = $('<button>').text(label).appendTo(buttonPane);
            let callback = this.options.buttons[label];
            if (callback) {
                button.get().addEventListener('click', e => callback(e));
            }
            button.get().addEventListener('click', e => this.close());
        }
    }

    content() {
        return this.obj.find('.jaga-dialog-content');
    }
};



export class JGMenuListWidget extends JGWidget {
    /***** DOM Structure *****
      <ul class="jaga-menu-list">
          <li> <a href="..."></a>
          ...
      </ul>
    /******/
    
    constructor(obj, options={}) {
        const defaults = {};
        super(obj, options);
        this.options = $.extend({}, defaults, options);
        this.obj.addClass('jaga-menulist');
    }
};


export class JGPullDownWidget extends JGWidget {
    /***** DOM Structure *****
      <select></select>
    /******/
    
    constructor(obj, options={}) {
        let defaults = {
            // properties //
            'heading': '',
            'items': [],    // [value] or [{value,label}]
            'initial': null,  // by index (integer) or value (string)
            // callbacks //
            'select': null,   // function(event, value, this)
            'labelOf': null,  // label => { return title; }
        };
        super(obj, options);
        this.options = $.extend({}, defaults, options);
        this.obj.addClass('jaga-pulldown');
        if (! this.options.labelOf) {
            this.options.labelOf = x => {
                return this.options.heading ? (this.options.heading + ' ' + x) : x
            };
        }

        this.hidden = $('<option>').attr({hidden: true}).prependTo(obj);
        this.hidden.html(this.options.heading || 'select...').get().selected = true;

        for (let item of this.options.items) {
            if (typeof item == 'string') {
                obj.append($('<option>').attr({value:item, label:item}).text(item));
            }
            else {
                const label = item.label ?? item.value;
                obj.append($('<option>').attr({value:item.value, label: label}).text(label));
            }
        }

        if (this.options.initial !== null) {
            let item = obj.find('option').at(this.options.initial+1); // +1 for hidden
            if (item !== undefined) {
                this.setLabel(item);
            }                
        }
        
        obj.bind('change', e => {
            let item = $(e.target).closest('select').selected();
            this.setLabel(item);
            if (this.options.select) {
                this.options.select(e, item.attr('value'), this);
            }
            else {
                console.log(item.attr('value'));
            }
        });
    }

    setLabel(label) {
        let html = null;
        if (label instanceof JGElement) {
            html = this.options.labelOf(label.attr('label') || label.attr('value'));
        }
        else {
            html = $.sanitizeWeakly(String(label));
        }
        if (html) {
            this.hidden.html(html);
            this.obj.selected(this.hidden);
        }
    }
};


export class JGHiddenWidget extends JGWidget {
    constructor(obj, options={}) {
        const defaults = {
            sensingObj: obj,
            group: null,
            opacity: 1,
            autoHide: 0,
        };
        super(obj, options);
        this.options = $.extend({}, defaults, options);
        
        this.options.sensingObj.bind('pointerenter', e=>{this.hideAll(); this.show()});
        this.options.sensingObj.bind('mouseleave', e=>this.hide());

        this.hide();
        this.timeoutId = null;
    }
    
    hide() {
        this.obj.css({
            filter: 'alpha(opacity=0)',
            opacity: 0,
            '-moz-opacity': 0,
        });
    }

    hideAll() {
        const group = this.options.group;
        if (group) {
            $(`.jaga-hiddenWidget-${group}`).removeClass(`jaga-hiddenWidget-${group}`).css({
                filter: 'alpha(opacity=0)',
                opacity: 0,
                '-moz-opacity': 0,
            });
        }
    }
    
    show() {
        const group = this.options.group;
        if (group) {
            this.obj.addClass(`jaga-hiddenWidget-${group}`);
        }
        this.obj.css({
            filter: 'alpha(opacity=' + this.options.opacity + ')',
            opacity: this.options.opacity,
            '-moz-opacity': this.options.opacity,
        });
        if (parseFloat(this.options.autoHide) > 0) {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }
            this.timeoutId = setTimeout(()=>{this.hide()}, 1000*parseFloat(this.options.autoHide));
        }
    }
};



export class JGIndicatorWidget extends JGWidget {
    constructor(obj, options={}) {
        const defaults = {
        };
        
        super(obj, options);
        this.options = $.extend({}, defaults, options);
        this.obj.addClass('jaga-indicator');

        this.obj.css({
            'position': 'fixed',
            'left': (window.innerWidth / 2) + 'px',
            'top': (window.innerHeight / 2) + 'px',
            'visibility': 'hidden',
            'z-index': 10000,
        });

        this.iconBox = $('<div>').appendTo(this.obj);
        this.iconBox.css({
            'display': 'inline',
            'font-size': '130%',
            'padding': '3px',
        });
        
        this.textBox = $('<div>').appendTo(this.obj);
        this.textBox.css({
            'display': 'inline',
            'padding': '3px',
            'background': "white",
            'color': "black",
            'border': 'thin dotted black',
            'border-radius': '3px',
        });
    }

    open(message="", icon="", x=null, y=null) {
        if (x == null) {
            x = window.innerWidth / 2;
        }
        else {
            x = parseInt(x);
        }
        if (y == null) {
            y = window.innerHeight / 2;
        }
        else {
            y = parseInt(y) - 10;
        }
        
        this.obj.css('left', 'calc(' + x + 'px + 1em)');
        this.obj.css('top', 'calc(' + y + 'px - 1.5em)');
        
        this.iconBox.html(icon);
        this.textBox.text(message);
        this.obj.css('visibility', 'visible');
    }

    close(message="", icon="", duration_ms=100) {
        this.iconBox.html(icon);
        this.textBox.text(message);
        setTimeout(()=>{
            this.obj.css('visibility', 'hidden');
        }, duration_ms);
    }
};


export class JGFileIconWidget extends JGWidget {
    constructor(obj, options={}) {
        const defaults = {
            filetype: '',
            badge: '',
        };
        
        super(obj, options);
        this.options = $.extend({}, defaults, options);
        this.label = this.obj.text();
        this.obj.attr({'title': this.label});

        this.obj.addClass('jaga-fileicon').html(`
            <div class="jaga-fileicon-icon">${this.options.filetype}</div>
            <div class="jaga-fileicon-label">${this.label}</div>
        `);
        if (this.options.badge != '') {
            this.obj.append($('<div>').addClass('jaga-fileicon-badge').html(this.options.badge));
        }
    }
};
