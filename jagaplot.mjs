// jagaplot.mjs //
// Author: Sanshiro Enomoto <sanshiro@uw.edu> //
// Created on 13 February 2019 //
// Refactored on 25 April 2023 //

import { JG as $, JGDateTime } from './jagaimo.mjs';
import { JGWidget } from './jagawidgets.mjs';
import { ColorMap } from './colormap.mjs';


export class JGPlotAxisScale {
    constructor(min, max, isLog, options={}) {
        const defaults = {
            x: 0, y: 0, length: 100, // axis position in parent coordinate
            labelPosition: 'bottom',   // left, right, top (up), bottom (down)
            labelMargin: null, // null => auto
            ticksOutwards: false,
            dateFormat: null, 
            numberOfTicks: 5,
            title: '',
            frameColor: 'black', frameThickness: 2,
            labelColor: null, gridColor: null,
        };
        this.config = $.extend({}, defaults, options);
        if (! this.config.lableColor) {
            this.config.labelColor = this.config.frameColor
        }
        if (! this.config.gridColor) {
            this.config.gridColor = this.config.frameColor
        }
        if (this.config.labelPosition[0].toLowerCase() == 'u') {
            this.config.labelPosition = 'top';
        }
        if (this.config.labelPosition[0].toLowerCase() == 'd') {
            this.config.labelPosition = 'bottom';
        }
        if (this.config.labelMargin === null) /* auto */ {
            if (['L', 'R'].includes(this.config.labelPosition[0].toUpperCase())) {
                this.config.labelMargin = 80;
            }
            else {
                this.config.labelMargin = 42;
            }
            if (this.config.ticksOutwards) {
                this.config.labelMargin += 8;
            }
        }
        
        this.min = 0;
        this.max = 1;
        this.isLog = false;
        this.ticklist = null;
        
        this.setRange(min, max, isLog);
    }

    setOptions(options) {
        $.extend(this.config, options);
    }
    
    setRange(min, max, isLog=false) {
        let x0 = parseFloat(min);
        let x1 = parseFloat(max);
        if (isNaN(x0)) x0 = this.min;
        if (isNaN(x1)) x1 = this.max;
        
        if (Math.abs(x1 - x0) < 1e-20 * (Math.abs(x0) + Math.abs(x1))) {
            [x0, x1] = JGPlotAxisScale.findRangeFromValues(x0, x1);
        }

        this.min = Math.min(x0, x1);
        this.max = Math.max(x0, x1);
        this.isLog = isLog;

        if (this.isLog) {
            if (this.max <= 0) {
                this.max = 10;
                this.min = 0.1;
            }
            else if (this.min <= 0) {
                this.min = Math.min(0.5, this.max / 1000.0);
            }
        }

        return this;
    }
    
    _find_ticks() {
        if (this.config.numberOfTicks <= 0) {
            return { ticks: [], subticks: [], min: this.min, max: this.max, isLog: this.isLog };
        }
        if (! (this.min < this.max)) {
            return { ticks: [], subticks: [], min: this.min, max: this.max, isLog: this.isLog };
        }
        
        function toint(x) { 
            return parseInt(x >= 0 ? Math.floor(x) : Math.ceil(x)); 
        }
                
        function findTicksFor(min, max, tickCapacity, i=0) {
            let width = max - min;
            if (width <= 0) {
                return {first: min, step: 1};
            }
            if (i > 20) {
                return {first: min, step: width};
            }
            
            let nticks = tickCapacity / 2 + 1;
            if (nticks < 2) {
                nticks = 2;
            }
            
            // order-normalization to make the width fit in range [N/2, 20*N]
            if (width > 20 * nticks) {
                ticks = findTicksFor(min / 10.0, max / 10.0, tickCapacity, i+1);
                return {first: ticks.first * 10.0, step: ticks.step * 10.0};
            }
            else if (width < nticks / 2.0) {
                ticks = findTicksFor(min * 10.0, max * 10.0, tickCapacity, i+1);
                return {first: ticks.first / 10.0, step: ticks.step / 10.0};
            }
            
            // factor-normalization(5) to make the width fit in range [N/2, 5*N)
            else if (width > 4.99 * nticks) {
            // I*5 normalization: once at most //
            // here the upper tickCapacity should be greater than 5*N to avoid
            // subsequent I*0.5 normalization which results in ugly 
            // I*2.5 normalization
                ticks = findTicksFor(min / 5.0, max / 5.0, tickCapacity, i+1);
                return {first: ticks.first * 5.0, step: ticks.step * 5.0};
            }
            
            // factor-normalization(2) to make the width fit in range (N, 2*N]
            else if (width > 2.01 * nticks) {
            // I*2 normalization: twice at most //
                ticks = findTicksFor(min / 2.0, max / 2.0, tickCapacity, i+1);
                return {first: ticks.first * 2.0, step: ticks.step * 2.0};
            }
            else if (width < 0.99 * nticks) {
            // I*0.5 normalization: once at most //
                ticks = findTicksFor(min * 2.0, max * 2.0, tickCapacity, i+1);
                return {first: ticks.first / 2.0, step: ticks.step / 2.0};
            }
            
            return {first: Math.ceil(min), step: 1};
        }
    
        function findLogTicks(min, max, tickCapacity) {
            let logMin = Math.log10(min);
            let logMax = Math.log10(max);
            let logMinInt = toint((toint(logMin) < logMin) ? (logMin+1) : logMin);
            let logWidth = logMax - logMinInt;
    
            if (logWidth <= 1.2) {
                return null;  // use linear ticking
            }
    
            let logStep = toint((logWidth-1) / tickCapacity) + 1;
            let step = Math.pow(10.0, logStep);
            let first = Math.pow(10.0, logMinInt);
            return {first: first, step: step};
        }
    
        function findSubTickStep(ticks) {
            let exponent = toint(Math.log10(1.01 * ticks.step));
            if (ticks.step < 0.99) {
                exponent -= 1;
            }  
            let factor = toint((1.01 * ticks.step) / Math.pow(10.0, exponent));
            if (factor == 1) {
                factor = 5;
            }
            else if (factor == 2) {
                factor = 4;
            }
            else if (factor > 5) {
                factor /= 2;
            }
    
            return ticks.step / factor;
        }

        function findDateTicks(min, max, tickCapacity, dateFormat) {
            let len = max - min;
            let step;
            if (len >= tickCapacity * 86400) {
                let days = Math.ceil((len/86400) / tickCapacity);
                if (days >= 300) {
                    days = Math.round(days / 365.25) * 365.25;
                }
                else if (days >= 20) {
                    days = Math.round(days / 30) * 30;
                }
                else if (days >= 5) {
                    days = Math.round(days / 7) * 7;
                }
                step = days * 86400;
            }
            else {
                const ticks = [
                    1, 2, 5, 10, 15, 20, 30,
                    60, 2*60, 5*60, 10*60, 15*60, 20*60, 30*60,
                    3600, 2*3600, 3*3600, 4*3600, 6*3600, 8*3600, 12*3600,
                    86400
                ];
                for (step of ticks) {
                    if (len / step <= tickCapacity) {
                        break;
                    }
                }
            }

            let first;
            let day0Date = new JGDateTime(min);
            let year0 = parseInt(day0Date.asString('%Y'));
            let month0 = parseInt(day0Date.asString('%m'));
            let day0 = parseInt(day0Date.asString('%d'));
            if (dateFormat.indexOf('%S') >= 0) {
                first = new Date(year0, month0, day0, 8, 0, 0).getTime()/1000;
            }
            else if (dateFormat.indexOf('%M') >= 0) {
                first = new Date(year0, month0, day0, 8, 0, 0).getTime()/1000;
            }
            else if (dateFormat.indexOf('%H') >= 0) {
                first = new Date(year0, month0, day0, 8, 0, 0).getTime()/1000;
            }
            else if ((dateFormat.indexOf('%d') >= 0) || (dateFormat.indexOf('%a') >= 0)) {
                first = new Date(year0, month0, day0, 0, 0, 0).getTime()/1000;
            }
            else if (dateFormat.indexOf('%m') >= 0) {
                first = new Date(year0, month0, 1, 0, 0, 0).getTime()/1000;
            }
            else {
                first = new Date(year0, 1, 1, 0, 0, 0).getTime()/1000;
            }

            let delta = step;
            if (step >= 365.25*86400) {
                delta = 365.25*86400;
            }
            else if (step >= 30*86400) {
                delta = 30*86400;
            }
            else if (step >= 86400) {
                delta = 86400;
            }
            else if (step >= 3600) {
                delta = 3600;
            }
            
            first += Math.ceil((min - first) / delta) * delta;
            
            return {first: first, step: step};
        }
        
        function findDateSubTickStep(ticks) {
            if (ticks.step > 10*86400) {
                return Math.floor(ticks.step/86400/5)*86400;
            }
            else if (ticks.step > 2*86400*0.999) {
                return 86400;
            }
            else if (ticks.step > 86400*0.999) {
                return 6*3600;
            }
            else if (ticks.step > 6*3600*0.999) {
                return 3*3600;
            }
            else if (ticks.step > 3*3600*0.999) {
                return 3600;
            }
            else if (ticks.step > 3600*0.999) {
                return 30*60;
            }
            else if (ticks.step > 30*60*0.999) {
                return 10*60;
            }
            else if (ticks.step > 15*60*0.999) {
                return 5*60;
            }
            else if (ticks.step > 60*0.999) {
                return 60;
            }
            else if (ticks.step > 10) {
                return 10;
            }
            else {
                return 1;
            }
        }

        let ticks = null;
        let isTicklistLog = this.isLog;
        if (this.config.dateFormat !== null) {
            ticks = findDateTicks(this.min, this.max, this.config.numberOfTicks, this.config.dateFormat);
            this.isLog = false;
            isTicklistLog = false;
        }            
        else if (this.isLog) {
            if (! (this.max > 0)) {
                this.max = 1;
            }
            if (! (this.min > 0) || ! (this.min < this.max)) {
                this.min = this.max/100;
            }
            ticks = findLogTicks(this.min, this.max, this.config.numberOfTicks);
            if (ticks === null) {
                isTicklistLog = false;
            }
        }
        if (ticks === null) {
            ticks = findTicksFor(this.min, this.max, this.config.numberOfTicks);
        }
        
        let ticklist = [];
        let subticks = [];
        if (! isTicklistLog) {
            // tick //
            let x = ticks.first;
            while (x <= this.max + ticks.step/100.0) {
                if (Math.abs(x) < ticks.step/1000.0) {
                    ticklist.push(0);
                }
                else {
                    ticklist.push(x);
                }
                x += ticks.step;
            }
            // subtick //
            let subtickstep;
            if (this.config.dateFormat !== null) {
                subtickstep = findDateSubTickStep(ticks);
            }
            else {
                subtickstep = findSubTickStep(ticks);
            }
            x = ticks.first;
            x -= Math.floor((ticks.first - this.min) / subtickstep) * subtickstep;
            while (x <= this.max + ticks.step/100.0) {
                subticks.push(x);
                x += subtickstep;
            }
        }
        else {
            // tick //
            let x = ticks.first;
            while (x <= this.max + ticks.step/1e30) {
                ticklist.push(x);
                x *= ticks.step;
            }
            // subtick //
            if (ticks.step < 200) {
                x = ticks.first / 10;
                while (x <= this.max + ticks.step/1e30) {
                    if (x > this.min) {
                        subticks.push(x);
                    }
                    x += Math.pow(10, Math.floor(Math.log10(x)+1e-30));
                }
            }
            else {
                x = ticks.first / 10;
                while (x <= this.max + ticks.step/1e30) {
                    if (x > this.min) {
                        subticks.push(x);
                    }
                    x *= 10;
                }
            }
        }
        return {ticks: ticklist, subticks: subticks, min: this.min, max: this.max, isLog: isTicklistLog };
    }

    draw(g, options={}) {
        const config = $.extend({}, this.config, options);
        
        function findFactoring(min, max) {
            if (min >= max) return 0;
            let amp = Math.max(Math.abs(min), Math.abs(max));
            if (amp <= 0) return 0;
            amp = Math.log10(amp);
            if (amp > 0) {
                return Math.floor(amp);
            }
            else if (amp < 0) {
                return Math.floor(amp);
            }
            else {
                return 0;
            }
        }
        
        function findDecimalDigits(ticks) {
            if (ticks.length < 2) return 0;
            let step = (ticks[1]-ticks[0]);
            let n = 10;
            let digits = step.toFixed(n);
            if (digits.indexOf('.') < 0) {
                return 0;
            }
            for (let i = 0; i < digits.length; i++) {
                if (digits[digits.length-i-1] == '0') {
                    n--;
                }
                else {
                    break;
                }
            }
            if (Math.abs(step - parseFloat(step.toFixed(n)) > 1e-10*step)) {
                n = 0;
            }
            return n;
        }

        function drawHorizontal(frame, ticks, config, isLog) {
            function cx(x) {
                let r;
                if (isLog) {
                    r = Math.log10(x / ticks.min) / Math.log10(ticks.max / ticks.min);
                }
                else {
                    r = (x - ticks.min) / (ticks.max - ticks.min);
                }
                return config.x + r * config.length;
            }

            let labelOffset = 5, labelOffsetSign = 1, tickSign = -1;
            if (ticks.isLog) {
                labelOffset += 5;
            }
            if (config.labelPosition[0].toUpperCase() == 'T') {
                tickSign *= -1;
                labelOffsetSign *= -1;
            }
            if (config.ticksOutwards) {
                tickSign *= -1;
                labelOffset += 8;
            }
            
            let xaxis = $('<g>', 'svg').appendTo(frame);
            let xtitle = $('<text>', 'svg').appendTo(xaxis).attr({
                x: config.x + config.length,
                y: config.y + labelOffsetSign * config.labelMargin,
                'font-family': 'sans-serif',
                'font-size': '16px',
                'text-anchor': 'end',
                'dominant-baseline': (labelOffsetSign > 0) ? 'alphabetic': 'hanging',
                'fill': config.labelColor,
            }).text(config.title);
            let xlabels = $('<g>', 'svg').appendTo(xaxis).attr({
                'font-family': 'sans-serif',
                'font-size': '16px',
                'fill': config.labelColor,
            });
            let xticks = $('<g>', 'svg').appendTo(xaxis).attr({
                'stroke': config.frameColor,
            });
            
            labelOffset *= labelOffsetSign;

            for (let x of ticks.ticks) {
                // tick //
                $('<line>', 'svg').appendTo(xticks).attr({
                    x1: cx(x).toPrecision(5), 
                    y1: config.y,
                    x2: cx(x).toPrecision(5), 
                    y2: config.y + tickSign * 8,
                });
                // label //
                let label = $('<text>', 'svg').appendTo(xlabels).attr({
                    x: cx(x).toPrecision(5), 
                    y: config.y + labelOffset,
                    'text-anchor': 'middle',
                    'dominant-baseline': (labelOffsetSign > 0)  ? 'hanging': 'alphabetic',
                });
                if (config.dateFormat !== null) {
                    if (config.dateFormat.substr(0, 4) == 'utc:') {
                        label.text((new JGDateTime(x)).asUTCString(config.dateFormat.substr(4)));
                    }
                    else {
                        label.text((new JGDateTime(x)).asString(config.dateFormat));
                    }
                }
                else if (! ticks.isLog) {
                    let digits = findDecimalDigits(ticks.ticks);
                    if (digits > 0) {
                        label.text(x.toFixed(digits));
                    }
                    else {
                        label.text(parseFloat(x.toPrecision(6)));
                    }
                }
                else {
                    label.text('10');
                    let exp = $('<tspan>', 'svg').appendTo(label).attr({
                        dy: -5,
                        'font-size': '12px',
                    }).text(Math.round(Math.log10(x)));
                }
            }
            // sub-ticks //
            for (let x of ticks.subticks) {
                $('<line>', 'svg').appendTo(xticks).attr({
                    x1: cx(x).toPrecision(5), 
                    y1: config.y,
                    x2: cx(x).toPrecision(5), 
                    y2: config.y + tickSign * 4,
                });
            }

            // axis //
            $('<line>', 'svg').appendTo(xaxis).attr({
                x1: config.x, y1: config.y,
                x2: config.x + config.length,
                y2: config.y,
                'stroke': config.frameColor,
                'stroke-width': config.frameThickness,
            });
        }

        function drawVertical(frame, ticks, config, isLog) {
            function cy(y) {
                let r;
                if (isLog) {
                    r = Math.log10(ticks.max / y) / Math.log10(ticks.max / ticks.min);
                }
                else {
                    r = (ticks.max - y) / (ticks.max - ticks.min);
                }
                return config.y + r * config.length;
            }
            let labelOffset = 5, labelOffsetSign = -1, tickSign = +1;
            if (config.labelPosition[0].toUpperCase() == 'R') {
                tickSign *= -1;
                labelOffsetSign *= -1;
            }
            if (config.ticksOutwards) {
                tickSign *= -1;
                labelOffset += 8;
            }

            let yaxis = $('<g>', 'svg').appendTo(frame);
            let ytitle = $('<text>', 'svg').appendTo(yaxis).attr({
                'font-family': 'sans-serif',
                'font-size': '16px',
                'fill': config.labelcolor,
            }).text(config.title);            
            let ylabels = $('<g>', 'svg').appendTo(yaxis).attr({
                'font-family': 'sans-serif',
                'font-size': '16px',
                'fill': config.labelColor,
            });
            let yticks = $('<g>', 'svg').appendTo(yaxis).attr({
                'stroke': config.frameColor,
            });

            if (labelOffsetSign < 0) {
                const x0 = config.x - config.labelMargin + 1;
                ytitle.attr({
                    x: x0, y: config.y,
                    'text-anchor': 'end',
                    'dominant-baseline': 'hanging',
                    transform: `rotate(-90, ${x0}, ${config.y})`,
                });
            }
            else {
                const x0 = config.x + config.labelMargin - 1;
                ytitle.attr({
                    x: x0, y: config.y,
                    'text-anchor': 'begin',
                    'dominant-baseline': 'hanging',
                    transform: `rotate(90, ${x0}, ${config.y})`,
                });
            }
            
            let yticklist = ticks;
            let factoringExp = ticks.isLog ? 1 : findFactoring(ticks.min, ticks.max);
            let factoring = 1;
            let yfactoring_threshold = 3.5;
            if (! ticks.isLog && (Math.abs(factoringExp) > yfactoring_threshold)) {
                factoring = Math.pow(10, -factoringExp);
                yticklist = (new JGPlotAxisScale(
                    ticks.min*factoring, ticks.max*factoring, isLog,
                    {numberOfTicks: config.numberOfTicks}
                ))._find_ticks();
            }
            
            labelOffset *= labelOffsetSign;
            
            for (let yf of yticklist.ticks) {
                let y = yf/factoring;
                // tick //
                $('<line>', 'svg').appendTo(yticks).attr({
                    x1: config.x,
                    y1: cy(y).toPrecision(5),
                    x2: config.x + tickSign * 8,
                    y2: cy(y).toPrecision(5),
                    'stroke': config.frameColor,
                });
                // label //
                let label = $('<text>', 'svg').appendTo(ylabels).attr({
                    x: config.x + labelOffset,
                    y: cy(y).toPrecision(5),
                    'dominant-baseline': 'middle',
                    'text-anchor': (labelOffsetSign < 0) ? 'end' : 'begin',
                });
                if (! ticks.isLog) {
                    let digits = findDecimalDigits(yticklist.ticks);
                    if (digits > 0) {
                        label.text(yf.toFixed(digits));
                    }
                    else {
                        label.text(parseFloat(yf.toPrecision(6)));
                    }
                }
                else {
                    label.text('10');
                    let exp = $('<tspan>', 'svg').appendTo(label).attr({
                        dy: -8,
                        'font-size': '12px',
                    });
                    exp.text(Math.round(Math.log10(y)));
                }
            }
            // sub-ticks //
            for (let y of yticklist.subticks) {
                $('<line>', 'svg').appendTo(yticks).attr({
                    x1: config.x,
                    y1: cy(y).toPrecision(4),
                    x2: config.x + tickSign * 4,
                    y2: cy(y).toPrecision(4),
                    'stroke': config.frameColor,
                });
            }
            // factoring //
            if (Math.abs(factoringExp) > yfactoring_threshold) {
                let factorLabel = $('<text>', 'svg').appendTo(ylabels);
                factorLabel.text('x10').attr({
                    x: config.x,
                    y: config.y - 8,
                    'dominant-baseline': 'alphabetic',
                    'text-anchor': 'start',
                });
                let exp = $('<tspan>', 'svg').appendTo(factorLabel);
                exp.text(factoringExp).attr({
                    dy: -8,
                    'font-size': '12px',
                });
            }
            // axis //
            $('<line>', 'svg').appendTo(yaxis).attr({
                x1: config.x, y1: config.y,
                x2: config.x,
                y2: config.y + config.length,
                'stroke': config.frameColor,
                'stroke-width': config.frameThickness,
            });
        }

        this.ticklist = this._find_ticks();
        
        let frame = g.append('<g>', 'svg');
        if (['L', 'R'].includes(config.labelPosition[0].toUpperCase())) {
            drawVertical(frame, this.ticklist, config, this.isLog);
        }
        else {
            drawHorizontal(frame, this.ticklist, config, this.isLog);
        }
    }

    static findRangeFromValues(minValue, maxValue, opts={}) {
        const defaults = {
            isLog: false,
            lowerMargin: 0.03,
            upperMargin: 0.03,
            stickyZero: true,
        };
        let options = $.extend({}, defaults, opts);

        let x0 = parseFloat(minValue);
        let x1 = parseFloat(maxValue);
        let lowerMargin = parseFloat(options.lowerMargin);
        let upperMargin = parseFloat(options.upperMargin);

        if (options.isLog) {
            if (x1 <= 0) {
                x1 = 10;
                x0 = 0.1;
            }
            else if (x0 <= 0) {
                x1 = 3 * x1;
                x0 = Math.min(0.5, x1/100);
            }
            else {
                let width = x1 / x0;
                x1 = x1 * Math.pow(width, upperMargin);
                x0 = x0 / Math.pow(width, lowerMargin);
            }
        }
        else {
            let width = x1 - x0;
            let sum = Math.abs(x0) + Math.abs(x1);
            if (sum < 1e-20) {
                x0 = -1;
                x1 = 1;
            }
            else if (width < 1e-6 * sum) {
                let center = (x0 + x1)/2;
                x0 = center - 0.1 * sum;
                x1 = center + 0.1 * sum;
            }
            else {
                if (options.stickyZero && (x0 >= 0) && (x0 < lowerMargin * width)) {
                    x0 = 0;
                }
                else {
                    x0 -= lowerMargin * width;
                }
            }
            x1 += upperMargin * width;
        }

        return [ x0, x1 ];
    }
};
    


export class JGPlotColorBarScale extends JGPlotAxisScale {
    constructor(min, max, isLog, options={}) {
        const defaults = {
            ticksOutwards: true,
            colorCoding: 'Parula',
            scaleBarWidth: 10,
            numberOfSlices: 32,
        };
        super(min, max, isLog, $.extend({}, defaults, options));
        
        this.colorMap = new ColorMap(this.config.colorCoding);
    }

    colorNameOf(value) {
        let r;
        if (this.isLog) {
            r = Math.log10(value / this.min) / Math.log10(this.max / this.min);
        }
        else {
            r = (value - this.min) / (this.max - this.min);
        }
        return this.colorMap.colorNameOf(r);
    }
    
    //... TODO: do not do this everytime. <g> should be in the constructor
    draw(g, options={}) {
        let colorBar = $('<g>', 'svg').appendTo(g);

        const n = this.config.numberOfSlices;
        const pos = this.config.labelPosition[0].toUpperCase();
        const sliceWidth = this.config.length / n;
        const barOffset = ((pos == 'R') || (pos == 'B') ? -1 : 0) * this.config.scaleBarWidth;
        
        for (let i = 0; i < this.config.numberOfSlices; i++) {
            const color = this.colorMap.colorNameOf((i+0.5)/n);
            let slice = $('<rect>', 'svg').appendTo(colorBar);
            if (pos == 'T' || pos == 'B') {
                slice.attr({
                    x: (this.config.x + (i/n) * this.config.length).toPrecision(5),
                    y: this.config.y + barOffset,
                    width: sliceWidth,
                    height: this.config.scaleBarWidth,
                });
            }
            else {
                slice.attr({
                    x: this.config.x + barOffset,
                    y: (this.config.y + (1-((i+1)/n)) * this.config.length).toPrecision(5),
                    width: this.config.scaleBarWidth,
                    height: sliceWidth,
                });
            }
            slice.attr({
                fill: color,
                stroke: color,
            });
        }

        super.draw(g, options);
    }
};



export class JGPlotFrame {
    static plotId = 1;
    constructor(parent_g, options={}) {
        let defaults = {
            x: 0, y: 0, width: 640, height: 480,  // in parent coordinate
            x0: 0, x1: 1, y0: 0, y1: 1,           // initial coordinate
            dateFormat: null, logX: false, logY: false,
            grid: false, stat: true, ticksX: 10, ticksY: 10, ticksOutwards: false,
            z0: 0, z1: 1, ticksZ: 10, colorScale: null,
            plotMarginColor: 'none', plotAreaColor: 'none',
            frameColor: 'black', frameThickness: 2, axisThickness: 1,
            labelColor: null, gridColor: null,
            marginTop: 32, marginRight: 20, marginBottom: 56, marginLeft: 72,
            colorBarWidth: 20,
            plotDigits: 6,
        };
        if (options.ticksOutwards === true) {
            defaults.marginBottom += 8;
            defaults.marginLeft += 8;
        }
        
        this.options = $.extend({}, defaults, options);
        
        if (this.options.colorScale !== null) {
            if ((this.options.colorScale === "") || (this.options.colorScale.toLowerCase() == "none")) {
                this.options.colorScale = null;
            }
        }
        if (this.options.colorScale !== null) {
            this.options.marginRight += this.options.marginLeft + this.options.colorBarWidth*2;
        }

        this.uid = JGPlot.plotId++;
        this.frame = $('<g>', 'svg').appendTo(parent_g);
        const plotWidth = parseFloat(this.options.width);
        const plotHeight = parseFloat(this.options.height);
        const x00 = parseFloat(this.options.x);
        const y00 = parseFloat(this.options.y);
        if ((x00 !== 0) || (y00 != 0)) {
            this.frame.attr('transform', `translate(${x00},${y00})`);
        }

        this.geom = {
            width: plotWidth,
            height: plotHeight,
            marginTop: parseInt(this.options.marginTop),
            marginRight: parseInt(this.options.marginRight),
            marginBottom: parseInt(this.options.marginBottom),
            marginLeft: parseInt(this.options.marginLeft),
            xmin: parseFloat(this.options.x0),
            xmax: parseFloat(this.options.x1),
            ymin: parseFloat(this.options.y0),
            ymax: parseFloat(this.options.y1),
            zmin: parseFloat(this.options.z0),
            zmax: parseFloat(this.options.z1),
            xlog: this.options.logX,
            ylog: this.options.logY,
            zlog: this.options.logZ,
            frameWidth: -1,
            frameHeight: -1,
            xticks: parseInt(this.options.ticksX),
            yticks: parseInt(this.options.ticksY),
            zticks: parseInt(this.options.ticksZ),
            xDateFormat: this.options.dateFormat,
        };
        this.geom.frameWidth = this.geom.width - this.geom.marginLeft - this.geom.marginRight;
        this.geom.frameHeight = this.geom.height - this.geom.marginTop - this.geom.marginBottom;

        this.labels = {
            title: '',
            footnote: '',
            grid: this.options.grid,
            stat: this.options.stat,
            plotMarginColor: this.options.plotMarginColor,
            plotAreaColor: this.options.plotAreaColor,
            frameColor: this.options.frameColor,
            labelColor: this.options.labelColor ?? this.options.frameColor,
            gridColor: this.options.gridColor ?? this.options.frameColor,
            frameThickness: this.options.frameThickness,
        };

        this.style = {
            lineColor: 'black',
            lineWidth: 1,
            lineStyle: 'solid',
            fillColor: '',
            fillOpacity: 1,
            markerType: 'circle',
            markerColor: 'black',
            markerOpacity: 1,
            markerSize: 3,
            textColor: 'black',
            fontFamily: 'sans-serif',
            fontSize: '16px'
        };

        this.scaleX = new JGPlotAxisScale(this.geom.xmin, this.geom.xmax, this.geom.xlog, {
            x: this.geom.marginLeft,
            y: this.geom.frameHeight + this.geom.marginTop,
            length: this.geom.frameWidth,
            labelPosition: 'down',
            ticksOutwards: this.options.ticksOutwards,
            dateFormat: this.geom.xDateFormat,
            numberOfTicks: this.options.ticksX,
            title: '',
            frameThickness: this.options.axisThickness ?? this.options.frameThickness,
            frameColor: this.options.frameColor,
            labelColor: this.options.labelColor,
            gridColor: this.options.gridColor,
        });
        this.scaleY = new JGPlotAxisScale(this.geom.ymin, this.geom.ymax, this.geom.ylog, {
            x: this.geom.marginLeft,
            y: this.geom.marginTop,
            length: this.geom.frameHeight,
            labelPosition: 'left',
            ticksOutwards: this.options.ticksOutwards,
            numberOfTicks: this.options.ticksY,
            title: '',
            frameThickness: this.options.axisThickness ?? this.options.frameThickness,
            frameColor: this.options.frameColor,
            labelColor: this.options.labelColor,
            gridColor: this.options.gridColor,
        });
        if (this.options.colorScale !== null) {
            const barWidth = this.options.colorBarWidth;
            this.options.marginRight += this.options.marginLeft + barWidth*2;
            this.scaleZ = new JGPlotColorBarScale(0, 1, false, {
                x: this.geom.marginLeft + this.geom.frameWidth + 2*barWidth,
                y: this.geom.marginTop,
                length: this.geom.frameHeight,
                scaleBarWidth: barWidth,
                labelMargin: this.geom.LeftMargin,
                labelPosition: 'right',
                colorCoding: this.options.colorScale,
                ticksOutwards: true,
                frameColor: this.style.plotLabelColor, // LabelColor on purpose
                labelColor: this.style.plotLabelColor,
                title: '',
            });
        }
        else {
            this.scaleZ = null;
        }
        
        this.geom.xmin = this.scaleX.min;
        this.geom.xmax = this.scaleX.max;
        this.geom.ymin = this.scaleY.min;
        this.geom.ymax = this.scaleY.max;
        if (this.scaleZ) {
            this.geom.zmin = this.scaleZ.min;
            this.geom.zmax = this.scaleZ.max;
        }
        this.clear();
    }
    
    clear() {
        this.drawFrame();
    }

    getRange() {
        return this.geom;
    }
    
    setRange(x0, x1, y0, y1, z0=null, z1=null, options={}) {
        const defaults = {
            xlog: this.geom.xlog,
            ylog: this.geom.ylog,
            zlog: this.geom.zlog ?? false,
            grid: this.labels.grid,
            stat: this.labels.stat
        };
        let opts = $.extend({}, defaults, options);

        this.scaleX.setRange(x0, x1, opts.xlog);
        this.scaleY.setRange(y0, y1, opts.ylog);
        this.geom.xmin = this.scaleX.min;
        this.geom.xmax = this.scaleX.max;
        this.geom.xlog = this.scaleX.isLog;
        this.geom.ymin = this.scaleY.min;
        this.geom.ymax = this.scaleY.max;
        this.geom.ylog = this.scaleY.isLog;
        if (this.scaleZ) {
            this.scaleZ.setRange(z0, z1, opts.zlog);
            this.geom.zmin = this.scaleZ.min;
            this.geom.zmax = this.scaleZ.max;
            this.geom.zlog = this.scaleZ.isLog;
        }

        this.labels.grid = opts.grid;
        this.labels.stat = opts.stat;

        this.drawFrame();
        
        return this;
    }
    
    setStyle(style) {
        $.extend(this.style, style);
        return this;
    }

    setTitle(title) {
        this.labels.title = title;
        this.frame.find('.jagaplot-title').text(title);
        return this;
    }    

    setXTitle(title) {
        this.scaleX.setOptions({'title': title});
        return this;
    }    

    setYTitle(title) {
        this.scaleY.setOptions({'title': title});
        return this;
    }    

    setZTitle(title) {
        if (this.scaleZ) {
            this.scaleZ.setOptions({'title': title});
        }
        return this;
    }    

    setFootnote(footnote) {
        this.labels.footnote = footnote;
        this.frame.find('.jagaplot-footnote').text(footnote);
        return this;
    }    

    setXDateFormat(fmt) {
        this.geom.xDateFormat = fmt;
        this.scaleX.setOptions({'dateFormat': fmt});
    }

    enableGrid(enabled=true) {
        this.labels.grid = enabled;
        this.frame.find('.jagaplot-grid').attr('visibility', enabled ? 'visible' : 'hidden');
        return this;
    }

    enableStat(enabled=true) {
        this.labels.stat = enabled;
        this.frame.find('.jagaplot-stat').attr('visibility', enabled ? 'visible' : 'hidden');
        return this;
    }

    drawFrame() {
        let frame = this.frame;
        let geom = this.geom;
        let xmin = this.geom.xmin, xmax = this.geom.xmax;
        let ymin = this.geom.ymin, ymax = this.geom.ymax;

        frame.empty();

        $('<rect>', 'svg').appendTo(frame).attr({
            x: 0, y: 0, width: geom.width, height: geom.height,
            fill: this.labels.plotMarginColor,
            stroke: 'none'
        });
        $('<rect>', 'svg').appendTo(frame).attr({
            x: this._cx(xmin), y: this._cy(ymax), 
            width: geom.frameWidth, height: geom.frameHeight,
            fill: this.labels.plotAreaColor,
            stroke: 'none'
        });
        
        let clippathid = 'plottingareaclip_' + this.uid;
        let clipPath = $('<clipPath>', 'svg').appendTo(frame).attr({
            id: clippathid
        });
        $('<rect>', 'svg').appendTo(clipPath).attr({
            x: this._cx(xmin), y: this._cy(ymax), 
            width: geom.frameWidth, height: geom.frameHeight,
        });
        let plottingarea = $('<g>', 'svg').appendTo(frame).addClass('jagaplot-plottingarea').attr({
            'clip-path': 'url(#' + clippathid + ')'
        });

        // Labels //
        let labels = $('<g>', 'svg').appendTo(frame);
        let title = $('<text>', 'svg').appendTo(labels).attr({
            x: geom.marginLeft + geom.frameWidth/2, y: geom.marginTop-5,
            'font-family': 'sans-serif',
            'font-size': '20px',
            'text-anchor': 'middle',
            'fill': this.labels.labelColor
        }).addClass('jagaplot-title').text(this.labels.title);
        let footnote = $('<text>', 'svg').appendTo(labels).attr({
            x: 3, y: geom.height-3,
            'font-family': 'sans-serif',
            'font-size': '8px',
            'fill': this.labels.labelColor
        }).addClass('jagaplot-footnote').text(this.labels.footnote);
        
        // X Axis //
        this.scaleX.draw(frame);
        let xgrid = $('<g>', 'svg').appendTo(plottingarea).attr({
            'stroke': this.labels.gridColor,
            'stroke-dasharray': 2
        });
        for (let x of this.scaleX.ticklist.ticks) {
            $('<line>', 'svg').appendTo(xgrid).addClass('jagaplot-grid').attr({
                x1: this._cx(x).toPrecision(5), 
                y1: this._cy(ymin).toPrecision(5),
                x2: this._cx(x).toPrecision(5), 
                y2: this._cy(ymax).toPrecision(5)
            });
        }

        // Y Axis //
        this.scaleY.draw(frame);
        let ygrid = $('<g>', 'svg').appendTo(plottingarea).attr({
            'stroke': this.labels.gridColor,
            'stroke-dasharray': 2
        });
        for (let y of this.scaleY.ticklist.ticks) {
            $('<line>', 'svg').appendTo(ygrid).addClass('jagaplot-grid').attr({
                x1: this._cx(xmin).toPrecision(5), 
                y1: this._cy(y).toPrecision(5),
                x2: this._cx(xmax).toPrecision(5), 
                y2: this._cy(y).toPrecision(5),
            });
        }
            
        // Frame Box //
        $('<rect>', 'svg').appendTo(frame).attr({
            x: this._cx(xmin), y: this._cy(ymax), 
            width: geom.frameWidth, height: geom.frameHeight,
            fill: 'none',
            'stroke': this.labels.frameColor,
            'stroke-width': this.labels.frameThickness,
        });

        // Stat //
        $('<g>', 'svg').appendTo(frame).addClass('jagaplot-stat');

        if (! this.labels.grid) {
            frame.find('.jagaplot-grid').attr('visibility', 'hidden')
        }
        if (! this.labels.stat) {
            frame.find('.jagaplot-stat').attr('visibility', 'hidden')
        }

        // Z Axis //
        if (this.scaleZ) {
            this.scaleZ.draw(frame);
        }
    }

    
    //// internal methods ////
    
    _clip(x, xmin, xmax) {
        if (x < xmin) return xmin;
        if (x > xmax) return xmax;
        return x;
    }    

    _includes(x, x0, x1) {
        if (x0 < x1) {
            return (x >= x0) && (x < x1);
        }
        else {
            return (x >= x1) && (x < x0);
        }
    }    

    _cx(px) {
        let r;
        if (this.geom.xlog) {
            r = Math.log10(px / this.geom.xmin) / Math.log10(this.geom.xmax / this.geom.xmin);
        }
        else {
            r = (px - this.geom.xmin) / (this.geom.xmax - this.geom.xmin);
        }
        return r * this.geom.frameWidth + this.geom.marginLeft;
    }

    _cy(py) {
        let r;
        if (this.geom.ylog) {
            r = Math.log10(this.geom.ymax / py) / Math.log10(this.geom.ymax / this.geom.ymin);
        }
        else {
            r = (this.geom.ymax - py) / (this.geom.ymax - this.geom.ymin);
        }
        return r * this.geom.frameHeight + this.geom.marginTop;
    }

    _px(cx) {
        let r = (cx - this.geom.marginLeft) / this.geom.frameWidth;
        if (this.geom.xlog) {
            return Math.pow(this.geom.xmax / this.geom.xmin, r) * this.geom.xmin;
        }
        else {
            return r * (this.geom.xmax - this.geom.xmin) + this.geom.xmin;
        }
    }

    _py(cy) {
        let r = (cy - this.geom.marginTop) / this.geom.frameHeight;
        if (this.geom.ylog) {
            return this.geom.ymax / Math.pow(this.geom.ymax / this.geom.ymin, r);
        }
        else {
            return this.geom.ymax - r * (this.geom.ymax - this.geom.ymin);
        }
    }
};



export class JGPlot extends JGPlotFrame { // to be embedded in <SVG>
    constructor(parent_g, options={}) {
        super(parent_g, options);
    }
    
    static _setPathData(path, pathData, precision=4) {
        let d = [];
        for (let seg of pathData) {
            if ((seg.values[0] !== null) && (seg.values[1] !== null)) {
                d.push(seg.type);
                d.push(seg.values[0].toPrecision(precision));
                d.push(seg.values[1].toPrecision(precision));
            }
        }
        path.setAttribute('d', d.join(' '));
    }

    
    drawHistogram(hist) {
        const min = parseFloat(hist.bins?.min ?? 0);
        const max = parseFloat(hist.bins?.max ?? min+1);
        const counts = hist.counts ?? [];
        const defaultStyle = {
            lineColor: this.style.lineColor,
            lineWidth: this.style.lineWidth,
            lineStyle: this.style.lineStyle,
            fillColor: this.style.fillColor,
            fillOpacity: this.style.fillOpacity,
        };
        const style = $.extend({}, defaultStyle, hist.style);

        let frame = this.frame;
        if (frame.find('.jagaplot-plottingarea').size() == 0) {
            this.drawFrame();
        }
        let plottingarea = frame.find('.jagaplot-plottingarea');
        let objgroup = $('<g>', 'svg').appendTo(plottingarea);

        const nbins = counts.length;
        if (nbins == 0) {
            return this;
        }

        let path = $('<path>', 'svg').appendTo(objgroup).get();
        if ((style.lineColor !== '') && (parseFloat(style.lineWidth) > 0)) {
            path.style.setProperty('stroke', style.lineColor);
            path.style.setProperty('stroke-width', style.lineWidth);
            if ((style.lineStyle == 'dot') || (style.lineStyle == 'dotted')) {
                path.style.setProperty('stroke-dasharray', 2);
            }
        }
        else {
            path.style.setProperty('stroke', 'none');
        }
        if (style.fillColor) {
            path.style.setProperty('fill', style.fillColor);
            path.style.setProperty('fill-opacity', style.fillOpacity);
        }
        else {
            path.style.setProperty('fill', 'none');
        }

        const step = (max - min) / nbins;
        let x0 = this._cx(min), y0 = this._cy(this.geom.ymin);
        let x1, y;
        let pathData = [ {type: "M", values: [x0, y0]} ];
        for (let i = 0; i < nbins; i++) {
            x0 = this._cx(min + i * step);
            x1 = this._cx(min + (i+1) * step);
            if (this.geom.ylog && (counts[i] <= 0)) {
                y = y0;
            }
            else {
                y = this._cy(parseFloat(counts[i]));
            }
            pathData.push({type: "L", values: [x0, y]});
            pathData.push({type: "L", values: [x1, y]});
        }
        pathData.push({type: "L", values: [x1, y0]});
        JGPlot._setPathData(path, pathData, this.options.plotDigits);

        return this;
    }

    
    drawHistogram2d(hist2d) {
        const xmin = parseFloat(hist2d.xbins?.min ?? 0);
        const xmax = parseFloat(hist2d.xbins?.max ?? xmin+1);
        const ymin = parseFloat(hist2d.ybins?.min ?? 0);
        const ymax = parseFloat(hist2d.ybins?.max ?? ymin+1);
        const counts = hist2d.counts ?? [[]];
        
        if (! this.scaleZ) {
            return this;
        }
        
        let frame = this.frame;
        if (frame.find('.jagaplot-plottingarea').size() == 0) {
            this.drawFrame();
        }
        let plottingarea = frame.find('.jagaplot-plottingarea');
        let objgroup = $('<g>', 'svg').appendTo(plottingarea);

        const ynbins = counts.length;
        if (ynbins == 0) {
            return this;
        }
        const xnbins = counts[0].length;
        if (xnbins == 0) {
            return this;
        }

        const xstep = (xmax - xmin) / xnbins, ystep = (ymax - ymin) / ynbins;
        for (let iy = 0; iy < ynbins; iy++) {
            for (let ix = 0; ix < xnbins; ix++) {
                const x0 = this._cx(xmin + ix * xstep);
                const x1 = this._cx(xmin + (ix+1) * xstep);
                const y0 = this._cy(ymin + iy * ystep);
                const y1 = this._cy(ymin + (iy+1) * ystep);
                const z = counts[iy][ix];

                let cell = $('<rect>', 'svg').appendTo(objgroup).attr({
                    x: x0, y: y1, width: x1-x0, height: y0-y1,
                    'fill': this.scaleZ.colorNameOf(z),
                    'stroke': this.scaleZ.colorNameOf(z),
                });
            }
        }
        
        return this;
    }

    
    drawGraph(graph) {
        const y = graph.y ? graph.y : []
        const x = (graph.x?.length == y.length) ? graph.x : [... Array(y.length)].map((_, i)=>i);
        const xerr = (graph.x_err?.length == x.length) ? graph.x_err : null;
        const yerr = (graph.y_err?.length == y.length) ? graph.y_err : null;
        const defaultStyle = {
            lineColor: this.style.lineColor,
            lineWidth: this.style.lineWidth,
            lineStyle: this.style.lineStyle,
            markerColor: this.style.markerColor,
            markerOpacity: this.style.markerOpacity,
            markerSize: this.style.markerSize,
            markerType: this.style.markerType,
            fillColor: this.style.lineColor,
            fillOpacity: 0,
            fillBaseline: 1e-100,
            lineType: 'connect',
        };
        let style = $.extend({}, defaultStyle, graph.style);
        
        let frame = this.frame;
        if (frame.find('.jagaplot-plottingarea').size() == 0) {
            this.drawFrame();
        }
        let plottingarea = frame.find('.jagaplot-plottingarea');
        let objgroup = $('<g>', 'svg').appendTo(plottingarea);
        let geom = this.geom;

        let drawMarker = null;
        if ((style.markerColor !== '') && (parseInt(style.markerSize) > 0) && (parseFloat(style.markerOpacity) > 0)) {
            let fill = style.markerColor, stroke = 'none', opacity = style.markerOpacity;
            let shape = style.markerType;
            if (shape.substr(0, 4) == 'open') {
                fill = 'none';
                stroke = style.markerColor;
                shape = shape.substr(4);
            }
            if (shape == 'circle') {
                const radius = style.markerSize;
                drawMarker = function(objgroup, x, y) {
                    $('<circle>', 'svg').appendTo(objgroup).attr({
                        cx: x, cy: y, r: radius,
                        fill: fill,
                        'fill-opacity': opacity,
                        stroke: stroke,
                        'stroke-width': 2
                    });
                }
            }
            else if (shape == 'square') {
                const width = style.markerSize * 1.77; /* sqrt(pi) */
                drawMarker = function(objgroup, x, y) {
                    $('<rect>', 'svg').appendTo(objgroup).attr({
                        x: x - width/2, y: y - width/2, width: width, height: width,
                        fill: fill,
                        'fill-opacity': opacity,
                        stroke: stroke,
                        'stroke-width': 2
                    });
                }
            }
            else if (shape == 'diamond') {
                const width = style.markerSize * 1.25; /* sqrt(pi/2) */
                drawMarker = function(objgroup, x, y) {
                    $('<polygon>', 'svg').appendTo(objgroup).attr({
                        points: `${x-width},${y} ${x},${y-width} ${x+width},${y} ${x},${y+width}`,
                        fill: fill,
                        'fill-opacity': opacity,
                        stroke: stroke,
                        'stroke-width': 2
                    });
                }
            }
            else if (shape == 'triangle') {
                const width = style.markerSize * 2.69; /* sqrt(pi/(sqrt(3)/4)) */
                const dx = width/2, dy0 = width*0.58, dy1 = width*0.29;
                drawMarker = function(objgroup, x, y) {
                    $('<polygon>', 'svg').appendTo(objgroup).attr({
                        points: `${x},${y-dy0} ${x-dx},${y+dy1} ${x+dx},${y+dy1}`,
                        fill: fill,
                        'fill-opacity': opacity,
                        stroke: stroke,
                        'stroke-width': 2
                    });
                }
            }
        }
        else {
            if (style.lineColor === '') {
                style.lineColor = 'black';
            }
            if (style.lineWidth <= 0) {
                style.lineWidth = 1;
            }
        }

        let path = null;
        if (
            ((style.lineColor !== '') && (parseFloat(style.lineWidth) > 0)) ||
            ((style.fillColor !== '') && (parseFloat(style.fillOpacity) > 0)) 
        ){
            path = $('<path>', 'svg').appendTo(objgroup).get();
            path.style.setProperty('stroke', style.lineColor);
            path.style.setProperty('stroke-width', style.lineWidth);
            if (style.fillOpacity > 0) {
                path.style.setProperty('fill', style.fillColor);
                path.style.setProperty('fill-opacity', style.fillOpacity);
            }
            else {
                path.style.setProperty('fill', 'none');
            }
            if ((style.lineStyle == 'dot') || (style.lineStyle == 'dotted')) {
                path.style.setProperty('stroke-dasharray', 2);
            }
        }

        let pathData = [];
        let cx0 = null, cy0 = null;
        const cy_base = this._cy(parseFloat(style.fillBaseline));
        for (let i = 0; i < x.length; i++) {
            if (isNaN(x[i]) || (geom.xlog && (x[i] <= 0))) {
                continue;
            }
            if (isNaN(y[i]) || (geom.ylog && (y[i] <= 0))) {
                continue;
            }
            const cx = this._cx(x[i]);
            const cy = this._cy(y[i]);

            if (path) {
                if ((cx0 === null) || (cy0 === null)) {
                    if (style.fillOpacity > 0) {
                        pathData.push({type: 'M', values: [cx, cy_base]});
                        pathData.push({type: 'L', values: [cx, cy]});
                    }
                    else {
                        pathData.push({type: 'M', values: [cx, cy]});
                    }
                }
                else {
                    if (style.lineType == 'last') {
                        if (style.fillOpacity > 0) {
                            pathData.push({type: 'L', values: [cx0, cy0]});
                        }
                        else {
                            pathData.push({type: 'M', values: [x0, cy0]});
                        }
                        pathData.push({type: 'L', values: [cx, cy0]});
                    }
                    else {
                        pathData.push({type: 'L', values: [cx, cy]});
                    }
                }
                cx0 = cx;
                cy0 = cy;
            }
            if (drawMarker) {
                drawMarker(objgroup, cx, cy);
            }
            if (xerr && ! isNaN(xerr[i]) && (xerr[i] > 0)) {
                const cxl = this._cx(x[i] - xerr[i]);
                const cxu = this._cx(x[i] + xerr[i]);
                $('<line>', 'svg').appendTo(objgroup).attr({
                    x1: cxl, y1: cy, x2: cxu, y2: cy,
                    stroke: style.markerColor,
                    'stroke-width': Math.max(1, style.markerSize / 2),
                });
            }
            if (yerr && ! isNaN(yerr[i]) && (yerr[i] > 0)) {
                let cyl = this._cy(y[i] - yerr[i]);
                let cyu = this._cy(y[i] + yerr[i]);
                $('<line>', 'svg').appendTo(objgroup).attr({
                    x1: cx, y1: cyl, x2: cx, y2: cyu,
                    stroke: style.markerColor,
                    'stroke-width': Math.max(1, style.markerSize / 2),
                });
            }
        }
        if (path) {
            if (style.fillOpacity > 0) {
                pathData.push({type: 'L', values: [cx0, cy_base]});
            }
            JGPlot._setPathData(path, pathData, this.options.plotDigits);
        }

        return this;
    }

    drawBarChart(graph) {
        const y = graph.y ? graph.y : []
        const x = (graph.x?.length == y.length) ? graph.x : [... Array(y.length)].map((_, i)=>i);
        const defaultStyle = {
            fillColor: this.style.fillColor || this.style.lineColr,
            fillOpacity: this.style.fillOpacity || 1,
            width: null,
        };
        let style = $.extend({}, defaultStyle, graph.style);

        
        let frame = this.frame;
        if (frame.find('.jagaplot-plottingarea').size() == 0) {
            this.drawFrame();
        }
        let plottingarea = frame.find('.jagaplot-plottingarea');
        let objgroup = $('<g>', 'svg').appendTo(plottingarea);
        let geom = this.geom;

        let fill = style.fillColor, stroke = 'none', opacity = style.fillOpacity;
        let width = style.width;
        if ((! width) || (width <= 0)) {
            if (x < 2) {
                width = (geom.xmax - geom.xmin) / 2;
            }
            else {
                width = x[1] - x[0];
            }
            for (let i = 2; i < x.length; i++) {
                const dx = x[i] - x[i-1];
                width = (dx < width) ? dx : width;
            }
            width *= 0.8;
        }

        const [yc_min, yc_max] = [this._cy(this.geom.ymax), this._cy(this.geom.ymin)]
        for (let i = 0; i < x.length; i++) {
            if (isNaN(x[i]) || (geom.xlog && (x[i] <= 0))) {
                continue;
            }
            if (isNaN(y[i]) || (geom.ylog && (y[i] <= 0))) {
                continue;
            }
            let x0 = this._cx(x[i]-width/2);
            let x1 = this._cx(x[i]+width/2);
            let y0 = this._clip(this._cy(0), yc_min, yc_max);
            let y1 = this._clip(this._cy(y[i], yc_min, yc_max));

            $('<rect>', 'svg').appendTo(objgroup).attr({
                x: x0, y: Math.min(y0, y1), width: x1-x0, height: Math.abs(y1-y0),
                //x: x0, y: y1, width: x1-x0, height: y0-y1,
                fill: fill,
                'fill-opacity': opacity,
                stroke: stroke,
                'stroke-width': 2
            });
        }

        return this;
    }

    drawFunction(func) {
        let x = func.x ?? [];
        let y = func.y ?? [];
        let f = func.func;
        let rangeMin = func.range?.min ?? 0;
        let rangeMax = func.range?.max ?? rangeMin+1;
        let step = func.step ?? ((rangeMax - rangeMin)/100);

        const defaultStyle = {
            lineColor: this.style.lineColor,
            lineWidth: this.style.lineWidth,
            lineStyle: this.style.lineStyle,
            //fillColor: this.style.fillColor,
            //fillOpacity: this.style.fillOpacity,
        };
        let style = $.extend({}, defaultStyle, func.style);

        let frame = this.frame;
        if (frame.find('.jagaplot-plottingarea').size() == 0) {
            this.drawFrame();
        }
        let plottingarea = frame.find('.jagaplot-plottingarea');
        let objgroup = $('<g>', 'svg').appendTo(plottingarea);
        let geom = this.geom;

        let isVoid = function(x) {
             return (x === undefined) || (x === null);
        };
        let isEmpty = function(x) {
            return isVoid(x) || (Array.isArray(x) && x.length == 0);
        };
        
        if (isEmpty(x)) {
            if (isVoid(f)) {
                console.log("JGPlotWidget.drawFunction(): empty data");
                return this;    
            }
            if (isVoid(rangeMin)) {
                rangeMin = geom.xmin;
            }
            if (isVoid(rangeMax)) {
                rangeMax = geom.xmax;
            }
            if (isVoid(step)) {
                step = (rangeMax - rangeMin) / 100;
            }
            x = []; y = [];
            for (let xk = rangeMin; xk <= rangeMax; xk += step) {
                x.push(xk);
                y.push(f(xk));
            }
        }

        let i = 0;
        while (i < x.length) {
            let pathData = [];
            while (i < x.length) {
                const xk = x[i], yk = y[i]; i++;
                if (isNaN(xk) || isNaN(yk)) {
                    break;
                }
                if ((xk < rangeMin) || (xk > rangeMax)) {
                    break;
                }
                if (geom.xlog && (xk <= 0)) {
                    break;
                }
                if (geom.ylog && (yk <= 0)) {
                    break;
                }
                const cx = this._cx(xk);
                const cy = this._cy(yk);
                pathData.push({type: ((pathData.length == 0) ? 'M': 'L'), values: [cx, cy]});
            }
            if (pathData.length > 0) {
                let path = $('<path>', 'svg').appendTo(objgroup).get();
                path.style.setProperty('fill', 'none');
                path.style.setProperty('stroke', style.lineColor);
                path.style.setProperty('stroke-width', style.lineWidth);
                if ((style.lineStyle == 'dot') || (style.lineStyle == 'dotted')) {
                    path.style.setProperty('stroke-dasharray', 2);
                }
                JGPlot._setPathData(path, pathData, this.options.plotDigits);
            }
        }

        return this;
    }

    drawStat(stat) {
        if ((stat === null) || (stat === {})) {
            this.frame.find('.jagaplot-stat').empty();
        }
        let title = stat.title;
        let doc = stat.contents;

        let frame = this.frame;
        if (frame.find('.jagaplot-stat').size() == 0) {
            this.drawFrame();
        }
        let statEntry = frame.find('.jagaplot-stat');

        let geom = this.geom;
        let width = 200, height = 200;
        let x0 = this._cx(geom.xmax) - (width + 5);
        let y0 = this._cy(geom.ymax) + 5;

        let box = statEntry.find('rect');
        let text = statEntry.find('text');
        if (box.size() == 0) {
            box = $('<rect>', 'svg').appendTo(statEntry).attr({
                x: x0-5, y: y0,
                width: width+5, height: height,
                stroke: 'black',
                'stroke-width': '0.5',
                fill: 'white',
                rx: 5, ry: 5
            });
            text = $('<text>', 'svg').appendTo(statEntry).attr({
                x: x0, y: y0,
                'font-family': 'sans-serif',
                'font-size': '12'
            });
        }
        let textwidth = Math.max(parseInt(box.attr('width')) - (10+5), 0);

        let titlespan = $('<tspan>', 'svg').appendTo(text).attr({
            x: x0,
            dy: '+15',
            'font-weight': 'bold'
        }).text(title);
        textwidth = Math.max(parseInt(titlespan.get().getComputedTextLength())+5, textwidth);
        for (let key in doc) {
            let tspan = $('<tspan>', 'svg').appendTo(text).attr({
                x: x0 + 5,
                dy: '+15',
            }).text(key + ": " + doc[key]);
            textwidth = Math.max(parseInt(tspan.get().getComputedTextLength())+5, textwidth);
        }

        let length = statEntry.find('tspan').size();
        box.attr('height', length * 15 + 5);

        let newWidth = textwidth + 10;
        box.attr('width', newWidth+5);
        let shift = (width - newWidth).toPrecision(4);
        statEntry.attr('transform', 'translate(' + shift + ',0)');

        return this;
    }

    drawText(text) {
        let x = parseFloat(text.x);
        let y = parseFloat(text.y);
        let contentText = text.text;
        const defaultStyle = {
            fontFamily: this.style.fontFamily,
            fontSize: this.style.fontSize,
            textColor: this.style.textColor,
        };
        let style = $.extend({}, defaultStyle, text.style);

        let frame = this.frame;
        if (frame.find('.jagaplot-plottingarea').size() == 0) {
            this.drawFrame();
        }
        let plottingarea = frame.find('.jagaplot-plottingarea');

        $('<text>', 'svg').appendTo(plottingarea).attr({
            x: this._cx(x).toPrecision(this.options.plotDigits), 
            y: this._cy(y).toPrecision(this.options.plotDigits),
            'font-family': style.fontFamily,
            'fill': style.textColor,
            'font-size': style.fontSize,
            'dominant-baseline': style['dominant-baseline'],
            'text-anchor': style['text-anchor']
        }).text(contentText);

        return this;
    }    

    drawLine(line) {
        let x0 = line.x0, x1 = line.x1;
        let y0 = line.y0, y1 = line.y1;
        const defaultStyle = {
            lineColor: this.style.lineColor,
            lineWidth: this.style.lineWidth,
            lineStyle: this.style.lineStyle,
        };
        let style = $.extend({}, defaultStyle, line.style);

        let frame = this.frame;
        if (frame.find('.jagaplot-plottingarea').size() == 0) {
            this.drawFrame();
        }
        let plottingarea = frame.find('.jagaplot-plottingarea');
        let geom = this.geom;

        function isValid(x) {
            return (x !== undefined) && (x !== null) && (x !== '');
        }

        if (! isValid(x0) && ! isValid(y0)) {
            return this;
        }
        else if (! isValid(x0)) { // horizontal line
            x0 = geom.xmin;
            x1 = geom.xmax;
            y1 = y0;
        }
        else if (! isValid(y0)) { // vertical line
            x1 = x0;
            y0 = geom.ymin;
            y1 = geom.ymax;
        }
        else {
            if (! isValid(x1)) {
                x1 = x0;
            }
            if (! isValid(y1)) {
                y1 = y0;
            }
        }

        let elem = $('<line>', 'svg').appendTo(plottingarea).attr({
            x1: this._cx(x0).toPrecision(this.options.plotDigits), 
            y1: this._cy(y0).toPrecision(this.options.plotDigits),
            x2: this._cx(x1).toPrecision(this.options.plotDigits), 
            y2: this._cy(y1).toPrecision(this.options.plotDigits),
            'stroke': style.lineColor,
            'stroke-width': style.lineWidth
        });
        if ((style.lineStyle == 'dot') || (style.lineStyle == 'dotted')) {
            elem.attr('stroke-dasharray', 2);
        }
        else if ((style.lineStyle !== '') && (style.lineStyle != 'solid')) {
            elem.attr('stroke-dasharray', style.lineStyle);
        }
    }    

    drawRectangle(rect) {
        let x0 = rect.x0, x1 = rect.x1;
        let y0 = rect.y0, y1 = rect.y1;
        const defaultStyle = {
            lineColor: this.style.lineColor,
            lineWidth: this.style.lineWidth,
            lineStyle: this.style.lineStyle,
            fillColor: this.style.fillColor,
            fillOpacity: this.style.fillOpacity
        };
        let style = $.extend({}, defaultStyle, rect.style);

        let frame = this.frame;
        if (frame.find('.jagaplot-plottingarea').size() == 0) {
            this.drawFrame();
        }
        let plottingarea = frame.find('.jagaplot-plottingarea');
        let geom = this.geom;

        function isValid(x) {
            return (x !== undefined) && (x !== null) && (x !== '');
        }

        if (! isValid(x0)) {
            x0 = geom.xmin;
        }
        if (! isValid(x1)) {
            x1 = geom.xmax;
        }
        if (! isValid(y0)) {
            y0 = geom.ymin;
        }
        if (! isValid(y1)) {
            y1 = geom.ymax;
        }

        let cx0 = this._cx(x0), cx1 = this._cx(x1);
        let cy0 = this._cy(y0), cy1 = this._cy(y1);
        let cx = Math.min(cx0, cx1).toPrecision(this.options.plotDigits);
        let cy = Math.min(cy0, cy1).toPrecision(this.options.plotDigits);
        let width = Math.abs(cx1 - cx0).toPrecision(this.options.plotDigits);
        let height = Math.abs(cy1 - cy0).toPrecision(this.options.plotDigits);
        let elem = $('<rect>', 'svg').appendTo(plottingarea).attr({
            x: cx, y: cy, width: width, height: height
        });
        if ((style.lineColor !== '') && (parseFloat(style.lineWidth) > 0)) {
                elem.get().style.setProperty('stroke', style.lineColor);
            elem.get().style.setProperty('stroke-width', style.lineWidth);
        }
        if (style.fillColor !== '') {
            elem.get().style.setProperty('fill', style.fillColor);
            elem.get().style.setProperty('fill-opacity', style.fillOpacity);
        }
        else {
            elem.get().style.setProperty('fill', 'none');
        }

        return this;
    }    
};




export class JGPlotWidget extends JGWidget {

    constructor(obj, options={}) {
        let defaults = {
            // properties //
            width: null, height: null,            // size of <svg> element
            labelScaling: 1,
            x0: 0, x1: 1, y0: 0, y1: 1,           // initial coordinate
            dateFormat: null, logX: false, logY: false,
            grid: false, stat: true, ticksX: 10, ticksY: 10,
            colorScale: null,
            plotMarginColor: 'none', plotAreaColor: 'none',
            frameColor: 'black', frameTickness: 2,
            labelColor: null, gridColor: null,
            marginTop: 32, marginRight: 20, marginBottom: 48, marginLeft: 72,
            plotDigits: 6,
            cursorDigits: 5,
            // callbacks //
            rangeSelect: function(plotWidget, x0, x1, y0, y1) {
                plotWidget.setRange(x0, x1, y0, y1);
            }
        };
        if (options.ticksOutwards === true) {
            defaults.marginBottom += 8;
            defaults.marginLeft += 8;
        }

        super(obj, options);
        this.options = $.extend({}, defaults, options);
        this.obj.addClass('jagaplot-plotWidet');
        if (this.obj.css('position') == 'static') {
            this.obj.css('position', 'relative');
        }

        if (! (this.options.width > 0)) {
            this.options.width = obj.get().offsetWidth;
            if (! (this.options.width > 0)) {
                this.options.wWidth = 640;
            }
        }
        if (! (this.options.height > 0)) {
            this.options.height = obj.get().offsetHeight;
            if (! (this.options.height > 0)) {
                this.options.height = this.options.width * 0.75;
            }
        }
        
        let viewWidth = parseFloat(this.options.width);
        let viewHeight = parseFloat(this.options.height);
        let labelScaling = parseFloat(this.options.labelScaling ?? 1.0);
        if (labelScaling > 0) {
            viewWidth /= labelScaling;
            viewHeight /= labelScaling;
        }
        this.svg = $('<svg>', 'svg').attr({
            "xmlns": "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
            "version": "1.1",
            "viewBox": `0 0  ${viewWidth} ${viewHeight}`,
        });
        this.svg.attr('width', this.options.width);
        this.svg.attr('height', this.options.height);
        this.obj.append(this.svg);

        this.options.width = viewWidth;
        this.options.height = viewHeight;
        this.options.labelScaling = undefined;
        this.plot = new JGPlot(this.svg, this.options);
        this.drawables = [];
        
        if (this.options.cursorDigits > 0) {
            this._setupCursorReader();
        }
        if (this.options.rangeSelect) {
            this._setupRangeSelect();
            this._setupTouchResponse2();
        }
    }

    setCanvasSize(width, height) {
        let rx = 1, ry = 1;
        if (width) {
            rx = parseInt(width) / this.options.width;
        }
        if (height) {
            ry = parseInt(height) / this.options.height;
        }
        let r = Math.min(rx, ry);
        width = r * this.options.width;
        height = r * this.options.height;

        this.svg.attr({
            'width': width,
            'height': height
        });

        return this;
    }

    update() {
        for (let d of this.drawables) {
            if (d.type == 'Graph') {
                this.plot.drawGraph(d.obj);
            }
            else if (d.type == 'BarChart') {
                this.plot.drawBarChart(d.obj);
            }
            else if (d.type == 'Histogram') {
                this.plot.drawHistogram(d.obj);
            }
            else if (d.type == 'Histogram2d') {
                this.plot.drawHistogram2d(d.obj);
            }
            else if (d.type == 'Function') {
                this.plot.drawFunction(d.obj);
            }
        }
    }
    
    clear(removeDrawables=true) {
        if (removeDrawables) {
            this.drawables = [];
        }
        this.plot.clear();
        this.obj.attr('cursorLabel', '');
        return this;        
    }

    getRange() {
        return this.plot.getRange();
    }
    
    setRange(x0, x1, y0, y1, z0=null, z1=null, options={}) {
        this.plot.setRange(x0, x1, y0, y1, z0, z1, options);
        this.plot.drawFrame();
        this.update();
        this.obj.attr('cursorLabel', '');
        return this;
    }

    setStyle(style) {
        this.plot.setStyle(style);
        return this;
    }

    setTitle(title) {
        this.plot.setTitle(title);
        return this;
    }    

    setXTitle(title) {
        this.plot.setXTitle(title);
        return this;
    }    

    setYTitle(title) {
        this.plot.setYTitle(title);
        return this;
    }    

    setZTitle(title) {
        this.plot.setZTitle(title);
        return this;
    }
    
    setFootnote(footnote) {
        this.plot.setFootnote(footnote);
        return this;
    }    

    setXDateFormat(fmt) {
        this.plot.setXDateFormat(fmt);
        return this;
    }
    
    enableGrid(enabled=true) {
        this.plot.enableGrid(enabled);
        return this;
    }

    enableStat(enabled=true) {
        this.plot.enableStat(enabled);
        return this;
    }

    addHistogram(hist) {
        this.drawables.push({type: "Histogram", obj: hist}); // deep copy?
        this.plot.drawHistogram(hist);
        return this;
    }

    addHistogram2d(hist) {
        this.drawables.push({type: "Histogram2d", obj: hist}); // deep copy?
        this.plot.drawHistogram2d(hist);
        return this;
    }

    addGraph(graph) {
        this.drawables.push({type: "Graph", obj: graph}); // deep copy?
        this.plot.drawGraph(graph);
        return this;
    }

    addBarChart(graph) {
        this.drawables.push({type: "BarChart", obj: graph}); // deep copy?
        this.plot.drawBarChart(graph);
        return this;
    }

    addFunction(func) {
        this.drawables.push({type: "Function", obj: func}); // deep copy?
        this.plot.drawFunction(func);
        return this;
    }

    drawHistogram(hist) {
        this.plot.drawHistogram(hist);
        return this;
    }
    
    drawGraph(graph) {
        this.plot.drawGraph(graph);
        return this;
    }
    
    drawBarChart(graph) {
        this.plot.drawBarChart(graph);
        return this;
    }
    
    drawFunction(func) {
        this.plot.drawFunction(func);
        return this;
    }
    
    drawStat(stat) {
        this.plot.drawStat(stat);
        return this;
    }
    
    drawText(text) {
        this.plot.drawText(text);
        return this;
    }
    
    drawLine(line) {
        this.plot.drawLine(line);
        return this;
    }
    
    drawRectangle(rect) {
        this.plot.drawRectangle(rect);
        return this;
    }
        
    // internal methods //
    
    static _screen2CanvasXY(x, y, svg, dom) {
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
        
        let domPoint = new DOMPoint(x, y);
        domPoint = transformFromViewport(domPoint, dom);
        
        let p0 = svg.createSVGPoint();
        p0.x = domPoint.x;
        p0.y = domPoint.y;
        const p1 = p0.matrixTransform(svg.getScreenCTM().inverse());
    
        return {x: p1.x, y: p1.y}
    }
        
    _setupCursorReader() {
        const geom = this.plot.geom;
        const precision = this.options.cursorDigits;
        const frameColor = this.plot.labels.frameColor;
        let plotAreaColor = this.plot.labels.plotAreaColor;

        if (plotAreaColor.match(/rgba.*\( *[0-9\.]+, *[0-9\.]+, *[0-9\.], *[0\.]/)) { // opacity 0
            plotAreaColor = 'none';
        }
        
        let cursorLabel = $('.jagaplot-cursorLabel');
        if (cursorLabel.size() == 0) {
            cursorLabel = $('<div>').addClass('jagaplot-cursorLabel').appendTo($('body'));
            cursorLabel.css({
                'background': ((plotAreaColor ?? 'none') == 'none') ? 'white' : plotAreaColor,
                'Color': ((frameColor ?? 'none') == 'none') ? 'black' : frameColor,
                'position': 'fixed',
                'margin': 0,
                'padding': 0,
            });
        }
        this.obj.css('cursor', 'crosshair');
        this.obj.attr('cursorLabel', '');
        this.obj.bind('mouseleave', e=>cursorLabel.hide());

        let processMouseMove = (event) => {
            if (this.obj.attr('cursorLabel') == '-') {
                cursorLabel.hide();
                return;
            }

            let sx = parseInt(event.clientX);
            let sy = parseInt(event.clientY);
            let cxy = JGPlotWidget._screen2CanvasXY(sx, sy, this.svg.get(), this.obj.get());
            let x = this.plot._px(cxy.x);
            let y = this.plot._py(cxy.y);
            let dateFormat = geom.xDateFormat;

            let text = this.obj.attr('cursorLabel');
            if (text === '') {
                if (
                    (x >= geom.xmin) && (x <= geom.xmax) &&
                    (y >= geom.ymin) && (y <= geom.ymax)
                ){
                    text = '(';
                    if (dateFormat) {
                        if (dateFormat.substr(0, 4) == 'utc:') {
                            text += (new JGDateTime(x)).asUTCString(dateFormat.substr(4));
                        }
                        else {
                            text += (new JGDateTime(x)).asString(dateFormat);
                        }
                    }
                    else {
                        text += x.toPrecision(precision);
                    }
                    text += ', ' + y.toPrecision(precision) + ')';
                }
            }
            
            cursorLabel.text(text).css({
                'left': (sx+20) + 'px',
                'top': (sy-20) + 'px',
            });
            cursorLabel.show();
        }

        this.obj.bind("mousemove", processMouseMove);
    }

    _setupRangeSelect() {
        let plot = this.plot;
        let geom = this.plot.geom;

        let cursorLabel = $('.jagaplot-cursorLabel');
        if (cursorLabel.size() == 0) {
            cursorLabel = $('<div>').addClass('jagaplot-cursorLabel').appendTo($('body'));
        }
        
        let box = $('.jagaplot-rangeSelectBox');
        if (box.size() == 0) {
            box = $('<div>').addClass('jagaplot-rangeSelectBox').hide().appendTo($('body'));
            box.css({
                'position': 'fixed',
                'border': 'thin dotted black',
                'background': 'rgba(200, 200, 200, 0.5)',
            });
        }

        let x0, y0, x1, y1;

        let stopDrag = (event) => {
            this.obj.unbind('mousemove', processDrag);
            box.unbind('mousemove', processDrag);
            $(window).unbind('mouseup', stopDrag);
            event.stopPropagation();
            event.preventDefault();
            box.hide();

            let x1 = parseInt(event.clientX);
            let y1 = parseInt(event.clientY);
            if ((Math.abs(x1 - x0) > 10) || (Math.abs(y1 - y0) > 10)) {
                let cxy0 = JGPlotWidget._screen2CanvasXY(x0, y0, this.svg.get(), this.obj.get());
                let cxy1 = JGPlotWidget._screen2CanvasXY(x1, y1, this.svg.get(), this.obj.get());
                let px0 = this.plot._px(cxy0.x), py0 = this.plot._py(cxy0.y);
                let px1 = this.plot._px(cxy1.x), py1 = this.plot._py(cxy1.y);
    
                if ((Math.max(px0, px1) < geom.xmin) || (Math.abs(x1 - x0) < 20)) {
                    px0 = geom.xmin;
                    px1 = geom.xmax;
                }
                if ((Math.max(py0, py1) < geom.ymin) ||(Math.abs(y1 - y0) < 20)) {
                    py0 = geom.ymin;
                    py1 = geom.ymax;
                }
                px0 = this.plot._clip(px0, geom.xmin, geom.xmax);
                px1 = this.plot._clip(px1, geom.xmin, geom.xmax);
                py0 = this.plot._clip(py0, geom.ymin, geom.ymax);
                py1 = this.plot._clip(py1, geom.ymin, geom.ymax);

                if (this.options.rangeSelect) {
                    this.options.rangeSelect(this, px0, px1, py0, py1);
                }
            }
        }

        let processDrag = (event) => {
            x1 = parseInt(event.clientX);
            y1 = parseInt(event.clientY);

            box.css({
                'left': Math.min(x0, x1) + 'px',
                'top': Math.min(y0, y1) + 'px',
                'width': Math.abs(x1 - x0) + 'px',
                'height': Math.abs(y1 - y0) + 'px'
            });

            event.stopPropagation();
            event.preventDefault();
        }
        
        let startDrag = (event) => {
            if (event.button != 0) {
                return;
            }

            x0 = parseInt(event.clientX);
            y0 = parseInt(event.clientY);                
            x1 = x0;
            y1 = y0;
            box.css({
                'left': x0 + 'px',
                'top': y0 + 'px',
                'width': 0,
                'height': 0,
            });
            box.show();            

            $(window).bind('mouseup', stopDrag);
            this.obj.bind('mousemove', processDrag);
            box.bind('mousemove', processDrag);
            event.stopPropagation();
            event.preventDefault();
        }

        this.obj.bind('mousedown', startDrag);
    }

    _setupTouchResponse() {
        let geom = this.plot.geom;

        let updatePlot = (x0, y0, x1, y1, dx, dy, cx, cy, rx, ry, isTransient) => {
            let cxy = JGPlotWidget._screen2CanvasXY(cx, cy, this.svg.get(), this.obj.get());
            cx = cxy.x; cy = cxy.y;
            let cx0 = this.plot._cx(x0), cy0 = this.plot._cy(y0);
            let cx1 = this.plot._cx(x1), cy1 = this.plot._cy(y1);
            cx0 -= dx; cx1 -= dx;
            cy0 -= dy; cy1 -= dy;
            if (this.plot._includes(cx, cx0, cx1) && (rx > 0)) {
                rx = this.plot._clip(rx, 1.0/5, 5);
                cx0 = (cx0 - cx) / rx + cx;
                cx1 = (cx1 - cx) / rx + cx;
            }
            if (this.plot._includes(cy, cy0, cy1) && (ry > 0)) {
                ry = this.plot._clip(ry, 1.0/5, 5);
                cy0 = (cy0 - cy) / ry + cy;
                cy1 = (cy1 - cy) / ry + cy;
            }
            
            let px0 = this.plot._px(cx0), py0 = this.plot._py(cy0);
            let px1 = this.plot._px(cx1), py1 = this.plot._py(cy1);
            if (isTransient) {
                geom.xmin = Math.min(px0, px1);
                geom.xmax = Math.max(px0, px1);
                geom.ymin = Math.min(py0, py1);
                geom.ymax = Math.max(py0, py1);
                this.update();
            }
            else {
                this.setRange(px0, px1, py0, py1);
                if (this.options.rangeSelect) {
                    this.options.rangeSelect(this, px0, px1, py0, py1);
                }
            }
        }

        let x0, y0, x1, y1;
        let tx0=null, ty0=null, tx1=null, ty1=null;
        let t1x0=null, t1y0=null, t1x1=null, t1y1=null;
        let t2x0=null, t2y0=null, t2x1=null, t2y1=null;
        let dw0 = geom.width/20.0, dw1 = geom.width/10.0;
        let dh0 = geom.height/20.0, dh1 = geom.height/10.0;
        let processUpdate = (isTransient=false) => {
            let dx = tx1 - tx0, dy = ty1 - ty0;
            let cx = tx0, cy = ty0, rx = 1, ry = 1;
            if (
                (t2x0 !== null) &&
                (Math.abs(t2x0 - t1x0) > dw0) && 
                ((Math.abs(t2x0 - t1x0) > dw1) || (Math.abs(t2x1 - t1x1) > dw1))
            ){
                cx = (t1x0 + t2x0) / 2;
                rx = Math.abs(t2x1 - t1x1) / Math.abs(t2x0 - t1x0);
            }
            if (
                (t2y0 !== null) &&
                (Math.abs(t2y0 - t1y0) > dh0) && 
                ((Math.abs(t2y0 - t1y0) > dh1) || (Math.abs(t2y1 - t1y1) > dh1))
            ){
                cy = (t1y0 + t2y0) / 2;
                ry = Math.abs(t2y1 - t1y1) / Math.abs(t2y0 - t1y0);
            }
            updatePlot(x0, y0, x1, y1, dx, dy, cx, cy, rx, ry, isTransient);
        }
        
        let processStart = (event) => {
            let touches = event.touches;
            if (touches.length < 2) {
                return
            }
            event.preventDefault();
            if (tx0 === null) {
                tx0 = tx1 = parseInt(touches[0].clientX);
                ty0 = ty1 = parseInt(touches[0].clientY);
                x0 = geom.xmin; x1 = geom.xmax;
                y0 = geom.ymin; y1 = geom.ymax;
            }
            t1x0 = t1x1 = parseInt(touches[0].clientX);
            t1y0 = t1y1 = parseInt(touches[0].clientY);
            t2x0 = t2x1 = parseInt(touches[1].clientX);
            t2y0 = t2y1 = parseInt(touches[1].clientY);
        }
        let processMove = (event) => {
            if (tx0 === null) {
                return;
            }
            let touches = event.touches;
            if (touches.length < 2) {
                return;
            }
            event.preventDefault();
            t1x1 = parseInt(touches[0].clientX);
            t1y1 = parseInt(touches[0].clientY);
            t2x1 = parseInt(touches[1].clientX);
            t2y1 = parseInt(touches[1].clientY);
            processUpdate(true);
        }
        let processEnd = (event) => {
            if (tx0 === null) {
                return;
            }
            event.preventDefault();
            processUpdate();
            tx0 = ty0 = tx1 = ty1 = null;
            t1x0 = t1y0 = t1x1 = t1y1 = null;
            t2x0 = t2y0 = t2x1 = t2y1 = null;
        }
        this.obj.bind('touchstart', processStart);
        this.obj.bind('touchmove', processMove);
        this.obj.bind('touchend', processEnd);
    }



    _setupTouchResponse2() {
        let geom = this.plot.geom;
        
        // initial ranges
        let plottingarea = null;
        let x0, y0, x1, y1, cx0, cy0, cx1, cy1;
        
        // t0: touch 1, t1: touch 2; x0: start x, x1: current x
        let t0x0=null, t0y0=null, t0x1=null, t0y1=null;  
        let t1x0=null, t1y0=null, t1x1=null, t1y1=null;
        
        let transientPlot = (dx, dy, rx, ry, ox, oy) => {
            let co = JGPlotWidget._screen2CanvasXY(ox, oy, this.svg.get(), this.obj.get());
            let cox = co.x - dx, coy = co.y - dy;
            plottingarea.attr({
                'transform-origin': `${cox} ${coy}`,
                'transform': `scale(${rx},${ry})translate(${dx},${dy})`,
            });
        }

        let updatePlot = (dx, dy, rx, ry, ox, oy) => {
            plottingarea.attr({'transform': undefined});
            let cx0b = cx0 - dx, cx1b = cx1 - dx;
            let cy0b = cy0 - dy, cy1b = cy1 - dy;

            if ((rx != 1) || (ry != 1)) {
                let co = JGPlotWidget._screen2CanvasXY(ox, oy, this.svg.get(), this.obj.get());
                let cox = co.x - dx, coy = co.y - dy;
                if (rx > 0) {
                    cx0b = (cx0b - cox) / rx + cox;
                    cx1b = (cx1b - cox) / rx + cox;
                }
                if (ry > 0) {
                    cy0b = (cy0b - coy) / ry + coy;
                    cy1b = (cy1b - coy) / ry + coy;
                }
            }
            
            const px0 = this.plot._px(cx0b), py0 = this.plot._py(cy0b);
            const px1 = this.plot._px(cx1b), py1 = this.plot._py(cy1b);
            const xmin = Math.min(px0, px1), xmax = Math.max(px0, px1);
            const ymin = Math.min(py0, py1), ymax = Math.max(py0, py1);
            this.setRange(xmin, xmax, ymin, ymax);
            if (this.options.rangeSelect) {
                this.options.rangeSelect(this, xmin, xmax, ymin, ymax);
            }
        }

        let processUpdate = (isTransient=false) => {
            const t0dx = t0x1 - t0x0;
            const t1dx = t1x1 - t1x0;
            const t0dy = t0y1 - t0y0;
            const t1dy = t1y1 - t1y0; 

            // translation: (dx, dy)
            let dx = 0, dy = 0;
            if (t0dx * t1dx > 0) {
                dx = (Math.abs(t0dx) < Math.abs(t1dx)) ? t0dx : t1dx;
            }
            if (t0dy * t1dy > 0) {
                dy = (Math.abs(t0dy) < Math.abs(t1dy)) ? t0dy : t1dy;
            }
            
            // scaling: factor (rx, ry), origin (ox, oy)
            const d0 = Math.sqrt((t1x0-t0x0)**2 + (t1y0-t0y0)**2);   // distance between touches, before
            const d1 = Math.sqrt((t1x1-t0x1)**2 + (t1y1-t0y1)**2);   // distance between touches, after
            let rx = 1, ry = 1, ox = t0x0, oy = t0y0;
            if (Math.abs(d1 - d0) > 0.1 * d0) {
                let r = d1 / d0; if (r > 10) r = 10; if (r < 0.1) r = 0.1;
                let theta = 0;
                if (d1 > d0) {
                    theta = Math.atan2(Math.abs(t1y1-t0y1), Math.abs(t1x1-t0x1));
                }
                else {
                    theta = Math.atan2(Math.abs(t1y0-t0y0), Math.abs(t1x0-t0x0));
                }
                theta *= 180 / 3.141592;
                if ((theta >= 30) && (theta < 60)) {
                    r *= 0.707;
                }
                if (theta < 60) {
                    rx = r;
                    ox = (t0x0 * Math.abs(t1dx) + t1x0 * Math.abs(t0dx)) / (Math.abs(t0dx) + Math.abs(t1dx));
                }
                if (theta > 30) {
                    ry = r;
                    oy = (t0y0 * Math.abs(t1dy) + t1y0 * Math.abs(t0dy)) / (Math.abs(t0dy) + Math.abs(t1dy));
                }
            }

            if (isTransient) {
                transientPlot(dx, dy, rx, ry, ox, oy);
            }
            else {
                updatePlot(dx, dy, rx, ry, ox, oy);
            }
        }
        
        let processStart = (event) => {
            let touches = event.touches;
            if (touches.length < 2) {
                return;
            }
            if (plottingarea !== null) {
                return;
            }
            if (! this.plot.frame || this.plot.frame.find('.jagaplot-plottingarea').size() != 1) {
                return;
            }
            plottingarea = this.plot.frame.find('.jagaplot-plottingarea');
            event.preventDefault();
            x0 = geom.xmin; x1 = geom.xmax;
            y0 = geom.ymin; y1 = geom.ymax;
            cx0 = this.plot._cx(x0); cy0 = this.plot._cy(y0);
            cx1 = this.plot._cx(x1); cy1 = this.plot._cy(y1);
            t0x0 = t0x1 = parseInt(touches[0].clientX);
            t0y0 = t0y1 = parseInt(touches[0].clientY);
            t1x0 = t1x1 = parseInt(touches[1].clientX);
            t1y0 = t1y1 = parseInt(touches[1].clientY);
        }
        let processMove = (event) => {
            if (plottingarea === null) {
                return;
            }
            let touches = event.touches;
            if (touches.length < 2) {
                return;
            }
            event.preventDefault();
            t0x1 = parseInt(touches[0].clientX);
            t0y1 = parseInt(touches[0].clientY);
            t1x1 = parseInt(touches[1].clientX);
            t1y1 = parseInt(touches[1].clientY);
            processUpdate(true);
        }
        let processEnd = (event) => {
            if (plottingarea === null) {
                return;
            }
            event.preventDefault();
            processUpdate(false);
            plottingarea = null;
            t0x0 = t0y0 = t0x1 = t0y1 = null;
            t1x0 = t1y0 = t1x1 = t1y1 = null;
        }
        this.obj.bind('touchstart', processStart);
        this.obj.bind('touchmove', processMove);
        this.obj.bind('touchend', processEnd);
    }
};
