import { TestBed, async } from '@angular/core/testing';

import { MatButtonModule } from '@angular/material';
import { MatDialogModule } from '@angular/material';
import { MatIconModule } from '@angular/material';
import { MatMenuModule } from '@angular/material';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { DwvComponent } from './dwv.component';

describe('DwvComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DwvComponent
      ],
      imports: [
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatMenuModule,
        MatProgressBarModule
      ]
    }).compileComponents();
  }));

  // Inspect the component instance on mount
  it('renders the component', async(() => {
    const fixture = TestBed.createComponent(DwvComponent);
    const component = fixture.debugElement.componentInstance;
    expect(component).toBeDefined();
    expect(component).not.toBeNull();
  }));

  // Mount an instance and inspect the render output
  it('renders the beginning of the legend', async(() => {
    const fixture = TestBed.createComponent(DwvComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    const legend = compiled.querySelector('.legend');
    expect(legend.textContent).toContain('Powered by');
  }));
});
