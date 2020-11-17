import { TestBed, waitForAsync } from '@angular/core/testing';
import { DwvModule } from './dwv/dwv.module';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AppComponent ],
      imports: [ DwvModule ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should init the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

});
