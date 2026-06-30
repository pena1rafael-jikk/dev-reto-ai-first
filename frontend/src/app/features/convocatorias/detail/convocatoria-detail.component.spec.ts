import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ConvocatoriaDetailComponent } from './convocatoria-detail.component';

describe('ConvocatoriaDetailComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ConvocatoriaDetailComponent],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
  }));
  it('should create', () => expect(TestBed.createComponent(ConvocatoriaDetailComponent).componentInstance).toBeTruthy());
});
