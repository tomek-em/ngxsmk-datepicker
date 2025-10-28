import * as i0 from '@angular/core';
import { EventEmitter, inject, ElementRef, HostListener, ViewChildren, ViewChild, Output, Input, Component, ChangeDetectorRef, forwardRef, HostBinding, ChangeDetectionStrategy } from '@angular/core';
import * as i1 from '@angular/common';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Date utility functions for ngxsmk-datepicker
 * Extracted to improve tree-shaking and reduce bundle size
 */
function getStartOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function getEndOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function addMonths(d, months) {
    const newDate = new Date(d);
    newDate.setMonth(d.getMonth() + months);
    return newDate;
}
function subtractDays(d, days) {
    const newDate = new Date(d);
    newDate.setDate(d.getDate() - days);
    return newDate;
}
function getStartOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function getEndOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function isSameDay(d1, d2) {
    if (!d1 || !d2)
        return false;
    return (d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate());
}
function normalizeDate(date) {
    if (!date)
        return null;
    const d = (date instanceof Date) ? new Date(date.getTime()) : new Date(date.toDate ? date.toDate() : date);
    if (isNaN(d.getTime()))
        return null;
    return d;
}

/**
 * Calendar utility functions for ngxsmk-datepicker
 * Optimized for performance and tree-shaking
 */
/**
 * Generate month options for dropdown
 */
function generateMonthOptions(locale, year) {
    return Array.from({ length: 12 }).map((_, i) => ({
        label: new Date(year, i, 1).toLocaleDateString(locale, { month: 'long' }),
        value: i,
    }));
}
/**
 * Generate year options for dropdown
 */
function generateYearOptions(currentYear, range = 10) {
    const startYear = currentYear - range;
    const endYear = currentYear + range;
    const options = [];
    for (let i = startYear; i <= endYear; i++) {
        options.push({ label: `${i}`, value: i });
    }
    return options;
}
/**
 * Generate time options for hour/minute dropdowns
 */
function generateTimeOptions(minuteInterval = 1) {
    const hourOptions = Array.from({ length: 12 }).map((_, i) => ({
        label: (i + 1).toString().padStart(2, '0'),
        value: i + 1,
    }));
    const minuteOptions = [];
    for (let i = 0; i < 60; i += minuteInterval) {
        minuteOptions.push({
            label: i.toString().padStart(2, '0'),
            value: i,
        });
    }
    return { hourOptions, minuteOptions };
}
/**
 * Generate week days for calendar header
 */
function generateWeekDays(locale, firstDayOfWeek = 0) {
    const day = new Date(2024, 0, 7 + firstDayOfWeek);
    return Array.from({ length: 7 }).map(() => {
        const weekDay = new Date(day).toLocaleDateString(locale, { weekday: 'short' });
        day.setDate(day.getDate() + 1);
        return weekDay;
    });
}
/**
 * Get first day of week for locale
 */
function getFirstDayOfWeek(locale) {
    try {
        return (new Intl.Locale(locale).weekInfo?.firstDay || 0) % 7;
    }
    catch (e) {
        return 0;
    }
}
/**
 * Convert 12-hour to 24-hour format
 */
function get24Hour(displayHour, isPm) {
    if (isPm) {
        return displayHour === 12 ? 12 : displayHour + 12;
    }
    return displayHour === 12 ? 0 : displayHour;
}
/**
 * Convert 24-hour to 12-hour format
 */
function update12HourState(fullHour) {
    return {
        isPm: fullHour >= 12,
        displayHour: fullHour % 12 || 12
    };
}
/**
 * Process date ranges input
 */
function processDateRanges(ranges) {
    if (!ranges)
        return null;
    return Object.entries(ranges).reduce((acc, [key, dates]) => {
        const start = normalizeDate(dates[0]);
        const end = normalizeDate(dates[1]);
        if (start && end)
            acc[key] = [start, end];
        return acc;
    }, {});
}

class CustomSelectComponent {
    constructor(cdr) {
        this.cdr = cdr;
        this.options = [];
        this.disabled = false;
        this.valueChange = new EventEmitter();
        this.isOpen = false;
        this.elementRef = inject(ElementRef);
    }
    onDocumentClick(event) {
        if (!this.elementRef.nativeElement.contains(event.target))
            this.isOpen = false;
    }
    ngAfterViewInit() {
        // If the list re-renders (e.g., options arrive async), re-center.
        this.optionEls.changes.subscribe(() => {
            if (this.isOpen)
                this.centerSelected();
        });
    }
    ngOnChanges(ch) {
        // When opening, wait for the DOM to actually render, then center.
        if (ch['isOpen']?.currentValue === true) {
            // Flush this CD cycle to ensure @if/@for content is in the DOM
            this.cdr.detectChanges();
            // Queue to the next macro-task to be 100% sure
            setTimeout(() => this.centerSelected());
        }
        // Also recenter if the selected value changes while open
        if (this.isOpen && ch['value'] && !ch['value'].firstChange) {
            // allow DOM/class to update first
            setTimeout(() => this.centerSelected());
        }
    }
    centerSelected() {
        const panel = this.panelRef?.nativeElement;
        if (!panel)
            return;
        // Find the selected LI within the current list
        const selected = panel.querySelector('li.selected');
        if (!selected)
            return;
        // Precise centering
        const target = selected.offsetTop - (panel.clientHeight / 2 - selected.offsetHeight / 2);
        panel.scrollTo({ top: Math.max(0, target), behavior: 'auto' });
        // Optional: focus panel for keyboard nav
        // panel.focus();
    }
    get displayValue() {
        const selectedOption = this.options.find((opt) => opt.value === this.value);
        return selectedOption ? selectedOption.label : '';
    }
    toggleDropdown() {
        if (this.disabled)
            return;
        this.isOpen = !this.isOpen;
    }
    selectOption(option) {
        this.value = option.value;
        this.valueChange.emit(this.value);
        this.isOpen = false;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.6", ngImport: i0, type: CustomSelectComponent, deps: [{ token: i0.ChangeDetectorRef }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.3.6", type: CustomSelectComponent, isStandalone: true, selector: "ngxsmk-custom-select", inputs: { options: "options", value: "value", disabled: "disabled" }, outputs: { valueChange: "valueChange" }, host: { listeners: { "document:click": "onDocumentClick($event)" } }, viewQueries: [{ propertyName: "panelRef", first: true, predicate: ["panel"], descendants: true }, { propertyName: "optionEls", predicate: ["opt"], descendants: true }], usesOnChanges: true, ngImport: i0, template: `
    <div class="ngxsmk-select-container" (click)="toggleDropdown()">
      <button type="button" class="ngxsmk-select-display" [disabled]="disabled">
        <span>{{ displayValue }}</span>
        <svg class="ngxsmk-arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48"
                d="M112 184l144 144 144-144"/>
        </svg>
      </button>
      @if (isOpen) {
        <div #panel class="ngxsmk-options-panel">
          <ul>
            @for (option of options; track option.value) {
              <li #opt 
                [class.selected]="option.value === value" 
                (click)="selectOption(option); $event.stopPropagation()">
                {{ option.label }}
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `, isInline: true, styles: [":host{position:relative;display:inline-block}.ngxsmk-select-container{cursor:pointer}.ngxsmk-select-display{display:flex;align-items:center;justify-content:space-between;width:var(--custom-select-width, 115px);background:var(--datepicker-background, #fff);border:1px solid var(--datepicker-border-color, #ccc);color:var(--datepicker-text-color, #333);border-radius:4px;padding:4px 8px;font-size:14px;text-align:left;height:30px}.ngxsmk-select-display:disabled{background-color:var(--datepicker-hover-background, #f0f0f0);cursor:not-allowed;opacity:.7}.ngxsmk-arrow-icon{width:12px;height:12px;margin-left:8px}.ngxsmk-options-panel{position:absolute;top:110%;left:0;width:100%;background:var(--datepicker-background, #fff);border:1px solid var(--datepicker-border-color, #ccc);color:var(--datepicker-text-color, #333);border-radius:4px;box-shadow:0 4px 8px #0000001a;max-height:200px;overflow-y:auto;z-index:9999}.ngxsmk-options-panel ul{list-style:none;padding:4px;margin:0}.ngxsmk-options-panel li{padding:8px 12px;border-radius:4px;cursor:pointer}.ngxsmk-options-panel li:hover{background-color:var(--datepicker-hover-background, #f0f0f0)}.ngxsmk-options-panel li.selected{background-color:var(--datepicker-primary-color, #3880ff);color:var(--datepicker-primary-contrast, #fff)}\n"], dependencies: [{ kind: "ngmodule", type: CommonModule }] }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.6", ngImport: i0, type: CustomSelectComponent, decorators: [{
            type: Component,
            args: [{ selector: 'ngxsmk-custom-select', standalone: true, imports: [CommonModule], template: `
    <div class="ngxsmk-select-container" (click)="toggleDropdown()">
      <button type="button" class="ngxsmk-select-display" [disabled]="disabled">
        <span>{{ displayValue }}</span>
        <svg class="ngxsmk-arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48"
                d="M112 184l144 144 144-144"/>
        </svg>
      </button>
      @if (isOpen) {
        <div #panel class="ngxsmk-options-panel">
          <ul>
            @for (option of options; track option.value) {
              <li #opt 
                [class.selected]="option.value === value" 
                (click)="selectOption(option); $event.stopPropagation()">
                {{ option.label }}
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `, styles: [":host{position:relative;display:inline-block}.ngxsmk-select-container{cursor:pointer}.ngxsmk-select-display{display:flex;align-items:center;justify-content:space-between;width:var(--custom-select-width, 115px);background:var(--datepicker-background, #fff);border:1px solid var(--datepicker-border-color, #ccc);color:var(--datepicker-text-color, #333);border-radius:4px;padding:4px 8px;font-size:14px;text-align:left;height:30px}.ngxsmk-select-display:disabled{background-color:var(--datepicker-hover-background, #f0f0f0);cursor:not-allowed;opacity:.7}.ngxsmk-arrow-icon{width:12px;height:12px;margin-left:8px}.ngxsmk-options-panel{position:absolute;top:110%;left:0;width:100%;background:var(--datepicker-background, #fff);border:1px solid var(--datepicker-border-color, #ccc);color:var(--datepicker-text-color, #333);border-radius:4px;box-shadow:0 4px 8px #0000001a;max-height:200px;overflow-y:auto;z-index:9999}.ngxsmk-options-panel ul{list-style:none;padding:4px;margin:0}.ngxsmk-options-panel li{padding:8px 12px;border-radius:4px;cursor:pointer}.ngxsmk-options-panel li:hover{background-color:var(--datepicker-hover-background, #f0f0f0)}.ngxsmk-options-panel li.selected{background-color:var(--datepicker-primary-color, #3880ff);color:var(--datepicker-primary-contrast, #fff)}\n"] }]
        }], ctorParameters: () => [{ type: i0.ChangeDetectorRef }], propDecorators: { options: [{
                type: Input
            }], value: [{
                type: Input
            }], disabled: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], panelRef: [{
                type: ViewChild,
                args: ['panel']
            }], optionEls: [{
                type: ViewChildren,
                args: ['opt']
            }], onDocumentClick: [{
                type: HostListener,
                args: ['document:click', ['$event']]
            }] } });

/**
 * Performance utilities for ngxsmk-datepicker
 * Optimized for better runtime performance
 */
/**
 * Memoization decorator for expensive computations
 */
function memoize(fn, keyGenerator) {
    const cache = new Map();
    return ((...args) => {
        const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    });
}
/**
 * Debounce function for performance optimization
 */
function debounce(func, wait) {
    let timeout = null;
    return (...args) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = window.setTimeout(() => {
            func(...args);
        }, wait);
    };
}
/**
 * Throttle function for performance optimization
 */
function throttle(func, limit) {
    let inThrottle = false;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            window.setTimeout(() => (inThrottle = false), limit);
        }
    };
}
/**
 * Create a shallow comparison function for objects
 */
function shallowEqual(a, b) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
        return false;
    }
    for (const key of keysA) {
        if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}
/**
 * Optimized date comparison for calendar rendering
 */
function createDateComparator() {
    const cache = new Map();
    const MAX_CACHE_SIZE = 1000; // Prevent memory leaks
    return (date1, date2) => {
        if (!date1 || !date2)
            return date1 === date2;
        const key = `${date1.getTime()}-${date2.getTime()}`;
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = (date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate());
        // Prevent cache from growing too large
        if (cache.size >= MAX_CACHE_SIZE) {
            const firstKey = cache.keys().next().value;
            if (firstKey !== undefined) {
                cache.delete(firstKey);
            }
        }
        cache.set(key, result);
        return result;
    };
}
/**
 * Optimized array filtering with caching
 */
function createFilteredArray(source, filterFn, cacheKey) {
    const cache = new Map();
    const key = cacheKey || JSON.stringify(source);
    if (cache.has(key)) {
        return cache.get(key);
    }
    const result = source.filter(filterFn);
    cache.set(key, result);
    return result;
}
/**
 * Clear all caches to prevent memory leaks
 */
function clearAllCaches() {
    // This would be called from the component's ngOnDestroy
    // Implementation depends on how caches are managed globally
}

class NgxsmkDatepickerComponent {
    constructor() {
        this.mode = 'single';
        this.isInvalidDate = () => false;
        this.showRanges = true;
        this.showTime = false;
        this.minuteInterval = 1;
        // 24h mode: if true show 00-23 hours and hide AM/PM selector
        this.use24hTimeFormat = false;
        // When true (default), popover auto-closes once a full selection is made.
        // Set to false to keep picker open after selecting a date/time.
        this.autoCloseOnSelect = true;
        // NEW: Holiday Provider Inputs
        this.holidayProvider = null;
        this.disableHolidays = false;
        // NEW: Disabled Dates Input
        this.disabledDates = [];
        // Popover/Input Mode
        this.placeholder = 'Select Date';
        this.inline = false;
        this.isCalendarOpen = false;
        this._internalValue = null;
        this._startAtDate = null;
        this._locale = 'en-US';
        this.theme = 'light';
        this.onChange = (_) => { };
        this.onTouched = () => { };
        this.disabled = false;
        this.valueChange = new EventEmitter();
        this.action = new EventEmitter();
        this._minDate = null;
        this._maxDate = null;
        this._ranges = null;
        this.currentDate = new Date();
        this.daysInMonth = [];
        this.weekDays = [];
        this.today = getStartOfDay(new Date());
        this.selectedDate = null;
        this.selectedDates = [];
        this.startDate = null;
        this.endDate = null;
        this.hoveredDate = null;
        this.rangesArray = [];
        this._currentMonth = this.currentDate.getMonth();
        this._currentYear = this.currentDate.getFullYear();
        this.monthOptions = [];
        this.yearOptions = [];
        this.firstDayOfWeek = 0;
        this.currentHour = 0;
        this.currentMinute = 0;
        this.currentDisplayHour = 12;
        this.isPm = false;
        this.hourOptions = [];
        this.minuteOptions = [];
        this.ampmOptions = [
            { label: 'AM', value: false },
            { label: 'PM', value: true }
        ];
        // Animation state properties
        this.elementRef = inject(ElementRef);
        this.cdr = inject(ChangeDetectorRef);
        this.dateComparator = createDateComparator();
    }
    set startAt(value) { this._startAtDate = this._normalizeDate(value); }
    set locale(value) { this._locale = value; }
    get locale() { return this._locale; }
    get isDarkMode() { return this.theme === 'dark'; }
    set disabledState(isDisabled) { this.disabled = isDisabled; }
    set minDate(value) { this._minDate = this._normalizeDate(value); }
    set maxDate(value) { this._maxDate = this._normalizeDate(value); }
    set ranges(value) {
        this._ranges = processDateRanges(value);
        this.updateRangesArray();
    }
    get isInlineMode() {
        return this.inline === true || this.inline === 'always' ||
            (this.inline === 'auto' && typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches);
    }
    get isCalendarVisible() {
        return this.isInlineMode || this.isCalendarOpen;
    }
    get displayValue() {
        if (this.mode === 'single' && this.selectedDate) {
            const options = {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            };
            if (this.showTime) {
                options.hour = '2-digit';
                options.minute = '2-digit';
            }
            return this.selectedDate.toLocaleString(this.locale, options);
        }
        else if (this.mode === 'range' && this.startDate && this.endDate) {
            const options = {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            };
            const start = this.startDate.toLocaleString(this.locale, options);
            const end = this.endDate.toLocaleString(this.locale, options);
            return `${start} - ${end}`;
        }
        else if (this.mode === 'multiple' && this.selectedDates.length > 0) {
            return `${this.selectedDates.length} dates selected`;
        }
        return '';
    }
    get isBackArrowDisabled() {
        if (!this._minDate)
            return false;
        // Get the first day of the current month
        const firstDayOfCurrentMonth = new Date(this.currentYear, this.currentMonth, 1);
        // Check if the first day of current month is before or equal to minDate
        return firstDayOfCurrentMonth <= this._minDate;
    }
    // Optimized getters for template performance
    get isCurrentMonthMemo() {
        return (day) => {
            if (!day)
                return false;
            return day.getMonth() === this._currentMonth && day.getFullYear() === this._currentYear;
        };
    }
    get isDateDisabledMemo() {
        return (day) => {
            if (!day)
                return false;
            return this.isDateDisabled(day);
        };
    }
    get isSameDayMemo() {
        return (d1, d2) => this.dateComparator(d1, d2);
    }
    get isHolidayMemo() {
        return (day) => {
            if (!day || !this.holidayProvider)
                return false;
            const dateOnly = getStartOfDay(day);
            return this.holidayProvider.isHoliday(dateOnly);
        };
    }
    get getHolidayLabelMemo() {
        return (day) => {
            if (!day || !this.holidayProvider || !this.isHolidayMemo(day))
                return null;
            return this.holidayProvider.getHolidayLabel ? this.holidayProvider.getHolidayLabel(getStartOfDay(day)) : 'Holiday';
        };
    }
    // TrackBy functions for better performance
    trackByDay(index, day) {
        return day ? day.getTime().toString() : `empty-${index}`;
    }
    trackByRange(_index, range) {
        return range.key;
    }
    onDocumentClick(event) {
        if (!this.isInlineMode && this.isCalendarOpen && !this.elementRef.nativeElement.contains(event.target)) {
            this.isCalendarOpen = false;
            this.cdr.markForCheck();
        }
    }
    writeValue(val) {
        this._internalValue = val;
        this.initializeValue(val);
        this.generateCalendar();
    }
    registerOnChange(fn) {
        this.onChange = fn;
    }
    registerOnTouched(fn) {
        this.onTouched = fn;
    }
    setDisabledState(isDisabled) {
        this.disabled = isDisabled;
    }
    emitValue(val) {
        this._internalValue = val;
        this.valueChange.emit(val);
        this.onChange(val);
        this.onTouched();
        // Auto-close popover when a selection is complete
        if (this.autoCloseOnSelect && !this.isInlineMode && val !== null) {
            const selectionComplete = this.mode === 'single' || (this.mode === 'range' && this.startDate && this.endDate) || (this.mode === 'multiple');
            if (selectionComplete) {
                this.isCalendarOpen = false;
            }
        }
    }
    toggleCalendar() {
        if (this.disabled || this.isInlineMode)
            return;
        this.isCalendarOpen = !this.isCalendarOpen;
        this.cdr.markForCheck();
    }
    clearValue(event) {
        if (event)
            event.stopPropagation();
        if (this.disabled)
            return;
        this.selectedDate = null;
        this.selectedDates = [];
        this.startDate = null;
        this.endDate = null;
        this.hoveredDate = null;
        this.isCalendarOpen = false;
        this.emitValue(null);
        this.action.emit({ type: 'clear', payload: null });
        // Reset view to today after clearing
        this.currentDate = new Date();
        this._currentMonth = this.currentDate.getMonth();
        this._currentYear = this.currentDate.getFullYear();
        this.generateCalendar();
        this.cdr.markForCheck();
    }
    get currentMonth() { return this._currentMonth; }
    set currentMonth(month) {
        if (this.disabled)
            return;
        if (this._currentMonth !== month) {
            this._currentMonth = month;
            this.currentDate.setMonth(month);
            this.generateCalendar();
            this.cdr.markForCheck();
        }
    }
    get currentYear() { return this._currentYear; }
    set currentYear(year) {
        if (this.disabled)
            return;
        if (this._currentYear !== year) {
            this._currentYear = year;
            this.currentDate.setFullYear(year);
            this.generateCalendar();
            this.cdr.markForCheck();
        }
    }
    ngOnInit() {
        if (this._locale === 'en-US' && typeof navigator !== 'undefined') {
            this._locale = navigator.language;
        }
        this.today.setHours(0, 0, 0, 0);
        this.generateLocaleData();
        this.generateTimeOptions();
        if (this.showTime && !this._internalValue) {
            const now = new Date();
            this.currentHour = now.getHours();
            this.currentMinute = Math.floor(now.getMinutes() / this.minuteInterval) * this.minuteInterval;
            if (this.currentMinute === 60) {
                this.currentMinute = 0;
                this.currentHour = (this.currentHour + 1) % 24;
            }
            this.update12HourState(this.currentHour);
        }
        if (this._internalValue) {
            this.initializeValue(this._internalValue);
        }
        else {
            this.initializeValue(null);
        }
        this.generateCalendar();
    }
    ngOnChanges(changes) {
        if (changes['locale']) {
            this.generateLocaleData();
            this.generateCalendar();
        }
        if (changes['minuteInterval']) {
            this.generateTimeOptions();
            this.currentMinute = Math.floor(this.currentMinute / this.minuteInterval) * this.minuteInterval;
            this.onTimeChange();
        }
        if (changes['value'] && changes['value'].currentValue !== changes['value'].previousValue) {
            this.writeValue(changes['value'].currentValue);
        }
        // Rerun calendar generation if provider changes to refresh disabled states
        if (changes['holidayProvider'] || changes['disableHolidays'] || changes['disabledDates']) {
            this.generateCalendar();
        }
        if (changes['startAt']) {
            if (!this._internalValue && this._startAtDate) {
                this.currentDate = new Date(this._startAtDate);
                this._currentMonth = this.currentDate.getMonth();
                this._currentYear = this.currentDate.getFullYear();
                this.generateCalendar();
            }
        }
        // Handle minDate changes - if minDate is set and is in the future, 
        // and we don't have a current value, update the view to show minDate's month
        if (changes['minDate'] && !this._internalValue) {
            if (this._minDate) {
                const today = new Date();
                const minDateOnly = getStartOfDay(this._minDate);
                const todayOnly = getStartOfDay(today);
                // If minDate is in the future, update the view to show minDate's month
                if (minDateOnly.getTime() > todayOnly.getTime()) {
                    this.currentDate = new Date(this._minDate);
                    this._currentMonth = this.currentDate.getMonth();
                    this._currentYear = this.currentDate.getFullYear();
                    this.generateCalendar();
                }
            }
        }
    }
    get24Hour(displayHour, isPm) {
        if (this.use24hTimeFormat)
            return displayHour; // already 0-23
        return get24Hour(displayHour, isPm);
    }
    update12HourState(fullHour) {
        if (this.use24hTimeFormat) {
            this.currentDisplayHour = fullHour;
            this.isPm = fullHour >= 12;
        }
        else {
            const state = update12HourState(fullHour);
            this.isPm = state.isPm;
            this.currentDisplayHour = state.displayHour;
        }
    }
    applyCurrentTime(date) {
        this.currentHour = this.get24Hour(this.currentDisplayHour, this.isPm);
        date.setHours(this.currentHour, this.currentMinute, 0, 0);
        return date;
    }
    initializeValue(value) {
        let initialDate = null;
        this.selectedDate = null;
        this.startDate = null;
        this.endDate = null;
        this.selectedDates = [];
        if (value) {
            if (this.mode === 'single' && value instanceof Date) {
                this.selectedDate = this._normalizeDate(value);
                initialDate = this.selectedDate;
            }
            else if (this.mode === 'range' && typeof value === 'object' && 'start' in value && 'end' in value) {
                this.startDate = this._normalizeDate(value.start);
                this.endDate = this._normalizeDate(value.end);
                initialDate = this.startDate;
            }
            else if (this.mode === 'multiple' && Array.isArray(value)) {
                this.selectedDates = value.map(d => this._normalizeDate(d)).filter((d) => d !== null);
                initialDate = this.selectedDates.length > 0 ? this.selectedDates[this.selectedDates.length - 1] : null;
            }
        }
        // Determine the initial view date
        let viewCenterDate = initialDate || this._startAtDate;
        // If no specific date is set and minDate is in the future, use minDate's month
        if (!viewCenterDate && this._minDate) {
            const today = new Date();
            const minDateOnly = getStartOfDay(this._minDate);
            const todayOnly = getStartOfDay(today);
            // If minDate is in the future, use minDate as the initial view
            if (minDateOnly.getTime() > todayOnly.getTime()) {
                viewCenterDate = this._minDate;
            }
        }
        // Fallback to current date if no other date is determined
        if (!viewCenterDate) {
            viewCenterDate = new Date();
        }
        if (viewCenterDate) {
            this.currentDate = new Date(viewCenterDate);
            this._currentMonth = viewCenterDate.getMonth();
            this._currentYear = viewCenterDate.getFullYear();
            this.currentHour = viewCenterDate.getHours();
            this.currentMinute = viewCenterDate.getMinutes();
            this.update12HourState(this.currentHour);
            this.currentMinute = Math.floor(this.currentMinute / this.minuteInterval) * this.minuteInterval;
        }
    }
    _normalizeDate(date) {
        return normalizeDate(date);
    }
    parseDateString(dateString) {
        try {
            // Handle MM/DD/YYYY format
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return null;
            }
            return getStartOfDay(date);
        }
        catch (error) {
            return null;
        }
    }
    generateTimeOptions() {
        if (this.use24hTimeFormat) {
            this.hourOptions = Array.from({ length: 24 }).map((_, i) => ({
                label: i.toString().padStart(2, '0'),
                value: i
            }));
        }
        else {
            const { hourOptions } = generateTimeOptions(this.minuteInterval); // 1-12
            this.hourOptions = hourOptions;
        }
        const { minuteOptions } = generateTimeOptions(this.minuteInterval);
        this.minuteOptions = minuteOptions;
    }
    generateLocaleData() {
        const year = new Date().getFullYear();
        this.monthOptions = generateMonthOptions(this.locale, year);
        this.firstDayOfWeek = getFirstDayOfWeek(this.locale);
        this.weekDays = generateWeekDays(this.locale, this.firstDayOfWeek);
    }
    updateRangesArray() {
        this.rangesArray = this._ranges ? Object.entries(this._ranges).map(([key, value]) => ({ key, value })) : [];
    }
    selectRange(range) {
        if (this.disabled)
            return;
        this.startDate = this.applyCurrentTime(range[0]);
        this.endDate = this.applyCurrentTime(range[1]);
        if (this.startDate && this.endDate) {
            this.emitValue({ start: this.startDate, end: this.endDate });
        }
        this.currentDate = new Date(this.startDate);
        this.initializeValue({ start: this.startDate, end: this.endDate });
        this.generateCalendar();
        this.action.emit({ type: 'rangeSelected', payload: { start: this.startDate, end: this.endDate, key: this.rangesArray.find(r => r.value === range)?.key } });
        this.cdr.markForCheck();
    }
    // NEW: Check if a date is a holiday
    isHoliday(date) {
        if (!date || !this.holidayProvider)
            return false;
        const dateOnly = getStartOfDay(date);
        return this.holidayProvider.isHoliday(dateOnly);
    }
    // NEW: Get holiday label
    getHolidayLabel(date) {
        if (!date || !this.holidayProvider || !this.isHoliday(date))
            return null;
        return this.holidayProvider.getHolidayLabel ? this.holidayProvider.getHolidayLabel(getStartOfDay(date)) : 'Holiday';
    }
    isDateDisabled(date) {
        if (!date)
            return false;
        const dateOnly = getStartOfDay(date);
        // 1. Check disabled dates array
        if (this.disabledDates.length > 0) {
            for (const disabledDate of this.disabledDates) {
                let parsedDate;
                if (typeof disabledDate === 'string') {
                    parsedDate = this.parseDateString(disabledDate);
                }
                else {
                    parsedDate = getStartOfDay(disabledDate);
                }
                if (parsedDate && dateOnly.getTime() === parsedDate.getTime()) {
                    return true;
                }
            }
        }
        // 2. Check holiday provider for disabling
        if (this.holidayProvider && this.disableHolidays && this.holidayProvider.isHoliday(dateOnly)) {
            return true;
        }
        // 3. Check min/max date
        if (this._minDate) {
            const minDateOnly = getStartOfDay(this._minDate);
            if (dateOnly.getTime() < minDateOnly.getTime())
                return true;
        }
        if (this._maxDate) {
            const maxDateOnly = getStartOfDay(this._maxDate);
            if (dateOnly.getTime() > maxDateOnly.getTime())
                return true;
        }
        // 4. Check custom invalid date function
        return this.isInvalidDate(date);
    }
    isMultipleSelected(d) {
        if (!d || this.mode !== 'multiple')
            return false;
        const dTime = getStartOfDay(d).getTime();
        return this.selectedDates.some(selected => getStartOfDay(selected).getTime() === dTime);
    }
    onTimeChange() {
        if (this.disabled)
            return;
        if (this.mode === 'single' && this.selectedDate) {
            this.selectedDate = this.applyCurrentTime(this.selectedDate);
            this.emitValue(this.selectedDate);
        }
        else if (this.mode === 'range' && this.startDate && this.endDate) {
            this.startDate = this.applyCurrentTime(this.startDate);
            this.endDate = this.applyCurrentTime(this.endDate);
            this.emitValue({ start: this.startDate, end: this.endDate });
        }
        else if (this.mode === 'range' && this.startDate && !this.endDate) {
            this.startDate = this.applyCurrentTime(this.startDate);
        }
        else if (this.mode === 'multiple') {
            this.selectedDates = this.selectedDates.map(date => {
                const newDate = getStartOfDay(date);
                return this.applyCurrentTime(newDate);
            });
            this.emitValue([...this.selectedDates]);
        }
        this.action.emit({ type: 'timeChanged', payload: { hour: this.currentHour, minute: this.currentMinute } });
        this.cdr.markForCheck();
    }
    onDateClick(day) {
        if (!day || this.disabled)
            return;
        // Only check isDateDisabled for current month days
        if (this.isCurrentMonth(day) && this.isDateDisabled(day))
            return;
        const dateToToggle = getStartOfDay(day);
        if (this.mode === 'single') {
            this.selectedDate = this.applyCurrentTime(day);
            this.emitValue(this.selectedDate);
        }
        else if (this.mode === 'range') {
            if (!this.startDate || (this.startDate && this.endDate)) {
                this.startDate = this.applyCurrentTime(day);
                this.endDate = null;
            }
            else if (day && this.startDate && day >= this.startDate) {
                this.endDate = this.applyCurrentTime(day);
                this.emitValue({ start: this.startDate, end: this.endDate });
            }
            else {
                this.startDate = this.applyCurrentTime(day);
                this.endDate = null;
            }
            this.hoveredDate = null;
        }
        else if (this.mode === 'multiple') {
            const existingIndex = this.selectedDates.findIndex(d => this.isSameDay(d, dateToToggle));
            if (existingIndex > -1) {
                this.selectedDates.splice(existingIndex, 1);
            }
            else {
                const dateWithTime = this.applyCurrentTime(dateToToggle);
                this.selectedDates.push(dateWithTime);
                this.selectedDates.sort((a, b) => a.getTime() - b.getTime());
            }
            this.emitValue([...this.selectedDates]);
        }
        const dateToSync = this.mode === 'single' ? this.selectedDate :
            this.mode === 'range' ? this.startDate :
                this.mode === 'multiple' && this.selectedDates.length > 0 ? this.selectedDates[this.selectedDates.length - 1] : null;
        if (dateToSync) {
            this.update12HourState(dateToSync.getHours());
            this.currentMinute = dateToSync.getMinutes();
        }
        this.action.emit({
            type: 'dateSelected',
            payload: {
                mode: this.mode,
                value: this._internalValue,
                date: day
            }
        });
        this.cdr.markForCheck();
    }
    onDateHover(day) {
        if (this.mode === 'range' && this.startDate && !this.endDate && day) {
            this.hoveredDate = day;
            this.cdr.markForCheck();
        }
    }
    isPreviewInRange(day) {
        if (this.mode !== 'range' || !this.startDate || this.endDate || !this.hoveredDate || !day)
            return false;
        const start = getStartOfDay(this.startDate).getTime();
        const end = getStartOfDay(this.hoveredDate).getTime();
        const time = getStartOfDay(day).getTime();
        return time > Math.min(start, end) && time < Math.max(start, end);
    }
    generateCalendar() {
        this.daysInMonth = [];
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        this._currentMonth = month;
        this._currentYear = year;
        this.generateDropdownOptions();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDayOfMonth.getDay();
        const emptyCellCount = (startDayOfWeek - this.firstDayOfWeek + 7) % 7;
        // Add previous month's days instead of null values
        const previousMonth = month === 0 ? 11 : month - 1;
        const previousYear = month === 0 ? year - 1 : year;
        const lastDayOfPreviousMonth = new Date(previousYear, previousMonth + 1, 0);
        for (let i = 0; i < emptyCellCount; i++) {
            const dayNumber = lastDayOfPreviousMonth.getDate() - emptyCellCount + i + 1;
            this.daysInMonth.push(this._normalizeDate(new Date(previousYear, previousMonth, dayNumber)));
        }
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            this.daysInMonth.push(this._normalizeDate(new Date(year, month, i)));
        }
        this.cdr.markForCheck();
        this.action.emit({
            type: 'calendarGenerated',
            payload: {
                month: month,
                year: year,
                days: this.daysInMonth.filter(d => d !== null)
            }
        });
    }
    generateDropdownOptions() {
        this.yearOptions = generateYearOptions(this._currentYear);
    }
    changeMonth(delta) {
        if (this.disabled)
            return;
        // Check if going back is disabled due to minDate constraint
        if (delta < 0 && this.isBackArrowDisabled)
            return;
        const newDate = addMonths(this.currentDate, delta);
        // Update the data immediately (no animation)
        this.currentDate = newDate;
        this._currentMonth = newDate.getMonth();
        this._currentYear = newDate.getFullYear();
        // Generate new calendar view
        this.generateCalendar();
        this.action.emit({ type: 'monthChanged', payload: { delta: delta } });
        this.cdr.markForCheck();
    }
    isSameDay(d1, d2) {
        return this.dateComparator(d1, d2);
    }
    isCurrentMonth(day) {
        if (!day)
            return false;
        return day.getMonth() === this._currentMonth && day.getFullYear() === this._currentYear;
    }
    isInRange(d) {
        if (!d || !this.startDate || !this.endDate)
            return false;
        const dTime = getStartOfDay(d).getTime();
        const startDayTime = getStartOfDay(this.startDate).getTime();
        const endDayTime = getStartOfDay(this.endDate).getTime();
        const startTime = Math.min(startDayTime, endDayTime);
        const endTime = Math.max(startDayTime, endDayTime);
        return dTime > startTime && dTime < endTime;
    }
    ngOnDestroy() {
        // Clean up any subscriptions or timers if needed
        this.selectedDate = null;
        this.selectedDates = [];
        this.startDate = null;
        this.endDate = null;
        this.hoveredDate = null;
        this._internalValue = null;
        // Clear any cached data
        if (this.dateComparator && typeof this.dateComparator === 'function') {
            // Clear any internal caches if they exist
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.6", ngImport: i0, type: NgxsmkDatepickerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.3.6", type: NgxsmkDatepickerComponent, isStandalone: true, selector: "ngxsmk-datepicker", inputs: { mode: "mode", isInvalidDate: "isInvalidDate", showRanges: "showRanges", showTime: "showTime", minuteInterval: "minuteInterval", use24hTimeFormat: "use24hTimeFormat", autoCloseOnSelect: "autoCloseOnSelect", holidayProvider: "holidayProvider", disableHolidays: "disableHolidays", disabledDates: "disabledDates", placeholder: "placeholder", inline: "inline", startAt: "startAt", locale: "locale", theme: "theme", disabledState: "disabledState", minDate: "minDate", maxDate: "maxDate", ranges: "ranges" }, outputs: { valueChange: "valueChange", action: "action" }, host: { listeners: { "document:click": "onDocumentClick($event)" }, properties: { "class.dark-theme": "this.isDarkMode" } }, providers: [{
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => NgxsmkDatepickerComponent),
                multi: true
            }], usesOnChanges: true, ngImport: i0, template: `
    <div class="ngxsmk-datepicker-wrapper" [class.ngxsmk-inline-mode]="isInlineMode">
      @if (!isInlineMode) {
        <div class="ngxsmk-input-group" (click)="toggleCalendar()" [class.disabled]="disabled">
          <input type="text" 
                 [value]="displayValue" 
                 [placeholder]="placeholder" 
                 readonly 
                 [disabled]="disabled"
                 class="ngxsmk-display-input">
          <button type="button" class="ngxsmk-clear-button" (click)="clearValue($event)" [disabled]="disabled" *ngIf="displayValue">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M368 368L144 144M368 144L144 368"/></svg>
          </button>
        </div>
      }

      @if (isCalendarVisible) {
        <div class="ngxsmk-popover-container" [class.ngxsmk-inline-container]="isInlineMode">
          <div class="ngxsmk-datepicker-container">
            @if (showRanges && rangesArray.length > 0 && mode === 'range') {
              <div class="ngxsmk-ranges-container">
                <ul>
                  @for (range of rangesArray; track trackByRange($index, range)) {
                    <li (click)="selectRange(range.value)" [class.disabled]="disabled">{{ range.key }}</li>
                  }
                </ul>
              </div>
            }
            <div class="ngxsmk-calendar-container">
              <div class="ngxsmk-header">
                <div class="ngxsmk-month-year-selects">
                  <ngxsmk-custom-select class="month-select" [options]="monthOptions"
                                    [(value)]="currentMonth" [disabled]="disabled"></ngxsmk-custom-select>
                  <ngxsmk-custom-select class="year-select" [options]="yearOptions" [(value)]="currentYear" [disabled]="disabled"></ngxsmk-custom-select>
                </div>
                <div class="ngxsmk-nav-buttons">
                  <button type="button" class="ngxsmk-nav-button" (click)="changeMonth(-1)" [disabled]="disabled || isBackArrowDisabled">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48"
                            d="M328 112L184 256l144 144"/>
                    </svg>
                  </button>
                  <button type="button" class="ngxsmk-nav-button" (click)="changeMonth(1)" [disabled]="disabled">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48"
                            d="M184 112l144 144-144 144"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="ngxsmk-days-grid-wrapper">
                <div class="ngxsmk-days-grid">
                  @for (day of weekDays; track day) {
                    <div class="ngxsmk-day-name">{{ day }}</div>
                  }
                  @for (day of daysInMonth; track trackByDay($index, day)) {
                    <div class="ngxsmk-day-cell"
                        [class.empty]="!isCurrentMonthMemo(day)" [class.disabled]="isDateDisabledMemo(day)" 
                        [class.today]="isSameDayMemo(day, today)"
                        [class.holiday]="isHolidayMemo(day)"
                        [class.selected]="mode === 'single' && isSameDayMemo(day, selectedDate)"
                        [class.multiple-selected]="mode === 'multiple' && isMultipleSelected(day)"
                        [class.start-date]="mode === 'range' && isSameDayMemo(day, startDate)"
                        [class.end-date]="mode === 'range' && isSameDayMemo(day, endDate)"
                        [class.in-range]="mode === 'range' && isInRange(day)"
                        [class.preview-range]="isPreviewInRange(day)"
                        (click)="onDateClick(day)" (mouseenter)="onDateHover(day)">
                      @if (day) {
                        <div class="ngxsmk-day-number" [attr.title]="getHolidayLabelMemo(day)">{{ day | date : 'd' }}</div>
                      }
                    </div>
                  }
                </div>
              </div>

              @if (showTime) {
                <div class="ngxsmk-time-selection">
                  <span class="ngxsmk-time-label">Time:</span>
                  <ngxsmk-custom-select
                    class="hour-select"
                    [options]="hourOptions"
                    [(value)]="currentDisplayHour"
                    (valueChange)="onTimeChange()"
                    [disabled]="disabled"
                  ></ngxsmk-custom-select>
                  <span class="ngxsmk-time-separator">:</span>
                  <ngxsmk-custom-select
                    class="minute-select"
                    [options]="minuteOptions"
                    [(value)]="currentMinute"
                    (valueChange)="onTimeChange()"
                    [disabled]="disabled"
                  ></ngxsmk-custom-select>
                  <ngxsmk-custom-select *ngIf="!use24hTimeFormat"
                    class="ampm-select"
                    [options]="ampmOptions"
                    [(value)]="isPm"
                    (valueChange)="onTimeChange()"
                    [disabled]="disabled"
                  ></ngxsmk-custom-select>
                </div>
              }
              
              <div class="ngxsmk-footer" *ngIf="!isInlineMode">
                <button type="button" class="ngxsmk-clear-button-footer" (click)="clearValue($event)" [disabled]="disabled">
                  Clear
                </button>
                <button type="button" class="ngxsmk-close-button" (click)="isCalendarOpen = false" [disabled]="disabled">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `, isInline: true, styles: [":host{--datepicker-primary-color: #6d28d9;--datepicker-primary-contrast: #ffffff;--datepicker-range-background: #f5f3ff;--datepicker-background: #ffffff;--datepicker-text-color: #222428;--datepicker-subtle-text-color: #9ca3af;--datepicker-border-color: #e9e9e9;--datepicker-hover-background: #f0f0f0;--datepicker-font-size-base: 14px;--datepicker-font-size-sm: 12px;--datepicker-font-size-lg: 16px;--datepicker-font-size-xl: 18px;--datepicker-line-height: 1.4;--datepicker-spacing-xs: 4px;--datepicker-spacing-sm: 8px;--datepicker-spacing-md: 12px;--datepicker-spacing-lg: 16px;--datepicker-spacing-xl: 20px;display:inline-block;position:relative}:host(.dark-theme){--datepicker-range-background: rgba(139, 92, 246, .2);--datepicker-background: #1f2937;--datepicker-text-color: #d1d5db;--datepicker-subtle-text-color: #6b7280;--datepicker-border-color: #4b5563;--datepicker-hover-background: #374151}.ngxsmk-datepicker-wrapper{position:relative}.ngxsmk-input-group{display:flex;align-items:center;cursor:pointer;width:100%;min-width:150px;border:1px solid var(--datepicker-border-color, #ccc);border-radius:4px;background:var(--datepicker-background);transition:all .2s ease;position:relative;overflow:hidden}.ngxsmk-input-group:focus-within{border-color:var(--datepicker-primary-color);box-shadow:0 0 0 2px #6d28d91a}.ngxsmk-input-group:hover:not(.disabled){border-color:var(--datepicker-primary-color)}.ngxsmk-input-group.has-value{border-color:var(--datepicker-primary-color)}.ngxsmk-input-group.error{border-color:#dc2626;box-shadow:0 0 0 2px #dc26261a}.ngxsmk-input-group.success{border-color:#16a34a;box-shadow:0 0 0 2px #16a34a1a}.ngxsmk-input-group.disabled{cursor:not-allowed;opacity:.7}.ngxsmk-display-input{flex-grow:1;padding:var(--datepicker-spacing-sm) var(--datepicker-spacing-sm);font-size:var(--datepicker-font-size-base);line-height:var(--datepicker-line-height);color:var(--datepicker-text-color, #333);background:transparent;border:none;outline:none;cursor:pointer;transition:all .2s ease;min-height:20px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.ngxsmk-display-input:disabled{background:var(--datepicker-hover-background, #f0f0f0);cursor:not-allowed;opacity:.6}.ngxsmk-display-input:focus{outline:2px solid var(--datepicker-primary-color);outline-offset:2px}.ngxsmk-display-input::placeholder{color:var(--datepicker-subtle-text-color);font-style:italic}.ngxsmk-input-group:focus-within .ngxsmk-display-input{color:var(--datepicker-primary-color)}.ngxsmk-input-group:hover:not(.disabled) .ngxsmk-display-input{color:var(--datepicker-text-color)}.ngxsmk-input-group.has-value .ngxsmk-display-input{font-weight:500;color:var(--datepicker-text-color)}.ngxsmk-input-group:not(.has-value) .ngxsmk-display-input{color:var(--datepicker-subtle-text-color)}.ngxsmk-input-group.error .ngxsmk-display-input{color:#dc2626;border-color:#dc2626}.ngxsmk-input-group.success .ngxsmk-display-input{color:#16a34a;border-color:#16a34a}.ngxsmk-input-group.compact{min-width:120px;padding:var(--datepicker-spacing-xs)}.ngxsmk-input-group.compact .ngxsmk-display-input{font-size:var(--datepicker-font-size-sm);padding:var(--datepicker-spacing-xs)}.ngxsmk-input-group.large{min-width:200px;padding:var(--datepicker-spacing-md)}.ngxsmk-input-group.large .ngxsmk-display-input{font-size:var(--datepicker-font-size-lg);padding:var(--datepicker-spacing-md)}.ngxsmk-input-group.with-icon .ngxsmk-display-input{padding-left:32px}.ngxsmk-input-group .ngxsmk-input-icon{position:absolute;left:var(--datepicker-spacing-sm);top:50%;transform:translateY(-50%);color:var(--datepicker-subtle-text-color);pointer-events:none}.ngxsmk-input-group.loading .ngxsmk-display-input{color:var(--datepicker-subtle-text-color);cursor:wait}.ngxsmk-input-group.loading:after{content:\"\";position:absolute;right:var(--datepicker-spacing-sm);top:50%;transform:translateY(-50%);width:16px;height:16px;border:2px solid var(--datepicker-border-color);border-top:2px solid var(--datepicker-primary-color);border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{0%{transform:translateY(-50%) rotate(0)}to{transform:translateY(-50%) rotate(360deg)}}.ngxsmk-clear-button{background:none;border:none;padding:0 8px;cursor:pointer;color:var(--datepicker-subtle-text-color);line-height:1}.ngxsmk-clear-button svg{width:14px;height:14px}.ngxsmk-clear-button:hover{color:var(--datepicker-text-color)}.ngxsmk-popover-container{position:absolute;top:100%;left:0;z-index:10000;margin-top:8px}.ngxsmk-popover-container.ngxsmk-inline-container{position:static;margin-top:0}.ngxsmk-datepicker-wrapper.ngxsmk-inline-mode{display:block}.ngxsmk-datepicker-wrapper.ngxsmk-inline-mode .ngxsmk-datepicker-container{box-shadow:none}.ngxsmk-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:12px;padding-top:8px;border-top:1px solid var(--datepicker-border-color)}.ngxsmk-clear-button-footer,.ngxsmk-close-button{padding:var(--datepicker-spacing-sm) var(--datepicker-spacing-md);border-radius:6px;font-size:var(--datepicker-font-size-sm);line-height:var(--datepicker-line-height);cursor:pointer;transition:background-color .2s;border:1px solid var(--datepicker-border-color)}.ngxsmk-clear-button-footer{background:none;color:var(--datepicker-subtle-text-color)}.ngxsmk-close-button{background-color:var(--datepicker-primary-color);color:var(--datepicker-primary-contrast);border-color:var(--datepicker-primary-color)}.ngxsmk-close-button:hover:not(:disabled){opacity:.9}.ngxsmk-clear-button-footer:hover:not(:disabled){background-color:var(--datepicker-hover-background)}.ngxsmk-datepicker-container{display:flex;flex-direction:column;width:100%}.ngxsmk-calendar-container{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:var(--datepicker-font-size-base);line-height:var(--datepicker-line-height);border-radius:10px;padding:var(--datepicker-spacing-md);background:var(--datepicker-background);box-shadow:0 4px 10px #0000001a}.ngxsmk-ranges-container{width:100%;padding:var(--datepicker-spacing-md);border-right:none;background:var(--datepicker-hover-background);border-radius:10px}.ngxsmk-ranges-container ul{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;list-style:none;padding:0;margin:0}.ngxsmk-ranges-container li{padding:var(--datepicker-spacing-sm) var(--datepicker-spacing-sm);margin-bottom:0;font-size:var(--datepicker-font-size-sm);line-height:var(--datepicker-line-height);border:1px solid var(--datepicker-border-color);border-radius:6px;cursor:pointer;transition:background-color .15s ease;flex-shrink:0}.ngxsmk-ranges-container li:hover{background-color:var(--datepicker-hover-background)}.ngxsmk-ranges-container li.disabled{cursor:not-allowed;opacity:.5;background-color:transparent!important;color:var(--datepicker-subtle-text-color, #9ca3af)}.ngxsmk-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;position:relative;z-index:2;gap:4px}.ngxsmk-month-year-selects{display:flex;gap:4px}.ngxsmk-month-year-selects app-custom-select.month-select{--custom-select-width: 100px}.ngxsmk-month-year-selects app-custom-select.year-select{--custom-select-width: 75px}.ngxsmk-nav-buttons{display:flex}.ngxsmk-nav-button{padding:6px;background:none;border:none;cursor:pointer;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:var(--datepicker-text-color)}.ngxsmk-nav-button:hover:not(:disabled){background-color:var(--datepicker-hover-background)}.ngxsmk-nav-button:disabled{cursor:not-allowed;opacity:.5}.ngxsmk-nav-button svg{width:16px;height:16px}.ngxsmk-days-grid{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;gap:0}.ngxsmk-day-name{font-size:var(--datepicker-font-size-sm);padding:var(--datepicker-spacing-sm) 0;color:var(--datepicker-subtle-text-color);font-weight:600;line-height:var(--datepicker-line-height)}.ngxsmk-day-cell{height:32px;position:relative;display:flex;justify-content:center;align-items:center;cursor:pointer;border-radius:0}.ngxsmk-day-cell.holiday .ngxsmk-day-number{color:var(--datepicker-primary-color);text-decoration:underline dotted}.ngxsmk-day-number{width:30px;height:30px;display:flex;justify-content:center;align-items:center;border-radius:50%;color:var(--datepicker-text-color);font-size:var(--datepicker-font-size-base);line-height:var(--datepicker-line-height);position:relative;z-index:1}.ngxsmk-time-selection{display:flex;align-items:center;gap:var(--datepicker-spacing-xs);flex-wrap:wrap;margin-top:var(--datepicker-spacing-md);padding-top:var(--datepicker-spacing-sm);border-top:1px solid var(--datepicker-border-color)}.ngxsmk-time-label{font-size:var(--datepicker-font-size-base);line-height:var(--datepicker-line-height);color:var(--datepicker-subtle-text-color);margin-right:var(--datepicker-spacing-xs)}.ngxsmk-time-separator{font-weight:600;color:var(--datepicker-text-color)}.ngxsmk-time-selection app-custom-select{--custom-select-width: 75px;height:28px}.ngxsmk-time-selection app-custom-select.ampm-select{--custom-select-width: 75px}.ngxsmk-time-selection .hour-select,.ngxsmk-time-selection .minute-select,.ngxsmk-time-selection .ampm-select{--custom-select-width: 75px;--custom-select-height: 28px}.ngxsmk-time-selection app-custom-select:hover{border-color:var(--datepicker-primary-color)}.ngxsmk-time-selection app-custom-select:focus-within{border-color:var(--datepicker-primary-color);box-shadow:0 0 0 2px #6d28d933}.ngxsmk-time-selection .time-select-compact{--custom-select-width: 60px;--custom-select-height: 24px;font-size:var(--datepicker-font-size-sm)}.ngxsmk-time-selection .time-select-large{--custom-select-width: 90px;--custom-select-height: 36px;font-size:var(--datepicker-font-size-lg)}.ngxsmk-time-selection .time-select-disabled{opacity:.6;cursor:not-allowed;pointer-events:none}.ngxsmk-time-selection app-custom-select{transition:border-color .2s ease,box-shadow .2s ease}.ngxsmk-time-selection app-custom-select.ngxsmk-time-select-animated{transition:all .2s cubic-bezier(.4,0,.2,1)}.ngxsmk-day-cell:not(.disabled):not(.empty):hover .ngxsmk-day-number{background-color:var(--datepicker-hover-background);color:var(--datepicker-primary-color)}.ngxsmk-day-cell.start-date .ngxsmk-day-number,.ngxsmk-day-cell.end-date .ngxsmk-day-number,.ngxsmk-day-cell.selected .ngxsmk-day-number,.ngxsmk-day-cell.multiple-selected .ngxsmk-day-number{background-color:var(--datepicker-primary-color);color:var(--datepicker-primary-contrast)}.ngxsmk-day-cell.multiple-selected .ngxsmk-day-number{border:1px dashed var(--datepicker-primary-contrast)}.ngxsmk-day-cell.multiple-selected:hover .ngxsmk-day-number{background-color:var(--datepicker-primary-color);color:var(--datepicker-primary-contrast)}.ngxsmk-day-cell.in-range,.ngxsmk-day-cell.start-date,.ngxsmk-day-cell.end-date,.ngxsmk-day-cell.preview-range{background-color:var(--datepicker-range-background)}.ngxsmk-day-cell.start-date{border-top-left-radius:100%;border-bottom-left-radius:100%}.ngxsmk-day-cell.end-date{border-top-right-radius:100%;border-bottom-right-radius:100%}.ngxsmk-day-cell.start-date.end-date{border-radius:50px}.ngxsmk-day-cell.disabled{background-color:transparent!important;color:#4b5563;cursor:not-allowed;pointer-events:none;opacity:.5}.ngxsmk-day-cell.empty{opacity:1}.ngxsmk-day-cell.empty .ngxsmk-day-number{color:var(--datepicker-subtle-text-color)}:host(.dark-theme) .ngxsmk-day-cell.empty .ngxsmk-day-number{color:#6b7280}.ngxsmk-day-cell.today .ngxsmk-day-number{border:1px solid var(--datepicker-primary-color)}@media (min-width: 600px){.ngxsmk-datepicker-container{display:flex;flex-direction:row}.ngxsmk-calendar-container{padding:var(--datepicker-spacing-lg);box-shadow:0 4px 10px #0000001a;width:auto;border-radius:10px;min-height:280px}.ngxsmk-ranges-container{width:180px;padding:var(--datepicker-spacing-lg);border-bottom:none;background:var(--datepicker-background);border-radius:10px 0 0 10px}.ngxsmk-ranges-container ul{flex-direction:column;justify-content:flex-start;gap:0}.ngxsmk-ranges-container li{padding:var(--datepicker-spacing-sm);margin-bottom:var(--datepicker-spacing-sm);border:none;font-size:var(--datepicker-font-size-lg)}.ngxsmk-header{margin-bottom:var(--datepicker-spacing-md);gap:var(--datepicker-spacing-xs)}.ngxsmk-month-year-selects app-custom-select.month-select{--custom-select-width: 120px}.ngxsmk-month-year-selects app-custom-select.year-select{--custom-select-width: 90px}.ngxsmk-nav-button{padding:var(--datepicker-spacing-sm)}.ngxsmk-nav-button svg{width:18px;height:18px}.ngxsmk-day-name{font-size:var(--datepicker-font-size-base);padding:var(--datepicker-spacing-sm) 0}.ngxsmk-day-cell{height:42px}.ngxsmk-day-number{width:38px;height:38px;font-size:var(--datepicker-font-size-lg)}.ngxsmk-time-selection{margin-top:var(--datepicker-spacing-lg);padding-top:var(--datepicker-spacing-md)}.ngxsmk-time-selection app-custom-select{--custom-select-width: 60px;height:30px}.ngxsmk-time-selection app-custom-select.ampm-select{--custom-select-width: 70px}.ngxsmk-time-selection .hour-select,.ngxsmk-time-selection .minute-select{--custom-select-width: 60px;--custom-select-height: 30px}.ngxsmk-time-selection .ampm-select{--custom-select-width: 70px;--custom-select-height: 30px}}@media (prefers-reduced-motion: reduce){.ngxsmk-days-grid{transition:none}.ngxsmk-days-grid.animate-forward,.ngxsmk-days-grid.animate-backward{transform:none;opacity:1}}@media (prefers-contrast: high){:host{--datepicker-border-color: #000000;--datepicker-text-color: #000000;--datepicker-subtle-text-color: #666666}.ngxsmk-day-cell.disabled{opacity:.3}}@media print{.ngxsmk-datepicker-wrapper{display:none}}.ngxsmk-day-cell:focus-visible .ngxsmk-day-number{outline:2px solid var(--datepicker-primary-color);outline-offset:2px}.ngxsmk-nav-button:focus-visible,.ngxsmk-clear-button:focus-visible,.ngxsmk-clear-button-footer:focus-visible,.ngxsmk-close-button:focus-visible{outline:2px solid var(--datepicker-primary-color);outline-offset:2px}.ngxsmk-day-cell,.ngxsmk-nav-button,.ngxsmk-clear-button{will-change:auto;transform:translateZ(0)}.ngxsmk-days-grid{contain:layout style paint;transform:translateZ(0)}.ngxsmk-day-cell{contain:layout style}.ngxsmk-day-number{contain:layout style paint}@media (max-width: 480px){.ngxsmk-day-cell{height:28px}.ngxsmk-day-number{width:26px;height:26px;font-size:var(--datepicker-font-size-sm)}.ngxsmk-day-name{font-size:var(--datepicker-font-size-sm);padding:var(--datepicker-spacing-xs) 0}.ngxsmk-calendar-container{padding:var(--datepicker-spacing-sm)}.ngxsmk-header{margin-bottom:var(--datepicker-spacing-sm)}.ngxsmk-input-group{min-width:120px}.ngxsmk-display-input{font-size:var(--datepicker-font-size-sm);padding:var(--datepicker-spacing-xs)}.ngxsmk-clear-button{padding:0 var(--datepicker-spacing-xs)}.ngxsmk-clear-button svg{width:12px;height:12px}}\n"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "ngmodule", type: FormsModule }, { kind: "component", type: CustomSelectComponent, selector: "ngxsmk-custom-select", inputs: ["options", "value", "disabled"], outputs: ["valueChange"] }, { kind: "ngmodule", type: ReactiveFormsModule }, { kind: "pipe", type: i1.DatePipe, name: "date" }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.6", ngImport: i0, type: NgxsmkDatepickerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'ngxsmk-datepicker', standalone: true, imports: [CommonModule, FormsModule, CustomSelectComponent, DatePipe, ReactiveFormsModule], providers: [{
                            provide: NG_VALUE_ACCESSOR,
                            useExisting: forwardRef(() => NgxsmkDatepickerComponent),
                            multi: true
                        }], changeDetection: ChangeDetectionStrategy.OnPush, template: `
    <div class="ngxsmk-datepicker-wrapper" [class.ngxsmk-inline-mode]="isInlineMode">
      @if (!isInlineMode) {
        <div class="ngxsmk-input-group" (click)="toggleCalendar()" [class.disabled]="disabled">
          <input type="text" 
                 [value]="displayValue" 
                 [placeholder]="placeholder" 
                 readonly 
                 [disabled]="disabled"
                 class="ngxsmk-display-input">
          <button type="button" class="ngxsmk-clear-button" (click)="clearValue($event)" [disabled]="disabled" *ngIf="displayValue">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M368 368L144 144M368 144L144 368"/></svg>
          </button>
        </div>
      }

      @if (isCalendarVisible) {
        <div class="ngxsmk-popover-container" [class.ngxsmk-inline-container]="isInlineMode">
          <div class="ngxsmk-datepicker-container">
            @if (showRanges && rangesArray.length > 0 && mode === 'range') {
              <div class="ngxsmk-ranges-container">
                <ul>
                  @for (range of rangesArray; track trackByRange($index, range)) {
                    <li (click)="selectRange(range.value)" [class.disabled]="disabled">{{ range.key }}</li>
                  }
                </ul>
              </div>
            }
            <div class="ngxsmk-calendar-container">
              <div class="ngxsmk-header">
                <div class="ngxsmk-month-year-selects">
                  <ngxsmk-custom-select class="month-select" [options]="monthOptions"
                                    [(value)]="currentMonth" [disabled]="disabled"></ngxsmk-custom-select>
                  <ngxsmk-custom-select class="year-select" [options]="yearOptions" [(value)]="currentYear" [disabled]="disabled"></ngxsmk-custom-select>
                </div>
                <div class="ngxsmk-nav-buttons">
                  <button type="button" class="ngxsmk-nav-button" (click)="changeMonth(-1)" [disabled]="disabled || isBackArrowDisabled">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48"
                            d="M328 112L184 256l144 144"/>
                    </svg>
                  </button>
                  <button type="button" class="ngxsmk-nav-button" (click)="changeMonth(1)" [disabled]="disabled">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48"
                            d="M184 112l144 144-144 144"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="ngxsmk-days-grid-wrapper">
                <div class="ngxsmk-days-grid">
                  @for (day of weekDays; track day) {
                    <div class="ngxsmk-day-name">{{ day }}</div>
                  }
                  @for (day of daysInMonth; track trackByDay($index, day)) {
                    <div class="ngxsmk-day-cell"
                        [class.empty]="!isCurrentMonthMemo(day)" [class.disabled]="isDateDisabledMemo(day)" 
                        [class.today]="isSameDayMemo(day, today)"
                        [class.holiday]="isHolidayMemo(day)"
                        [class.selected]="mode === 'single' && isSameDayMemo(day, selectedDate)"
                        [class.multiple-selected]="mode === 'multiple' && isMultipleSelected(day)"
                        [class.start-date]="mode === 'range' && isSameDayMemo(day, startDate)"
                        [class.end-date]="mode === 'range' && isSameDayMemo(day, endDate)"
                        [class.in-range]="mode === 'range' && isInRange(day)"
                        [class.preview-range]="isPreviewInRange(day)"
                        (click)="onDateClick(day)" (mouseenter)="onDateHover(day)">
                      @if (day) {
                        <div class="ngxsmk-day-number" [attr.title]="getHolidayLabelMemo(day)">{{ day | date : 'd' }}</div>
                      }
                    </div>
                  }
                </div>
              </div>

              @if (showTime) {
                <div class="ngxsmk-time-selection">
                  <span class="ngxsmk-time-label">Time:</span>
                  <ngxsmk-custom-select
                    class="hour-select"
                    [options]="hourOptions"
                    [(value)]="currentDisplayHour"
                    (valueChange)="onTimeChange()"
                    [disabled]="disabled"
                  ></ngxsmk-custom-select>
                  <span class="ngxsmk-time-separator">:</span>
                  <ngxsmk-custom-select
                    class="minute-select"
                    [options]="minuteOptions"
                    [(value)]="currentMinute"
                    (valueChange)="onTimeChange()"
                    [disabled]="disabled"
                  ></ngxsmk-custom-select>
                  <ngxsmk-custom-select *ngIf="!use24hTimeFormat"
                    class="ampm-select"
                    [options]="ampmOptions"
                    [(value)]="isPm"
                    (valueChange)="onTimeChange()"
                    [disabled]="disabled"
                  ></ngxsmk-custom-select>
                </div>
              }
              
              <div class="ngxsmk-footer" *ngIf="!isInlineMode">
                <button type="button" class="ngxsmk-clear-button-footer" (click)="clearValue($event)" [disabled]="disabled">
                  Clear
                </button>
                <button type="button" class="ngxsmk-close-button" (click)="isCalendarOpen = false" [disabled]="disabled">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `, styles: [":host{--datepicker-primary-color: #6d28d9;--datepicker-primary-contrast: #ffffff;--datepicker-range-background: #f5f3ff;--datepicker-background: #ffffff;--datepicker-text-color: #222428;--datepicker-subtle-text-color: #9ca3af;--datepicker-border-color: #e9e9e9;--datepicker-hover-background: #f0f0f0;--datepicker-font-size-base: 14px;--datepicker-font-size-sm: 12px;--datepicker-font-size-lg: 16px;--datepicker-font-size-xl: 18px;--datepicker-line-height: 1.4;--datepicker-spacing-xs: 4px;--datepicker-spacing-sm: 8px;--datepicker-spacing-md: 12px;--datepicker-spacing-lg: 16px;--datepicker-spacing-xl: 20px;display:inline-block;position:relative}:host(.dark-theme){--datepicker-range-background: rgba(139, 92, 246, .2);--datepicker-background: #1f2937;--datepicker-text-color: #d1d5db;--datepicker-subtle-text-color: #6b7280;--datepicker-border-color: #4b5563;--datepicker-hover-background: #374151}.ngxsmk-datepicker-wrapper{position:relative}.ngxsmk-input-group{display:flex;align-items:center;cursor:pointer;width:100%;min-width:150px;border:1px solid var(--datepicker-border-color, #ccc);border-radius:4px;background:var(--datepicker-background);transition:all .2s ease;position:relative;overflow:hidden}.ngxsmk-input-group:focus-within{border-color:var(--datepicker-primary-color);box-shadow:0 0 0 2px #6d28d91a}.ngxsmk-input-group:hover:not(.disabled){border-color:var(--datepicker-primary-color)}.ngxsmk-input-group.has-value{border-color:var(--datepicker-primary-color)}.ngxsmk-input-group.error{border-color:#dc2626;box-shadow:0 0 0 2px #dc26261a}.ngxsmk-input-group.success{border-color:#16a34a;box-shadow:0 0 0 2px #16a34a1a}.ngxsmk-input-group.disabled{cursor:not-allowed;opacity:.7}.ngxsmk-display-input{flex-grow:1;padding:var(--datepicker-spacing-sm) var(--datepicker-spacing-sm);font-size:var(--datepicker-font-size-base);line-height:var(--datepicker-line-height);color:var(--datepicker-text-color, #333);background:transparent;border:none;outline:none;cursor:pointer;transition:all .2s ease;min-height:20px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.ngxsmk-display-input:disabled{background:var(--datepicker-hover-background, #f0f0f0);cursor:not-allowed;opacity:.6}.ngxsmk-display-input:focus{outline:2px solid var(--datepicker-primary-color);outline-offset:2px}.ngxsmk-display-input::placeholder{color:var(--datepicker-subtle-text-color);font-style:italic}.ngxsmk-input-group:focus-within .ngxsmk-display-input{color:var(--datepicker-primary-color)}.ngxsmk-input-group:hover:not(.disabled) .ngxsmk-display-input{color:var(--datepicker-text-color)}.ngxsmk-input-group.has-value .ngxsmk-display-input{font-weight:500;color:var(--datepicker-text-color)}.ngxsmk-input-group:not(.has-value) .ngxsmk-display-input{color:var(--datepicker-subtle-text-color)}.ngxsmk-input-group.error .ngxsmk-display-input{color:#dc2626;border-color:#dc2626}.ngxsmk-input-group.success .ngxsmk-display-input{color:#16a34a;border-color:#16a34a}.ngxsmk-input-group.compact{min-width:120px;padding:var(--datepicker-spacing-xs)}.ngxsmk-input-group.compact .ngxsmk-display-input{font-size:var(--datepicker-font-size-sm);padding:var(--datepicker-spacing-xs)}.ngxsmk-input-group.large{min-width:200px;padding:var(--datepicker-spacing-md)}.ngxsmk-input-group.large .ngxsmk-display-input{font-size:var(--datepicker-font-size-lg);padding:var(--datepicker-spacing-md)}.ngxsmk-input-group.with-icon .ngxsmk-display-input{padding-left:32px}.ngxsmk-input-group .ngxsmk-input-icon{position:absolute;left:var(--datepicker-spacing-sm);top:50%;transform:translateY(-50%);color:var(--datepicker-subtle-text-color);pointer-events:none}.ngxsmk-input-group.loading .ngxsmk-display-input{color:var(--datepicker-subtle-text-color);cursor:wait}.ngxsmk-input-group.loading:after{content:\"\";position:absolute;right:var(--datepicker-spacing-sm);top:50%;transform:translateY(-50%);width:16px;height:16px;border:2px solid var(--datepicker-border-color);border-top:2px solid var(--datepicker-primary-color);border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{0%{transform:translateY(-50%) rotate(0)}to{transform:translateY(-50%) rotate(360deg)}}.ngxsmk-clear-button{background:none;border:none;padding:0 8px;cursor:pointer;color:var(--datepicker-subtle-text-color);line-height:1}.ngxsmk-clear-button svg{width:14px;height:14px}.ngxsmk-clear-button:hover{color:var(--datepicker-text-color)}.ngxsmk-popover-container{position:absolute;top:100%;left:0;z-index:10000;margin-top:8px}.ngxsmk-popover-container.ngxsmk-inline-container{position:static;margin-top:0}.ngxsmk-datepicker-wrapper.ngxsmk-inline-mode{display:block}.ngxsmk-datepicker-wrapper.ngxsmk-inline-mode .ngxsmk-datepicker-container{box-shadow:none}.ngxsmk-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:12px;padding-top:8px;border-top:1px solid var(--datepicker-border-color)}.ngxsmk-clear-button-footer,.ngxsmk-close-button{padding:var(--datepicker-spacing-sm) var(--datepicker-spacing-md);border-radius:6px;font-size:var(--datepicker-font-size-sm);line-height:var(--datepicker-line-height);cursor:pointer;transition:background-color .2s;border:1px solid var(--datepicker-border-color)}.ngxsmk-clear-button-footer{background:none;color:var(--datepicker-subtle-text-color)}.ngxsmk-close-button{background-color:var(--datepicker-primary-color);color:var(--datepicker-primary-contrast);border-color:var(--datepicker-primary-color)}.ngxsmk-close-button:hover:not(:disabled){opacity:.9}.ngxsmk-clear-button-footer:hover:not(:disabled){background-color:var(--datepicker-hover-background)}.ngxsmk-datepicker-container{display:flex;flex-direction:column;width:100%}.ngxsmk-calendar-container{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:var(--datepicker-font-size-base);line-height:var(--datepicker-line-height);border-radius:10px;padding:var(--datepicker-spacing-md);background:var(--datepicker-background);box-shadow:0 4px 10px #0000001a}.ngxsmk-ranges-container{width:100%;padding:var(--datepicker-spacing-md);border-right:none;background:var(--datepicker-hover-background);border-radius:10px}.ngxsmk-ranges-container ul{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;list-style:none;padding:0;margin:0}.ngxsmk-ranges-container li{padding:var(--datepicker-spacing-sm) var(--datepicker-spacing-sm);margin-bottom:0;font-size:var(--datepicker-font-size-sm);line-height:var(--datepicker-line-height);border:1px solid var(--datepicker-border-color);border-radius:6px;cursor:pointer;transition:background-color .15s ease;flex-shrink:0}.ngxsmk-ranges-container li:hover{background-color:var(--datepicker-hover-background)}.ngxsmk-ranges-container li.disabled{cursor:not-allowed;opacity:.5;background-color:transparent!important;color:var(--datepicker-subtle-text-color, #9ca3af)}.ngxsmk-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;position:relative;z-index:2;gap:4px}.ngxsmk-month-year-selects{display:flex;gap:4px}.ngxsmk-month-year-selects app-custom-select.month-select{--custom-select-width: 100px}.ngxsmk-month-year-selects app-custom-select.year-select{--custom-select-width: 75px}.ngxsmk-nav-buttons{display:flex}.ngxsmk-nav-button{padding:6px;background:none;border:none;cursor:pointer;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:var(--datepicker-text-color)}.ngxsmk-nav-button:hover:not(:disabled){background-color:var(--datepicker-hover-background)}.ngxsmk-nav-button:disabled{cursor:not-allowed;opacity:.5}.ngxsmk-nav-button svg{width:16px;height:16px}.ngxsmk-days-grid{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;gap:0}.ngxsmk-day-name{font-size:var(--datepicker-font-size-sm);padding:var(--datepicker-spacing-sm) 0;color:var(--datepicker-subtle-text-color);font-weight:600;line-height:var(--datepicker-line-height)}.ngxsmk-day-cell{height:32px;position:relative;display:flex;justify-content:center;align-items:center;cursor:pointer;border-radius:0}.ngxsmk-day-cell.holiday .ngxsmk-day-number{color:var(--datepicker-primary-color);text-decoration:underline dotted}.ngxsmk-day-number{width:30px;height:30px;display:flex;justify-content:center;align-items:center;border-radius:50%;color:var(--datepicker-text-color);font-size:var(--datepicker-font-size-base);line-height:var(--datepicker-line-height);position:relative;z-index:1}.ngxsmk-time-selection{display:flex;align-items:center;gap:var(--datepicker-spacing-xs);flex-wrap:wrap;margin-top:var(--datepicker-spacing-md);padding-top:var(--datepicker-spacing-sm);border-top:1px solid var(--datepicker-border-color)}.ngxsmk-time-label{font-size:var(--datepicker-font-size-base);line-height:var(--datepicker-line-height);color:var(--datepicker-subtle-text-color);margin-right:var(--datepicker-spacing-xs)}.ngxsmk-time-separator{font-weight:600;color:var(--datepicker-text-color)}.ngxsmk-time-selection app-custom-select{--custom-select-width: 75px;height:28px}.ngxsmk-time-selection app-custom-select.ampm-select{--custom-select-width: 75px}.ngxsmk-time-selection .hour-select,.ngxsmk-time-selection .minute-select,.ngxsmk-time-selection .ampm-select{--custom-select-width: 75px;--custom-select-height: 28px}.ngxsmk-time-selection app-custom-select:hover{border-color:var(--datepicker-primary-color)}.ngxsmk-time-selection app-custom-select:focus-within{border-color:var(--datepicker-primary-color);box-shadow:0 0 0 2px #6d28d933}.ngxsmk-time-selection .time-select-compact{--custom-select-width: 60px;--custom-select-height: 24px;font-size:var(--datepicker-font-size-sm)}.ngxsmk-time-selection .time-select-large{--custom-select-width: 90px;--custom-select-height: 36px;font-size:var(--datepicker-font-size-lg)}.ngxsmk-time-selection .time-select-disabled{opacity:.6;cursor:not-allowed;pointer-events:none}.ngxsmk-time-selection app-custom-select{transition:border-color .2s ease,box-shadow .2s ease}.ngxsmk-time-selection app-custom-select.ngxsmk-time-select-animated{transition:all .2s cubic-bezier(.4,0,.2,1)}.ngxsmk-day-cell:not(.disabled):not(.empty):hover .ngxsmk-day-number{background-color:var(--datepicker-hover-background);color:var(--datepicker-primary-color)}.ngxsmk-day-cell.start-date .ngxsmk-day-number,.ngxsmk-day-cell.end-date .ngxsmk-day-number,.ngxsmk-day-cell.selected .ngxsmk-day-number,.ngxsmk-day-cell.multiple-selected .ngxsmk-day-number{background-color:var(--datepicker-primary-color);color:var(--datepicker-primary-contrast)}.ngxsmk-day-cell.multiple-selected .ngxsmk-day-number{border:1px dashed var(--datepicker-primary-contrast)}.ngxsmk-day-cell.multiple-selected:hover .ngxsmk-day-number{background-color:var(--datepicker-primary-color);color:var(--datepicker-primary-contrast)}.ngxsmk-day-cell.in-range,.ngxsmk-day-cell.start-date,.ngxsmk-day-cell.end-date,.ngxsmk-day-cell.preview-range{background-color:var(--datepicker-range-background)}.ngxsmk-day-cell.start-date{border-top-left-radius:100%;border-bottom-left-radius:100%}.ngxsmk-day-cell.end-date{border-top-right-radius:100%;border-bottom-right-radius:100%}.ngxsmk-day-cell.start-date.end-date{border-radius:50px}.ngxsmk-day-cell.disabled{background-color:transparent!important;color:#4b5563;cursor:not-allowed;pointer-events:none;opacity:.5}.ngxsmk-day-cell.empty{opacity:1}.ngxsmk-day-cell.empty .ngxsmk-day-number{color:var(--datepicker-subtle-text-color)}:host(.dark-theme) .ngxsmk-day-cell.empty .ngxsmk-day-number{color:#6b7280}.ngxsmk-day-cell.today .ngxsmk-day-number{border:1px solid var(--datepicker-primary-color)}@media (min-width: 600px){.ngxsmk-datepicker-container{display:flex;flex-direction:row}.ngxsmk-calendar-container{padding:var(--datepicker-spacing-lg);box-shadow:0 4px 10px #0000001a;width:auto;border-radius:10px;min-height:280px}.ngxsmk-ranges-container{width:180px;padding:var(--datepicker-spacing-lg);border-bottom:none;background:var(--datepicker-background);border-radius:10px 0 0 10px}.ngxsmk-ranges-container ul{flex-direction:column;justify-content:flex-start;gap:0}.ngxsmk-ranges-container li{padding:var(--datepicker-spacing-sm);margin-bottom:var(--datepicker-spacing-sm);border:none;font-size:var(--datepicker-font-size-lg)}.ngxsmk-header{margin-bottom:var(--datepicker-spacing-md);gap:var(--datepicker-spacing-xs)}.ngxsmk-month-year-selects app-custom-select.month-select{--custom-select-width: 120px}.ngxsmk-month-year-selects app-custom-select.year-select{--custom-select-width: 90px}.ngxsmk-nav-button{padding:var(--datepicker-spacing-sm)}.ngxsmk-nav-button svg{width:18px;height:18px}.ngxsmk-day-name{font-size:var(--datepicker-font-size-base);padding:var(--datepicker-spacing-sm) 0}.ngxsmk-day-cell{height:42px}.ngxsmk-day-number{width:38px;height:38px;font-size:var(--datepicker-font-size-lg)}.ngxsmk-time-selection{margin-top:var(--datepicker-spacing-lg);padding-top:var(--datepicker-spacing-md)}.ngxsmk-time-selection app-custom-select{--custom-select-width: 60px;height:30px}.ngxsmk-time-selection app-custom-select.ampm-select{--custom-select-width: 70px}.ngxsmk-time-selection .hour-select,.ngxsmk-time-selection .minute-select{--custom-select-width: 60px;--custom-select-height: 30px}.ngxsmk-time-selection .ampm-select{--custom-select-width: 70px;--custom-select-height: 30px}}@media (prefers-reduced-motion: reduce){.ngxsmk-days-grid{transition:none}.ngxsmk-days-grid.animate-forward,.ngxsmk-days-grid.animate-backward{transform:none;opacity:1}}@media (prefers-contrast: high){:host{--datepicker-border-color: #000000;--datepicker-text-color: #000000;--datepicker-subtle-text-color: #666666}.ngxsmk-day-cell.disabled{opacity:.3}}@media print{.ngxsmk-datepicker-wrapper{display:none}}.ngxsmk-day-cell:focus-visible .ngxsmk-day-number{outline:2px solid var(--datepicker-primary-color);outline-offset:2px}.ngxsmk-nav-button:focus-visible,.ngxsmk-clear-button:focus-visible,.ngxsmk-clear-button-footer:focus-visible,.ngxsmk-close-button:focus-visible{outline:2px solid var(--datepicker-primary-color);outline-offset:2px}.ngxsmk-day-cell,.ngxsmk-nav-button,.ngxsmk-clear-button{will-change:auto;transform:translateZ(0)}.ngxsmk-days-grid{contain:layout style paint;transform:translateZ(0)}.ngxsmk-day-cell{contain:layout style}.ngxsmk-day-number{contain:layout style paint}@media (max-width: 480px){.ngxsmk-day-cell{height:28px}.ngxsmk-day-number{width:26px;height:26px;font-size:var(--datepicker-font-size-sm)}.ngxsmk-day-name{font-size:var(--datepicker-font-size-sm);padding:var(--datepicker-spacing-xs) 0}.ngxsmk-calendar-container{padding:var(--datepicker-spacing-sm)}.ngxsmk-header{margin-bottom:var(--datepicker-spacing-sm)}.ngxsmk-input-group{min-width:120px}.ngxsmk-display-input{font-size:var(--datepicker-font-size-sm);padding:var(--datepicker-spacing-xs)}.ngxsmk-clear-button{padding:0 var(--datepicker-spacing-xs)}.ngxsmk-clear-button svg{width:12px;height:12px}}\n"] }]
        }], propDecorators: { mode: [{
                type: Input
            }], isInvalidDate: [{
                type: Input
            }], showRanges: [{
                type: Input
            }], showTime: [{
                type: Input
            }], minuteInterval: [{
                type: Input
            }], use24hTimeFormat: [{
                type: Input
            }], autoCloseOnSelect: [{
                type: Input
            }], holidayProvider: [{
                type: Input
            }], disableHolidays: [{
                type: Input
            }], disabledDates: [{
                type: Input
            }], placeholder: [{
                type: Input
            }], inline: [{
                type: Input
            }], startAt: [{
                type: Input
            }], locale: [{
                type: Input
            }], theme: [{
                type: Input
            }], isDarkMode: [{
                type: HostBinding,
                args: ['class.dark-theme']
            }], disabledState: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], action: [{
                type: Output
            }], minDate: [{
                type: Input
            }], maxDate: [{
                type: Input
            }], ranges: [{
                type: Input
            }], onDocumentClick: [{
                type: HostListener,
                args: ['document:click', ['$event']]
            }] } });

/*
 * Public API Surface of ngxsmk-datepicker
 */

/**
 * Generated bundle index. Do not edit.
 */

export { CustomSelectComponent, NgxsmkDatepickerComponent, addMonths, generateMonthOptions, generateTimeOptions, generateWeekDays, generateYearOptions, get24Hour, getEndOfDay, getEndOfMonth, getFirstDayOfWeek, getStartOfDay, getStartOfMonth, isSameDay, normalizeDate, processDateRanges, subtractDays, update12HourState };
//# sourceMappingURL=ngxsmk-datepicker.mjs.map
