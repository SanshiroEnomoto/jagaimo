// jagaimo.mjs //
// Author: Sanshiro Enomoto <sanshiro@uw.edu> //
// Created on 2 November 2017 //


export class JGElement {
    constructor(elem, nameSpace=null) {
        this.elem = [];
        if ((typeof elem == 'string') && elem.length > 0) {
            if ((elem[0] == '<') && elem[elem.length-1] == '>') {
                let name = elem.substr(1, elem.length-2);
                if (nameSpace === null) {
                    this.elem.push(
                        document.createElement(name)
                    );
                }
                else if (nameSpace === 'svg') {
                    this.elem.push(
                        document.createElementNS("http://www.w3.org/2000/svg", name)
                    );
                }
                else {
                    this.elem.push(
                        document.createElementNS(nameSpace, name)
                    );
                }
            }
            else {
                let elemCollection = document.querySelectorAll(elem);
                for (let i = 0; i < elemCollection.length; i++) {
                    this.elem.push(elemCollection[i]);
                }
                if (! elemCollection.length) {
                    if (elem[0] != '.') {
                        console.log('JGElement: no match: ' + elem);
                    }
                }
            }
        }
        else if (elem instanceof JGElement) {
            this.elem = elem.elem;
        }
        else if (elem) {
            // DOM-like object //
            this.elem.push(elem);
        }
        this.length = this.elem.length;
    }

    size() {
        return this.elem.length;
    }

    *enumerate() {
        for (let i = 0; i < this.length; i++) {
            yield JG(this.elem[i]);
        }
    }

    at(index) {
        return (index < this.length) ? JG(this.elem[index]) : undefined;
    }
    
    eq(index) {
        return this.at(index);
    }
    
    get(index=0) {
        return (index < this.length) ? this.elem[index] : undefined;
    }

    last(index) {
        return this.at(this.length-1);
    }
    
    
    find(query) {
        let elem = new JGElement(null);
        for (let basenode of this.elem) {
            let elemCollection = basenode.querySelectorAll(query);
            for (let i = 0; i < elemCollection.length; i++) {
                elem.elem.push(elemCollection[i]);
            }
        }
        elem.length = elem.elem.length;

        return elem;
    }


    closest(query) {
        if ((this.elem.length < 1) || (query.length < 1)) {
            return new JGElement(null);
        }
        
        if (query[0] == '#') {
            if (this.elem[0].attr('id') == query.substr(1)) {
                return this;
            }
        }
        else if (query[0] == '.') {
            if (this.elem[0].classList?.contains(query.substr(1))) {
                return this;
            }
        }
        else {
            if (query.toUpperCase() == this.elem[0].tagName.toUpperCase()) {
                return this;
            }
        }
        
        return this.parent().closest(query);
    }
    
    
    append(e) {
        if (this.length > 0) {
            this.elem[0].appendChild(JG(e).get());
        }
        return this;
    }
    
    appendTo(e) {
        JG(e).append(this);
        return this;
    }

    prepend(e) {
        if (this.length > 0) {
            this.elem[0].insertBefore(JG(e).get(), this.elem[0].firstChild);
        }
        return this;
    }
    
    prependTo(e) {
        JG(e).prepend(this);
        return this;
    }
    
    insertBefore(e, where) {
        if (this.length > 0) {
            this.elem[0].insertBefore(JG(e).get(), JG(where).get());
        }
        return this;
    }
    
    insertAfter(e, where) {
        if (this.length > 0) {
            this.elem[0].insertBefore(JG(e).get(), JG(where).get().nextSibling);
        }
        return this;
    }

    parent() {
        if (this.length == 0) {
            return new JGElement(null);
        }
        return new JGElement(this.elem[0].parentNode);
    }
    
    next() {
        if (this.length == 0) {
            return new JGElement(null);
        }
        return new JGElement(this.elem[0].nextSibling);
    }
    
    empty() {
        for (let e of this.elem) {
            //e.textContent = null;  // slow??
            while (e.firstChild) {
                e.removeChild(e.firstChild);
            }
        }
        return this;
    }
    
    remove(sel=null) {
        if (sel === null) {
            for (let e of this.elem) {
                e.parentNode.removeChild(e);
            }
            this.elem = [];
            this.elem.length = 0;
        }
        else {
            this.find(sel).remove();
        }
        
        return this;
    }
    
    html(str=null) {
        if (str === null) {
            return this.length == 0 ? undefined : this.elem[0].innerHTML;
        }
        for (let e of this.elem) {
            e.innerHTML = str;
        }
        return this;
    }

    text(str=null) {
        if (str === null) {
            return this.length == 0 ? undefined : this.elem[0].textContent;
        }
        for (let e of this.elem) {
            e.textContent = str;
        }
        return this;
    }

    val(str=null) {
        if (str === null) {
            if (this.length == 0) {
                return undefined;
            }
            const inputType = (this.elem[0].getAttribute('type') ?? '').toUpperCase();
            if (this.elem[0].tagName == 'SELECT') {
                let sel = this.elem[0];
                return sel.options[sel.selectedIndex].value;
            }
            else if (['CHECKBOX', 'RADIO'].includes(inputType)) {
                if (this.elem[0].checked) {
                    const value = this.elem[0].getAttribute('value') ?? '';
                    return (value !== '') ? value : true;
                }
                else {
                    return false;
                }
            }
            else if (['RANGE'].includes(inputType)) {
                return this.elem[0].valueAsNumber;
            }
            else {   
                return this.elem[0].value;
            }
        }
        for (let e of this.elem) {
            if (e.tagName == 'SELECT') {
                for (let opt of JG(e).find('option[value="' + str + '"]').enumerate()) {
                    opt.get().selected = true; 
                }
            }
            else if (['CHECKBOX', 'RADIO'].includes((e.getAttribute('type')??'').toUpperCase())) {
                if (typeof str == 'boolean') {
                    e.checked = str;
                }
                else {
                    e.value = str;
                }
            }
            else {   
                e.value = str;
            }
        }
        return this;
    }

    selected(option=null) {
        if (option === null) {
            if ((this.length == 0) || (this.elem[0].tagName != 'SELECT')) {
                return undefined;
            }
            let sel = this.elem[0];
            return JG(sel.options[sel.selectedIndex]);
        }
        for (let sel of this.elem) {
            if (sel.tagName != 'SELECT') {
                continue;
            }
            if (typeof option == 'string') {
                for (let opt of JG(sel).find('option[value="' + option + '"]').enumerate()) {
                    opt.get().selected = true; 
                }
            }
            else if (typeof option == 'number') {
                sel.options[option].selected = true;
            }
            else if (option instanceof JGElement) {
                option.get().selected = true;
            }
        }
        return this;
    }

    checked(toCheck = null) {
        if (toCheck === null) {
            if ((this.length == 0) || (typeof this.elem[0].checked != 'boolean')) {
                return undefined;
            }
            return this.elem[0].checked;
        }
        for (let e of this.elem) {
            if (typeof e.checked == 'boolean') {
                e.checked = toCheck;
            }
        }
        return this;
    }
    
    enabled(toEnable = null) {
        if (toEnable === null) {
            if ((this.length == 0) || (typeof this.elem[0].enabled != 'boolean')) {
                return undefined;
            }
            return this.elem[0].enabled;
        }
        for (let e of this.elem) {
            if (typeof e.disabled == 'boolean') {
                e.disabled = ! toEnable;
            }
            else if (typeof e.enabled == 'boolean') {
                e.enabled = toEnable;
            }
        }
        return this;
    }
    
    css(name, value=null) {
        if ((typeof name == 'object') && (value === null)) {
            for (let key in name) {
                this.css(key, name[key]);
            }
            return this;
        }
        
        if (value === null) {
            if ((typeof name != 'string') || (this.length < 1)) {
                return undefined;
            }
            return this.elem[0].style[name];
        }
        
        if (typeof name == 'string') {
            for (let e of this.elem) {
                e.style[name] = value;
            }
        }
        return this;
    }

    attr(name, value=null) {
        if ((typeof name == 'object') && (value === null)) {
            for (let key in name) {
                this.attr(key, name[key]);
            }
            return this;
        }
        if ((typeof name != 'string') || (this.length < 1)) {
            return value === null ? undefined : this;
        }
        
        if (value === null) {
            return this.elem[0].getAttribute(name);
        }
        
        for (let e of this.elem) {
            if (value === undefined) {
                e.removeAttribute(name);
            }
            else {
                e.setAttribute(name, value);
            }
        }
        
        return this;
    }

    data(name, value=null) {
        if ((typeof name == 'object') && (value === null)) {
            for (let key in name) {
                this.data(key, name[key]);
            }
            return this;
        }
        if (typeof name != 'string') {
            return value === null ? undefined : this;
        }

        if (value === null) {
            return this.attr('data-' + name);
        }
        else {
            return this.attr('data-' + name, value);
        }
    }

    addClass(className) {
        for (let e of this.elem) {
            for (let cl of className.split(' ')) {
                if (cl.length) e.classList.add(cl);
            }
        }
        return this;
    }
    
    removeClass(className) {
        for (let e of this.elem) {
            for (let cl of className.split(' ')) {
                if (cl.length) e.classList.remove(cl);
            }
        }
        return this;
    }
    
    toggleClass(className) {
        for (let e of this.elem) {
            for (let cl of className.split(' ')) {
                if (cl.length) e.classList.toggle(cl);
            }
        }
        return this;
    }

    hasClass(className) {
        return this.length < 1 ? false : this.elem[0].classList.contains(className);
    }

    boundingClientWidth() {
        return this.length < 1 ? 0 : this.elem[0].getBoundingClientRect().width;
    }
    
    boundingClientHeight() {
        return this.length < 1 ? 0 : this.elem[0].getBoundingClientRect().height;
    }

    screenX() {
        return this.length < 1 ? 0 : this.elem[0].getBoundingClientRect().left;
    }
    
    screenY() {
        return this.length < 1 ? 0 : this.elem[0].getBoundingClientRect().top;
    }

    pageX() {
        return this.length < 1 ? 0 : window.pageXOffset + this.screenX();
    }
    
    pageY() {
        return this.length < 1 ? 0 : window.pageYOffset + this.screenY();
    }

    bind(event, callback) {
        //... TODO: support namespace
        for (let e of this.elem) {
            e.addEventListener(event, callback);
        }
        return this;
    }

    unbind(event, callback) {
        //... TODO: support namespace
        for (let e of this.elem) {
            e.removeEventListener(event, callback);
        }
        return this;
    }

    show() {
        for (let e of this.elem) {
            let display = e.getAttribute('data-jaga-display');
            e.style['display'] = (! display || display == 'none') ? 'block' : display;
        }
        return this;
    }
    
    hide() {
        for (let e of this.elem) {
            e.setAttribute('data-jaga-display', e.style['display']);
            e.style['display'] = 'none';
        }
        return this;
    }
    
    focus() {
        for (let e of this.elem) {
            e.focus();
        }
        return this;
    }
    
    click(fn = null) {
        if (fn === null) {
            for (let e of this.elem) {
                e.click();
            }
        }
        else {
            for (let e of this.elem) {
                e.onclick = fn;
            }
        }
        return this;
    }
};


export function JG(elem, nameSpace=null) {
    return new JGElement(elem, nameSpace);
};


JG.sanitize = function(line) {
    if (typeof line != 'string') {
        return line;
    }
    return (JG.unsanitize(line)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
    );
};

JG.sanitizeWeakly = function(line) {
    if (typeof line != 'string') {
        return line;
    }
    return (JG.unsanitize(line)
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
    );
};

JG.unsanitize = function(line) {
    if (typeof line != 'string') {
        return line;
    }
    return (line
        .replace(/&gt;/g, ">")
        .replace(/&lt;/g, "<")
        .replace(/&amp;/g, "&")
    );
};

JG.isDict = function(x) {
    // returns true if x is {...}
    //... BUG: does not work if the object does not have a constructor
    return (
        (x !== undefined) && (x !== null) &&
        (typeof(x) === 'object') &&
        (x.constructor === Object)  // excludes Array, Date, RegExp, Class, ...
    );
};

// if the first argument is 'true', make a deep copy (same as jQuery)
// ex1) let mergedCopy = JG.extend({}, src1, src2);
// ex2) let deepMergedCopy = JG.extend(true, {}, src1, src2);
JG.extend = function() {
    let n = arguments.length;
    let isDeep = (arguments[0] === true);
    let first = isDeep ? 1 : 0;
    if (n < first) {
        return {};
    }
    else if (n <= first) {
        return arguments[first];
    }
    let dest = arguments[first];
        
    for (let k = first+1; k < n; k++) {
        let src = arguments[k];
        for (let x in src) {
            if (isDeep && JG.isDict(src[x])) {
                if (! JG.isDict(dest[x])) {
                    dest[x] = {};
                }
                JG.extend(true, dest[x], src[x]);
            }
            else if (src[x] !== undefined) {
                dest[x] = src[x];
            }
        }
    }
        
    return dest;
};


JG.sprintf = function(format, ...args) {
    let re = /%(0?)([0-9]*)(\.[0-9]+)?(d|x|s|f|e|g)/;
    
    let out = '';
    for (let arg of args) {
        let match = re.exec(format);
        if (match === null) {
            break;
        }
        let [ all, fill, wint, wfrac, type ] = match;
        if ((fill === undefined) || (fill.length != 1)) fill = ' ';
        wint = (wint !== undefined) ? parseInt(wint) : 0;
        if (wfrac && (wfrac.length > 1)) wfrac = parseInt(wfrac.slice(1));
        
        let [ start, len ] = [ match.index, all.length ];
        out += format.slice(0, start);
        format = format.slice(start + len);

        let conv = '';
        if (type == 'd') {
            conv = parseInt(arg).toString();
        }
        else if (type == 'x') {
            conv = parseInt(arg).toString(16);
        }
        else if (type == 's') {
            if (JG.isDict(arg)) {
                conv = JSON.stringify(arg);
            }
            else {
                conv = String(arg);
            }
        }
        else if (type == 'f') {
            if (wfrac === undefined) {
                conv = parseFloat(arg).toPrecision();
            }
            else {
                conv = parseFloat(arg).toFixed(wfrac);
            }
        }
        else if (type == 'e') {
            if (wfrac === undefined) {
                conv = parseFloat(arg).toExponential();
            }
            else {
                conv = parseFloat(arg).toExponential(wfrac);
            }
        }
        else if (type == 'g') {
            if (wfrac === undefined) {
                conv = parseFloat(arg).toPrecision();
            }
            else {
                conv = parseFloat(arg).toPrecision(wfrac);
            }
        }
        if (conv.length < wint) {
            if ((conv[0] == '-') && (fill != ' ')) {
                conv = conv[0] + fill.repeat(wint - conv.length) + conv.slice(1);
            }
            else {
                conv = fill.repeat(wint - conv.length) + conv;
            }
        }
        out += conv;
    }
    out += format;
    
    return out;
};


JG.JSON_stringify = function(doc, options={}) {
    const defaults = {
        indent: '    ',
        expandAll: true,  // otherwise the last layer will be inlined
    };
    const opts = JG.extend({}, defaults, options);
    
    function stringifyNode(node, indent, opts) {
        let string = '';
        const nextIndent = indent + opts.indent;
    
        if (JG.isDict(node)) {
            let hasChildren = opts.expandAll;
            for (const key in node) {
                const val = node[key];
                if (JG.isDict(val) || (val instanceof Array)) {
                    hasChildren = true;
                    break;
                }
            }
            string = '{';
            for (const key in node) {
                if (string.length > 1) {
                    string += ',';
                }
                string += hasChildren ? '\n' + nextIndent : ' ';
                string += '"' + key + '": ' + stringifyNode(node[key], nextIndent, opts);
            }
            string += hasChildren ? '\n' + indent : ' ';
            string += '}';
        }
        
        else if (node instanceof Array) {
            let hasChildren = opts.expandAll;
            for (const val of node) {
                if (JG.isDict(val) || (val instanceof Array)) {
                    hasChildren = true;
                    break;
                }
            }
            string = '[';
            for (let val of node) {
                if (string.length > 1) {
                    string += ',';
                }
                string += hasChildren ? '\n' + nextIndent: ' ';
                string += stringifyNode(val, nextIndent, opts);
            }
            string += hasChildren ? '\n' + indent: ' ';
            string += ']';
        }
        
        else if (typeof(node) === 'number') {
            string += String(node);
        }
        
        else if (typeof(node) === 'string') {
            string += '"' + node + '"';
        }
        
        else if (node === true) {
            string += 'true';
        }
        else if (node === false) {
            string += 'false';
        }
        else if (node === null) {
            string += 'null';
        }
        else if (node === undefined) {
            string += 'undefined';
        }
        
        else {
            string += '"' + String(node) + '"';
        }
        
        return string;
    }

    return stringifyNode(doc, '', opts) + '\n';
};


JG.time = function() {
    return Math.floor((new Date()).getTime()/1000.0);
};


JG.formatDuration = function(format, duration) {
    let day = Math.floor(duration / 86400);
    duration -= 86400 * day;
    let hour = Math.floor(duration / 3600);
    duration -= 3600 * hour;
    let minute = Math.floor(duration / 60);
    let second = duration - 60 * minute;
    return format
        .replace(/%d/g, (day < 10) ? "0" + day : day)
        .replace(/%_d/g, (day < 10) ? " " + day : day)
        .replace(/%-d/g, day)
        .replace(/%H/g, (hour < 10) ? "0" + hour : hour)
        .replace(/%_H/g, (hour < 10) ? " " + hour : hour)
        .replace(/%-H/g, hour)
        .replace(/%M/g, (minute < 10) ? "0" + minute : minute)
        .replace(/%_M/g, (minute < 10) ? " " + minute : minute)
        .replace(/%-M/g, minute)
        .replace(/%S/g, (second < 10) ? "0" + second : second)
        .replace(/%_S/g, (second < 10) ? " " + second : second)
        .replace(/%-S/g, second);
};


JG.percentileOf = function(data, percentile, filter=x=>x) {
    let x = [];
    for (let dk of data) {
        let xk = filter(dk);
        if (! isNaN(xk) && xk !== null) {
            x.push(xk);
        }
    }
    if (x.length < 1) {
        return [ undefined, undefined ];
    }

    x.sort((a, b) => a-b);
    
    let n = x.length;
    let m = Math.ceil(n * (1 - percentile/100.0));
    let k0 = 0, k1 = n-1;
    if (m >= k1) {
        let median = x[Math.floor(n/2)];
        return [ median, median ];
    }
    if (m > 2) {
        k0 += Math.floor(m/2);
        k1 -= Math.floor(m/2);
    }
    return [ x[k0], x[k1] ];
}

JG.hsv2rgb = function(h, s, v) {  // h: [0, 360], s: [0, 1], v: [0, 1]
    if (s == 0) return [ v, v, v ];
    function ghr01(rm1, rm2, h) {
        h = (h > 360) ? (h - 360) : ((h < 0) ? (h + 360) : h);
        if (h <  60) return rm1 + (rm2 - rm1) * h / 60.0;
        if (h < 180) return rm2;
        if (h < 240) return rm1 + (rm2 - rm1) * (240 - h) / 60.0;
	return rm1;
    }
    let rm2 = (v < 0.5) ? v * (1.0 + s) : v + s - v * s;
    let rm1 = 2.0 * v - rm2;
    return [ ghr01(rm1, rm2, h+120), ghr01(rm1, rm2, h), ghr01(rm1, rm2, h-120) ];
};



export class JGDateTime {

    constructor(param = null) {
        if (typeof param == 'number') {
            this.timestamp = parseInt(param);
        }
        else if (typeof param == 'string') {
            if (! isNaN(param)) {
                // string of UNIX timestamp integer
                this.timestamp = parseFloat(param);
                if (! (this.timestamp > 0)) {
                    this.timestamp = parseInt(param); // parseInt() works for "0x10" while parseFloat() doesn't.
                }
            } 
            else {
                this.timestamp = Date.parse(param) / 1000;
            }
        }
        else if (param instanceof Date) {
            this.timestamp = param.getTime() / 1000;
        }
        else if (param === null) {
            this.timestamp = (new Date()).getTime()/1000;
        }
        else {
            this.timestamp = NaN;
        }
    }

    advanceBy(offset) {
        this.timestamp += parseInt(offset);
        return this;
    }
    
    asInt() {
        return parseInt(this.timestamp);
    }
    
    asString(format='%Y-%m-%d,%H:%M:%S', isUTC=false) {
        let date = new Date();
        date.setTime(1000*parseInt(this.timestamp));

        let year4 = Number(isUTC ? date.getUTCFullYear() : date.getFullYear());
        let year2 = (year4 > 2000) ? year4 - 2000 : year4 - 1900;
        let month = Number(isUTC ? date.getUTCMonth() : date.getMonth()) + 1;
        let day = Number(isUTC ? date.getUTCDate() : date.getDate());
        let dayOfWeek = Number(isUTC ? date.getUTCDay() : date.getDay());
        let hour = Number(isUTC ? date.getUTCHours() : date.getHours());
        let minute = Number(isUTC ? date.getUTCMinutes() : date.getMinutes());
        let second = Number(isUTC ? date.getUTCSeconds() : date.getSeconds());
        let timezoneOffset = Number(isUTC ? 0 : date.getTimezoneOffset());
        let hour12 = (hour < 13) ? ((hour == 0) ? 12 : hour) : hour - 12;
        
        const monthNames = [ 
            '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const dayNames = [ 
            'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
        ];

        let timezoneOffsetH = Math.abs(timezoneOffset / 60);
        let timezoneOffsetM = Math.abs(timezoneOffset % 60);
        let timezoneSign = (timezoneOffset > 0) ? '-' : '+';
        let timezoneHH = timezoneSign + ((timezoneOffsetH < 10) ? '0' : '') + timezoneOffsetH;
        let timezoneHHMM = timezoneHH + ((timezoneOffsetM < 10) ? '0' : '') + timezoneOffsetM;
        let timezoneHHcMM = timezoneHH + ((timezoneOffsetM < 10) ? ':0' : ':') + timezoneOffsetM;

        let timezoneShort = (timezoneOffsetM == 0) ? (timezoneSign + timezoneOffsetH)+'h' : timezoneHHMM;
        
        return format
            .replace(/%Y/g, year4)
            .replace(/%y/g, (year2 < 10) ? "0" + year2 : year2)
            .replace(/%m/g, (month < 10) ? "0" + month : month)
            .replace(/%_m/g, (month < 10) ? " " + month : month)
            .replace(/%-m/g, month)
            .replace(/%d/g, (day < 10) ? "0" + day : day)
            .replace(/%_d/g, (day < 10) ? " " + day : day)
            .replace(/%-d/g, day)
            .replace(/%H/g, (hour < 10) ? "0" + hour : hour)
            .replace(/%_H/g, (hour < 10) ? " " + hour : hour)
            .replace(/%-H/g, hour)
            .replace(/%I/g, (hour12 < 10) ? "0" + hour12 : hour12)
            .replace(/%_I/g, (hour12 < 10) ? " " + hour12 : hour12)
            .replace(/%-I/g, hour12)
            .replace(/%M/g, (minute < 10) ? "0" + minute : minute)
            .replace(/%_M/g, (minute < 10) ? " " + minute : minute)
            .replace(/%-M/g, minute)
            .replace(/%S/g, (second < 10) ? "0" + second : second)
            .replace(/%_S/g, (second < 10) ? " " + second : second)
            .replace(/%-S/g, second)
            .replace(/%Z/g, timezoneShort)
            .replace(/%z/g, timezoneHHMM)
            .replace(/%:z/g, timezoneHHcMM)
            .replace(/%a/g, dayNames[dayOfWeek])
            .replace(/%A/g, dayNames[dayOfWeek])
            .replace(/%b/g, monthNames[month])
            .replace(/%B/g, monthNames[month])
            .replace(/%p/g, (hour < 12) ? 'AM' : 'PM')
            .replace(/%P/g, (hour < 12) ? 'am' : 'pm');
    }

    asUTCString(format) {
        return this.asString(format, true);
    }
}
