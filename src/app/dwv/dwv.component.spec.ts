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

  it('should create the dwv component', async(() => {
    const fixture = TestBed.createComponent(DwvComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it(`should have a legend`, async(() => {
    const fixture = TestBed.createComponent(DwvComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.legend).toContain('Powered by dwv');
  }));

  it('should render legend with legend class', async(() => {
    const fixture = TestBed.createComponent(DwvComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.legend').textContent).toContain('Powered by dwv');
  }));
});
