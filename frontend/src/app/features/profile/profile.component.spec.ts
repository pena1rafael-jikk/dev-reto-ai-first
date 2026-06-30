import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ProfileComponent],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
  }));
  it('should create', () => expect(TestBed.createComponent(ProfileComponent).componentInstance).toBeTruthy());
});
