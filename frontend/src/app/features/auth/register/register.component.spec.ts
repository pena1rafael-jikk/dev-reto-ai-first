import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RegisterComponent],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
  }));

  it('should create', () => expect(TestBed.createComponent(RegisterComponent).componentInstance).toBeTruthy());

  it('submit button disabled on empty form', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
    expect(btn.disabled).toBeTrue();
  });
});
