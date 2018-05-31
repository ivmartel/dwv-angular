import { NgModule } from '@angular/core';
import { DwvModule } from './dwv/dwv.module';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [ AppComponent ],
  imports: [ DwvModule ],
  bootstrap: [AppComponent]
})

export class AppModule {}
