import { TestBed, ComponentFixture, waitForAsync } from '@angular/core/testing';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { DwvComponent } from './dwv.component';

describe('DwvComponent', () => {
  let component: DwvComponent;
  let fixture: ComponentFixture<DwvComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        DwvComponent
      ],
      imports: [
        MatButtonModule,
        MatButtonToggleModule,
        MatDialogModule,
        MatIconModule,
        MatProgressBarModule
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
      fixture = TestBed.createComponent(DwvComponent);
      component = fixture.debugElement.componentInstance;
  });

  it('should create', () => {
      expect(component).toBeTruthy();
  });

  it('should init', () => {
      expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('renders the beginning of the legend', waitForAsync(() => {
    fixture.detectChanges();

    const compiled = fixture.debugElement.nativeElement;
    const legend = compiled.querySelector('.legend');
    expect(legend.textContent).toContain('Powered by');
  }));
});
