import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    // Provide a single route so we can inject Router/ActivatedRoute in the demo
    provideRouter([{ path: '', component: AppComponent }]),
  ],
}).catch(err => console.error(err));
