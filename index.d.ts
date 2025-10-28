import * as i0 from '@angular/core';
import { OnInit, OnChanges, OnDestroy, EventEmitter, SimpleChanges, ElementRef, QueryList, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

/**
 * Date utility functions for ngxsmk-datepicker
 * Extracted to improve tree-shaking and reduce bundle size
 */
declare function getStartOfDay(d: Date): Date;
declare function getEndOfDay(d: Date): Date;
declare function addMonths(d: Date, months: number): Date;
declare function subtractDays(d: Date, days: number): Date;
declare function getStartOfMonth(d: Date): Date;
declare function getEndOfMonth(d: Date): Date;
declare function isSameDay(d1: Date | null, d2: Date | null): boolean;
declare function normalizeDate(date: DateInput | null): Date | null;
type DateInput = Date | string | {
    toDate: () => Date;
    _isAMomentObject?: boolean;
    $d?: Date;
};

/**
 * Calendar utility functions for ngxsmk-datepicker
 * Optimized for performance and tree-shaking
 */

interface HolidayProvider {
    /**
     * Returns true if the given date is a holiday.
     * The date passed will be at the start of the day (00:00:00).
     */
    isHoliday(date: Date): boolean;
    /**
     * Optional: Returns a label or reason for the holiday.
     */
    getHolidayLabel?(date: Date): string | null;
}
interface DateRange {
    [key: string]: [DateInput, DateInput];
}
type DatepickerValue = Date | {
    start: Date;
    end: Date;
} | Date[] | null;
/**
 * Generate month options for dropdown
 */
declare function generateMonthOptions(locale: string, year: number): {
    label: string;
    value: number;
}[];
/**
 * Generate year options for dropdown
 */
declare function generateYearOptions(currentYear: number, range?: number): {
    label: string;
    value: number;
}[];
/**
 * Generate time options for hour/minute dropdowns
 */
declare function generateTimeOptions(minuteInterval?: number): {
    hourOptions: {
        label: string;
        value: number;
    }[];
    minuteOptions: {
        label: string;
        value: number;
    }[];
};
/**
 * Generate week days for calendar header
 */
declare function generateWeekDays(locale: string, firstDayOfWeek?: number): string[];
/**
 * Get first day of week for locale
 */
declare function getFirstDayOfWeek(locale: string): number;
/**
 * Convert 12-hour to 24-hour format
 */
declare function get24Hour(displayHour: number, isPm: boolean): number;
/**
 * Convert 24-hour to 12-hour format
 */
declare function update12HourState(fullHour: number): {
    isPm: boolean;
    displayHour: number;
};
/**
 * Process date ranges input
 */
declare function processDateRanges(ranges: DateRange | null): {
    [key: string]: [Date, Date];
} | null;

declare class NgxsmkDatepickerComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {
    mode: 'single' | 'range' | 'multiple';
    isInvalidDate: (date: Date) => boolean;
    showRanges: boolean;
    showTime: boolean;
    minuteInterval: number;
    use24hTimeFormat: boolean;
    autoCloseOnSelect: boolean;
    holidayProvider: HolidayProvider | null;
    disableHolidays: boolean;
    disabledDates: (string | Date)[];
    placeholder: string;
    inline: boolean | 'always' | 'auto';
    isCalendarOpen: boolean;
    _internalValue: DatepickerValue;
    private _startAtDate;
    set startAt(value: DateInput | null);
    private _locale;
    set locale(value: string);
    get locale(): string;
    theme: 'light' | 'dark';
    get isDarkMode(): boolean;
    private onChange;
    private onTouched;
    disabled: boolean;
    set disabledState(isDisabled: boolean);
    valueChange: EventEmitter<DatepickerValue>;
    action: EventEmitter<{
        type: string;
        payload?: any;
    }>;
    private _minDate;
    set minDate(value: DateInput | null);
    private _maxDate;
    set maxDate(value: DateInput | null);
    private _ranges;
    set ranges(value: DateRange | null);
    currentDate: Date;
    daysInMonth: (Date | null)[];
    weekDays: string[];
    readonly today: Date;
    selectedDate: Date | null;
    selectedDates: Date[];
    startDate: Date | null;
    endDate: Date | null;
    hoveredDate: Date | null;
    rangesArray: {
        key: string;
        value: [Date, Date];
    }[];
    private _currentMonth;
    private _currentYear;
    monthOptions: {
        label: string;
        value: number;
    }[];
    yearOptions: {
        label: string;
        value: number;
    }[];
    private firstDayOfWeek;
    currentHour: number;
    currentMinute: number;
    currentDisplayHour: number;
    isPm: boolean;
    hourOptions: {
        label: string;
        value: number;
    }[];
    minuteOptions: {
        label: string;
        value: number;
    }[];
    ampmOptions: {
        label: string;
        value: boolean;
    }[];
    private readonly elementRef;
    private readonly cdr;
    private readonly dateComparator;
    get isInlineMode(): boolean;
    get isCalendarVisible(): boolean;
    get displayValue(): string;
    get isBackArrowDisabled(): boolean;
    get isCurrentMonthMemo(): (day: Date | null) => boolean;
    get isDateDisabledMemo(): (day: Date | null) => boolean;
    get isSameDayMemo(): (d1: Date | null, d2: Date | null) => boolean;
    get isHolidayMemo(): (day: Date | null) => boolean;
    get getHolidayLabelMemo(): (day: Date | null) => string | null;
    trackByDay(index: number, day: Date | null): string;
    trackByRange(_index: number, range: {
        key: string;
        value: [Date, Date];
    }): string;
    onDocumentClick(event: MouseEvent): void;
    writeValue(val: DatepickerValue): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    private emitValue;
    toggleCalendar(): void;
    clearValue(event?: MouseEvent): void;
    get currentMonth(): number;
    set currentMonth(month: number);
    get currentYear(): number;
    set currentYear(year: number);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    private get24Hour;
    private update12HourState;
    private applyCurrentTime;
    private initializeValue;
    private _normalizeDate;
    private parseDateString;
    private generateTimeOptions;
    private generateLocaleData;
    private updateRangesArray;
    selectRange(range: [Date, Date]): void;
    isHoliday(date: Date | null): boolean;
    getHolidayLabel(date: Date | null): string | null;
    isDateDisabled(date: Date | null): boolean;
    isMultipleSelected(d: Date | null): boolean;
    onTimeChange(): void;
    onDateClick(day: Date | null): void;
    onDateHover(day: Date | null): void;
    isPreviewInRange(day: Date | null): boolean;
    generateCalendar(): void;
    private generateDropdownOptions;
    changeMonth(delta: number): void;
    isSameDay(d1: Date | null, d2: Date | null): boolean;
    isCurrentMonth(day: Date | null): boolean;
    isInRange(d: Date | null): boolean;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgxsmkDatepickerComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<NgxsmkDatepickerComponent, "ngxsmk-datepicker", never, { "mode": { "alias": "mode"; "required": false; }; "isInvalidDate": { "alias": "isInvalidDate"; "required": false; }; "showRanges": { "alias": "showRanges"; "required": false; }; "showTime": { "alias": "showTime"; "required": false; }; "minuteInterval": { "alias": "minuteInterval"; "required": false; }; "use24hTimeFormat": { "alias": "use24hTimeFormat"; "required": false; }; "autoCloseOnSelect": { "alias": "autoCloseOnSelect"; "required": false; }; "holidayProvider": { "alias": "holidayProvider"; "required": false; }; "disableHolidays": { "alias": "disableHolidays"; "required": false; }; "disabledDates": { "alias": "disabledDates"; "required": false; }; "placeholder": { "alias": "placeholder"; "required": false; }; "inline": { "alias": "inline"; "required": false; }; "startAt": { "alias": "startAt"; "required": false; }; "locale": { "alias": "locale"; "required": false; }; "theme": { "alias": "theme"; "required": false; }; "disabledState": { "alias": "disabledState"; "required": false; }; "minDate": { "alias": "minDate"; "required": false; }; "maxDate": { "alias": "maxDate"; "required": false; }; "ranges": { "alias": "ranges"; "required": false; }; }, { "valueChange": "valueChange"; "action": "action"; }, never, never, true, never>;
}

declare class CustomSelectComponent {
    private cdr;
    options: {
        label: string;
        value: any;
    }[];
    value: any;
    disabled: boolean;
    valueChange: EventEmitter<any>;
    panelRef?: ElementRef<HTMLDivElement>;
    optionEls: QueryList<ElementRef<HTMLLIElement>>;
    isOpen: boolean;
    constructor(cdr: ChangeDetectorRef);
    private readonly elementRef;
    onDocumentClick(event: MouseEvent): void;
    ngAfterViewInit(): void;
    ngOnChanges(ch: SimpleChanges): void;
    private centerSelected;
    get displayValue(): string;
    toggleDropdown(): void;
    selectOption(option: {
        label: string;
        value: any;
    }): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CustomSelectComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CustomSelectComponent, "ngxsmk-custom-select", never, { "options": { "alias": "options"; "required": false; }; "value": { "alias": "value"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; }, { "valueChange": "valueChange"; }, never, never, true, never>;
}

export { CustomSelectComponent, NgxsmkDatepickerComponent, addMonths, generateMonthOptions, generateTimeOptions, generateWeekDays, generateYearOptions, get24Hour, getEndOfDay, getEndOfMonth, getFirstDayOfWeek, getStartOfDay, getStartOfMonth, isSameDay, normalizeDate, processDateRanges, subtractDays, update12HourState };
export type { DateInput, DateRange, DatepickerValue, HolidayProvider };
