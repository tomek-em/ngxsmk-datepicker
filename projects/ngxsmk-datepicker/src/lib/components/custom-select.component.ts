import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ngxsmk-custom-select',
  standalone: true,
  imports: [CommonModule],
  template: `
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
  `,
  styles: [`
    :host { position: relative; display: inline-block; }
    .ngxsmk-select-container { cursor: pointer; }
    .ngxsmk-select-display {
      display: flex; align-items: center; justify-content: space-between;
      width: var(--custom-select-width, 115px); background: var(--datepicker-background, #fff);
      border: 1px solid var(--datepicker-border-color, #ccc); color: var(--datepicker-text-color, #333);
      border-radius: 4px; padding: 4px 8px; font-size: 14px; text-align: left; height: 30px;
    }
    .ngxsmk-select-display:disabled {
      background-color: var(--datepicker-hover-background, #f0f0f0);
      cursor: not-allowed;
      opacity: 0.7;
    }
    .ngxsmk-arrow-icon { width: 12px; height: 12px; margin-left: 8px; }
    .ngxsmk-options-panel {
      position: absolute; top: 110%; left: 0; width: 100%;
      background: var(--datepicker-background, #fff); border: 1px solid var(--datepicker-border-color, #ccc);
      color: var(--datepicker-text-color, #333); border-radius: 4px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); max-height: 200px; overflow-y: auto; z-index: 9999;
    }
    .ngxsmk-options-panel ul { list-style: none; padding: 4px; margin: 0; }
    .ngxsmk-options-panel li { padding: 8px 12px; border-radius: 4px; cursor: pointer; }
    .ngxsmk-options-panel li:hover { background-color: var(--datepicker-hover-background, #f0f0f0); }
    .ngxsmk-options-panel li.selected {
      background-color: var(--datepicker-primary-color, #3880ff); color: var(--datepicker-primary-contrast, #fff);
    }
  `],
})
export class CustomSelectComponent {
  @Input() options: { label: string; value: any }[] = [];
  @Input() value: any;
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<any>();
  @ViewChild('panel') panelRef?: ElementRef<HTMLDivElement>;
  @ViewChildren('opt') optionEls!: QueryList<ElementRef<HTMLLIElement>>;
  public isOpen = false;

  constructor(private cdr: ChangeDetectorRef) {}

  private readonly elementRef: ElementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])

  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) this.isOpen = false;
  }

  ngAfterViewInit() {
    // If the list re-renders (e.g., options arrive async), re-center.
    this.optionEls.changes.subscribe(() => {
      if (this.isOpen) this.centerSelected();
    });
  }

  ngOnChanges(ch: SimpleChanges) {
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

  private centerSelected() {
    const panel = this.panelRef?.nativeElement;
    if (!panel) return;

    // Find the selected LI within the current list
    const selected = panel.querySelector('li.selected') as HTMLElement | null;
    if (!selected) return;

    // Precise centering
    const target = selected.offsetTop - (panel.clientHeight / 2 - selected.offsetHeight / 2);
    panel.scrollTo({ top: Math.max(0, target), behavior: 'auto' });

    // Optional: focus panel for keyboard nav
    // panel.focus();
  }

  get displayValue(): string {
    const selectedOption = this.options.find((opt) => opt.value === this.value);
    return selectedOption ? selectedOption.label : '';
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
  }

  selectOption(option: { label: string; value: any }): void {
    this.value = option.value;
    this.valueChange.emit(this.value);
    this.isOpen = false;
  }
}


