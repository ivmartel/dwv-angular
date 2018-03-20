import { TestBed, async } from '@angular/core/testing';
import { DwvComponent } from './dwv.component';
describe('DwvComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DwvComponent
      ],
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(DwvComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
  it(`should have a legend`, async(() => {
    const fixture = TestBed.createComponent(DwvComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.legend).toContain('Powered by dwv');
  }));
  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(DwvComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.legend').textContent).toContain('Powered by dwv');
  }));
});
