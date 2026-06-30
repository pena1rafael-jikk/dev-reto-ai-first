import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ConvocatoriasListComponent } from './convocatorias-list.component';

describe('ConvocatoriasListComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ConvocatoriasListComponent],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
  }));
  it('should create', () => expect(TestBed.createComponent(ConvocatoriasListComponent).componentInstance).toBeTruthy());
});
