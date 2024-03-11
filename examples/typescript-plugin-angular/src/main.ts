import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import safescript from "@redradist/module-runtime-safescript";


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
